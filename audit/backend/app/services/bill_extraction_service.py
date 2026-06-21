import re
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Bill, UploadedFile
from app.services.file_parser_service import parse_file
from app.services.utils import clean_text, parse_amount, parse_date


def latest_bill_uploads(db: Session, client_id: int) -> list[UploadedFile]:
    files = (
        db.query(UploadedFile)
        .filter(UploadedFile.client_id == client_id, UploadedFile.category == "bills")
        .order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc())
        .all()
    )
    if not files:
        return []
    latest_session_id = next((item.upload_session_id for item in files if item.upload_session_id), None)
    if latest_session_id:
        return [item for item in files if item.upload_session_id == latest_session_id]
    return files


def extract_bills(db: Session, client_id: int) -> dict:
    files = latest_bill_uploads(db, client_id)
    processed = 0
    for uploaded in files:
        bill = db.query(Bill).filter(Bill.client_id == client_id, Bill.source_file_id == uploaded.id).first()
        if not bill:
            bill = Bill(client_id=client_id, source_file_id=uploaded.id, source_ref=uploaded.filename)
            db.add(bill)
        payload = _extract_from_upload(uploaded)
        for key, value in payload.items():
            setattr(bill, key, value)
        bill.vendor_name = bill.vendor_name or bill.extracted_vendor_name
        bill.gstin = bill.gstin or bill.extracted_vendor_gstin
        bill.invoice_number = bill.invoice_number or bill.extracted_invoice_number
        bill.invoice_date = bill.invoice_date or bill.extracted_invoice_date
        bill.amount = bill.extracted_total_amount
        bill.readable = payload["extraction_status"] != "OCR Review Required"
        processed += 1
    db.commit()
    return {"status": "completed", "processed": processed}


def _extract_from_upload(uploaded: UploadedFile) -> dict:
    path = Path(uploaded.stored_path)
    parsed = {}
    if not clean_text(uploaded.raw_text) and path.exists():
        parsed = parse_file(path, "bills")
    text = " ".join([
        clean_text(uploaded.filename),
        clean_text(uploaded.raw_text),
        clean_text(parsed.get("raw_text") if isinstance(parsed, dict) else ""),
    ])
    gstin = _find_gstin(text)
    invoice = _find_invoice(text) or _stem_invoice(uploaded.filename)
    date = _find_date(text)
    amounts = [_amount for _amount in re.findall(r"(?:Rs\.?|INR|₹)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)", text, flags=re.I)]
    numeric = [parse_amount(value) for value in amounts]
    numeric = [value for value in numeric if value is not None]
    total = _find_total_amount(text)
    total_gst = _find_tax(text)
    taxable = total - total_gst if total is not None and total_gst is not None and total >= total_gst else None
    vendor = _find_vendor(text, uploaded.filename)
    confidence = 30
    confidence += 20 if gstin else 0
    confidence += 20 if invoice else 0
    confidence += 15 if date else 0
    confidence += 15 if total else 0
    status = "Extracted" if confidence >= 60 else "OCR Review Required"
    return {
        "extracted_text": text[:20000],
        "extracted_vendor_name": vendor,
        "extracted_vendor_gstin": gstin,
        "extracted_invoice_number": invoice,
        "extracted_invoice_date": date,
        "extracted_taxable_value": taxable,
        "extracted_cgst": None,
        "extracted_sgst": None,
        "extracted_igst": total_gst,
        "extracted_total_gst": total_gst,
        "extracted_total_amount": total,
        "extraction_confidence": min(confidence, 100),
        "extraction_status": status,
        "ocr_review_required": status != "Extracted",
    }


def _find_gstin(text: str) -> str:
    match = re.search(r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b", text.upper())
    return match.group(0) if match else ""


def _find_invoice(text: str) -> str:
    patterns = [
        r"(?:invoice|inv|bill)\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9/\-]{2,40})",
        r"\b([A-Z]{1,6}/[0-9A-Z/\-]{3,40})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            return clean_text(match.group(1)).strip("-:")
    return ""


def _stem_invoice(filename: str) -> str:
    stem = Path(filename).stem
    return stem[:80] if any(char.isdigit() for char in stem) else ""


def _find_date(text: str):
    match = re.search(r"\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b", text)
    return parse_date(match.group(1)) if match else None


def _find_tax(text: str):
    values = []
    for label in ["cgst", "sgst", "igst", "gst"]:
        match = re.search(rf"{label}\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([0-9][0-9,]*(?:\.[0-9]{{1,2}})?)", text, flags=re.I)
        if match:
            value = parse_amount(match.group(1))
            if value is not None:
                values.append(value)
    return sum(values) if values else None


def _find_total_amount(text: str) -> float | None:
    labels = list(re.finditer(
        r"(?:grand\s+total|invoice\s+total|voice\s+total|total\s+amount|amount\s+payable|net\s+amount|net\s+payable)",
        text,
        flags=re.I,
    ))
    for match in reversed(labels):
        values = _money_values(text[match.end():match.end() + 180])
        if values:
            return values[-1]
    values = _money_values(text)
    return max(values) if values else None


def _money_values(text: str) -> list[float]:
    patterns = (
        r"(?<![A-Za-z0-9])(?:\d{1,3}\s+){1,5}\d{1,3}\.\d{1,2}(?![A-Za-z0-9])",
        r"(?<![A-Za-z0-9])\d{1,3}(?:[,.]\d{2,3}){1,5}(?![A-Za-z0-9])",
        r"(?<![A-Za-z0-9])\d[\d,]*\.\d{1,2}(?![A-Za-z0-9])",
    )
    matches: list[tuple[int, int, str]] = []
    for pattern in patterns:
        matches.extend((match.start(), match.end(), match.group(0)) for match in re.finditer(pattern, text))
    values: list[float] = []
    last_end = -1
    for start, end, token in sorted(matches, key=lambda item: (item[0], -(item[1] - item[0]))):
        if start < last_end:
            continue
        value = _parse_money_token(token)
        if value is not None and 0 < value <= 100_000_000:
            values.append(value)
        last_end = end
    return values


def _parse_money_token(token: str) -> float | None:
    compact = re.sub(r"\s+", "", token)
    if compact.count(".") > 1 and "," not in compact:
        parts = compact.split(".")
        compact = "".join(parts[:-1]) + "." + parts[-1]
    return parse_amount(compact)


def _find_vendor(text: str, filename: str) -> str:
    lines = [clean_text(line) for line in text.splitlines() if clean_text(line)]
    for line in lines[:10]:
        if len(line) > 3 and not re.search(r"invoice|tax|gstin|date", line, re.I):
            return line[:255]
    return clean_text(Path(filename).stem.replace("_", " ").replace("-", " "))[:255]
