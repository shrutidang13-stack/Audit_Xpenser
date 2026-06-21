from collections import Counter, defaultdict
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import (
    Bill,
    BillMatch,
    BusinessPurposeRisk,
    CapitalReview,
    Client,
    DuplicateBillFlag,
    ExpenseClassification,
    ExpenseTransaction,
    Form3CDImpact,
    GSTRecord,
    ProcessingExpense,
    RiskScore,
    StatutoryAlert,
    TDSRecord,
    Vendor,
    VendorRisk,
    WorkingPaper,
)
from app.services.audit_trail_service import log_event
from app.services.exception_register_service import create_audit_run, rebuild_exception_register
from app.services.expense_classification_service import classify_text
from app.services.processing_service import CA_REVIEW_REQUIRED, generate_processing_data, normalise_ledger_name
from app.services.query_engine import generate_queries_from_exceptions
from app.services.retention_service import prune_audit_runs
from app.services.utils import risk_level, valid_gstin, valid_pan


TDS_CATEGORIES = {"Professional fees", "Rent", "Commission / brokerage", "Contract payment", "Interest / finance cost", "Legal fees", "Advertisement / sales promotion"}
RCM_KEYWORDS = ["legal", "gta", "director", "import of services", "security", "sponsorship", "rent-a-cab"]
BUSINESS_PURPOSE_CATEGORIES = {"Travelling", "Hotel / food", "Staff welfare", "Advertisement / sales promotion", "Director-related payment", "Employee cost"}


def run_audit(db: Session, client_id: int, file_ids: list[int] | None = None) -> dict:
    client = db.get(Client, client_id)
    if not client:
        raise ValueError("Client not found")
    _clear_outputs(db, client_id)
    processing = generate_processing_data(db, client_id, file_ids)
    normalised = processing.get("normalised", {})
    processing_rows = db.query(ProcessingExpense).filter(ProcessingExpense.client_id == client_id).all()
    processing_ledgers = {_ledger_key(row.ledger_name) for row in processing_rows}
    processing_type_by_ledger = {_ledger_key(row.ledger_name): row.expense_type for row in processing_rows}
    expenses = db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all()
    if processing_ledgers:
        expenses = [tx for tx in expenses if _ledger_key(tx.ledger_name) in processing_ledgers]
    bills = db.query(Bill).filter(Bill.client_id == client_id).all()
    vendors = db.query(Vendor).filter(Vendor.client_id == client_id).all()
    tds = db.query(TDSRecord).filter(TDSRecord.client_id == client_id).all()
    gst = db.query(GSTRecord).filter(GSTRecord.client_id == client_id).all()

    classifications = {}
    for tx in expenses:
        result = classify_text(tx.ledger_name, tx.narration)
        processing_type = processing_type_by_ledger.get(_ledger_key(tx.ledger_name))
        if processing_type == CA_REVIEW_REQUIRED:
            result = {
                **result,
                "category": CA_REVIEW_REQUIRED,
                "confidence": min(result.get("confidence", 0), 0.5),
                "basis": "Classification pending review in Processing schedule.",
            }
        elif processing_type:
            result = {
                **result,
                "basis": f"{result.get('basis') or 'Automated classification'} Processing schedule: {processing_type}.",
            }
        item = ExpenseClassification(client_id=client_id, transaction_id=tx.id, **result)
        db.add(item)
        db.flush()
        classifications[tx.id] = result["category"]

    _match_bills(db, client_id, expenses, bills)
    db.flush()
    _detect_duplicate_bills(db, client_id, bills)
    _vendor_risks(db, client_id, vendors, expenses, gst)
    _statutory_risks(db, client_id, expenses, vendors, tds, gst, classifications)
    _capital_and_business_reviews(db, client_id, expenses, classifications)
    db.flush()
    _risk_scores(db, client_id, expenses, classifications)
    db.flush()
    _form3cd_impacts(db, client_id)
    db.flush()
    _working_paper(db, client, normalised)
    db.commit()
    audit_run = create_audit_run(db, client_id)
    canonical = rebuild_exception_register(db, client_id, audit_run.id)
    generate_queries_from_exceptions(db, client_id, audit_run.id)
    db.refresh(audit_run)
    retention = prune_audit_runs(db, client_id)
    log_event(db, client_id, "Audit pipeline completed", "Expense audit completed with indicative risk scores and suggested client queries.")
    return {
        "status": "completed",
        "normalised": normalised,
        "transactions_reviewed": len(expenses),
        "audit_run_id": audit_run.id,
        "risk_score": audit_run.risk_score,
        "risk_label": audit_run.risk_label,
        "total_vouchers": audit_run.total_vouchers,
        "total_exceptions": audit_run.total_exceptions,
        "indicative_amount": audit_run.indicative_amount,
        "category_summary": canonical["category_summary"],
        "form_3cd_summary": canonical["form_3cd_summary"],
        "retention": retention,
    }


def _clear_outputs(db: Session, client_id: int) -> None:
    for model in [BillMatch, ExpenseClassification, VendorRisk, StatutoryAlert, CapitalReview, BusinessPurposeRisk, DuplicateBillFlag, Form3CDImpact, RiskScore, ClientQuery, WorkingPaper]:
        db.execute(delete(model).where(model.client_id == client_id))
    db.commit()


def _ledger_key(value: str | None) -> str:
    return normalise_ledger_name(value).casefold()


def _match_bills(db, client_id, expenses, bills):
    used = set()
    for tx in expenses:
        best = None
        best_score = 0
        for bill in bills:
            score = 0
            if tx.invoice_number and bill.invoice_number and tx.invoice_number.lower() == bill.invoice_number.lower():
                score += 45
            if tx.amount and bill.amount and abs(tx.amount - bill.amount) <= max(5, tx.amount * 0.02):
                score += 30
            if tx.vendor_name and bill.vendor_name and tx.vendor_name.lower() in bill.vendor_name.lower():
                score += 15
            if bill.gstin:
                score += 5
            if score > best_score:
                best = bill
                best_score = score
        if best and best_score >= 60:
            status = "Matched" if best_score >= 80 else "Partial Match"
            used.add(best.id)
            db.add(BillMatch(client_id=client_id, transaction_id=tx.id, bill_id=best.id, status=status, score=best_score, reason="Best-effort bill-to-ledger match."))
        else:
            db.add(BillMatch(client_id=client_id, transaction_id=tx.id, status="Bill Missing", score=best_score, reason="No sufficiently matching uploaded bill was found."))
    for bill in bills:
        if bill.id not in used:
            status = "Unreadable Bill" if not bill.readable else "Ledger Entry Missing"
            db.add(BillMatch(client_id=client_id, bill_id=bill.id, status=status, score=0, reason="Uploaded bill did not link to a ledger entry."))


def _detect_duplicate_bills(db, client_id, bills):
    by_invoice = Counter((b.vendor_name or "", b.invoice_number or "") for b in bills if b.invoice_number)
    by_amount_date = Counter((b.vendor_name or "", b.amount or 0, str(b.invoice_date or "")) for b in bills if b.amount)
    for bill in bills:
        if bill.invoice_number and by_invoice[(bill.vendor_name or "", bill.invoice_number)] > 1:
            db.add(DuplicateBillFlag(client_id=client_id, bill_id=bill.id, issue="Possible duplicate bill number for same vendor.", severity="High"))
        if bill.amount and by_amount_date[(bill.vendor_name or "", bill.amount or 0, str(bill.invoice_date or ""))] > 1:
            db.add(DuplicateBillFlag(client_id=client_id, bill_id=bill.id, issue="Possible duplicate bill based on vendor, amount and date.", severity="Medium"))
        if bill.gstin and not valid_gstin(bill.gstin):
            db.add(DuplicateBillFlag(client_id=client_id, bill_id=bill.id, issue="GSTIN format requires CA review based on captured bill data.", severity="Medium"))


def _vendor_risks(db, client_id, vendors, expenses, gst_records):
    vendor_names = {v.name.lower(): v for v in vendors}
    gst_uploaded = bool(gst_records)
    for vendor in vendors:
        if not valid_pan(vendor.pan):
            db.add(VendorRisk(client_id=client_id, vendor_id=vendor.id, vendor_name=vendor.name, issue="PAN missing or requiring review.", severity="Medium", suggested_action="Please verify vendor PAN before final audit conclusion."))
        if not valid_gstin(vendor.gstin):
            db.add(VendorRisk(client_id=client_id, vendor_id=vendor.id, vendor_name=vendor.name, issue="GSTIN missing or requiring review.", severity="Medium", suggested_action="Please obtain or verify GST registration details where applicable."))
        if gst_uploaded and vendor.gstin and not any(g.gstin == vendor.gstin for g in gst_records):
            db.add(VendorRisk(client_id=client_id, vendor_id=vendor.id, vendor_name=vendor.name, issue="GSTR-2B support not identified for vendor GSTIN.", severity="Low-Medium", suggested_action="Please review GST support and ITC eligibility records."))
    for tx in expenses:
        if tx.vendor_name and tx.vendor_name.lower() not in vendor_names and tx.amount >= 50000:
            db.add(VendorRisk(client_id=client_id, vendor_name=tx.vendor_name, issue="High-value vendor not found in vendor master.", severity="Medium", suggested_action="Please verify vendor master details and statutory registrations."))


def _statutory_risks(db, client_id, expenses, vendors, tds_records, gst_records, classifications):
    vendor_by_name = {v.name.lower(): v for v in vendors}
    tds_keys = {((r.vendor_or_pan or "").lower(), r.section or "") for r in tds_records}
    gst_invoice_numbers = {(g.invoice_number or "").lower() for g in gst_records if g.invoice_number}
    for tx in expenses:
        category = classifications.get(tx.id, "")
        vendor = vendor_by_name.get((tx.vendor_name or "").lower())
        haystack = f"{tx.ledger_name or ''} {tx.narration or ''}".lower()
        if category in TDS_CATEGORIES and (tx.amount or 0) >= 30000:
            has_tds = bool(tx.tds_amount) or (vendor and ((vendor.pan or "").lower(), "") in tds_keys)
            if not has_tds:
                db.add(StatutoryAlert(client_id=client_id, transaction_id=tx.id, alert_type="TDS", issue="Possible TDS review required for high-value expense.", severity="Medium", suggested_review="Review TDS applicability, PAN and challan support."))
        if tx.gst_amount is None and (tx.amount or 0) >= 25000:
            db.add(StatutoryAlert(client_id=client_id, transaction_id=tx.id, alert_type="GST", issue="Possible GST documentation review required.", severity="Low-Medium", suggested_review="Verify GST invoice and GSTR-2B support where applicable."))
        if tx.invoice_number and gst_records and tx.invoice_number.lower() not in gst_invoice_numbers:
            db.add(StatutoryAlert(client_id=client_id, transaction_id=tx.id, alert_type="GST", issue="Invoice not matched with uploaded GST data.", severity="Medium", suggested_review="Review GSTR-2B or GST reconciliation support."))
        if any(keyword in haystack for keyword in RCM_KEYWORDS):
            db.add(StatutoryAlert(client_id=client_id, transaction_id=tx.id, alert_type="RCM", issue="Possible GST/RCM review required.", severity="Medium", suggested_review="Review RCM applicability based on service nature and vendor registration."))


def _capital_and_business_reviews(db, client_id, expenses, classifications):
    capital_keywords = ["laptop", "air conditioner", " ac ", "furniture", "machinery", "equipment", "renovation", "software purchase", "website development"]
    vague = ["misc", "general", "reimbursement", "expenses", "as discussed", ""]
    for tx in expenses:
        text = f" {tx.ledger_name or ''} {tx.narration or ''} ".lower()
        if classifications.get(tx.id) == "Capital item risk" or any(k in text for k in capital_keywords):
            db.add(CapitalReview(client_id=client_id, transaction_id=tx.id, amount=tx.amount, reason="Possible capital item booked under revenue expense head.", suggested_review_area="Capital-vs-revenue and depreciation/computation review."))
        if classifications.get(tx.id) in BUSINESS_PURPOSE_CATEGORIES:
            narration = (tx.narration or "").strip().lower()
            if len(narration) < 10 or narration in vague or (tx.amount or 0) >= 50000:
                db.add(BusinessPurposeRisk(client_id=client_id, transaction_id=tx.id, issue="Business purpose support may require review.", query_suggestion="Please provide business purpose, approval and supporting documents for this expense.", severity="Medium"))


def _risk_scores(db, client_id, expenses, classifications):
    bill_matches_by_tx = defaultdict(list)
    for match in db.query(BillMatch).filter(BillMatch.client_id == client_id).all():
        if match.transaction_id:
            bill_matches_by_tx[match.transaction_id].append(match)
    for tx in expenses:
        score = 0
        reasons = []
        matches = bill_matches_by_tx.get(tx.id, [])
        if any(m.status == "Bill Missing" for m in matches):
            score += 25
            reasons.append("Bill missing")
        if classifications.get(tx.id) == "Personal / non-business risk":
            score += 20
            reasons.append("Possible personal/non-business nature")
        if classifications.get(tx.id) == "Capital item risk":
            score += 20
            reasons.append("Possible capital booked as revenue")
        if db.query(StatutoryAlert).filter(StatutoryAlert.transaction_id == tx.id, StatutoryAlert.alert_type == "TDS").count():
            score += 20
            reasons.append("Possible TDS review")
        if db.query(StatutoryAlert).filter(StatutoryAlert.transaction_id == tx.id, StatutoryAlert.alert_type == "RCM").count():
            score += 15
            reasons.append("Possible RCM review")
        if (tx.payment_mode or "").lower() == "cash" and (tx.amount or 0) >= 10000:
            score += 15
            reasons.append("Cash payment risk")
        if classifications.get(tx.id) == "Penalty / fine":
            score += 20
            reasons.append("Penalty/fine review")
        if (tx.amount or 0) >= 100000:
            score += 10
            reasons.append("High-value transaction")
        if tx.date and tx.date.month == 3 and tx.date.day >= 25:
            score += 10
            reasons.append("Year-end transaction")
        if db.query(BusinessPurposeRisk).filter(BusinessPurposeRisk.transaction_id == tx.id).count():
            score += 15
            reasons.append("Business purpose missing or high value")
        db.add(RiskScore(client_id=client_id, transaction_id=tx.id, score=min(score, 100), level=risk_level(min(score, 100)), reasons=", ".join(reasons) or "No major automated exception identified."))


def _form3cd_impacts(db, client_id):
    for alert in db.query(StatutoryAlert).filter(StatutoryAlert.client_id == client_id).all():
        clause = "Potential Clause 34 impact" if alert.alert_type == "TDS" else "Potential Clause 44 / GST review impact"
        db.add(Form3CDImpact(client_id=client_id, source_type="statutory_alert", source_id=alert.id, clause_area=clause, observation=alert.issue, suggested_review=alert.suggested_review))
    for item in db.query(CapitalReview).filter(CapitalReview.client_id == client_id).all():
        db.add(Form3CDImpact(client_id=client_id, source_type="capital_review", source_id=item.id, clause_area="Potential Clause 21/computation review", observation=item.reason, suggested_review=item.suggested_review_area))
    for score in db.query(RiskScore).filter(RiskScore.client_id == client_id, RiskScore.score >= 60).all():
        db.add(Form3CDImpact(client_id=client_id, source_type="risk_score", source_id=score.id, clause_area="Potential tax audit reporting review", observation=f"Indicative risk score {score.score}: {score.reasons}", suggested_review="CA review required before reporting conclusion."))


def _working_paper(db, client, normalised):
    summary = [
        f"Client name: {client.name}",
        f"Financial year: {client.financial_year}",
        "Objective: Expense verification and identification of possible tax audit risk areas.",
        "Scope: Uploaded expense ledgers, vendor masters, bills, TDS/GST data and supporting records available in the system.",
        f"Data uploaded and reviewed: {normalised}",
        "Procedures performed: Normalisation, bill matching, duplicate scan, vendor checks, statutory review flags, capital-vs-revenue review, business purpose review and indicative risk scoring.",
        "Conclusion placeholder: CA review required before final reporting or legal conclusion.",
    ]
    db.add(WorkingPaper(client_id=client.id, title="AuditXpenser Expense Audit Working Paper", content="\n".join(summary)))
