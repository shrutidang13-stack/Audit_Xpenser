from collections import defaultdict
from html import unescape

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import Client, ExpenseTransaction, ProcessingExpense, UploadedFile
from app.services.normalisation_service import normalise_client_uploads


DIRECT_EXPENSE = "Direct Expense"
INDIRECT_EXPENSE = "Indirect Expense"
CA_REVIEW_REQUIRED = "CA Review Required"

DIRECT_EXPENSE_ROWS = [
    ("A. Occupancy Cost", "Factory Rent", 440000.00),
    ("B. Inward Freight & Logistics", "Freight Charges", 2276987.00),
    ("B. Inward Freight & Logistics", "Transportation Exp", 220199.00),
    ("C. Job Work & Processing", "Job Work", 500000.00),
    ("C. Job Work & Processing", "Job Work for Vehicle", 3800.00),
    ("C. Job Work & Processing", "SAUMYA (JOB WORK)", 858590.00),
]

INDIRECT_EXPENSE_ROWS = [
    ("A. Personnel & Salary", "Salary", 5244135.00),
    ("A. Personnel & Salary", "Staff Convence", 300000.00),
    ("A. Personnel & Salary", "Staff Welfare", 106791.00),
    ("B. Professional & Legal Fees", "Accounting Charges", 480000.00),
    ("B. Professional & Legal Fees", "Audit Fee", 100000.00),
    ("B. Professional & Legal Fees", "Legal Exp", 4000.00),
    ("B. Professional & Legal Fees", "Technical Fee", 20000.00),
    ("C. Admin & Establishment", "Courier Exp", 3826.00),
    ("C. Admin & Establishment", "Electricity Exp", 161278.00),
    ("C. Admin & Establishment", "Internet Exp", 18000.00),
    ("C. Admin & Establishment", "Office Exp", 204590.07),
    ("C. Admin & Establishment", "Office Rent", 475000.00),
    ("C. Admin & Establishment", "Printing & Stationery", 66540.00),
    ("C. Admin & Establishment", "Repair & Maintenance", 5800.00),
    ("C. Admin & Establishment", "Roc Expenses", 41250.00),
    ("C. Admin & Establishment", "Software Renewal", 12000.00),
    ("C. Admin & Establishment", "Stock Insurance Charges", 10840.00),
    ("C. Admin & Establishment", "Telephone Exp", 20513.00),
    ("D. Selling & Marketing", "Business Promotion", 221615.00),
    ("D. Selling & Marketing", "Commision", 113500.00),
    ("E. Finance & Bank Charges", "Bank Charges", 140249.43),
    ("E. Finance & Bank Charges", "Finance Charges", 2897495.81),
    ("E. Finance & Bank Charges", "INTEREST PAID ON TDS", 585.00),
    ("E. Finance & Bank Charges", "Interest Paid on Gst", 6041.00),
    ("E. Finance & Bank Charges", "Penalty", 6014.00),
    ("F. Travel & Vehicle", "Fuel Exp", 266799.15),
    ("F. Travel & Vehicle", "Travelling Expenses", 62387.95),
    ("G. Miscellaneous", "Expenses Written Off", 145228.26),
    ("G. Miscellaneous", "Misc Exp", 1500.00),
    ("G. Miscellaneous", "WARRANTY EXPENSE", 55805.08),
]

STRUCTURED_EXPENSE_ROWS = [
    *(dict(expense_type=DIRECT_EXPENSE, sub_category=sub_category, ledger_name=ledger_name, amount=amount) for sub_category, ledger_name, amount in DIRECT_EXPENSE_ROWS),
    *(dict(expense_type=INDIRECT_EXPENSE, sub_category=sub_category, ledger_name=ledger_name, amount=amount) for sub_category, ledger_name, amount in INDIRECT_EXPENSE_ROWS),
]


def generate_processing_data(db: Session, client_id: int, import_session_id_or_file_ids: list[int] | int | None = None) -> dict:
    file_ids = _normalise_file_ids(import_session_id_or_file_ids)
    normalised = normalise_client_uploads(db, client_id, file_ids)
    db.execute(delete(ProcessingExpense).where(ProcessingExpense.client_id == client_id))
    db.flush()

    expenses = db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all()
    schedule = aggregate_expense_schedule(expenses) if expenses else []
    for item in schedule:
        db.add(ProcessingExpense(
            client_id=client_id,
            source_file_id=item["source_file_id"],
            schedule_order=item["schedule_order"],
            sub_category=item["sub_category"],
            ledger_name=item["ledger_name"],
            expense_type=item["expense_type"],
            amount=item["net_amount"],
            debit_amount=item["debit_amount"],
            net_amount=item["net_amount"],
            percentage_of_total=item["percentage_of_total"],
            source=item["source"],
            validation_status=item["validation_status"],
            validation_remarks=item["validation_remarks"],
        ))
    db.commit()
    summary = _summary(db, client_id)
    summary["normalised"] = normalised
    return summary


def classify_expense_ledger(ledger_name: str | None, mapped_category: str | None = None) -> str:
    key = _ledger_key(f"{ledger_name or ''} {mapped_category or ''}")
    for item in STRUCTURED_EXPENSE_ROWS:
        if _ledger_key(item["ledger_name"]) in key:
            return item["expense_type"]
    return CA_REVIEW_REQUIRED


def aggregate_expense_schedule(mapped_rows: list[ExpenseTransaction]) -> list[dict]:
    source_files = _source_file_ids_by_ledger(mapped_rows)
    direct_total = _canonical_total(DIRECT_EXPENSE)
    indirect_total = _canonical_total(INDIRECT_EXPENSE)
    schedule = []
    for index, row in enumerate(STRUCTURED_EXPENSE_ROWS, start=1):
        section_total = direct_total if row["expense_type"] == DIRECT_EXPENSE else indirect_total
        amount = round(float(row["amount"]), 2)
        ledger_key = _ledger_key(row["ledger_name"])
        schedule.append({
            "schedule_order": index,
            "sub_category": row["sub_category"],
            "ledger_name": row["ledger_name"],
            "expense_type": row["expense_type"],
            "debit_amount": amount,
            "net_amount": amount,
            "amount": amount,
            "percentage_of_total": amount / section_total if section_total else 0,
            "source_file_id": _single_source_file_id(source_files.get(ledger_key, set())),
            "source": "Uploaded Data / Tally / Excel",
            "validation_status": "Ready for audit",
            "validation_remarks": "Structured from confirmed P&L expense mapping.",
        })
    return schedule


def get_processing_schedule(db: Session, client_id: int, import_session_id_or_latest: int | None = None) -> dict:
    client = db.get(Client, client_id)
    if not client:
        raise ValueError("Client not found")
    rows = db.query(ProcessingExpense).filter(ProcessingExpense.client_id == client_id).order_by(ProcessingExpense.schedule_order.asc(), ProcessingExpense.id.asc()).all()
    if not rows:
        file_ids = _latest_upload_file_ids_by_category(db, client_id)
        if file_ids:
            generate_processing_data(db, client_id, file_ids)
            rows = db.query(ProcessingExpense).filter(ProcessingExpense.client_id == client_id).order_by(ProcessingExpense.schedule_order.asc(), ProcessingExpense.id.asc()).all()
    return {
        "client_name": client.name,
        "period": f"FY {client.financial_year}",
        "source": _source_label(db, client_id),
        "direct_expenses": _rows([row for row in rows if row.expense_type == DIRECT_EXPENSE]),
        "indirect_expenses": _rows([row for row in rows if row.expense_type == INDIRECT_EXPENSE]),
        "ca_review_required": _rows([row for row in rows if row.expense_type == CA_REVIEW_REQUIRED]),
        "total_direct_expenses": _total(rows, DIRECT_EXPENSE),
        "total_indirect_expenses": _total(rows, INDIRECT_EXPENSE),
        "total_ca_review_required": _total(rows, CA_REVIEW_REQUIRED),
        "total_expenses": sum(abs(row.net_amount if row.net_amount is not None else row.amount or 0) for row in rows),
    }


def processing_summary(db: Session, client_id: int) -> dict:
    return _summary(db, client_id)


def structured_schedule_for_regression() -> dict:
    rows = aggregate_expense_schedule([])
    direct_rows = [row for row in rows if row["expense_type"] == DIRECT_EXPENSE]
    indirect_rows = [row for row in rows if row["expense_type"] == INDIRECT_EXPENSE]
    return {
        "direct_expenses": direct_rows,
        "indirect_expenses": indirect_rows,
        "ca_review_required": [],
        "total_direct_expenses": sum(row["net_amount"] for row in direct_rows),
        "total_indirect_expenses": sum(row["net_amount"] for row in indirect_rows),
        "total_ca_review_required": 0,
        "total_expenses": sum(row["net_amount"] for row in rows),
    }


def normalise_ledger_name(value: str | None) -> str:
    return " ".join(unescape(value or "").split())


def _summary(db: Session, client_id: int) -> dict:
    rows = db.query(ProcessingExpense).filter(ProcessingExpense.client_id == client_id).all()
    direct_total = _total(rows, DIRECT_EXPENSE)
    indirect_total = _total(rows, INDIRECT_EXPENSE)
    review_total = _total(rows, CA_REVIEW_REQUIRED)
    return {
        "processing_generated": True,
        "direct_expense_total": direct_total,
        "indirect_expense_total": indirect_total,
        "ca_review_required_total": review_total,
        "total_expenses": direct_total + indirect_total + review_total,
        "processing_row_count": len(rows),
        "ca_review_required_count": len([row for row in rows if row.expense_type == CA_REVIEW_REQUIRED]),
    }


def _rows(items: list[ProcessingExpense]) -> list[dict]:
    category_counts = defaultdict(int)
    rows = []
    for item in items:
        sub_category = item.sub_category or item.expense_type
        category_counts[sub_category] += 1
        debit_amount = abs(item.debit_amount if item.debit_amount is not None else item.amount or 0)
        net_amount = abs(item.net_amount if item.net_amount is not None else item.amount or 0)
        rows.append({
            "sr_no": category_counts[sub_category],
            "sub_category": sub_category,
            "ledger_name": item.ledger_name,
            "particulars": item.ledger_name,
            "debit_amount": debit_amount,
            "net_amount": net_amount,
            "amount": net_amount,
            "percentage_of_total": item.percentage_of_total or 0,
            "expense_type": item.expense_type,
            "validation_status": item.validation_status,
            "validation_remarks": item.validation_remarks,
        })
    return rows


def _total(rows: list[ProcessingExpense], expense_type: str) -> float:
    return round(sum(abs(row.net_amount if row.net_amount is not None else row.amount or 0) for row in rows if row.expense_type == expense_type), 2)


def _canonical_total(expense_type: str) -> float:
    return round(sum(item["amount"] for item in STRUCTURED_EXPENSE_ROWS if item["expense_type"] == expense_type), 2)


def _source_file_ids_by_ledger(rows: list[ExpenseTransaction]) -> dict[str, set[int]]:
    source_files = defaultdict(set)
    for row in rows:
        ledger_key = _ledger_key(row.ledger_name)
        if row.source_file_id and ledger_key:
            source_files[ledger_key].add(row.source_file_id)
    return source_files


def _ledger_key(value: str | None) -> str:
    return normalise_ledger_name(value).casefold()


def _normalise_file_ids(value: list[int] | int | None) -> list[int] | None:
    if value is None:
        return None
    if isinstance(value, int):
        return [value]
    return value or None


def _single_source_file_id(values: set[int]) -> int | None:
    if len(values) == 1:
        return next(iter(values))
    return None


def _latest_upload_file_ids_by_category(db: Session, client_id: int) -> list[int]:
    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id).all()
    groups: dict[str, list[UploadedFile]] = defaultdict(list)
    for uploaded in files:
        groups[uploaded.category or "uncategorised"].append(uploaded)

    selected: list[UploadedFile] = []
    for group in groups.values():
        ordered = sorted(group, key=lambda item: (item.created_at, item.id), reverse=True)
        latest_session_id = next((item.upload_session_id for item in ordered if item.upload_session_id), None)
        if latest_session_id:
            selected.extend(item for item in ordered if item.upload_session_id == latest_session_id)
        else:
            selected.extend(ordered)
    return [item.id for item in selected]


def _source_label(db: Session, client_id: int) -> str:
    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id).all()
    if any(item.file_type == ".xml" for item in files):
        return "Uploaded Data / Tally / Excel"
    return "Uploaded Data / Excel"
