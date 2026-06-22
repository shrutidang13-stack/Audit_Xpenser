from collections import defaultdict
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import (
    BankTransaction,
    Client,
    ExpenseAuditResult,
    GSTRecord,
    ProcessingExpense,
    ReferenceDocumentChunk,
    TDSRecord,
    TrialBalanceLine,
    UploadedFile,
)
from app.services.file_parser_service import parse_file
from app.services.utils import clean_text, from_json, parse_amount


STATUTORY_NOT_AVAILABLE = "Statutory reference data not available - CA Review Required"
NO_DIFFERENCE = "No difference noted from available data"
GL_DIFFERENCE = "GL difference noted for CA review"
DATA_NOT_AVAILABLE = "Data not available for conclusion"
GST_NOT_AVAILABLE = "GST data not available for matching"
PAYMENT_NOT_AVAILABLE = "Payment mode data not available"
TDS_REVIEW = "TDS review required based on available statutory mapping"
SECTION_40A3_REVIEW = "Section 40A(3) review required based on available statutory mapping"
CA_REVIEW_REQUIRED = "CA Review Required"
NOT_APPLICABLE = "Not Applicable"
GL_TOLERANCE = 0.50


def run_expense_audit(db: Session, client_id: int) -> dict:
    if not db.get(Client, client_id):
        raise ValueError("Client not found")

    rows = _structured_rows(db, client_id)
    if not rows:
        raise ValueError("Structured Data tab expenses not found")

    reference_available = _statutory_reference_available(db)
    gl_amounts = _gl_amounts_by_ledger(db, client_id)
    tds_amounts = _tds_amounts_by_ledger(db, client_id)
    gst_available = db.query(GSTRecord.id).filter(GSTRecord.client_id == client_id).first() is not None
    payment_available = db.query(BankTransaction.id).filter(BankTransaction.client_id == client_id).first() is not None

    db.execute(delete(ExpenseAuditResult).where(ExpenseAuditResult.client_id == client_id))
    db.flush()

    for row in rows:
        amount_as_per_audit = _money(row.net_amount if row.net_amount is not None else row.amount)
        amount_as_per_gl = _structured_gl_amount(row, gl_amounts)
        difference = _difference(amount_as_per_audit, amount_as_per_gl)
        gl_recording_check = _gl_recording_check(amount_as_per_gl, difference)
        tds_review = _tds_review(reference_available, tds_amounts.get(_ledger_key(row.ledger_name)))
        gst_review = DATA_NOT_AVAILABLE if gst_available else GST_NOT_AVAILABLE
        payment_review = DATA_NOT_AVAILABLE if payment_available else PAYMENT_NOT_AVAILABLE
        if reference_available and payment_available:
            payment_review = SECTION_40A3_REVIEW
        elif not reference_available:
            payment_review = STATUTORY_NOT_AVAILABLE

        finding = _finding(gl_recording_check)
        risk_level = _risk_level(gl_recording_check, difference)
        ca_review_status = CA_REVIEW_REQUIRED if gl_recording_check == GL_DIFFERENCE else NOT_APPLICABLE

        db.add(ExpenseAuditResult(
            client_id=client_id,
            ledger_name=row.ledger_name,
            expense_type=row.expense_type,
            amount_as_per_audit=amount_as_per_audit,
            amount_as_per_gl=amount_as_per_gl,
            difference_amount=difference,
            tds_review=tds_review,
            gst_review=gst_review,
            payment_40a3_review=payment_review,
            gl_recording_check=gl_recording_check,
            finding=finding,
            risk_level=risk_level,
            ca_review_status=ca_review_status,
            ca_remarks="",
            statutory_reference_status="Available" if reference_available else "Not available",
            statutory_reference_note=None if reference_available else STATUTORY_NOT_AVAILABLE,
        ))

    db.commit()
    return get_expense_audit_results(db, client_id)["summary"]


def get_expense_audit_results(db: Session, client_id: int) -> dict:
    if not db.get(Client, client_id):
        raise ValueError("Client not found")
    rows = db.query(ExpenseAuditResult).filter(ExpenseAuditResult.client_id == client_id).order_by(ExpenseAuditResult.id.asc()).all()
    return {
        "summary": _summary(rows),
        "rows": [_result_row(index, row) for index, row in enumerate(rows, start=1)],
    }


def _structured_rows(db: Session, client_id: int) -> list[ProcessingExpense]:
    return db.query(ProcessingExpense).filter(ProcessingExpense.client_id == client_id).order_by(ProcessingExpense.schedule_order.asc(), ProcessingExpense.id.asc()).all()


def _statutory_reference_available(db: Session) -> bool:
    query = db.query(ReferenceDocumentChunk.id).filter(
        ReferenceDocumentChunk.content_text.isnot(None),
        ReferenceDocumentChunk.content_text != "",
    )
    return query.first() is not None


def _gl_amounts_by_ledger(db: Session, client_id: int) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    rows = db.query(TrialBalanceLine).filter(TrialBalanceLine.client_id == client_id).all()
    for row in rows:
        key = _ledger_key(row.ledger_name)
        if not key or _is_ignored_gl_key(key):
            continue
        debit = float(row.debit_amount or 0)
        credit = float(row.credit_amount or 0)
        net_amount = debit - credit if debit or credit else float(row.amount or 0)
        totals[key] += net_amount
    if totals:
        return {key: _money(abs(amount)) for key, amount in totals.items()}
    return _gl_amounts_from_uploaded_files(db, client_id)


def _structured_gl_amount(row: ProcessingExpense, gl_amounts: dict[str, float]) -> float | None:
    """Prefer the GL debit already validated and displayed in the structured Data tab."""
    debit_amount = float(row.debit_amount or 0)
    if debit_amount or not float(row.net_amount or row.amount or 0):
        return _money(abs(debit_amount))
    return gl_amounts.get(_ledger_key(row.ledger_name))


def _tds_amounts_by_ledger(db: Session, client_id: int) -> dict[str, float]:
    totals: dict[str, float] = defaultdict(float)
    records = db.query(TDSRecord.vendor_or_pan, TDSRecord.payment_amount, TDSRecord.tds_deducted).filter(TDSRecord.client_id == client_id).all()
    for vendor_or_pan, payment_amount, tds_deducted in records:
        key = _ledger_key(vendor_or_pan)
        if key:
            totals[key] += float(tds_deducted or payment_amount or 0)
    return {key: _money(value) for key, value in totals.items()}


def _gl_recording_check(amount_as_per_gl: float | None, difference: float) -> str:
    if amount_as_per_gl is None:
        return DATA_NOT_AVAILABLE
    if abs(difference) <= GL_TOLERANCE:
        return NO_DIFFERENCE
    return GL_DIFFERENCE


def _tds_review(reference_available: bool, tds_amount: float | None) -> str:
    if not reference_available:
        return STATUTORY_NOT_AVAILABLE
    if tds_amount is None:
        return TDS_REVIEW
    return NO_DIFFERENCE


def _finding(gl_recording_check: str) -> str:
    if gl_recording_check == GL_DIFFERENCE:
        return GL_DIFFERENCE
    if gl_recording_check == DATA_NOT_AVAILABLE:
        return DATA_NOT_AVAILABLE
    return NO_DIFFERENCE


def _risk_level(gl_recording_check: str, difference: float) -> str:
    if gl_recording_check == GL_DIFFERENCE:
        return "High" if abs(difference) >= 100000 else "Medium"
    return "Low"


def _summary(rows: list[ExpenseAuditResult]) -> dict:
    return {
        "total_ledgers_audited": len(rows),
        "total_amount_audited": _money(sum(row.amount_as_per_audit or 0 for row in rows)),
        "gl_differences": len([row for row in rows if row.gl_recording_check == GL_DIFFERENCE]),
        "tds_review_items": len([row for row in rows if row.tds_review != NO_DIFFERENCE]),
        "gst_review_items": len([row for row in rows if row.gst_review != NO_DIFFERENCE]),
        "ca_review_required_count": len([row for row in rows if row.ca_review_status == CA_REVIEW_REQUIRED]),
    }


def _result_row(index: int, row: ExpenseAuditResult) -> dict:
    return {
        "id": row.id,
        "result_id": row.id,
        "sr_no": index,
        "ledger_name": row.ledger_name,
        "expense_type": row.expense_type,
        "amount_as_per_audit": row.amount_as_per_audit,
        "amount_as_per_gl": row.amount_as_per_gl,
        "difference_amount": row.difference_amount,
        "tds_review": row.tds_review,
        "gst_review": row.gst_review,
        "payment_40a3_review": row.payment_40a3_review,
        "gl_recording_check": row.gl_recording_check,
        "finding": row.finding,
        "risk_level": row.risk_level,
        "ca_review_status": row.ca_review_status,
        "ca_remarks": row.ca_remarks or "",
        "statutory_reference_status": row.statutory_reference_status,
        "statutory_reference_note": row.statutory_reference_note,
    }


def _ledger_key(value: str | None) -> str:
    return " ".join((value or "").split()).casefold()


def _money(value: float | int | None) -> float:
    return round(float(value or 0), 2)


def _difference(amount_as_per_audit: float, amount_as_per_gl: float | None) -> float:
    if amount_as_per_gl is None:
        return 0
    difference = _money(amount_as_per_audit - amount_as_per_gl)
    return 0 if abs(difference) <= GL_TOLERANCE else difference


def _is_ignored_gl_key(key: str) -> bool:
    ignored = {
        "grand total",
        "direct expenses",
        "indirect expenses",
        "group summary",
        "closing balance",
        "debit",
        "credit",
        "particulars",
    }
    return key in ignored or key.startswith(("cin ", "date ", "address "))


def _gl_amounts_from_uploaded_files(db: Session, client_id: int) -> dict[str, float]:
    files = _latest_trial_balance_files(db, client_id)
    totals: dict[str, float] = defaultdict(float)
    for uploaded in files:
        rows = _trial_balance_preview_rows(uploaded)
        for row in rows:
            ledger_name = clean_text(_row_value(row, "Ledger Name", "ledger_name", "Particulars", "particulars"))
            key = _ledger_key(ledger_name)
            if not key or _is_ignored_gl_key(key):
                continue
            debit = parse_amount(_row_value(row, "Debit", "debit_amount", "Debit Amount")) or 0
            credit = parse_amount(_row_value(row, "Credit", "credit_amount", "Credit Amount")) or 0
            if not debit and not credit:
                amount = parse_amount(_row_value(row, "Net Amount", "Amount", "amount", "Closing Balance"))
                if amount is None:
                    continue
                totals[key] += amount
            else:
                totals[key] += debit - credit
    return {key: _money(abs(amount)) for key, amount in totals.items()}


def _latest_trial_balance_files(db: Session, client_id: int) -> list[UploadedFile]:
    files = db.query(UploadedFile).filter(
        UploadedFile.client_id == client_id,
        UploadedFile.category == "trial-balance",
    ).order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc()).all()
    if not files:
        return []
    latest_session_id = files[0].upload_session_id
    if latest_session_id:
        return [uploaded for uploaded in files if uploaded.upload_session_id == latest_session_id]
    return [files[0]]


def _trial_balance_preview_rows(uploaded: UploadedFile) -> list[dict]:
    path = Path(uploaded.stored_path or "")
    if path.exists():
        parsed = parse_file(path, "trial-balance")
        rows = parsed.get("preview") or []
        if rows:
            return rows
    return from_json(uploaded.preview_json, [])


def _row_value(row: dict, *keys: str):
    normalized = {_normal_key(key): value for key, value in row.items()}
    for key in keys:
        if key in row:
            return row.get(key)
        value = normalized.get(_normal_key(key))
        if value is not None:
            return value
    return ""


def _normal_key(value: str) -> str:
    return "".join(char for char in str(value).casefold() if char.isalnum())
