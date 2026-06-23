from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import (
    BankTransaction,
    Bill,
    ColumnMapping,
    ExpenseTransaction,
    GSTRecord,
    TDSRecord,
    TrialBalanceLine,
    UploadedFile,
    Vendor,
)
from app.services.utils import clean_text, from_json, parse_amount, parse_date


FIELD_ALIASES = {
    "amount": ["Amount"],
    "date": ["Date"],
    "debit_credit": ["Debit/Credit", "Debit Credit"],
    "gst_amount": ["GST Amount"],
    "invoice_number": ["Invoice number", "Invoice Number"],
    "ledger_name": ["Ledger name", "Ledger Name"],
    "narration": ["Narration"],
    "payment_mode": ["Payment mode", "Payment Mode"],
    "tds_amount": ["TDS Amount"],
    "vendor_name": ["Vendor name", "Vendor Name"],
    "voucher_number": ["Voucher number", "Voucher Number"],
    "debit_amount": ["Debit", "Debit Amount", "Dr"],
    "credit_amount": ["Credit", "Credit Amount", "Cr"],
}


def normalise_client_uploads(db: Session, client_id: int, file_ids: list[int] | None = None) -> dict:
    models = (ExpenseTransaction, Vendor, Bill, TDSRecord, GSTRecord, BankTransaction, TrialBalanceLine)
    for model in models:
        query = delete(model).where(model.client_id == client_id)
        if file_ids:
            # A scoped processing run must only replace rows produced by those
            # files. Clearing the whole client here made every later upload
            # erase previously extracted bills and GST records.
            query = query.where(model.source_file_id.in_(file_ids))
        db.execute(query)
    db.commit()

    counts = {"expenses": 0, "vendors": 0, "bills": 0, "tds": 0, "gst": 0, "bank": 0, "trial_balance": 0}
    query = db.query(UploadedFile).filter(UploadedFile.client_id == client_id)
    if file_ids:
        query = query.filter(UploadedFile.id.in_(file_ids))
    files = query.all()
    for uploaded in files:
        rows = from_json(uploaded.preview_json, [])
        mapping = _mapping_for_file(db, uploaded)
        if uploaded.category in {"expense-ledger", "purchase-register", "msme-report"}:
            counts["expenses"] += _normalise_expenses(db, client_id, uploaded, rows, mapping)
        elif uploaded.category == "vendor-master":
            counts["vendors"] += _normalise_vendors(db, client_id, uploaded, rows, mapping)
        elif uploaded.category == "bills":
            counts["bills"] += _normalise_bills(db, client_id, uploaded, rows, mapping)
        elif uploaded.category == "tds-data":
            counts["tds"] += _normalise_tds(db, client_id, uploaded, rows, mapping)
        elif uploaded.category == "gst-data":
            counts["gst"] += _normalise_gst(db, client_id, uploaded, rows, mapping)
        elif uploaded.category == "bank-data":
            counts["bank"] += _normalise_bank(db, client_id, uploaded, rows, mapping)
        elif uploaded.category == "trial-balance":
            counts["trial_balance"] += _normalise_trial_balance(db, client_id, uploaded, rows, mapping)
    db.commit()
    return counts


def _mapping_for_file(db: Session, uploaded: UploadedFile) -> dict[str, str]:
    mappings = db.query(ColumnMapping).filter(ColumnMapping.file_id == uploaded.id).all()
    return {m.target_field: m.source_column for m in mappings if m.target_field}


def _get(row: dict, mapping: dict, field: str):
    source = mapping.get(field, field)
    for key in [source, field, *FIELD_ALIASES.get(field, [])]:
        if key in row:
            return row.get(key, "")
    normalised = {_normalise_key(key): value for key, value in row.items()}
    for key in [source, field, *FIELD_ALIASES.get(field, [])]:
        lookup = _normalise_key(key)
        if lookup in normalised:
            return normalised[lookup]
    return ""


def _normalise_key(value: str) -> str:
    return "".join(char for char in str(value).casefold() if char.isalnum())


def _normalise_expenses(db, client_id, uploaded, rows, mapping):
    inserted = 0
    for idx, row in enumerate(rows, start=1):
        amount = parse_amount(_get(row, mapping, "amount")) or 0
        date = parse_date(_get(row, mapping, "date"))
        voucher_number = clean_text(_get(row, mapping, "voucher_number"))
        ledger_name = clean_text(_get(row, mapping, "ledger_name"))
        vendor_name = clean_text(_get(row, mapping, "vendor_name"))
        narration = clean_text(_get(row, mapping, "narration"))
        if not any([date, voucher_number, ledger_name, vendor_name, narration, amount]):
            continue
        db.add(ExpenseTransaction(
            client_id=client_id,
            source_file_id=uploaded.id,
            source_ref=f"row {idx}",
            date=date,
            voucher_number=voucher_number,
            ledger_name=ledger_name,
            vendor_name=vendor_name,
            narration=narration,
            amount=amount,
            debit_credit=clean_text(_get(row, mapping, "debit_credit")),
            payment_mode=clean_text(_get(row, mapping, "payment_mode")),
            invoice_number=clean_text(_get(row, mapping, "invoice_number")),
            gst_amount=parse_amount(_get(row, mapping, "gst_amount")),
            tds_amount=parse_amount(_get(row, mapping, "tds_amount")),
        ))
        inserted += 1
    return inserted


def _normalise_vendors(db, client_id, uploaded, rows, mapping):
    for idx, row in enumerate(rows, start=1):
        name = clean_text(_get(row, mapping, "name") or _get(row, mapping, "vendor_name"))
        if not name:
            continue
        db.add(Vendor(
            client_id=client_id,
            source_file_id=uploaded.id,
            source_ref=f"row {idx}",
            name=name,
            pan=clean_text(_get(row, mapping, "pan")).upper() or None,
            gstin=clean_text(_get(row, mapping, "gstin")).upper() or None,
            address=clean_text(_get(row, mapping, "address")),
            vendor_type=clean_text(_get(row, mapping, "vendor_type")),
            contact=clean_text(_get(row, mapping, "contact")),
        ))
    return len(rows)


def _normalise_bills(db, client_id, uploaded, rows, mapping):
    if uploaded.raw_text and not rows:
        rows = [{"extracted_text": uploaded.raw_text}]
    for idx, row in enumerate(rows or [{}], start=1):
        db.add(Bill(
            client_id=client_id,
            source_file_id=uploaded.id,
            source_ref=f"page/row {idx}",
            vendor_name=clean_text(_get(row, mapping, "vendor_name")),
            invoice_number=clean_text(_get(row, mapping, "invoice_number")),
            invoice_date=parse_date(_get(row, mapping, "invoice_date")),
            amount=parse_amount(_get(row, mapping, "amount")),
            gstin=clean_text(_get(row, mapping, "gstin")).upper() or None,
            pan=clean_text(_get(row, mapping, "pan")).upper() or None,
            extracted_text=clean_text(row.get("extracted_text") or uploaded.raw_text),
            readable=not uploaded.ca_review_required,
        ))
    return len(rows or [{}])


def _normalise_tds(db, client_id, uploaded, rows, mapping):
    for row in rows:
        db.add(TDSRecord(
            client_id=client_id,
            source_file_id=uploaded.id,
            vendor_or_pan=clean_text(_get(row, mapping, "vendor_or_pan")).upper(),
            section=clean_text(_get(row, mapping, "section")),
            payment_amount=parse_amount(_get(row, mapping, "payment_amount")),
            tds_deducted=parse_amount(_get(row, mapping, "tds_deducted")),
            tds_deposited=parse_amount(_get(row, mapping, "tds_deposited")),
            challan_details=clean_text(_get(row, mapping, "challan_details")),
        ))
    return len(rows)


def _normalise_gst(db, client_id, uploaded, rows, mapping):
    inserted = 0
    for row in rows:
        db.add(GSTRecord(
            client_id=client_id,
            source_file_id=uploaded.id,
            gstin=clean_text(_get(row, mapping, "gstin")).upper(),
            vendor_name=clean_text(_get(row, mapping, "vendor_name")),
            invoice_number=clean_text(_get(row, mapping, "invoice_number")),
            invoice_date=parse_date(_get(row, mapping, "invoice_date")),
            taxable_value=parse_amount(_get(row, mapping, "taxable_value")),
            gst_amount=_gst_amount(row, mapping),
            itc_status=clean_text(_get(row, mapping, "itc_status")),
        ))
        inserted += 1
    return inserted


def _gst_amount(row: dict, mapping: dict):
    parts = [parse_amount(row.get(field)) for field in ["igst", "cgst", "sgst", "cess"]]
    available = [part for part in parts if part is not None]
    if available:
        return sum(available)
    mapped = parse_amount(_get(row, mapping, "gst_amount"))
    if mapped is not None:
        return mapped
    return None


def _normalise_bank(db, client_id, uploaded, rows, mapping):
    for row in rows:
        db.add(BankTransaction(
            client_id=client_id,
            source_file_id=uploaded.id,
            date=parse_date(_get(row, mapping, "date")),
            particulars=clean_text(_get(row, mapping, "particulars")),
            amount=parse_amount(_get(row, mapping, "amount")),
            mode=clean_text(_get(row, mapping, "mode")),
            reference_number=clean_text(_get(row, mapping, "reference_number")),
        ))
    return len(rows)


def _normalise_trial_balance(db, client_id, uploaded, rows, mapping):
    inserted = 0
    for row in rows:
        ledger_name = clean_text(_get(row, mapping, "ledger_name"))
        if _ignore_gl_row(ledger_name):
            continue
        debit_amount = parse_amount(_get(row, mapping, "debit_amount")) or 0
        credit_amount = parse_amount(_get(row, mapping, "credit_amount")) or 0
        amount = parse_amount(_get(row, mapping, "amount"))
        if amount is None:
            amount = debit_amount - credit_amount
        db.add(TrialBalanceLine(
            client_id=client_id,
            source_file_id=uploaded.id,
            ledger_name=ledger_name,
            debit_amount=debit_amount,
            credit_amount=credit_amount,
            amount=amount,
        ))
        inserted += 1
    return inserted


def _ignore_gl_row(ledger_name: str | None) -> bool:
    value = clean_text(ledger_name)
    if not value:
        return True
    normalized = "".join(char if char.isalnum() else " " for char in value.casefold())
    normalized = " ".join(normalized.split())
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
    if normalized in ignored:
        return True
    return normalized.startswith(("cin ", "date ", "address "))
