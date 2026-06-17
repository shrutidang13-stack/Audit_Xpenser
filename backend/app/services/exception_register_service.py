from collections import Counter, defaultdict

from sqlalchemy import delete, func
from sqlalchemy.orm import Session

from app.models import (
    AuditException,
    AuditRun,
    Bill,
    BillMatch,
    BusinessPurposeRisk,
    CapitalReview,
    ClientQuery,
    DuplicateBillFlag,
    ExpenseTransaction,
    RiskScore,
    StatutoryAlert,
)
from app.services.utils import risk_level


RISK_MAP = {
    "low": "Low",
    "low-medium": "Medium",
    "medium": "Medium",
    "medium-high": "High",
    "high": "High",
    "high risk": "High",
}


def rebuild_exception_register(db: Session, client_id: int, audit_run_id: int) -> dict:
    db.execute(delete(ClientQuery).where(ClientQuery.client_id == client_id))
    db.execute(delete(AuditException).where(AuditException.client_id == client_id))
    db.commit()

    created = []
    for match in db.query(BillMatch).filter(BillMatch.client_id == client_id).all():
        item = create_exception_from_bill_match(db, client_id, audit_run_id, match)
        if item:
            created.append(item)
    for alert in db.query(StatutoryAlert).filter(StatutoryAlert.client_id == client_id).all():
        item = create_exception_from_statutory_alert(db, client_id, audit_run_id, alert)
        if item:
            created.append(item)
    for review in db.query(CapitalReview).filter(CapitalReview.client_id == client_id).all():
        created.append(create_exception_from_capital_review(db, client_id, audit_run_id, review))
    for purpose in db.query(BusinessPurposeRisk).filter(BusinessPurposeRisk.client_id == client_id).all():
        created.append(create_exception_from_business_purpose_risk(db, client_id, audit_run_id, purpose))
    for duplicate in db.query(DuplicateBillFlag).filter(DuplicateBillFlag.client_id == client_id).all():
        created.append(create_exception_from_duplicate_bill(db, client_id, audit_run_id, duplicate))
    for score in db.query(RiskScore).filter(RiskScore.client_id == client_id, RiskScore.score >= 60).all():
        created.append(create_exception_from_risk_score(db, client_id, audit_run_id, score))

    db.add_all([item for item in created if item])
    db.commit()
    summary = summarize_exceptions(db, client_id, audit_run_id)
    run = db.get(AuditRun, audit_run_id)
    if run:
        run.total_exceptions = summary["total_exceptions"]
        run.indicative_amount = summary["indicative_amount"]
        run.risk_score = _risk_score(summary["total_exceptions"], run.total_vouchers, summary["risk_counts"])
        run.risk_label = _label(run.risk_score)
        db.commit()
        db.refresh(run)
    return summary


def create_exception_from_bill_match(db, client_id, audit_run_id, match):
    if match.status not in {"Bill Missing", "Unreadable Bill", "Partial Match"}:
        return None
    tx = db.get(ExpenseTransaction, match.transaction_id) if match.transaction_id else None
    bill = db.get(Bill, match.bill_id) if match.bill_id else None
    category = "Missing Bill" if match.status == "Bill Missing" else "Supporting Document Review"
    amount = (tx.amount if tx else bill.amount if bill else 0) or 0
    return _exception(
        client_id,
        audit_run_id,
        tx,
        category,
        "Possible review required due to incomplete or weak supporting documentation.",
        "High" if match.status == "Bill Missing" and amount >= 25000 else "Medium",
        "18(ca), 21",
        amount=amount,
        party_name=tx.vendor_name if tx else bill.vendor_name if bill else "",
    )


def create_exception_from_statutory_alert(db, client_id, audit_run_id, alert):
    tx = db.get(ExpenseTransaction, alert.transaction_id) if alert.transaction_id else None
    alert_type = (alert.alert_type or "").upper()
    if alert_type == "TDS":
        category, clause = "TDS Review", "34(a), 34(b)"
    elif alert_type in {"GST", "RCM"}:
        category, clause = "GST Review", "44"
    else:
        category, clause = "Statutory Review", map_exception_to_form_3cd_clause(alert_type)
    return _exception(
        client_id,
        audit_run_id,
        tx,
        category,
        alert.issue or "Indicative statutory review required based on available data.",
        _risk(alert.severity),
        clause,
    )


def create_exception_from_capital_review(db, client_id, audit_run_id, review):
    tx = db.get(ExpenseTransaction, review.transaction_id) if review.transaction_id else None
    return _exception(
        client_id,
        audit_run_id,
        tx,
        "Capital vs Revenue Review",
        review.reason or "Possible capital versus revenue review required.",
        "Medium",
        "21",
        amount=review.amount,
    )


def create_exception_from_business_purpose_risk(db, client_id, audit_run_id, purpose):
    tx = db.get(ExpenseTransaction, purpose.transaction_id) if purpose.transaction_id else None
    return _exception(
        client_id,
        audit_run_id,
        tx,
        "Business Purpose Review",
        purpose.issue or "Possible review required because the business purpose is not clear from available narration.",
        _risk(purpose.severity),
        "21",
    )


def create_exception_from_duplicate_bill(db, client_id, audit_run_id, duplicate):
    bill = db.get(Bill, duplicate.bill_id) if duplicate.bill_id else None
    return AuditException(
        client_id=client_id,
        audit_run_id=audit_run_id,
        transaction_id=None,
        voucher_date=bill.invoice_date if bill else None,
        voucher_type="Bill",
        voucher_number=bill.invoice_number if bill else "",
        party_name=bill.vendor_name if bill else "",
        ledger_name="",
        amount=bill.amount if bill else 0,
        exception_type="Duplicate Bill Review",
        exception_description=duplicate.issue or "Possible duplicate supporting document review required.",
        risk_level=_risk(duplicate.severity),
        form_3cd_clause="18(ca)",
        status="Pending",
    )


def create_exception_from_risk_score(db, client_id, audit_run_id, score):
    tx = db.get(ExpenseTransaction, score.transaction_id) if score.transaction_id else None
    return _exception(
        client_id,
        audit_run_id,
        tx,
        "High Risk Transaction Review",
        f"Indicative risk score {score.score}: {score.reasons}",
        _risk(score.level),
        map_exception_to_form_3cd_clause("HIGH_RISK"),
    )


def summarize_exceptions(db: Session, client_id: int, audit_run_id: int | None = None) -> dict:
    query = db.query(AuditException).filter(AuditException.client_id == client_id)
    if audit_run_id:
        query = query.filter(AuditException.audit_run_id == audit_run_id)
    items = query.all()
    category_counter = Counter(item.exception_type for item in items)
    risk_counter = Counter(item.risk_level for item in items)
    clause_counter = Counter(item.form_3cd_clause or "CA Review Required" for item in items)
    amount_by_category = defaultdict(float)
    for item in items:
        amount_by_category[item.exception_type] += abs(item.amount or 0)
    return {
        "total_exceptions": len(items),
        "indicative_amount": sum(abs(item.amount or 0) for item in items),
        "category_summary": [
            {"category": key, "count": category_counter[key], "indicative_amount": amount_by_category[key], "risk_level": _category_risk(items, key)}
            for key in sorted(category_counter)
        ],
        "risk_counts": [{"risk_level": key, "count": risk_counter[key]} for key in ["High", "Medium", "Low"] if risk_counter[key]],
        "form_3cd_summary": [{"clause": key, "count": clause_counter[key]} for key in sorted(clause_counter)],
    }


def latest_audit_run(db: Session, client_id: int) -> AuditRun | None:
    return db.query(AuditRun).filter(AuditRun.client_id == client_id).order_by(AuditRun.run_at.desc(), AuditRun.id.desc()).first()


def create_audit_run(db: Session, client_id: int) -> AuditRun:
    total_vouchers = db.query(func.count(ExpenseTransaction.id)).filter(ExpenseTransaction.client_id == client_id).scalar() or 0
    run = AuditRun(client_id=client_id, total_vouchers=total_vouchers, risk_score=0, risk_label="Low", total_exceptions=0, indicative_amount=0)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def map_exception_to_form_3cd_clause(exception_type: str) -> str:
    text = (exception_type or "").upper()
    if "TDS" in text:
        return "34(a), 34(b)"
    if "GST" in text or "RCM" in text:
        return "44"
    if "CASH" in text:
        return "40A(3)"
    if "CAPITAL" in text or "BUSINESS" in text:
        return "21"
    if "BILL" in text or "DUPLICATE" in text:
        return "18(ca)"
    return "CA Review Required"


def map_exception_to_documents_required(exception_type: str) -> str:
    text = (exception_type or "").lower()
    if "tds" in text:
        return "Copy of invoice; nature of service; TDS deduction details; challan and return reference, if available"
    if "gst" in text:
        return "Tax invoice; supplier GSTIN; GSTR-2B / ITC reconciliation; payment proof, if required"
    if "missing" in text or "supporting" in text:
        return "Original invoice or bill; payment proof; approval note; business purpose explanation"
    if "cash" in text:
        return "Cash voucher; supporting bill; recipient confirmation, if available; business justification"
    if "capital" in text:
        return "Invoice; asset usage details; capitalisation policy; management explanation"
    if "duplicate" in text:
        return "Copies of similar bills; payment details; confirmation whether duplicate entry exists"
    if "business" in text:
        return "Invoice; approval note; business purpose explanation; supporting correspondence"
    return "Supporting document; management explanation; CA review note"


def _exception(client_id, audit_run_id, tx, exception_type, description, risk, clause, amount=None, party_name=None):
    return AuditException(
        client_id=client_id,
        audit_run_id=audit_run_id,
        transaction_id=tx.id if tx else None,
        voucher_date=tx.date if tx else None,
        voucher_type=tx.payment_mode if tx else "",
        voucher_number=tx.voucher_number if tx else "",
        party_name=party_name if party_name is not None else (tx.vendor_name if tx else ""),
        ledger_name=tx.ledger_name if tx else "",
        amount=amount if amount is not None else (tx.amount if tx else 0),
        exception_type=exception_type,
        exception_description=description,
        risk_level=_risk(risk),
        form_3cd_clause=clause,
        status="Pending",
    )


def _risk(value: str | None) -> str:
    text = (value or "Medium").lower()
    for key, mapped in RISK_MAP.items():
        if key in text:
            return mapped
    return "Medium"


def _category_risk(items, category):
    values = [_risk(item.risk_level) for item in items if item.exception_type == category]
    if "High" in values:
        return "High"
    if "Medium" in values:
        return "Medium"
    return "Low"


def _risk_score(total_exceptions: int, total_vouchers: int, risk_counts: list[dict]) -> int:
    high = sum(item["count"] for item in risk_counts if item["risk_level"] == "High")
    medium = sum(item["count"] for item in risk_counts if item["risk_level"] == "Medium")
    density = (total_exceptions / max(total_vouchers, 1)) * 60
    weighted = min(40, high * 2 + medium)
    return min(100, int(density + weighted))


def _label(score: int) -> str:
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"
