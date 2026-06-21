from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
from difflib import SequenceMatcher
import random
import re

from sqlalchemy import delete, func
from sqlalchemy.orm import Session

from app.models import (
    AuditException,
    Bill,
    BillMatch,
    BillMatchingResult,
    BillMatchingRun,
    ClientQuery,
    DuplicateBillFlag,
    ExpenseTransaction,
    FixedAsset,
    GSTRecord,
    ProcessingExpense,
    UploadedFile,
)
from app.services.audit_pipeline_service import _match_bills as legacy_match_bills
from app.services.bill_extraction_service import extract_bills, latest_bill_uploads
from app.services.utils import clean_text


AMOUNT_TOLERANCE = 10
GST_TOLERANCE = 1
ASSET_TERMS = ("laptop", "computer", "machinery", "equipment", "vehicle", "furniture", "software", "renovation", "asset", "printer", "server")
BOOK_MATCH_CATEGORIES = {"purchase-register", "expense-ledger"}
EXPENSE_TYPES_FOR_BILL_MATCH = {"Direct Expense", "Indirect Expense"}


def sources(db: Session, client_id: int) -> dict:
    bill_files = latest_bill_uploads(db, client_id)
    bill_file_ids = [item.id for item in bill_files]
    bills = _active_bills_query(db, client_id, bill_file_ids).count()
    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id).all()
    by_category = Counter(file.category for file in files)
    eligible_books = _eligible_book_transactions(db, client_id)
    return {
        "uploaded_bills_count": bills,
        "bill_files_count": len(bill_files),
        "all_book_entries_count": db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).count(),
        "purchase_expense_entries_count": len(eligible_books),
        "gl_expense_entries_count": len(eligible_books),
        "purchase_register_entries_count": by_category.get("purchase-register", 0),
        "expense_ledger_source_files_count": by_category.get("expense-ledger", 0),
        "input_register_entries_count": by_category.get("gst-data", 0),
        "fixed_asset_additions_count": (
            db.query(FixedAsset)
            .outerjoin(UploadedFile, UploadedFile.id == FixedAsset.source_file_id)
            .filter(
                FixedAsset.client_id == client_id,
                (UploadedFile.category.is_(None)) | (UploadedFile.category != "fixed-assets-opening"),
            )
            .count()
        ),
        "unprocessed_bill_count": _active_bills_query(db, client_id, bill_file_ids).filter(Bill.extraction_status.in_(["Pending", None])).count(),
        "latest_bill_file": _latest_file(db, client_id, "bills"),
        "latest_books_file": _latest_file(db, client_id, "purchase-register") or _latest_file(db, client_id, "expense-ledger"),
        "latest_gst_file": _latest_file(db, client_id, "gst-data"),
    }


def run_bill_matching(db: Session, client_id: int) -> dict:
    extract_bills(db, client_id)
    db.execute(delete(BillMatchingResult).where(BillMatchingResult.client_id == client_id))
    db.execute(delete(DuplicateBillFlag).where(DuplicateBillFlag.client_id == client_id))
    db.execute(delete(AuditException).where(AuditException.client_id == client_id, AuditException.exception_type == "Bill Matching"))
    db.commit()

    run = BillMatchingRun(client_id=client_id, status="running", started_at=datetime.utcnow())
    db.add(run)
    db.flush()

    bills = _active_bills(db, client_id)
    books = _eligible_book_transactions(db, client_id)
    book_index = _build_book_index(books)
    matched_book_ids: set[int] = set()

    duplicate_bill_ids = _detect_duplicate_bills(db, client_id, bills)
    duplicate_book_ids = _detect_duplicate_books(books)

    for bill in bills:
        best_tx, score, reasons = _best_transaction_match(bill, _candidate_transactions(bill, books, book_index))
        result = _result_from_bill(db, client_id, run.id, bill, best_tx, score, reasons)
        if bill.id in duplicate_bill_ids:
            result.match_status = "duplicate_bill"
            result.risk_level = "High"
            result.suggested_action = "Possible duplicate bill. CA review required before allowing expense support."
        if best_tx:
            matched_book_ids.add(best_tx.id)
            if best_tx.id in duplicate_book_ids and result.match_status == "matched":
                result.match_status = "duplicate_book_entry"
                result.risk_level = "High"
                result.suggested_action = "Same invoice appears to be booked more than once in books. Verify duplicate entry risk."
        db.add(result)
        _create_exception_for_result(db, result)

    for tx in books:
        if tx.id in matched_book_ids:
            continue
        status = "capital_review" if _looks_capital(tx) else "only_in_books"
        result = BillMatchingResult(
            client_id=client_id,
            run_id=run.id,
            expense_transaction_id=tx.id,
            match_status=status,
            match_score=0,
            risk_level="High" if status == "only_in_books" else "Medium",
            book_vendor_name=tx.vendor_name,
            book_invoice_number=tx.invoice_number,
            book_invoice_date=tx.date,
            book_total_amount=abs(tx.amount or 0),
            book_gst_amount=tx.gst_amount,
            matched_ledger=tx.ledger_name,
            gl_date=tx.date,
            gl_voucher_number=tx.voucher_number,
            amount_difference=round(abs(tx.amount or 0), 2),
            gst_difference=round(tx.gst_amount or 0, 2),
            mismatch_reason="Book entry has no matched bill support.",
            suggested_action="Obtain supporting invoice/bill or mark as not applicable after CA verification.",
            ca_review_status="Pending",
        )
        if tx.id in duplicate_book_ids:
            result.match_status = "duplicate_book_entry"
            result.risk_level = "High"
            result.suggested_action = "Possible duplicate book entry. Verify voucher and invoice support."
        db.add(result)
        _create_exception_for_result(db, result)

    db.flush()
    results = db.query(BillMatchingResult).filter(BillMatchingResult.run_id == run.id).all()
    counts = Counter(result.match_status for result in results)
    run.status = "completed"
    run.total_bills = len(bills)
    run.total_book_entries = len(books)
    run.matched_count = counts.get("matched", 0)
    run.probable_match_count = counts.get("probable_match", 0)
    run.only_bill_count = counts.get("only_in_bill", 0)
    run.only_books_count = counts.get("only_in_books", 0)
    run.mismatch_count = sum(counts.get(status, 0) for status in ["amount_mismatch", "gst_mismatch", "vendor_mismatch", "date_mismatch", "missing_gstin"])
    run.duplicate_count = counts.get("duplicate_bill", 0) + counts.get("duplicate_book_entry", 0)
    run.high_risk_count = sum(1 for result in results if result.risk_level == "High")
    run.completed_at = datetime.utcnow()
    db.commit()
    return {"status": "completed", "run_id": run.id, "summary": summary(db, client_id)}


def summary(db: Session, client_id: int) -> dict:
    latest = db.query(BillMatchingRun).filter(BillMatchingRun.client_id == client_id).order_by(BillMatchingRun.id.desc()).first()
    rows = db.query(BillMatchingResult).filter(BillMatchingResult.client_id == client_id)
    mismatch_statuses = {"amount_mismatch", "gst_mismatch", "vendor_mismatch", "date_mismatch"}
    total_mismatch_amount = sum(
        abs(row.amount_difference or 0)
        for row in rows.filter(BillMatchingResult.match_status.in_(mismatch_statuses)).all()
        if abs(row.amount_difference or 0) <= 1_000_000_000
    )
    return {
        "latest_run": _run_payload(latest) if latest else None,
        "sources": sources(db, client_id),
        "total_bills_uploaded": len(_active_bills(db, client_id)),
        "bills_matched_with_gl": rows.filter(BillMatchingResult.match_status == "matched").count(),
        "bills_matched_with_purchase_expense": rows.filter(BillMatchingResult.match_status == "matched").count(),
        "probable_matches": rows.filter(BillMatchingResult.match_status == "probable_match").count(),
        "bills_not_found_in_gl": rows.filter(BillMatchingResult.match_status == "only_in_bill").count(),
        "gl_entries_without_bill": rows.filter(BillMatchingResult.match_status == "only_in_books").count(),
        "purchase_expense_entries_without_bill": rows.filter(BillMatchingResult.match_status == "only_in_books").count(),
        "amount_mismatch": rows.filter(BillMatchingResult.match_status == "amount_mismatch").count(),
        "gst_mismatch": rows.filter(BillMatchingResult.match_status == "gst_mismatch").count(),
        "vendor_mismatch": rows.filter(BillMatchingResult.match_status == "vendor_mismatch").count(),
        "duplicate_bills": rows.filter(BillMatchingResult.match_status == "duplicate_bill").count(),
        "capital_review": rows.filter(BillMatchingResult.match_status == "capital_review").count(),
        "total_mismatch_amount": round(total_mismatch_amount, 2),
        "purchase_register_bills_without_upload": _purchase_register_bills_without_upload(db, client_id),
    }


def _purchase_register_bills_without_upload(db: Session, client_id: int, limit: int = 100) -> list[dict]:
    """Return a small sample of purchase-register rows with no uploaded bill.

    The explicit invoice-number exclusion is intentional: it prevents a row from
    appearing here when the same invoice exists in the active uploaded-bill set,
    even if a previous fuzzy matching result classified it unexpectedly.
    """
    active_bills = _active_bills(db, client_id)
    uploaded_invoice_numbers = {
        _normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)
        for bill in active_bills
        if _normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)
    }
    uploaded_fingerprints = {
        (
            clean_text(bill.vendor_name or bill.extracted_vendor_name).casefold(),
            bill.invoice_date or bill.extracted_invoice_date,
            round(abs(bill.amount or bill.extracted_total_amount or 0), 2),
        )
        for bill in active_bills
    }
    candidates = (
        db.query(ExpenseTransaction)
        .join(UploadedFile, UploadedFile.id == ExpenseTransaction.source_file_id)
        .filter(
            ExpenseTransaction.client_id == client_id,
            UploadedFile.category == "purchase-register",
        )
        .all()
    )
    if not candidates:
        # Some legacy uploads store the purchase/expense register as an
        # expense-ledger file (for example, Transactions.xml).
        candidates = [row for row in _eligible_book_transactions(db, client_id) if _looks_like_bill_entry(row)]
    safe_candidates = []
    for row in candidates:
        if "axis bank" in clean_text(row.vendor_name).casefold():
            continue
        if abs(row.amount or 0) <= 0:
            continue
        invoice_number = _normalize_invoice(row.invoice_number)
        if not invoice_number:
            continue
        fingerprint = (
            clean_text(row.vendor_name).casefold(),
            row.date,
            round(abs(row.amount or 0), 2),
        )
        if any(
            uploaded == invoice_number
            or (len(uploaded) >= 5 and uploaded in invoice_number)
            or (len(invoice_number) >= 5 and invoice_number in uploaded)
            for uploaded in uploaded_invoice_numbers
        ):
            continue
        if fingerprint in uploaded_fingerprints:
            continue
        safe_candidates.append(row)
    selected = random.sample(safe_candidates, min(limit, len(safe_candidates)))
    return [{
        "id": row.id,
        "book_vendor_name": row.vendor_name,
        "book_invoice_number": row.invoice_number,
        "book_invoice_date": row.date,
        "book_total_amount": abs(row.amount or 0),
        "matched_ledger": row.ledger_name,
        "gl_date": row.date,
        "gl_voucher_number": row.voucher_number,
        "match_status": "only_in_books",
    } for row in selected]


def _looks_like_bill_entry(row: ExpenseTransaction) -> bool:
    vendor = clean_text(row.vendor_name).casefold()
    ledger = clean_text(row.ledger_name).casefold()
    if not vendor or not abs(row.amount or 0):
        return False
    excluded_vendor_terms = (" bank", "bank ", "loan a/c", "imprest")
    if any(term in f" {vendor} " for term in excluded_vendor_terms):
        return False
    if ledger in {"bank charges", "interest paid on gst", "interest paid on tds"}:
        return False
    return vendor != ledger


def _unmatched_amount(row: BillMatchingResult) -> float:
    if row.match_status == "only_in_books":
        amount = abs(row.book_total_amount or 0)
    elif row.match_status == "only_in_bill":
        amount = abs(row.bill_total_amount or 0)
    elif row.match_status in {"amount_mismatch", "gst_mismatch", "vendor_mismatch", "date_mismatch"}:
        amount = abs(row.amount_difference or 0)
    else:
        return 0
    return amount if amount <= 1_000_000_000 else 0


def results(db: Session, client_id: int, status: str | None = None, risk_level: str | None = None) -> list[dict]:
    query = db.query(BillMatchingResult).filter(BillMatchingResult.client_id == client_id)
    if status:
        query = query.filter(BillMatchingResult.match_status == status)
    if risk_level:
        query = query.filter(BillMatchingResult.risk_level == risk_level)
    return [_result_payload(row) for row in query.order_by(BillMatchingResult.risk_level.desc(), BillMatchingResult.id.desc()).all()]


def duplicates(db: Session, client_id: int) -> list[dict]:
    rows = db.query(DuplicateBillFlag, Bill).outerjoin(Bill, Bill.id == DuplicateBillFlag.bill_id).filter(DuplicateBillFlag.client_id == client_id).order_by(DuplicateBillFlag.id.desc()).all()
    return [{
        "id": flag.id,
        "bill_id": flag.bill_id,
        "file_name": bill.source_ref if bill else "",
        "vendor": bill.vendor_name if bill else "",
        "invoice_number": bill.invoice_number if bill else "",
        "issue": flag.issue,
        "severity": flag.severity,
        "duplicate_group_key": flag.duplicate_group_key,
        "duplicate_reason": flag.duplicate_reason,
        "duplicate_score": flag.duplicate_score,
    } for flag, bill in rows]


def create_query(db: Session, client_id: int, result_id: int) -> dict:
    result = db.get(BillMatchingResult, result_id)
    if not result or result.client_id != client_id:
        raise ValueError("Bill matching result not found")
    existing = db.query(func.count(ClientQuery.id)).filter(ClientQuery.client_id == client_id).scalar() or 0
    query = ClientQuery(
        client_id=client_id,
        query_number=f"BM-{existing + 1:03d}",
        category="Bill Matching",
        ledger=result.matched_ledger,
        vendor=result.bill_vendor_name or result.book_vendor_name,
        transaction_date=result.book_invoice_date or result.bill_invoice_date,
        amount=result.book_total_amount or result.bill_total_amount,
        issue_detected=result.mismatch_reason or result.match_status,
        required_document=result.suggested_action or "Please provide invoice support and explanation.",
        documents_required=result.suggested_action or "Invoice support and management explanation",
        priority="High" if result.risk_level == "High" else "Medium",
        suggested_wording=f"Please provide support for bill matching review item: {result.mismatch_reason or result.match_status}.",
    )
    db.add(query)
    result.ca_review_status = "Query Created"
    db.commit()
    return {"status": "created", "query_id": query.id}


def mark_reviewed(db: Session, client_id: int, result_id: int, status: str = "Reviewed") -> dict:
    result = db.get(BillMatchingResult, result_id)
    if not result or result.client_id != client_id:
        raise ValueError("Bill matching result not found")
    result.ca_review_status = status
    db.commit()
    return {"status": "updated", "result_id": result_id, "ca_review_status": status}


def export_payload(db: Session, client_id: int) -> dict[str, list[dict]]:
    all_rows = results(db, client_id)
    return {
        "Summary": [summary(db, client_id)],
        "Matched Bills": [row for row in all_rows if row["match_status"] == "matched"],
        "Probable Matches": [row for row in all_rows if row["match_status"] == "probable_match"],
        "Bills Not Found in Books": [row for row in all_rows if row["match_status"] == "only_in_bill"],
        "Book Entries Without Bills": [row for row in all_rows if row["match_status"] == "only_in_books"],
        "Amount Mismatch": [row for row in all_rows if row["match_status"] == "amount_mismatch"],
        "GST Mismatch": [row for row in all_rows if row["match_status"] == "gst_mismatch"],
        "Duplicate Bills": duplicates(db, client_id),
        "Vendor Mismatch": [row for row in all_rows if row["match_status"] == "vendor_mismatch"],
        "Capital Review": [row for row in all_rows if row["match_status"] == "capital_review"],
        "Suggested Client Queries": [row for row in all_rows if row["risk_level"] in {"High", "Medium"}],
    }


def _active_bills_query(db: Session, client_id: int, bill_file_ids: list[int] | None = None):
    if bill_file_ids is None:
        bill_file_ids = [item.id for item in latest_bill_uploads(db, client_id)]
    query = db.query(Bill).filter(Bill.client_id == client_id)
    if not bill_file_ids:
        return query.filter(Bill.id == -1)
    return query.filter(Bill.source_file_id.in_(bill_file_ids))


def _active_bills(db: Session, client_id: int) -> list[Bill]:
    return _active_bills_query(db, client_id).all()


def _eligible_book_transactions(db: Session, client_id: int) -> list[ExpenseTransaction]:
    structured_expense_keys = {
        _ledger_key(row.ledger_name)
        for row in db.query(ProcessingExpense).filter(
            ProcessingExpense.client_id == client_id,
            ProcessingExpense.expense_type.in_(EXPENSE_TYPES_FOR_BILL_MATCH),
        ).all()
        if row.ledger_name
    }
    rows = (
        db.query(ExpenseTransaction, UploadedFile.category)
        .outerjoin(UploadedFile, UploadedFile.id == ExpenseTransaction.source_file_id)
        .filter(ExpenseTransaction.client_id == client_id)
        .all()
    )
    eligible: list[ExpenseTransaction] = []
    seen: set[int] = set()
    for tx, category in rows:
        source_category = (category or "").casefold()
        ledger_key = _ledger_key(tx.ledger_name)
        if source_category == "purchase-register":
            include = True
        elif source_category == "expense-ledger":
            include = ledger_key in structured_expense_keys and _is_expense_side_entry(tx)
        else:
            include = False
        if include and tx.id not in seen:
            eligible.append(tx)
            seen.add(tx.id)
    return eligible


def _is_expense_side_entry(tx: ExpenseTransaction) -> bool:
    debit_credit = clean_text(tx.debit_credit).casefold()
    if debit_credit in {"dr", "debit"}:
        return True
    if debit_credit in {"cr", "credit"}:
        return False
    return (tx.amount or 0) < 0


def _best_transaction_match(bill: Bill, books: list[ExpenseTransaction]):
    best = (None, 0, ["No comparable book entry found."])
    for tx in books:
        score, reasons = _score_bill_tx(bill, tx)
        if score > best[1]:
            best = (tx, score, reasons)
    return best


def _build_book_index(books: list[ExpenseTransaction]) -> dict:
    by_invoice = defaultdict(list)
    for tx in books:
        invoice = _normalize_invoice(tx.invoice_number)
        if invoice:
            by_invoice[invoice].append(tx)
    return {"by_invoice": by_invoice}


def _candidate_transactions(bill: Bill, books: list[ExpenseTransaction], book_index: dict) -> list[ExpenseTransaction]:
    invoice = _normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)
    if invoice and book_index["by_invoice"].get(invoice):
        return book_index["by_invoice"][invoice]
    amount = bill.amount or bill.extracted_total_amount or 0
    vendor = clean_text(bill.vendor_name or bill.extracted_vendor_name).casefold()
    candidates = []
    for tx in books:
        book_amount = abs(tx.amount or 0)
        if amount and abs(book_amount - amount) <= max(AMOUNT_TOLERANCE, amount * 0.05):
            candidates.append(tx)
        elif vendor and vendor[:8] and vendor[:8] in clean_text(tx.vendor_name or tx.ledger_name).casefold():
            candidates.append(tx)
    return candidates[:500] if candidates else books[:500]


def _score_bill_tx(bill: Bill, tx: ExpenseTransaction) -> tuple[float, list[str]]:
    score = 0
    reasons = []
    bill_invoice = _normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)
    book_invoice = _normalize_invoice(tx.invoice_number)
    if bill_invoice and book_invoice and bill_invoice == book_invoice:
        score += 40
        reasons.append("Invoice number matched.")
    elif bill_invoice and book_invoice and (bill_invoice in book_invoice or book_invoice in bill_invoice):
        score += 25
        reasons.append("Invoice number partially matched.")
    vendor_score = _similarity(bill.vendor_name or bill.extracted_vendor_name, tx.vendor_name or tx.ledger_name)
    if vendor_score >= 0.85:
        score += 20
        reasons.append("Vendor name matched.")
    elif vendor_score >= 0.6:
        score += 10
        reasons.append("Vendor name is similar.")
    amount_diff = abs((bill.amount or bill.extracted_total_amount or 0) - abs(tx.amount or 0))
    if amount_diff <= GST_TOLERANCE:
        score += 25
        reasons.append("Amount matched.")
    elif amount_diff <= AMOUNT_TOLERANCE:
        score += 18
        reasons.append("Amount within tolerance.")
    elif amount_diff <= max((bill.amount or 0) * 0.05, 100):
        score += 8
        reasons.append("Amount is near but outside standard tolerance.")
    if bill.invoice_date and tx.date:
        days = abs((bill.invoice_date - tx.date).days)
        if days <= 3:
            score += 10
            reasons.append("Date matched.")
        elif days <= 30:
            score += 5
            reasons.append("Date is close.")
    bill_gst = bill.extracted_total_gst or 0
    book_gst = tx.gst_amount or 0
    if bill_gst and book_gst and abs(bill_gst - book_gst) <= GST_TOLERANCE:
        score += 5
        reasons.append("GST amount matched.")
    return min(score, 100), reasons


def _result_from_bill(db: Session, client_id: int, run_id: int, bill: Bill, tx: ExpenseTransaction | None, score: float, reasons: list[str]) -> BillMatchingResult:
    gst_record = _find_gst_record(db, client_id, bill)
    fixed_asset = _find_fixed_asset(db, client_id, bill)
    bill_amount = bill.amount or bill.extracted_total_amount or 0
    book_amount = abs(tx.amount or 0) if tx else 0
    bill_gst = bill.extracted_total_gst or 0
    book_gst = tx.gst_amount if tx else 0
    amount_diff = round((bill_amount or 0) - (book_amount or 0), 2)
    gst_diff = round((bill_gst or 0) - (book_gst or 0), 2)
    status = _status_for_match(score, amount_diff, gst_diff, bill, tx, fixed_asset)
    return BillMatchingResult(
        client_id=client_id,
        run_id=run_id,
        bill_id=bill.id,
        expense_transaction_id=tx.id if tx else None,
        gst_record_id=gst_record.id if gst_record else None,
        fixed_asset_id=fixed_asset.id if fixed_asset else None,
        match_status=status,
        match_score=score,
        risk_level=_risk(status, score),
        bill_file_name=bill.source_ref,
        bill_vendor_name=bill.vendor_name or bill.extracted_vendor_name,
        book_vendor_name=tx.vendor_name if tx else None,
        bill_gstin=bill.gstin or bill.extracted_vendor_gstin,
        book_gstin=None,
        bill_invoice_number=bill.invoice_number or bill.extracted_invoice_number,
        book_invoice_number=tx.invoice_number if tx else None,
        bill_invoice_date=bill.invoice_date or bill.extracted_invoice_date,
        book_invoice_date=tx.date if tx else None,
        bill_taxable_value=bill.extracted_taxable_value,
        book_taxable_value=(tx.amount or 0) - (tx.gst_amount or 0) if tx and tx.amount else None,
        bill_gst_amount=bill_gst,
        book_gst_amount=book_gst,
        bill_total_amount=bill_amount,
        book_total_amount=book_amount,
        matched_ledger=tx.ledger_name if tx else None,
        gl_date=tx.date if tx else None,
        gl_voucher_number=tx.voucher_number if tx else None,
        purchase_register_invoice_number=tx.invoice_number if tx else None,
        purchase_register_amount=abs(tx.amount or 0) if tx else None,
        amount_difference=amount_diff,
        gst_difference=gst_diff,
        mismatch_reason=" ".join(reasons) or status,
        suggested_action=_suggestion(status),
        ca_review_status="Pending",
    )


def _status_for_match(score, amount_diff, gst_diff, bill, tx, fixed_asset):
    if not tx:
        return "only_in_bill"
    if _looks_capital(tx) or fixed_asset:
        return "capital_review"
    if not (bill.gstin or bill.extracted_vendor_gstin):
        return "missing_gstin"
    if abs(amount_diff) > AMOUNT_TOLERANCE and score >= 60:
        return "amount_mismatch"
    if abs(gst_diff) > GST_TOLERANCE and (bill.extracted_total_gst or tx.gst_amount):
        return "gst_mismatch"
    if score == 100:
        return "matched"
    if score >= 80:
        return "probable_match"
    if score >= 60:
        return "date_mismatch"
    return "only_in_bill"


def _detect_duplicate_bills(db: Session, client_id: int, bills: list[Bill]) -> set[int]:
    groups = defaultdict(list)
    for bill in bills:
        keys = [
            f"gstin:{clean_text(bill.gstin or bill.extracted_vendor_gstin).casefold()}|invoice:{_normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)}",
            f"vendor:{clean_text(bill.vendor_name or bill.extracted_vendor_name).casefold()}|invoice:{_normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)}",
            f"invoice-date-amount:{_normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)}|{bill.invoice_date or bill.extracted_invoice_date}|{round(bill.amount or bill.extracted_total_amount or 0, 2)}",
        ]
        for key in keys:
            if key and not key.endswith("|invoice:") and "||" not in key:
                groups[key].append(bill)
    duplicate_ids = set()
    for key, items in groups.items():
        if len(items) < 2:
            continue
        for bill in items:
            duplicate_ids.add(bill.id)
            db.add(DuplicateBillFlag(client_id=client_id, bill_id=bill.id, issue="Possible duplicate bill detected.", severity="High", duplicate_group_key=key[:255], duplicate_reason="Duplicate combination of GSTIN/vendor, invoice number, date or amount.", duplicate_score=95))
    return duplicate_ids


def _detect_duplicate_books(books: list[ExpenseTransaction]) -> set[int]:
    groups = defaultdict(list)
    for tx in books:
        key = f"{_normalize_invoice(tx.invoice_number)}|{round(abs(tx.amount or 0), 2)}|{clean_text(tx.vendor_name).casefold()}"
        if _normalize_invoice(tx.invoice_number):
            groups[key].append(tx)
    return {tx.id for items in groups.values() if len(items) > 1 for tx in items}


def _find_gst_record(db: Session, client_id: int, bill: Bill):
    invoice = _normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)
    if not invoice:
        return None
    return db.query(GSTRecord).filter(GSTRecord.client_id == client_id, GSTRecord.invoice_number.ilike(f"%{invoice}%")).first()


def _find_fixed_asset(db: Session, client_id: int, bill: Bill):
    invoice = _normalize_invoice(bill.invoice_number or bill.extracted_invoice_number)
    if not invoice:
        return None
    return db.query(FixedAsset).filter(FixedAsset.client_id == client_id, FixedAsset.invoice_number.ilike(f"%{invoice}%")).first()


def _create_exception_for_result(db: Session, result: BillMatchingResult) -> None:
    if result.match_status in {"matched", "probable_match"}:
        return
    db.add(AuditException(client_id=result.client_id, transaction_id=result.expense_transaction_id, voucher_date=result.gl_date, voucher_number=result.gl_voucher_number, party_name=result.bill_vendor_name or result.book_vendor_name, ledger_name=result.matched_ledger, amount=result.book_total_amount or result.bill_total_amount, exception_type="Bill Matching", exception_description=result.mismatch_reason or result.match_status, risk_level=result.risk_level, form_3cd_clause="Expense evidence review", status="Pending"))


def _normalize_invoice(value: str | None) -> str:
    return re.sub(r"[^A-Z0-9]", "", clean_text(value).upper())


def _ledger_key(value: str | None) -> str:
    return " ".join(clean_text(value).split()).casefold()


def _similarity(a: str | None, b: str | None) -> float:
    a_clean = clean_text(a).casefold()
    b_clean = clean_text(b).casefold()
    if not a_clean or not b_clean:
        return 0
    return SequenceMatcher(None, a_clean, b_clean).ratio()


def _looks_capital(tx: ExpenseTransaction) -> bool:
    text = f"{tx.ledger_name or ''} {tx.narration or ''}".casefold()
    return any(term in text for term in ASSET_TERMS) or (tx.amount or 0) >= 50000 and any(term in text for term in ("repair", "installation", "purchase"))


def _risk(status: str, score: float) -> str:
    if status in {"matched"}:
        return "Low"
    if status in {"probable_match", "capital_review"} or score >= 60:
        return "Medium"
    return "High"


def _suggestion(status: str) -> str:
    suggestions = {
        "matched": "No immediate action from automated matching. Subject to CA verification.",
        "probable_match": "Probable support found. CA should verify vendor, date and amount before closure.",
        "amount_mismatch": "Review amount difference and obtain credit note/debit note or corrected entry support.",
        "gst_mismatch": "Review GST component against bill, input register and books.",
        "vendor_mismatch": "Verify vendor name/GSTIN and ledger mapping.",
        "only_in_bill": "Bill uploaded but matching book entry was not found. Verify whether expense booking is pending.",
        "only_in_books": "Book entry has no matched bill support. Obtain invoice evidence.",
        "duplicate_bill": "Possible duplicate bill. Verify before allowing support.",
        "duplicate_book_entry": "Possible duplicate book entry. Review voucher posting.",
        "capital_review": "Possible capital nature. Review whether expense should be capitalised or linked to fixed asset schedule.",
        "missing_gstin": "GSTIN missing in bill extraction. Review OCR output and vendor master.",
        "date_mismatch": "Dates differ or match is partial. Verify invoice and book dates.",
    }
    return suggestions.get(status, "CA review required based on automated matching.")


def _latest_file(db: Session, client_id: int, category: str) -> dict | None:
    item = db.query(UploadedFile).filter(UploadedFile.client_id == client_id, UploadedFile.category == category).order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc()).first()
    if not item:
        return None
    return {"id": item.id, "filename": item.filename, "category": item.category, "file_type": item.file_type, "records_extracted": item.records_extracted, "parse_status": item.parse_status}


def _run_payload(item: BillMatchingRun) -> dict:
    return {field: getattr(item, field) for field in ["id", "status", "total_bills", "total_book_entries", "matched_count", "probable_match_count", "only_bill_count", "only_books_count", "mismatch_count", "duplicate_count", "high_risk_count", "started_at", "completed_at"]}


def _result_payload(item: BillMatchingResult) -> dict:
    return {field: getattr(item, field) for field in [
        "id", "bill_id", "expense_transaction_id", "gst_record_id", "fixed_asset_id", "match_status", "match_score", "risk_level", "bill_file_name", "bill_vendor_name", "book_vendor_name", "bill_gstin", "book_gstin", "bill_invoice_number", "book_invoice_number", "bill_invoice_date", "book_invoice_date", "bill_taxable_value", "book_taxable_value", "bill_gst_amount", "book_gst_amount", "bill_total_amount", "book_total_amount", "matched_ledger", "gl_date", "gl_voucher_number", "purchase_register_invoice_number", "purchase_register_amount", "amount_difference", "gst_difference", "mismatch_reason", "suggested_action", "ca_review_status"
    ]}


match_bills = legacy_match_bills
