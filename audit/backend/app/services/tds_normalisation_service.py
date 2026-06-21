import re

from sqlalchemy.orm import Session

from app.models import ExpenseTransaction, Vendor


SECTION_RULES = (
    ("195", 20.0, ("foreign", "non resident", "import")),
    ("192", 10.0, ("salary", "wages")),
    ("194I", 10.0, ("rent", "lease")),
    ("194J", 10.0, ("professional", "consultancy", "technical", "legal", "audit fee")),
    ("194H", 5.0, ("commission", "brokerage")),
    ("194A", 10.0, ("interest",)),
    ("194C", 2.0, ("contract", "job work", "freight", "transport", "repair", "labour")),
    ("194Q", 0.1, ("purchase", "goods", "material")),
)


def source_entries(db: Session, client_id: int) -> list[dict]:
    vendors = {v.name.casefold(): v for v in db.query(Vendor).filter(Vendor.client_id == client_id).all() if v.name}
    rows = db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all()
    result = []
    for row in rows:
        text = " ".join(filter(None, [row.ledger_name, row.narration, row.vendor_name])).casefold()
        section, rate = section_for(text)
        if not section or is_tds_ledger(text):
            continue
        vendor = vendors.get((row.vendor_name or "").casefold())
        gross = abs(row.amount or 0)
        gst = abs(row.gst_amount or 0)
        base = max(gross - gst, 0)
        result.append({
            "source": row,
            "vendor_pan": vendor.pan if vendor else None,
            "vendor_gstin": vendor.gstin if vendor else None,
            "section": section,
            "rate": rate,
            "gross": gross,
            "gst": gst,
            "base": base,
            "expected": round(base * rate / 100, 2),
        })
    return result


def section_for(text: str) -> tuple[str | None, float]:
    for section, rate, terms in SECTION_RULES:
        if any(term in text for term in terms):
            return section, rate
    return None, 0


def is_tds_ledger(text: str) -> bool:
    return bool(re.search(r"\btds\b|tax deducted at source", text, re.I))
