from sqlalchemy import inspect, text

from app.core.database import engine


def ensure_reporting_schema() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    _ensure_columns(table_names, "client_queries", {
        "exception_id": "INTEGER",
        "category": "VARCHAR(120)",
        "documents_required": "TEXT",
        "client_response": "TEXT",
        "ca_note": "TEXT",
    })
    _ensure_columns(table_names, "uploaded_files", {
        "upload_session_id": "VARCHAR(80)",
    })
    _ensure_columns(table_names, "processing_expenses", {
        "schedule_order": "INTEGER DEFAULT 0",
        "sub_category": "VARCHAR(160)",
        "debit_amount": "FLOAT DEFAULT 0",
        "net_amount": "FLOAT DEFAULT 0",
        "percentage_of_total": "FLOAT DEFAULT 0",
    })
    _ensure_columns(table_names, "expense_audit_results", {
        "statutory_reference_status": "VARCHAR(120) DEFAULT ''",
        "statutory_reference_note": "TEXT",
    })
    _ensure_columns(table_names, "trial_balance_lines", {
        "debit_amount": "FLOAT",
        "credit_amount": "FLOAT",
    })
    _ensure_columns(table_names, "bills", {
        "extracted_vendor_name": "VARCHAR(255)",
        "extracted_vendor_gstin": "VARCHAR(20)",
        "extracted_invoice_number": "VARCHAR(120)",
        "extracted_invoice_date": "DATE",
        "extracted_taxable_value": "FLOAT",
        "extracted_cgst": "FLOAT",
        "extracted_sgst": "FLOAT",
        "extracted_igst": "FLOAT",
        "extracted_total_gst": "FLOAT",
        "extracted_total_amount": "FLOAT",
        "extraction_confidence": "FLOAT DEFAULT 0",
        "extraction_status": "VARCHAR(80) DEFAULT 'Pending'",
        "ocr_review_required": "BOOLEAN DEFAULT 0",
    })
    _ensure_columns(table_names, "duplicate_bill_flags", {
        "duplicate_group_key": "VARCHAR(255)",
        "duplicate_reason": "TEXT",
        "duplicate_score": "FLOAT DEFAULT 0",
    })


def _ensure_columns(table_names: set[str], table_name: str, additions: dict[str, str]) -> None:
    if table_name not in table_names:
        return
    existing = {column["name"] for column in inspect(engine).get_columns(table_name)}
    with engine.begin() as connection:
        for column, definition in additions.items():
            if column not in existing:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column} {definition}"))
