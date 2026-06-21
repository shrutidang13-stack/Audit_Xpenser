from datetime import timedelta

from sqlalchemy.orm import Session

from app.models import ExpenseTransaction
from app.services.tds_normalisation_service import is_tds_ledger


def match_deduction(db: Session, client_id: int, item: dict) -> dict:
    source = item["source"]
    candidates = db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all()
    best = None
    for row in candidates:
        text = " ".join(filter(None, [row.ledger_name, row.narration])).casefold()
        if not is_tds_ledger(text) and not (row.tds_amount or 0):
            continue
        same_voucher = source.voucher_number and row.voucher_number == source.voucher_number
        same_vendor = source.vendor_name and row.vendor_name and source.vendor_name.casefold() in row.vendor_name.casefold()
        close_date = source.date and row.date and abs((source.date - row.date).days) <= 30
        if same_voucher or (same_vendor and close_date):
            best = row
            break
    actual = abs((best.tds_amount if best and best.tds_amount else best.amount if best else source.tds_amount) or 0)
    return {"row": best, "amount": actual, "date": best.date if best else (source.date if actual else None)}


def match_payment(db: Session, client_id: int, deduction: dict) -> dict:
    row = deduction.get("row")
    if not row:
        return {"row": None, "date": None, "challan_no": None, "amount": 0}
    candidates = db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all()
    for item in candidates:
        text = " ".join(filter(None, [item.ledger_name, item.narration])).casefold()
        if ("challan" in text or "tds payment" in text or "bank" in text) and item.date and row.date and item.date >= row.date:
            if item.date <= row.date + timedelta(days=120):
                return {"row": item, "date": item.date, "challan_no": item.voucher_number, "amount": abs(item.amount or 0)}
    return {"row": None, "date": None, "challan_no": None, "amount": 0}
