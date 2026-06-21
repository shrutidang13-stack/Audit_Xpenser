from pathlib import Path

import openpyxl
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import ClientQuery


QUERY_REGISTER_PATH = (
    Path(__file__).resolve().parents[2]
    / "query_templates"
    / "NXTMobility_ClientQueryRegister_FY2025-26.xlsx"
)


def generate_queries_from_exceptions(db: Session, client_id: int, audit_run_id: int | None = None) -> list[ClientQuery]:
    """Replace generic exception queries with the curated potential-query register."""
    del audit_run_id
    if not QUERY_REGISTER_PATH.exists():
        raise FileNotFoundError(f"Client query register not found: {QUERY_REGISTER_PATH}")

    workbook = openpyxl.load_workbook(QUERY_REGISTER_PATH, data_only=True, read_only=True)
    try:
        sheet = workbook.active
        source_rows = []
        for values in sheet.iter_rows(min_row=3, values_only=True):
            query_number = str(values[0] or "").strip()
            if not query_number.startswith("Q-"):
                continue
            source_rows.append(values)
    finally:
        workbook.close()

    db.execute(delete(ClientQuery).where(ClientQuery.client_id == client_id))
    created = []
    for values in source_rows:
        query_number, ledger, category, severity, amount, observation, documents, status = values[:8]
        item = ClientQuery(
            client_id=client_id,
            query_number=str(query_number).strip(),
            category=str(category or "").strip(),
            ledger=str(ledger or "").strip(),
            vendor=None,
            transaction_date=None,
            amount=float(amount) if amount is not None else None,
            issue_detected=str(observation or "").strip(),
            required_document=str(documents or "").strip(),
            documents_required=str(documents or "").strip(),
            priority=str(severity or "Medium").strip().title(),
            status=str(status or "Pending").strip(),
            suggested_wording=str(observation or "").strip(),
        )
        db.add(item)
        created.append(item)
    db.commit()
    return created
