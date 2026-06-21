from datetime import datetime, timedelta
import hashlib
import json
import logging
import uuid

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import Client
from app.models.tds_audit_models import TDSAuditRun, TDSCase, TDSException, TDSLayerResult
from app.services.tds_matching_service import match_deduction, match_payment
from app.services.tds_normalisation_service import source_entries
from app.services.tds_reporting_service import case_payload, exception_payload, form_3cd_impact, layer_payload, summary


logger = logging.getLogger(__name__)
LAYERS = ("EXPENSE_BOOKING_LAYER", "TDS_DEDUCTION_LAYER", "TDS_PAYMENT_CHALLAN_LAYER", "TDS_RETURN_REPORTING_LAYER")


def run(db: Session, client_id: int) -> dict:
    try:
        client = db.get(Client, client_id)
        items = source_entries(db, client_id)
        if not items:
            return {"status": "no_data", "message": "No mapped accounting data found for TDS audit. Existing workflow not disturbed."}
        run_id = str(uuid.uuid4())
        _clear_client_results(db, client_id)
        audit_run = TDSAuditRun(client_id=client_id, run_id=run_id, financial_year=client.financial_year if client else "2025-26", status="running", source_note="Read-only scan of existing expense transactions.", total_entries_scanned=len(items))
        db.add(audit_run)
        db.flush()
        exception_count = 0
        for item in items:
            deduction = match_deduction(db, client_id, item)
            payment = match_payment(db, client_id, deduction)
            case = _build_case(client_id, run_id, item, deduction, payment)
            db.add(case)
            db.flush()
            _add_layers(db, case, item, deduction, payment)
            exception_count += _add_exceptions(db, case, item, deduction, payment)
        audit_run.status = "completed"
        audit_run.total_tds_cases = len(items)
        audit_run.total_exceptions = exception_count
        audit_run.completed_at = datetime.utcnow()
        db.commit()
        report = summary(db, client_id)
        return {"status": "completed", "run_id": run_id, "client_id": client_id, "summary": {"total_entries_scanned": len(items), "total_tds_cases": len(items), "total_exceptions": exception_count, "high_risk": db.query(TDSCase).filter(TDSCase.client_id == client_id, TDSCase.risk_level == "High").count(), "ca_review_required": report["ca_review_required"]}, "message": "TDS audit completed without disturbing existing workflow."}
    except Exception as exc:
        db.rollback()
        logger.exception("TDS audit failed for client %s", client_id)
        return {"status": "error", "message": f"TDS audit could not complete. Existing workflow not disturbed. {exc}"}


def cases(db: Session, client_id: int) -> list[dict]:
    return [case_payload(row) for row in db.query(TDSCase).filter(TDSCase.client_id == client_id).order_by(TDSCase.id.desc()).all()]


def case_detail(db: Session, client_id: int, case_id: str) -> dict | None:
    case = db.query(TDSCase).filter(TDSCase.client_id == client_id, TDSCase.tds_case_id == case_id).first()
    if not case:
        return None
    layers = db.query(TDSLayerResult).filter(TDSLayerResult.tds_case_id == case_id).order_by(TDSLayerResult.id).all()
    exceptions = db.query(TDSException).filter(TDSException.client_id == client_id, TDSException.tds_case_id == case_id).all()
    return {"case": case_payload(case), "layers": [layer_payload(row) for row in layers], "exceptions": [exception_payload(row) for row in exceptions]}


def exceptions(db: Session, client_id: int) -> list[dict]:
    return [exception_payload(row) for row in db.query(TDSException).filter(TDSException.client_id == client_id).order_by(TDSException.id.desc()).all()]


def _clear_client_results(db: Session, client_id: int) -> None:
    case_ids = [row[0] for row in db.query(TDSCase.tds_case_id).filter(TDSCase.client_id == client_id).all()]
    if case_ids:
        db.execute(delete(TDSLayerResult).where(TDSLayerResult.tds_case_id.in_(case_ids)))
    db.execute(delete(TDSException).where(TDSException.client_id == client_id))
    db.execute(delete(TDSCase).where(TDSCase.client_id == client_id))


def _build_case(client_id, run_id, item, deduction, payment) -> TDSCase:
    row = item["source"]
    key = "|".join(map(str, [client_id, item["vendor_pan"] or row.vendor_name, row.invoice_number or row.voucher_number, row.date, item["gross"], item["section"]]))
    case_id = hashlib.sha256(key.encode()).hexdigest()[:24]
    actual = deduction["amount"]
    status = "Matched" if actual and abs(actual - item["expected"]) <= max(1, item["expected"] * .05) and payment["date"] else "CA Review Required"
    return TDSCase(client_id=client_id, run_id=run_id, tds_case_id=case_id, vendor_name=row.vendor_name, vendor_pan=item["vendor_pan"], vendor_gstin=item["vendor_gstin"], invoice_no=row.invoice_number, invoice_date=row.date, voucher_no=row.voucher_number, voucher_date=row.date, expense_ledger=row.ledger_name, expense_nature=row.ledger_name, gross_amount=item["gross"], gst_amount=item["gst"], tds_base_amount=item["base"], expected_tds_section=item["section"], expected_tds_rate=item["rate"], expected_tds_amount=item["expected"], actual_tds_section=item["section"] if actual else None, actual_tds_amount=actual, tds_deduction_date=deduction["date"], tds_payment_date=payment["date"], challan_no=payment["challan_no"], challan_amount=payment["amount"], return_form_type="26Q", form_3cd_clause="Clause 34(a)/(b)", disallowance_section="Potential Section 40(a)(ia)", status=status, risk_level="Low" if status == "Matched" else "High", ca_review_required=status != "Matched")


def _add_layers(db, case, item, deduction, payment):
    data = [
        (LAYERS[0], "matched", {"section": item["section"], "base": item["base"]}, {"gross": item["gross"], "gst": item["gst"]}, "TDS applicability evaluated from expense nature."),
        (LAYERS[1], "matched" if deduction["amount"] else "exception", {"amount": item["expected"]}, {"amount": deduction["amount"]}, "Deduction matched by voucher, vendor and date proximity."),
        (LAYERS[2], "matched" if payment["date"] else "exception", {"deposit": "expected"}, {"date": str(payment["date"] or ""), "challan": payment["challan_no"]}, "Challan/payment linkage is indicative and subject to auditor verification."),
        (LAYERS[3], "review" if case.ca_review_required else "matched", {"form_3cd": "Clause 34(a)/(b)"}, {"return_form": case.return_form_type}, "Possible Form 3CD impact assessed."),
    ]
    for name, status, expected, actual, remarks in data:
        db.add(TDSLayerResult(tds_case_id=case.tds_case_id, layer_name=name, layer_status=status, expected_value_json=json.dumps(expected), actual_value_json=json.dumps(actual), remarks=remarks, evidence_json=json.dumps({"voucher_no": case.voucher_no, "invoice_no": case.invoice_no})))


def _add_exceptions(db, case, item, deduction, payment) -> int:
    titles = []
    if not deduction["amount"]:
        titles.append("TDS applicability identified but deduction not found")
    elif deduction["amount"] + max(1, item["expected"] * .05) < item["expected"]:
        titles.append("TDS appears short deducted")
    if deduction["amount"] and not payment["date"]:
        titles.append("TDS deducted but payment/challan not matched")
    if not item["vendor_pan"]:
        titles.append("PAN not available for vendor")
    if titles:
        titles.extend(["Possible Form 3CD Clause 34 reporting impact", "Potential 40(a)(ia) disallowance exposure"])
    for title in titles:
        impact = title in {"Possible Form 3CD Clause 34 reporting impact", "Potential 40(a)(ia) disallowance exposure"}
        db.add(TDSException(client_id=case.client_id, run_id=case.run_id, tds_case_id=case.tds_case_id, exception_type="TDS Audit", exception_title=title, exception_description=f"Indicative exception: {title}. Subject to auditor verification.", amount_impact=case.expected_tds_amount, possible_form_3cd_impact=impact, possible_40aia_impact=title == "Potential 40(a)(ia) disallowance exposure", risk_level="High" if "not" in title or "40(a)(ia)" in title else "Medium", ca_review_required=True, suggested_query="Please provide TDS deduction, challan and return evidence for CA review.", suggested_working_paper_note="Possible Form 3CD impact; CA Review Required.", status="Open"))
    return len(titles)
