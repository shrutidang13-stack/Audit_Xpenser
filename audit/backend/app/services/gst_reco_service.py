import json
import re
from collections import Counter
from dataclasses import dataclass
from html import unescape
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Client, ExpenseTransaction, GSTRecord, GSTRecoResult, GSTRecoRun, UploadedFile
from app.services.normalisation_service import normalise_client_uploads
from app.services.utils import clean_text, from_json, parse_amount, parse_date


GST_CATEGORIES = {"gst-data", "gst", "gstr-2b", "gstr-2a"}
BOOK_CATEGORIES = {"expense-ledger", "daybook", "books", "gl", "trial-balance"}
BOOK_CATEGORY_PRIORITY = {"expense-ledger": 0, "daybook": 1, "books": 2, "gl": 3, "trial-balance": 4}
BACKEND_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class RecoInvoice:
    source_ref: str
    vendor_name: str = ""
    gstin: str = ""
    invoice_number: str = ""
    invoice_date: object = None
    taxable_value: float | None = None
    tax_amount: float | None = None
    amount: float | None = None
    key_hint: str = ""


def source_status(db: Session, client_id: int) -> dict:
    gstr_files = _gstr_files(db, client_id)
    purchase_register = _purchase_register_payload(client_id)
    books_file = _latest_books_file(db, client_id)
    input_register = _input_register_payload(client_id)
    input_ledger = input_register or _input_ledger_payload(books_file)
    combined_count = len(_combined_book_invoices(db, client_id, books_file)) if purchase_register or input_ledger else None
    return {
        "gstr_file": _gstr_source_payload(gstr_files),
        "gstr_files": [_file_payload(item) for item in gstr_files],
        "purchase_register_file": purchase_register,
        "input_register_file": input_register,
        "input_ledger_file": input_ledger,
        "combined_books_file": _combined_books_payload(purchase_register, input_ledger, combined_count),
        "books_file": _file_payload(books_file),
    }


def run_gst_reco(db: Session, client_id: int, payload=None) -> dict:
    if not db.get(Client, client_id):
        raise ValueError("Client not found")
    amount_tolerance = float(getattr(payload, "amount_tolerance", 2) or 2)
    date_tolerance_days = int(getattr(payload, "date_tolerance_days", 7) or 7)
    override_gstr_file = _selected_file(db, client_id, getattr(payload, "gstr_file_id", None))
    gstr_files = [override_gstr_file] if override_gstr_file else _gstr_files(db, client_id)
    books_file = _selected_file(db, client_id, getattr(payload, "books_file_id", None)) or _latest_books_file(db, client_id)
    if not gstr_files:
        raise ValueError("GSTR-2A/B JSON file not found for this client. Please upload GST JSON from Upload Centre.")
    if not books_file:
        raise ValueError("Books / Daybook file not found for this client. Please upload Daybook or GL from Upload Centre.")

    gstr_rows = _gstr_invoices_from_files(db, client_id, gstr_files)
    book_rows = _combined_book_invoices(db, client_id, books_file)
    db.execute(delete(GSTRecoResult).where(GSTRecoResult.client_id == client_id))
    db.commit()

    run = GSTRecoRun(
        client_id=client_id,
        gstr_file_id=gstr_files[0].id if gstr_files else None,
        books_file_id=books_file.id,
        total_gstr_invoices=len(gstr_rows),
        total_books_invoices=len(book_rows),
        itc_as_per_gstr=round(sum(row.tax_amount or 0 for row in gstr_rows), 2),
        itc_as_per_books=round(sum(row.tax_amount or 0 for row in book_rows), 2),
        amount_tolerance=amount_tolerance,
        date_tolerance_days=date_tolerance_days,
    )
    db.add(run)
    db.flush()

    _store_results(db, client_id, run, gstr_rows, book_rows, amount_tolerance, date_tolerance_days)
    _update_run_summary(db, run)
    db.commit()
    db.refresh(run)
    return {"status": "completed", "run_id": run.id, "summary": summary(db, client_id), "sources": source_status(db, client_id)}


def summary(db: Session, client_id: int) -> dict:
    run = _latest_run(db, client_id)
    sources = source_status(db, client_id)
    if not run:
        return {
            "latest_run": None,
            "sources": sources,
            "total_gstr_invoices": 0,
            "total_books_invoices": 0,
            "matched": 0,
            "only_in_gstr": 0,
            "only_in_books": 0,
            "amount_mismatch": 0,
            "duplicate_invoices": 0,
            "itc_as_per_gstr": 0,
            "itc_as_per_books": 0,
            "net_itc_difference": 0,
        }
    return {**_run_payload(run), **_result_counts(db, run), "sources": sources}


def results(db: Session, client_id: int, status: str | None = None, risk_level: str | None = None) -> list[dict]:
    run = _latest_run(db, client_id)
    if not run:
        return []
    query = db.query(GSTRecoResult).filter(GSTRecoResult.client_id == client_id, GSTRecoResult.run_id == run.id)
    if status:
        query = query.filter(GSTRecoResult.status == status)
    if risk_level:
        query = query.filter(GSTRecoResult.risk_level == risk_level)
    return [_result_payload(item) for item in query.order_by(GSTRecoResult.id.asc()).all()]


def export_rows(db: Session, client_id: int) -> list[dict]:
    return results(db, client_id)


def _store_results(db, client_id, run, gstr_rows, book_rows, amount_tolerance, date_tolerance_days):
    book_by_key = {}
    used_books = set()
    gstr_key_counts = Counter(_match_key(row) for row in gstr_rows if _match_key(row))
    book_key_counts = Counter(_match_key(row) for row in book_rows if _match_key(row))
    for index, row in enumerate(book_rows):
        key = _match_key(row)
        if key and key not in book_by_key:
            book_by_key[key] = (index, row)

    for gstr in gstr_rows:
        key = _match_key(gstr)
        if key and gstr_key_counts[key] > 1:
            db.add(_result(client_id, run.id, gstr, None, "DUPLICATE_IN_GSTR", "High", "Possible duplicate ITC booking risk. CA review required."))
            continue
        match = book_by_key.get(key)
        if not match:
            match = _best_fallback_match(gstr, book_rows, used_books, amount_tolerance)
        if not match:
            db.add(_result(client_id, run.id, gstr, None, "ONLY_IN_GSTR", "Medium", "Invoice appears in GSTR-2A/B but not found in books. Verify whether purchase entry or ITC booking is pending."))
            continue
        book_index, book = match
        used_books.add(book_index)
        if key and book_key_counts[key] > 1:
            db.add(_result(client_id, run.id, gstr, book, "DUPLICATE_IN_BOOKS", "High", "Possible duplicate ITC booking risk. CA review required."))
            continue
        status, risk, action = _compare(gstr, book, amount_tolerance, date_tolerance_days)
        db.add(_result(client_id, run.id, gstr, book, status, risk, action))

    for index, book in enumerate(book_rows):
        if index in used_books:
            continue
        key = _match_key(book)
        if key and book_key_counts[key] > 1:
            db.add(_result(client_id, run.id, None, book, "DUPLICATE_IN_BOOKS", "High", "Possible duplicate ITC booking risk. CA review required."))
        else:
            db.add(_result(client_id, run.id, None, book, "ONLY_IN_BOOKS", "Medium", "Invoice appears in books but not in GSTR-2A/B. Verify supplier filing before ITC claim."))


def _compare(gstr: RecoInvoice, book: RecoInvoice, amount_tolerance: float, date_tolerance_days: int) -> tuple[str, str, str]:
    tax_diff = abs((gstr.tax_amount or 0) - (book.tax_amount or 0))
    exact_key_match = bool(_match_key(gstr) and _match_key(gstr) == _match_key(book))
    if gstr.gstin and book.gstin and gstr.gstin != book.gstin:
        return "GSTIN_MISMATCH", "Medium", "GSTIN differs between books and GSTR-2A/B. Verify supplier GSTIN and invoice capture."
    if tax_diff > amount_tolerance:
        return "AMOUNT_MISMATCH", "Medium", "Tax amount differs between books and GSTR-2A/B. Verify invoice copy and accounting entry."
    if gstr.invoice_date and book.invoice_date and abs((gstr.invoice_date - book.invoice_date).days) > date_tolerance_days:
        return "DATE_MISMATCH", "Low-Medium", "Invoice date differs between books and GSTR-2A/B. Verify invoice period and accounting date."
    if _amount(gstr) and _amount(book) and abs(_amount(gstr) - _amount(book)) > amount_tolerance:
        return "POSSIBLE_MATCH", "Low-Medium", "Invoice number matches but taxable or gross amount differs. Review supporting invoice."
    if not exact_key_match:
        return "MATCHED", "Low", "Invoice appears matched between books and GSTR-2A/B based on vendor and amount."
    return "MATCHED", "Low", "Invoice appears matched between books and GSTR-2A/B."


def _best_fallback_match(gstr: RecoInvoice, book_rows: list[RecoInvoice], used_books: set[int], amount_tolerance: float):
    best = None
    best_score = 0
    for index, book in enumerate(book_rows):
        if index in used_books:
            continue
        score = 0
        if gstr.gstin and book.gstin and gstr.gstin == book.gstin:
            score += 35
        if _vendor_key(gstr.vendor_name) and _vendor_key(gstr.vendor_name) == _vendor_key(book.vendor_name):
            score += 25
        elif _vendor_overlap(gstr.vendor_name, book.vendor_name):
            score += 15
        if gstr.tax_amount is not None and book.tax_amount is not None and abs((gstr.tax_amount or 0) - (book.tax_amount or 0)) <= max(amount_tolerance, 1):
            score += 30
        if gstr.taxable_value is not None and book.taxable_value is not None and abs((gstr.taxable_value or 0) - (book.taxable_value or 0)) <= max(amount_tolerance, 5):
            score += 25
        if gstr.amount is not None and book.amount is not None and abs((gstr.amount or 0) - (book.amount or 0)) <= max(amount_tolerance, 5):
            score += 10
        if gstr.invoice_date and book.invoice_date and abs((gstr.invoice_date - book.invoice_date).days) <= 31:
            score += 10
        if score > best_score:
            best_score = score
            best = (index, book)
    return best if best_score >= 55 else None


def _result(client_id, run_id, gstr, book, status, risk, action):
    return GSTRecoResult(
        client_id=client_id,
        run_id=run_id,
        gstr_source_ref=gstr.source_ref if gstr else None,
        books_source_ref=book.source_ref if book else None,
        vendor_name=(book.vendor_name if book and book.vendor_name else gstr.vendor_name if gstr else ""),
        gstin=(gstr.gstin if gstr and gstr.gstin else book.gstin if book else ""),
        invoice_number=(gstr.invoice_number if gstr and gstr.invoice_number else book.invoice_number if book else ""),
        gstr_invoice_date=gstr.invoice_date if gstr else None,
        books_invoice_date=book.invoice_date if book else None,
        gstr_taxable_value=gstr.taxable_value if gstr else None,
        books_taxable_value=book.taxable_value if book else None,
        gstr_tax_amount=gstr.tax_amount if gstr else None,
        books_tax_amount=book.tax_amount if book else None,
        difference_amount=round((gstr.tax_amount or 0 if gstr else 0) - (book.tax_amount or 0 if book else 0), 2),
        status=status,
        risk_level=risk,
        suggested_action=action,
    )


def _update_run_summary(db: Session, run: GSTRecoRun) -> None:
    db.flush()
    rows = db.query(GSTRecoResult).filter(GSTRecoResult.run_id == run.id).all()
    counts = Counter(row.status for row in rows)
    run.matched_count = counts["MATCHED"]
    run.only_in_gstr_count = counts["ONLY_IN_GSTR"]
    run.only_in_books_count = counts["ONLY_IN_BOOKS"]
    run.amount_mismatch_count = counts["AMOUNT_MISMATCH"]
    run.duplicate_invoices_count = counts["DUPLICATE_IN_GSTR"] + counts["DUPLICATE_IN_BOOKS"]
    run.net_itc_difference = round((run.itc_as_per_books or 0) - (run.itc_as_per_gstr or 0), 2)


def _result_counts(db: Session, run: GSTRecoRun) -> dict:
    counts = Counter(
        status
        for (status,) in db.query(GSTRecoResult.status).filter(GSTRecoResult.run_id == run.id).all()
    )
    return {
        "matched": counts["MATCHED"],
        "only_in_gstr": counts["ONLY_IN_GSTR"],
        "only_in_books": counts["ONLY_IN_BOOKS"],
        "amount_mismatch": counts["AMOUNT_MISMATCH"],
        "duplicate_invoices": counts["DUPLICATE_IN_GSTR"] + counts["DUPLICATE_IN_BOOKS"],
    }


def _gstr_invoices_from_files(db: Session, client_id: int, uploaded_files: list[UploadedFile]) -> list[RecoInvoice]:
    rows = []
    for uploaded in uploaded_files:
        rows.extend(_gstr_invoices(db, client_id, uploaded))
    return rows


def _gstr_invoices(db: Session, client_id: int, uploaded: UploadedFile) -> list[RecoInvoice]:
    rows = _rows_from_gstr_json(uploaded) if uploaded.file_type == ".json" else []
    if not rows:
        rows = [
            RecoInvoice(
                source_ref=f"{uploaded.filename}: gst record {item.id}",
                vendor_name=item.vendor_name or "",
                gstin=(item.gstin or "").upper(),
                invoice_number=item.invoice_number or "",
                invoice_date=item.invoice_date,
                taxable_value=item.taxable_value,
                tax_amount=item.gst_amount,
                amount=(item.taxable_value or 0) + (item.gst_amount or 0),
            )
            for item in db.query(GSTRecord).filter(GSTRecord.client_id == client_id, GSTRecord.source_file_id == uploaded.id).all()
        ]
    else:
        for row in rows:
            row.source_ref = f"{uploaded.filename}: {row.source_ref}"
    return [row for row in rows if row.invoice_number or row.gstin or row.tax_amount]


def _book_invoices(db: Session, client_id: int, uploaded: UploadedFile) -> list[RecoInvoice]:
    if uploaded.file_type == ".xml":
        rows = _book_invoices_from_tally_xml(uploaded)
        if rows:
            return rows
    rows = db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all()
    if not rows:
        normalise_client_uploads(db, client_id, [uploaded.id])
        rows = db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all()
    if uploaded.category != "trial-balance":
        rows = [row for row in rows if row.source_file_id == uploaded.id] or rows
    return [
        RecoInvoice(
            source_ref=row.source_ref or f"expense {row.id}",
            vendor_name=row.vendor_name or "",
            invoice_number=row.invoice_number or "",
            invoice_date=row.date,
            tax_amount=row.gst_amount,
            amount=abs(row.amount or 0),
        )
        for row in rows
        if row.invoice_number or row.gst_amount is not None
    ]


def _combined_book_invoices(db: Session, client_id: int, books_file: UploadedFile) -> list[RecoInvoice]:
    purchase_rows = _purchase_register_invoices(client_id)
    input_rows = _input_register_invoices(client_id) or _input_ledger_invoices(books_file)
    if not purchase_rows:
        return input_rows or _book_invoices(db, client_id, books_file)
    merged = list(purchase_rows)
    for row in input_rows:
        if row.tax_amount is None or abs(row.tax_amount or 0) <= 0.5:
            continue
        if _is_duplicate_book_row(row, merged):
            continue
        merged.append(row)
    return merged


def _is_duplicate_book_row(candidate: RecoInvoice, existing_rows: list[RecoInvoice]) -> bool:
    candidate_key = _match_key(candidate)
    if candidate_key and any(candidate_key == _match_key(row) for row in existing_rows):
        return True
    for row in existing_rows:
        if candidate.gstin and row.gstin and candidate.gstin != row.gstin:
            continue
        if not _vendor_overlap(candidate.vendor_name, row.vendor_name):
            continue
        if candidate.invoice_number and row.invoice_number and _clean_invoice_ref(candidate.invoice_number).casefold() == _clean_invoice_ref(row.invoice_number).casefold():
            return True
        tax_close = candidate.tax_amount is not None and row.tax_amount is not None and abs((candidate.tax_amount or 0) - (row.tax_amount or 0)) <= 2
        taxable_close = candidate.taxable_value is not None and row.taxable_value is not None and abs((candidate.taxable_value or 0) - (row.taxable_value or 0)) <= 5
        date_close = bool(candidate.invoice_date and row.invoice_date and abs((candidate.invoice_date - row.invoice_date).days) <= 31)
        if tax_close and (taxable_close or date_close):
            return True
    return False


def _book_invoices_from_tally_xml(uploaded: UploadedFile) -> list[RecoInvoice]:
    path = Path(uploaded.stored_path)
    if not path.exists():
        return []
    rows = []
    buffer = ""
    with path.open("r", encoding=_detect_text_encoding(path), errors="ignore") as handle:
        while True:
            chunk = handle.read(256 * 1024)
            if not chunk:
                break
            buffer += chunk
            while True:
                upper = buffer.upper()
                start = upper.find("<VOUCHER")
                end = upper.find("</VOUCHER>")
                if start == -1:
                    buffer = buffer[-200:]
                    break
                if end == -1 or end < start:
                    buffer = buffer[start:]
                    break
                end += len("</VOUCHER>")
                invoice = _book_invoice_from_voucher(buffer[start:end], uploaded.filename)
                if invoice:
                    rows.append(invoice)
                buffer = buffer[end:]
    return rows


def _input_ledger_payload(uploaded: UploadedFile | None) -> dict | None:
    if not uploaded or uploaded.file_type != ".xml":
        return None
    rows = _input_ledger_invoices(uploaded)
    if not rows:
        return None
    payload = _file_payload(uploaded)
    payload["filename"] = f"Input GST ledgers from {uploaded.filename}"
    payload["category"] = "input-ledger"
    payload["records_extracted"] = len(rows)
    return payload


def _combined_books_payload(purchase_register: dict | None, input_ledger: dict | None, records_extracted: int | None = None) -> dict | None:
    if not purchase_register and not input_ledger:
        return None
    sources = [item for item in [purchase_register, input_ledger] if item]
    return {
        "filename": "Purchase Register + Input GST Ledgers" if len(sources) > 1 else sources[0]["filename"],
        "category": "books-combined",
        "file_type": "mixed",
        "parse_status": "Parsed",
        "records_extracted": records_extracted if records_extracted is not None else sum(item.get("records_extracted") or 0 for item in sources),
        "created_at": None,
        "filenames": [item["filename"] for item in sources],
    }


def _input_ledger_invoices(uploaded: UploadedFile | None) -> list[RecoInvoice]:
    if not uploaded or uploaded.file_type != ".xml":
        return []
    path = Path(uploaded.stored_path)
    if not path.exists():
        return []
    rows = []
    buffer = ""
    with path.open("r", encoding=_detect_text_encoding(path), errors="ignore") as handle:
        while True:
            chunk = handle.read(256 * 1024)
            if not chunk:
                break
            buffer += chunk
            while True:
                upper = buffer.upper()
                start = upper.find("<VOUCHER")
                end = upper.find("</VOUCHER>")
                if start == -1:
                    buffer = buffer[-200:]
                    break
                if end == -1 or end < start:
                    buffer = buffer[start:]
                    break
                end += len("</VOUCHER>")
                invoice = _input_ledger_invoice_from_voucher(buffer[start:end], uploaded.filename)
                if invoice:
                    rows.append(invoice)
                buffer = buffer[end:]
    return rows


def _input_ledger_invoice_from_voucher(block: str, filename: str) -> RecoInvoice | None:
    ledger_entries = _ledger_entries(block)
    tax = _gst_tax_from_ledgers(ledger_entries)
    if tax is None or abs(tax) <= 0.5:
        return None
    voucher_type = _tag_value(block, "VOUCHERTYPENAME")
    voucher_key = voucher_type.casefold()
    if any(token in voucher_key for token in ["sales", "receipt", "payment", "contra", "stock journal", "delivery note", "material in", "material out"]):
        return None
    if voucher_key and not any(token in voucher_key for token in ["purchase", "journal", "debit note", "credit note"]):
        return None
    party_name = _tag_value(block, "PARTYLEDGERNAME") or _tag_value(block, "PARTYNAME") or _tag_value(block, "BASICBASEPARTYNAME")
    voucher_number = _clean_invoice_ref(_tag_value(block, "VOUCHERNUMBER"))
    invoice_number = _best_invoice_ref(block) or voucher_number
    if not invoice_number and not party_name:
        return None
    gross = _party_amount(ledger_entries, party_name)
    taxable = _inventory_taxable_value(block)
    if taxable is None:
        taxable = _taxable_from_ledgers(ledger_entries)
    if taxable is None and gross is not None:
        taxable = max(abs(gross) - abs(tax), 0)
    return RecoInvoice(
        source_ref=f"{filename}: input-ledger voucher {voucher_number or invoice_number or 'not available'}",
        vendor_name=party_name,
        gstin=_supplier_gstin(block),
        invoice_number=invoice_number or voucher_number,
        invoice_date=parse_date(_tag_value(block, "DATE") or _tag_value(block, "EFFECTIVEDATE")),
        taxable_value=round(abs(taxable), 2) if taxable is not None else None,
        tax_amount=round(abs(tax), 2) if tax is not None else None,
        amount=round(abs(gross), 2) if gross is not None else None,
    )


def _purchase_register_path(client_id: int) -> Path:
    return _upload_root() / str(client_id) / "purchase-register" / "PR.xml"


def _input_register_path(client_id: int) -> Path:
    return _upload_root() / str(client_id) / "input-register" / "Input Register.xlsx"


def _upload_root() -> Path:
    configured = Path(get_settings().upload_dir)
    return configured if configured.is_absolute() else BACKEND_ROOT / configured


def _purchase_register_payload(client_id: int) -> dict | None:
    path = _purchase_register_path(client_id)
    if not path.exists():
        return None
    rows = _purchase_register_invoices(client_id)
    return {
        "filename": path.name,
        "category": "purchase-register",
        "file_type": ".xml",
        "parse_status": "Parsed",
        "records_extracted": len(rows),
        "created_at": None,
        "full_path": str(path),
    }


def _input_register_payload(client_id: int) -> dict | None:
    path = _input_register_path(client_id)
    if not path.exists():
        return None
    rows = _input_register_invoices(client_id)
    return {
        "filename": path.name,
        "category": "input-register",
        "file_type": ".xlsx",
        "parse_status": "Parsed",
        "records_extracted": len(rows),
        "created_at": None,
        "full_path": str(path),
    }


def _purchase_register_invoices(client_id: int) -> list[RecoInvoice]:
    path = _purchase_register_path(client_id)
    if not path.exists():
        return []
    text = path.read_text(encoding=_detect_text_encoding(path), errors="ignore")
    rows = []
    for part in re.split(r"<DBCFIXED>", text, flags=re.I)[1:]:
        block = "<DBCFIXED>" + part
        invoice = _purchase_register_invoice_from_block(block, path.name)
        if invoice:
            rows.append(invoice)
    return rows


def _input_register_invoices(client_id: int) -> list[RecoInvoice]:
    path = _input_register_path(client_id)
    if not path.exists():
        return []
    try:
        import openpyxl
    except Exception:
        return []
    try:
        workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
    except Exception:
        return []
    rows = []
    for sheet in workbook.worksheets:
        sheet_name = clean_text(sheet.title).casefold()
        if "input" not in sheet_name:
            continue
        header_seen = False
        for values in sheet.iter_rows(values_only=True):
            cells = list(values or [])
            if not cells:
                continue
            first = clean_text(cells[0])
            if first.casefold() == "date":
                header_seen = True
                continue
            if not header_seen:
                continue
            invoice = _input_register_invoice_from_row(sheet.title, cells, path.name)
            if invoice:
                rows.append(invoice)
    return rows


def _input_register_invoice_from_row(sheet_name: str, cells: list, filename: str) -> RecoInvoice | None:
    date_value = _parse_excel_date(cells[0] if len(cells) > 0 else None)
    party_name = clean_text(cells[2] if len(cells) > 2 else "")
    voucher_type = clean_text(cells[3] if len(cells) > 3 else "")
    voucher_number = _clean_invoice_ref(cells[4] if len(cells) > 4 else "")
    if not date_value or not party_name or not voucher_number:
        return None
    tax = _input_register_tax_amount(sheet_name, cells)
    if tax is None or abs(tax) <= 0.5:
        return None
    return RecoInvoice(
        source_ref=f"{filename}: {clean_text(sheet_name)} voucher {voucher_number}",
        vendor_name=party_name,
        invoice_number=voucher_number,
        invoice_date=date_value,
        tax_amount=round(abs(tax), 2),
        key_hint=voucher_type,
    )


def _input_register_tax_amount(sheet_name: str, cells: list) -> float | None:
    title = clean_text(sheet_name).casefold()
    if "igst" in title and "cgst" not in title:
        debit = parse_amount(cells[5] if len(cells) > 5 else None)
        credit = parse_amount(cells[6] if len(cells) > 6 else None)
        if credit and abs(credit) > 0.5:
            return None
        return debit
    values = [parse_amount(cells[index] if len(cells) > index else None) for index in (5, 6, 7)]
    values = [value for value in values if value is not None]
    return sum(values) if values else None


def _parse_excel_date(value):
    if hasattr(value, "date"):
        return value.date()
    return parse_date(value)


def _purchase_register_invoice_from_block(block: str, filename: str) -> RecoInvoice | None:
    date_text = _tag_value(block, "DBCDATE")
    voucher_type = _tag_value(block, "DBCVCHTYPE")
    if not date_text or "purchase" not in voucher_type.casefold():
        return None
    vendor_name = _tag_value(block, "DBCBUYERNAME") or _tag_value(block, "DBCPARTY")
    gstin = clean_text(_tag_value(block, "DBCGSTIN")).upper()
    invoice_number = _clean_invoice_ref(
        _tag_value(block, "DBCVCHREF")
        or _tag_value(block, "DBCREPTDELDOCNO")
        or _tag_value(block, "DBCVCHNO")
    )
    voucher_number = _clean_invoice_ref(_tag_value(block, "DBCVCHNO"))
    taxable = parse_amount(_tag_value(block, "DBCAMOUNT"))
    gross = parse_amount(_tag_value(block, "DBCGROSSAMT"))
    if taxable is None and gross is None:
        return None
    tax = None
    if gross is not None and taxable is not None:
        diff = abs(gross) - abs(taxable)
        if diff > 0.5:
            tax = diff
        else:
            tax = 0
    if tax is None:
        tax = _purchase_register_tax_from_ledgers(block, taxable)
    return RecoInvoice(
        source_ref=f"{filename}: voucher {voucher_number or invoice_number or 'not available'}",
        vendor_name=vendor_name,
        gstin=gstin,
        invoice_number=invoice_number or voucher_number,
        invoice_date=_parse_tally_register_date(date_text),
        taxable_value=round(abs(taxable), 2) if taxable is not None else None,
        tax_amount=round(abs(tax), 2) if tax is not None else None,
        amount=round(abs(gross), 2) if gross is not None else None,
    )


def _purchase_register_tax_from_ledgers(block: str, taxable: float | None) -> float | None:
    values = [parse_amount(value) for value in _tag_values(block, "DBCLEDAMT")]
    values = [value for value in values if value is not None]
    if not values:
        return None
    taxable_abs = abs(taxable) if taxable is not None else None
    candidates = []
    for value in values:
        abs_value = abs(value)
        if taxable_abs is not None and abs(abs_value - taxable_abs) <= 1:
            continue
        if abs_value <= 1:
            continue
        candidates.append(abs_value)
    return sum(candidates) if candidates else 0


def _parse_tally_register_date(value: str | None):
    parsed = parse_date(value)
    if parsed:
        return parsed
    text = clean_text(value)
    if not text:
        return None
    from datetime import datetime

    for fmt in ("%d-%b-%y", "%d-%b-%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _book_invoice_from_voucher(block: str, filename: str) -> RecoInvoice | None:
    voucher_type = _tag_value(block, "VOUCHERTYPENAME")
    if voucher_type and not any(token in voucher_type.casefold() for token in ["purchase", "journal", "debit note", "credit note"]):
        return None
    party_name = _tag_value(block, "PARTYLEDGERNAME") or _tag_value(block, "PARTYNAME") or _tag_value(block, "BASICBASEPARTYNAME")
    voucher_number = _clean_invoice_ref(_tag_value(block, "VOUCHERNUMBER"))
    invoice_number = _best_invoice_ref(block) or voucher_number
    date_value = parse_date(_tag_value(block, "DATE") or _tag_value(block, "EFFECTIVEDATE"))
    gstin = _supplier_gstin(block)
    ledger_entries = _ledger_entries(block)
    inventory_taxable = _inventory_taxable_value(block)
    taxable = inventory_taxable if inventory_taxable is not None else _taxable_from_ledgers(ledger_entries)
    tax = _gst_tax_from_ledgers(ledger_entries)
    gross = _party_amount(ledger_entries, party_name)
    if tax is None and not invoice_number:
        return None
    if taxable is None and gross is not None and tax is not None:
        taxable = max(abs(gross) - abs(tax), 0)
    return RecoInvoice(
        source_ref=f"{filename}: voucher {voucher_number or invoice_number or 'not available'}",
        vendor_name=party_name,
        gstin=gstin,
        invoice_number=invoice_number or voucher_number,
        invoice_date=date_value,
        taxable_value=round(abs(taxable), 2) if taxable is not None else None,
        tax_amount=round(abs(tax), 2) if tax is not None else None,
        amount=round(abs(gross), 2) if gross is not None else None,
    )


def _ledger_entries(block: str) -> list[dict]:
    entries = []
    for entry in re.findall(r"<(?:ALL)?LEDGERENTRIES\.LIST[\s\S]*?</(?:ALL)?LEDGERENTRIES\.LIST>", block, flags=re.I):
        entries.append({
            "ledger_name": _tag_value(entry, "LEDGERNAME"),
            "amount": parse_amount(_tag_value(entry, "AMOUNT")),
            "vat_exp_amount": parse_amount(_tag_value(entry, "VATEXPAMOUNT")),
            "is_party": _tag_value(entry, "ISPARTYLEDGER").casefold() == "yes",
        })
    return entries


def _gst_tax_from_ledgers(entries: list[dict]) -> float | None:
    total = 0
    found = False
    for entry in entries:
        name = (entry.get("ledger_name") or "").casefold()
        if any(token in name for token in ["input igst", "input cgst", "input sgst", "input cess", "input gst"]):
            value = entry.get("vat_exp_amount")
            if value is None:
                value = entry.get("amount")
            if value is not None:
                total += abs(value)
                found = True
    return total if found else None


def _taxable_from_ledgers(entries: list[dict]) -> float | None:
    values = []
    for entry in entries:
        name = (entry.get("ledger_name") or "").casefold()
        value = entry.get("amount")
        if value is None or entry.get("is_party"):
            continue
        if any(token in name for token in ["input igst", "input cgst", "input sgst", "input cess", "input gst", "round off"]):
            continue
        values.append(abs(value))
    return sum(values) if values else None


def _inventory_taxable_value(block: str) -> float | None:
    values = []
    for entry in re.findall(r"<ALLINVENTORYENTRIES\.LIST[\s\S]*?</ALLINVENTORYENTRIES\.LIST>", block, flags=re.I):
        value = parse_amount(_tag_value(entry, "AMOUNT"))
        if value is not None:
            values.append(abs(value))
    return sum(values) if values else None


def _party_amount(entries: list[dict], party_name: str | None) -> float | None:
    for entry in entries:
        if entry.get("is_party"):
            return entry.get("amount")
    party_key = _vendor_key(party_name)
    for entry in entries:
        if party_key and _vendor_key(entry.get("ledger_name")) == party_key:
            return entry.get("amount")
    return None


def _supplier_gstin(block: str) -> str:
    company_gstin = _tag_value(block, "CMPGSTIN")
    gstins = re.findall(r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b", block)
    for gstin in gstins:
        if gstin != company_gstin:
            return gstin
    return ""


def _rows_from_gstr_json(uploaded: UploadedFile) -> list[RecoInvoice]:
    path = Path(uploaded.stored_path)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
    except Exception:
        return []
    invoices = []
    _walk_gstr(data, invoices)
    if invoices:
        return invoices
    return [_invoice_from_flat(row, f"preview row {index}") for index, row in enumerate(from_json(uploaded.preview_json, []), start=1)]


def _walk_gstr(node, invoices: list[RecoInvoice], supplier: dict | None = None):
    if isinstance(node, list):
        for item in node:
            _walk_gstr(item, invoices, supplier)
        return
    if not isinstance(node, dict):
        return
    current_supplier = supplier or {}
    if any(key in node for key in ["ctin", "gstin", "supplier_gstin", "supprd", "supplier_name"]):
        current_supplier = {**current_supplier, **node}
    inv_list = node.get("inv")
    if isinstance(inv_list, list):
        for invoice in inv_list:
            if isinstance(invoice, dict):
                invoices.append(_invoice_from_gstr(invoice, current_supplier, f"invoice {len(invoices) + 1}"))
    for value in node.values():
        if isinstance(value, (dict, list)) and value is not inv_list:
            _walk_gstr(value, invoices, current_supplier)


def _invoice_from_gstr(invoice: dict, supplier: dict, source_ref: str) -> RecoInvoice:
    tax = _tax_from_items(invoice.get("itms") or invoice.get("items") or [])
    taxable = _taxable_from_items(invoice.get("itms") or invoice.get("items") or [])
    return RecoInvoice(
        source_ref=source_ref,
        vendor_name=clean_text(supplier.get("trdnm") or supplier.get("supprd") or supplier.get("supplier_name")),
        gstin=clean_text(supplier.get("ctin") or supplier.get("gstin") or supplier.get("supplier_gstin")).upper(),
        invoice_number=clean_text(invoice.get("inum") or invoice.get("invoice_number") or invoice.get("inv_num")),
        invoice_date=parse_date(invoice.get("idt") or invoice.get("invoice_date")),
        taxable_value=taxable if taxable is not None else parse_amount(invoice.get("txval")),
        tax_amount=tax if tax is not None else _sum_amounts(invoice, ["igst", "cgst", "sgst", "cess", "iamt", "camt", "samt", "csamt"]),
        amount=parse_amount(invoice.get("val") or invoice.get("amount")),
    )


def _invoice_from_flat(row: dict, source_ref: str) -> RecoInvoice:
    tax = _sum_amounts(row, ["igst", "cgst", "sgst", "cess", "iamt", "camt", "samt", "csamt", "gst_amount"])
    return RecoInvoice(
        source_ref=source_ref,
        vendor_name=clean_text(_first(row, ["vendor_name", "supplier_name", "supprd", "trade_name"])),
        gstin=clean_text(_first(row, ["gstin", "ctin", "supplier_gstin"])).upper(),
        invoice_number=clean_text(_first(row, ["invoice_number", "inum", "inv_num", "invoice_no"])),
        invoice_date=parse_date(_first(row, ["invoice_date", "idt", "date"])),
        taxable_value=parse_amount(_first(row, ["taxable_value", "txval"])),
        tax_amount=tax,
        amount=parse_amount(_first(row, ["amount", "val", "invoice_value"])),
    )


def _tax_from_items(items) -> float | None:
    if not isinstance(items, list):
        return None
    total = 0
    found = False
    for item in items:
        detail = item.get("itm_det", item) if isinstance(item, dict) else {}
        value = _sum_amounts(detail, ["iamt", "camt", "samt", "csamt", "igst", "cgst", "sgst", "cess"])
        if value is not None:
            total += value
            found = True
    return round(total, 2) if found else None


def _taxable_from_items(items) -> float | None:
    if not isinstance(items, list):
        return None
    values = [parse_amount((item.get("itm_det", item) if isinstance(item, dict) else {}).get("txval")) for item in items]
    values = [value for value in values if value is not None]
    return round(sum(values), 2) if values else None


def _sum_amounts(row: dict, fields: list[str]) -> float | None:
    values = [parse_amount(row.get(field)) for field in fields if isinstance(row, dict)]
    values = [value for value in values if value is not None]
    return round(sum(values), 2) if values else None


def _first(row: dict, fields: list[str]):
    normalised = {"".join(str(key).casefold().split()): value for key, value in row.items()}
    for field in fields:
        if field in row:
            return row[field]
        key = "".join(field.casefold().split())
        if key in normalised:
            return normalised[key]
    return ""


def _gstr_files(db: Session, client_id: int) -> list[UploadedFile]:
    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id, UploadedFile.file_type == ".json").all()
    candidates = [item for item in files if (item.category or "").casefold() in GST_CATEGORIES and _looks_like_gstr(item)]
    latest_by_name = {}
    for item in sorted(candidates, key=lambda value: (value.created_at, value.id), reverse=True):
        key = _gstr_period_key(item)
        if key not in latest_by_name:
            latest_by_name[key] = item
    return sorted(latest_by_name.values(), key=lambda value: _gstr_sort_key(value))


def _latest_gstr_file(db: Session, client_id: int) -> UploadedFile | None:
    return _latest(_gstr_files(db, client_id))


def _latest_books_file(db: Session, client_id: int) -> UploadedFile | None:
    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id).all()
    candidates = [item for item in files if (item.category or "").casefold() in BOOK_CATEGORIES]
    return _latest(candidates, key=lambda item: (BOOK_CATEGORY_PRIORITY.get((item.category or "").casefold(), 99), -(item.created_at.timestamp() if item.created_at else 0), -item.id))


def _looks_like_gstr(uploaded: UploadedFile) -> bool:
    text = f"{uploaded.filename} {uploaded.raw_text or ''} {uploaded.preview_json or ''}".casefold()
    return any(token in text for token in ["gstr", "2b", "2a", "ctin", "inum", "itms", "b2b", "gstin"])


def _tag_value(text: str, tag: str) -> str:
    match = re.search(rf"<{re.escape(tag)}[^>]*>([\s\S]*?)</{re.escape(tag)}>", text, flags=re.I)
    if not match:
        return ""
    return clean_text(unescape(re.sub(r"<[^>]+>", " ", match.group(1))))


def _clean_invoice_ref(value: str | None) -> str:
    text = clean_text(value)
    if not text:
        return ""
    if len(text) > 80:
        tokens = _invoice_tokens(text)
        if tokens:
            return tokens[-1]
    blocked = {"not applicable", "regular", "india", "purchase", "journal"}
    if text.casefold() in blocked:
        return ""
    return text[:120]


def _best_invoice_ref(block: str) -> str:
    candidates = []
    for tag in ["REFERENCE", "VOUCHERNUMBER", "BASICREFERENCE", "BILLNO"]:
        candidates.extend(_tag_values(block, tag))
    for value in candidates:
        cleaned = _clean_invoice_ref(value)
        if cleaned and len(cleaned) <= 60 and any(char.isdigit() for char in cleaned):
            return cleaned
    tokens = _invoice_tokens(" ".join(candidates))
    return tokens[-1] if tokens else ""


def _tag_values(text: str, tag: str) -> list[str]:
    return [
        clean_text(unescape(re.sub(r"<[^>]+>", " ", match.group(1))))
        for match in re.finditer(rf"<{re.escape(tag)}[^>]*>([\s\S]*?)</{re.escape(tag)}>", text, flags=re.I)
    ]


def _invoice_tokens(text: str) -> list[str]:
    pattern = r"\b(?:[A-Z]{1,6}[/\-])?(?:[A-Z]{1,6}[/\-])?\d{1,6}(?:[/\-][A-Z0-9]{1,8}){0,4}\b"
    tokens = []
    for raw in re.findall(pattern, text.upper()):
        token = raw.strip(" -/")
        if len(token) >= 3 and not re.fullmatch(r"20\d{6}", token):
            tokens.append(token)
    return tokens


def _vendor_key(value: str | None) -> str:
    text = clean_text(value).casefold()
    text = re.sub(r"\b(private|pvt|limited|ltd|llp|m/s|ms|india|the)\b", " ", text)
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def _vendor_overlap(left: str | None, right: str | None) -> bool:
    left_tokens = {token for token in _vendor_key(left).split() if len(token) > 2}
    right_tokens = {token for token in _vendor_key(right).split() if len(token) > 2}
    if not left_tokens or not right_tokens:
        return False
    return len(left_tokens & right_tokens) >= min(2, len(left_tokens), len(right_tokens))


def _detect_text_encoding(path: Path) -> str:
    prefix = path.read_bytes()[:4]
    if prefix.startswith(b"\xff\xfe") or prefix.startswith(b"\xfe\xff"):
        return "utf-16"
    if prefix.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    return "utf-8"


def _gstr_period_key(uploaded: UploadedFile) -> str:
    name = (uploaded.filename or "").casefold()
    import re

    match = re.search(r"_(\d{2})(20\d{2})\b", name)
    if match:
        return f"{match.group(2)}-{match.group(1)}"
    return name


def _gstr_sort_key(uploaded: UploadedFile):
    key = _gstr_period_key(uploaded)
    return (key, uploaded.created_at, uploaded.id)


def _selected_file(db: Session, client_id: int, file_id: int | None) -> UploadedFile | None:
    if not file_id:
        return None
    uploaded = db.get(UploadedFile, file_id)
    return uploaded if uploaded and uploaded.client_id == client_id else None


def _latest(items: list[UploadedFile], key=None) -> UploadedFile | None:
    if not items:
        return None
    if key:
        return sorted(items, key=key)[0]
    return sorted(items, key=lambda item: (item.created_at, item.id), reverse=True)[0]


def _latest_run(db: Session, client_id: int) -> GSTRecoRun | None:
    return db.query(GSTRecoRun).filter(GSTRecoRun.client_id == client_id).order_by(GSTRecoRun.id.desc()).first()


def _match_key(row: RecoInvoice) -> str:
    invoice = clean_text(row.invoice_number).casefold()
    gstin = clean_text(row.gstin).casefold()
    return f"{gstin}|{invoice}" if invoice else ""


def _amount(row: RecoInvoice) -> float:
    return float(row.amount if row.amount is not None else (row.taxable_value or 0) + (row.tax_amount or 0))


def _file_payload(item: UploadedFile | None) -> dict | None:
    if not item:
        return None
    return {
        "id": item.id,
        "filename": item.filename,
        "category": item.category,
        "file_type": item.file_type,
        "parse_status": item.parse_status,
        "records_extracted": item.records_extracted,
        "created_at": item.created_at,
    }


def _gstr_source_payload(items: list[UploadedFile]) -> dict | None:
    if not items:
        return None
    total_records = sum(item.records_extracted or 0 for item in items)
    latest = _latest(items)
    return {
        "id": latest.id if latest else items[0].id,
        "filename": f"{len(items)} GSTR-2A/B JSON files selected",
        "category": "gst-data",
        "file_type": ".json",
        "parse_status": "Parsed",
        "records_extracted": total_records,
        "created_at": latest.created_at if latest else items[0].created_at,
        "file_count": len(items),
        "filenames": [item.filename for item in items],
    }


def _run_payload(run: GSTRecoRun | None) -> dict | None:
    if not run:
        return None
    return {
        "latest_run": {"id": run.id, "run_at": run.run_at},
        "run_id": run.id,
        "total_gstr_invoices": run.total_gstr_invoices,
        "total_books_invoices": run.total_books_invoices,
        "matched": run.matched_count,
        "only_in_gstr": run.only_in_gstr_count,
        "only_in_books": run.only_in_books_count,
        "amount_mismatch": run.amount_mismatch_count,
        "duplicate_invoices": run.duplicate_invoices_count,
        "itc_as_per_gstr": run.itc_as_per_gstr,
        "itc_as_per_books": run.itc_as_per_books,
        "net_itc_difference": run.net_itc_difference,
    }


def _result_payload(item: GSTRecoResult) -> dict:
    return {
        "id": item.id,
        "status": item.status,
        "risk_level": item.risk_level,
        "vendor_name": item.vendor_name,
        "gstin": item.gstin,
        "invoice_number": item.invoice_number,
        "gstr_invoice_date": item.gstr_invoice_date,
        "books_invoice_date": item.books_invoice_date,
        "gstr_taxable_value": item.gstr_taxable_value,
        "books_taxable_value": item.books_taxable_value,
        "gstr_tax_amount": item.gstr_tax_amount,
        "books_tax_amount": item.books_tax_amount,
        "difference_amount": item.difference_amount,
        "suggested_action": item.suggested_action,
    }
