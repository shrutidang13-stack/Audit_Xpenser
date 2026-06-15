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


def normalise_client_uploads(db: Session, client_id: int) -> dict:
    db.execute(delete(ExpenseTransaction).where(ExpenseTransaction.client_id == client_id))
    db.execute(delete(Vendor).where(Vendor.client_id == client_id))
    db.execute(delete(Bill).where(Bill.client_id == client_id))
    db.execute(delete(TDSRecord).where(TDSRecord.client_id == client_id))
    db.execute(delete(GSTRecord).where(GSTRecord.client_id == client_id))
    db.execute(delete(BankTransaction).where(BankTransaction.client_id == client_id))
    db.execute(delete(TrialBalanceLine).where(TrialBalanceLine.client_id == client_id))
    db.commit()

    counts = {"expenses": 0, "vendors": 0, "bills": 0, "tds": 0, "gst": 0, "bank": 0, "trial_balance": 0}
    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id).all()
    for uploaded in files:
        rows = from_json(uploaded.preview_json, [])
        mapping = _mapping_for_file(db, uploaded)
        if uploaded.category == "expense-ledger":
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
    return row.get(source, row.get(field, ""))


def _normalise_expenses(db, client_id, uploaded, rows, mapping):
    for idx, row in enumerate(rows, start=1):
        amount = parse_amount(_get(row, mapping, "amount")) or 0
        db.add(ExpenseTransaction(
            client_id=client_id,
            source_file_id=uploaded.id,
            source_ref=f"row {idx}",
            date=parse_date(_get(row, mapping, "date")),
            voucher_number=clean_text(_get(row, mapping, "voucher_number")),
            ledger_name=clean_text(_get(row, mapping, "ledger_name")),
            vendor_name=clean_text(_get(row, mapping, "vendor_name")),
            narration=clean_text(_get(row, mapping, "narration")),
            amount=amount,
            debit_credit=clean_text(_get(row, mapping, "debit_credit")),
            payment_mode=clean_text(_get(row, mapping, "payment_mode")),
            invoice_number=clean_text(_get(row, mapping, "invoice_number")),
            gst_amount=parse_amount(_get(row, mapping, "gst_amount")),
            tds_amount=parse_amount(_get(row, mapping, "tds_amount")),
        ))
    return len(rows)


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
    for row in rows:
        db.add(GSTRecord(
            client_id=client_id,
            source_file_id=uploaded.id,
            gstin=clean_text(_get(row, mapping, "gstin")).upper(),
            vendor_name=clean_text(_get(row, mapping, "vendor_name")),
            invoice_number=clean_text(_get(row, mapping, "invoice_number")),
            invoice_date=parse_date(_get(row, mapping, "invoice_date")),
            taxable_value=parse_amount(_get(row, mapping, "taxable_value")),
            gst_amount=parse_amount(_get(row, mapping, "gst_amount")),
            itc_status=clean_text(_get(row, mapping, "itc_status")),
        ))
    return len(rows)


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
    for row in rows:
        db.add(TrialBalanceLine(
            client_id=client_id,
            source_file_id=uploaded.id,
            ledger_name=clean_text(_get(row, mapping, "ledger_name")),
            amount=parse_amount(_get(row, mapping, "amount")),
        ))
    return len(rows)
