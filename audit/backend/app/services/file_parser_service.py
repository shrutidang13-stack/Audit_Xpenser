import json
import re
import tempfile
from pathlib import Path

import fitz
import pandas as pd
import pdfplumber
import xmltodict
from PIL import Image

from app.services.column_mapping_service import suggest_mapping
from app.services.ocr_service import extract_image_text
from app.services.utils import clean_text, file_sha256, to_json


SUPPORTED_EXTENSIONS = {".xlsx", ".xls", ".csv", ".pdf", ".jpg", ".jpeg", ".png", ".xml", ".json"}
MAX_XML_FULL_PARSE_BYTES = 5 * 1024 * 1024
MAX_NAME_SCAN_BYTES = 2 * 1024 * 1024
MAX_OCR_PDF_PAGES = 5


def parse_file(path: Path, category: str) -> dict:
    ext = path.suffix.lower()
    result = {
        "status": "Parsed",
        "records": 0,
        "columns": [],
        "preview": [],
        "raw_text": "",
        "error": None,
        "ca_review_required": False,
        "hash": file_sha256(path),
        "mapping": [],
    }
    try:
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError("Unsupported file format")
        if ext == ".csv":
            frame = pd.read_csv(path)
            result.update(_frame_result(frame, category))
        elif ext in {".xlsx", ".xls"}:
            if category.startswith("fixed-assets-"):
                frame = parse_structured_workbook(path, category)
            elif category == "trial-balance":
                frame = _parse_tally_group_summary_workbook(path)
            else:
                frame = pd.read_excel(path)
            result.update(_frame_result(frame, category))
        elif ext == ".xml":
            rows = _parse_xml_rows(path)
            frame = pd.DataFrame(rows)
            result.update(_frame_result(frame, category))
        elif ext == ".json":
            rows = _parse_json_rows(path)
            frame = pd.DataFrame(rows)
            result.update(_frame_result(frame, category))
        elif ext == ".pdf":
            text = _extract_pdf_text(path)
            result.update(_bill_text_result(text))
        else:
            result.update(_image_result(path))
    except Exception as exc:  # best-effort parser by design
        result["status"] = "CA Review Required"
        result["error"] = str(exc)
        result["ca_review_required"] = True
    return result


def _frame_result(frame: pd.DataFrame, category: str) -> dict:
    frame = frame.fillna("")
    preview = frame.to_dict(orient="records")
    columns = [str(c) for c in frame.columns]
    return {
        "records": int(len(frame.index)),
        "columns": columns,
        "preview": preview,
        "mapping": suggest_mapping(category, columns),
    }


def _parse_tally_group_summary_workbook(path: Path) -> pd.DataFrame:
    sheets = pd.read_excel(path, sheet_name=None, header=None)
    rows = []
    for sheet_name, frame in sheets.items():
        frame = frame.fillna("")
        for _, row in frame.iterrows():
            ledger_name = clean_text(row.iloc[0] if len(row) > 0 else "")
            debit = row.iloc[1] if len(row) > 1 else ""
            credit = row.iloc[2] if len(row) > 2 else ""
            if _ignore_tally_group_summary_row(ledger_name, debit, credit):
                continue
            rows.append({
                "Ledger Name": ledger_name,
                "Debit": debit,
                "Credit": credit,
                "Expense Type": clean_text(sheet_name),
            })
    return pd.DataFrame(rows, columns=["Ledger Name", "Debit", "Credit", "Expense Type"])


def parse_structured_workbook(path: Path, category: str) -> pd.DataFrame:
    sheets = pd.read_excel(path, sheet_name=None, header=None)
    best_frame = None
    best_score = -1
    for _, frame in sheets.items():
        frame = frame.fillna("")
        for row_index in range(min(len(frame.index), 30)):
            labels = [clean_text(value) for value in frame.iloc[row_index].tolist()]
            score = _header_score(labels, category)
            if score > best_score:
                best_score = score
                best_frame = _frame_from_header(frame, row_index)
    if best_frame is not None and best_score >= 2:
        return best_frame
    first_sheet = next(iter(sheets.values()))
    return pd.DataFrame(first_sheet).fillna("")


def _header_score(labels: list[str], category: str) -> int:
    text = " ".join(labels).casefold()
    expected = {
        "fixed-assets-opening": ["asset", "classification", "original cost", "wdv", "depreciation", "residual", "useful life"],
        "fixed-assets-opening-income-tax": ["asset", "block", "opening", "wdv", "depreciation", "rate"],
        "fixed-assets-additions": ["asset", "vendor", "invoice", "purchase", "amount", "capitalisation"],
        "fixed-assets-disposals": ["asset", "disposal", "sale", "mode"],
    }
    return sum(1 for token in expected.get(category, expected["fixed-assets-opening"]) if token in text)


def _frame_from_header(frame: pd.DataFrame, row_index: int) -> pd.DataFrame:
    headers = []
    used = {}
    for position, value in enumerate(frame.iloc[row_index].tolist()):
        label = clean_text(value) or f"Column {position + 1}"
        count = used.get(label, 0)
        used[label] = count + 1
        headers.append(label if count == 0 else f"{label} {count + 1}")
    data = frame.iloc[row_index + 1 :].copy()
    data.columns = headers
    data = data.fillna("")
    data = data.loc[~data.apply(lambda row: all(clean_text(value) == "" for value in row.tolist()), axis=1)]
    return data.reset_index(drop=True)


def _ignore_tally_group_summary_row(ledger_name, debit, credit) -> bool:
    name = clean_text(ledger_name)
    if not name:
        return True
    normalized = re.sub(r"[^a-z0-9]+", " ", name.casefold()).strip()
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
    if normalized.startswith(("cin ", "address ", "date ")):
        return True
    has_amount = any(str(value).strip() not in {"", "nan", "None"} for value in [debit, credit])
    return not has_amount


def _bill_text_result(text: str) -> dict:
    fields = _extract_invoice_fields(text)
    return {
        "records": 1 if text else 0,
        "columns": list(fields.keys()),
        "preview": [fields] if fields else [],
        "raw_text": text[:20000],
        "ca_review_required": not bool(text.strip()),
        "status": "Parsed" if text.strip() else "CA Review Required",
    }


def _extract_pdf_text(path: Path) -> str:
    pages = []
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                pages.append(page.extract_text() or "")
    except Exception:
        doc = fitz.open(path)
        pages = [page.get_text() for page in doc]
    text = clean_text("\n".join(pages))
    if text.strip():
        return text
    return _extract_scanned_pdf_text(path)


def _image_result(path: Path) -> dict:
    with Image.open(path) as image:
        width, height = image.size
    text = extract_image_text(path)
    parsed = _bill_text_result(text)
    if text.strip():
        fields = parsed["preview"][0] if parsed["preview"] else {}
        fields["image_width"] = width
        fields["image_height"] = height
        parsed["preview"] = [fields]
        parsed["columns"] = list(fields.keys())
        parsed["status"] = "Parsed with OCR"
        parsed["ca_review_required"] = False
        parsed["error"] = None
        return parsed
    return {
        "records": 0,
        "columns": ["image_width", "image_height", "extracted_text"],
        "preview": [{"image_width": width, "image_height": height, "extracted_text": "", "note": "OCR completed but no readable text was found"}],
        "ca_review_required": True,
        "status": "CA Review Required",
        "error": "OCR completed but no readable text was found.",
    }


def _extract_scanned_pdf_text(path: Path) -> str:
    pages = []
    doc = fitz.open(path)
    try:
        for index, page in enumerate(doc):
            if index >= MAX_OCR_PDF_PAGES:
                break
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as handle:
                temp_path = Path(handle.name)
                handle.write(pixmap.tobytes("png"))
            try:
                pages.append(extract_image_text(temp_path))
            finally:
                try:
                    temp_path.unlink()
                except OSError:
                    pass
    finally:
        doc.close()
    return clean_text("\n".join(pages))


def _parse_json_rows(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
    rows = _extract_json_rows(data)
    return rows[:5000] if rows else [_simple_flat(data)]


def _extract_json_rows(data) -> list[dict]:
    if isinstance(data, list):
        return [_simple_flat(item) for item in data if isinstance(item, dict)]
    if not isinstance(data, dict):
        return []
    preferred_keys = ["b2b", "inv", "invoices", "items", "records", "data", "docs", "documents"]
    for key in preferred_keys:
        value = data.get(key)
        if isinstance(value, list):
            nested = []
            for item in value:
                if isinstance(item, dict):
                    child_rows = _extract_json_rows(item)
                    nested.extend(child_rows or [_simple_flat(item)])
            if nested:
                return nested
    rows = []
    for value in data.values():
        child_rows = _extract_json_rows(value)
        if child_rows:
            rows.extend(child_rows)
    return rows


def _read_xml_text(path: Path) -> str:
    text = path.read_text(encoding=_detect_text_encoding(path), errors="ignore")
    return _sanitize_xml_text(text)


def _sanitize_xml_text(text: str) -> str:
    def replace_numeric_ref(match):
        raw = match.group(1)
        try:
            codepoint = int(raw[1:], 16) if raw.lower().startswith("x") else int(raw)
        except ValueError:
            return ""
        allowed = codepoint in (0x9, 0xA, 0xD) or 0x20 <= codepoint <= 0xD7FF or 0xE000 <= codepoint <= 0xFFFD or 0x10000 <= codepoint <= 0x10FFFF
        return match.group(0) if allowed else ""

    text = re.sub(r"&#(x[0-9a-fA-F]+|\d+);", replace_numeric_ref, text)
    return "".join(ch for ch in text if ch in "\t\n\r" or ord(ch) >= 0x20)


def _parse_xml_rows(path: Path) -> list[dict]:
    voucher_rows = _extract_tally_vouchers_from_path(path)
    if voucher_rows:
        return voucher_rows
    text = _read_xml_prefix(path, MAX_XML_FULL_PARSE_BYTES)
    data = xmltodict.parse(text)
    return _flatten_xml(data)


def _extract_tally_vouchers_from_path(path: Path) -> list[dict]:
    rows = []
    buffer = ""
    with path.open("r", encoding=_detect_text_encoding(path), errors="ignore") as handle:
        while True:
            chunk = handle.read(256 * 1024)
            if not chunk:
                break
            buffer += chunk
            while True:
                start = buffer.upper().find("<VOUCHER")
                end = buffer.upper().find("</VOUCHER>")
                if start == -1:
                    buffer = buffer[-200:]
                    break
                if end == -1 or end < start:
                    buffer = buffer[start:]
                    break
                end += len("</VOUCHER>")
                rows.extend(_rows_from_voucher(_sanitize_xml_text(buffer[start:end])))
                buffer = buffer[end:]
                if len(rows) >= 5000:
                    return rows
    return rows


def _rows_from_voucher(block: str) -> list[dict]:
    rows = []
    date_text = _tag_value(block, "DATE")
    voucher_number = _tag_value(block, "VOUCHERNUMBER") or _tag_value(block, "REFERENCE")
    narration = _tag_value(block, "NARRATION")
    voucher_type = _tag_value(block, "VOUCHERTYPENAME")
    party_name = _tag_value(block, "PARTYLEDGERNAME") or _tag_value(block, "PARTYNAME")
    for ledger_block in re.findall(r"<ALLLEDGERENTRIES\.LIST[\s\S]*?</ALLLEDGERENTRIES\.LIST>", block, flags=re.I):
        amount = _tag_value(ledger_block, "AMOUNT")
        ledger_name = _tag_value(ledger_block, "LEDGERNAME")
        if ledger_name or amount:
            rows.append({
                "Date": date_text,
                "Voucher number": voucher_number,
                "Ledger name": ledger_name,
                "Vendor name": party_name or ledger_name,
                "Narration": narration or voucher_type,
                "Amount": amount,
                "Debit/Credit": "Dr" if str(amount).startswith("-") else "Cr",
                "Payment mode": voucher_type,
                "Invoice number": _tag_value(block, "REFERENCE"),
            })
    return rows


def _read_xml_prefix(path: Path, limit: int) -> str:
    with path.open("r", encoding=_detect_text_encoding(path), errors="ignore") as handle:
        text = handle.read(limit + 1)
    if len(text) > limit:
        return "<rows><row><xml_note>Large XML stored successfully. Please export Day Book as CSV/XLSX if full voucher extraction is not available.</xml_note></row></rows>"
    return _sanitize_xml_text(text)


def _tag_value(text: str, tag: str) -> str:
    match = re.search(rf"<{re.escape(tag)}[^>]*>([\s\S]*?)</{re.escape(tag)}>", text, flags=re.I)
    if not match:
        return ""
    return clean_text(re.sub(r"<[^>]+>", " ", match.group(1)))


def extract_party_name(path: Path) -> str:
    ext = path.suffix.lower()
    try:
        if ext == ".xml":
            return _extract_xml_party_name(path)
        if ext == ".csv":
            frame = pd.read_csv(path, nrows=20).fillna("")
            return _extract_frame_party_name(frame)
        if ext in {".xlsx", ".xls"}:
            frame = pd.read_excel(path, nrows=20).fillna("")
            return _extract_frame_party_name(frame)
    except Exception:
        return ""
    return ""


def _extract_xml_party_name(path: Path) -> str:
    with path.open("r", encoding=_detect_text_encoding(path), errors="ignore") as handle:
        text = _sanitize_xml_text(handle.read(MAX_NAME_SCAN_BYTES))
    tag_priority = [
        "COMPANYNAME",
        "CMPNAME",
        "REMOTECMPNAME",
        "CURRENTCOMPANY",
        "CLIENTNAME",
        "PARTYNAME",
    ]
    for tag in tag_priority:
        value = _normal_client_name(_tag_value(text, tag))
        if value:
            return value
    for container in re.findall(r"<REMOTECMPINFO\.LIST[\s\S]*?</REMOTECMPINFO\.LIST>", text, flags=re.I):
        value = _normal_client_name(_tag_value(container, "NAME"))
        if value:
            return value
    for tag in ["NAME", "MAILINGNAME"]:
        for value in re.findall(rf"<{tag}\b[^>]*>([\s\S]*?)</{tag}>", text, flags=re.I):
            cleaned = _normal_client_name(clean_text(re.sub(r"<[^>]+>", " ", value)))
            if cleaned:
                return cleaned
    return ""


def _extract_frame_party_name(frame: pd.DataFrame) -> str:
    for column in frame.columns:
        label = str(column).lower()
        if any(token in label for token in ["company", "client", "party", "business", "organisation", "organization"]):
            for value in frame[column].tolist():
                cleaned = _normal_client_name(value)
                if cleaned:
                    return cleaned
    for _, row in frame.head(8).iterrows():
        values = [clean_text(value) for value in row.tolist()]
        joined = " ".join(values)
        match = re.search(r"(?:company|client|party|business)\s*name\s*[:\-]?\s*([A-Za-z0-9&.,()' /-]{3,100})", joined, flags=re.I)
        if match:
            cleaned = _normal_client_name(match.group(1))
            if cleaned:
                return cleaned
    return ""


def _normal_client_name(value) -> str:
    text = clean_text(value)
    text = re.sub(r"^(?:company|client|party|business)\s*name\s*[:\-]\s*", "", text, flags=re.I)
    text = text.strip(" :-|")
    if len(text) < 3 or len(text) > 120:
        return ""
    blocked = {"primary", "day book", "voucher", "ledger", "profit & loss", "balance sheet", "not applicable"}
    if text.lower() in blocked:
        return ""
    if re.fullmatch(r"[\d\s./:-]+", text):
        return ""
    return text


def _detect_text_encoding(path: Path) -> str:
    prefix = path.read_bytes()[:4]
    if prefix.startswith(b"\xff\xfe") or prefix.startswith(b"\xfe\xff"):
        return "utf-16"
    if prefix.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    return "utf-8"


def _extract_invoice_fields(text: str) -> dict:
    amount_match = re.search(r"(?:total|amount|grand total)[^\d]{0,20}([0-9,]+(?:\.[0-9]{1,2})?)", text, re.I)
    invoice_match = re.search(r"(?:invoice|bill|voucher)\s*(?:no|number|#)?[:\-\s]*([A-Z0-9\/\-]+)", text, re.I)
    gstin_match = re.search(r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b", text)
    date_match = re.search(r"\b([0-3]?\d[\/\-.][01]?\d[\/\-.](?:20)?\d{2})\b", text)
    return {
        "vendor_name": "",
        "invoice_number": invoice_match.group(1) if invoice_match else "",
        "invoice_date": date_match.group(1) if date_match else "",
        "amount": amount_match.group(1) if amount_match else "",
        "gstin": gstin_match.group(0) if gstin_match else "",
        "extracted_text": text[:1000],
    }


def _flatten_xml(data: dict) -> list[dict]:
    rows = []

    def walk(node, prefix=""):
        if isinstance(node, dict):
            flat = {}
            for key, value in node.items():
                if isinstance(value, list):
                    for item in value:
                        rows.append(_simple_flat(item))
                elif isinstance(value, dict):
                    flat.update({f"{key}.{k}": v for k, v in _simple_flat(value).items()})
                else:
                    flat[key] = value
            if flat:
                rows.append(flat)

    walk(data)
    return rows[:1000]


def _simple_flat(node) -> dict:
    if not isinstance(node, dict):
        return {"value": node}
    out = {}
    for key, value in node.items():
        if isinstance(value, dict):
            for inner_key, inner_value in _simple_flat(value).items():
                out[f"{key}.{inner_key}"] = inner_value
        elif not isinstance(value, list):
            out[key] = value
    return out
