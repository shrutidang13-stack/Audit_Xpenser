from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Client, ClientQuery
from app.services.query_engine import generate_queries_from_exceptions
from app.services.report_service import (
    generate_exception_register_xlsx,
    generate_query_letter_docx,
    generate_working_paper_docx,
    get_exception_register_data,
)


router = APIRouter(prefix="/api/reports")


@router.get("/{client_id}/exception-register")
def exception_register(client_id: int, format: str = "xlsx", db: Session = Depends(get_db)):
    client = _client_or_404(db, client_id)
    if format == "json":
        return get_exception_register_data(db, client_id)
    output = generate_exception_register_xlsx(db, client_id)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{_filename("ExceptionRegister", client, "xlsx")}"'},
    )


@router.get("/{client_id}/working-paper")
def working_paper(client_id: int, db: Session = Depends(get_db)):
    client = _client_or_404(db, client_id)
    output = generate_working_paper_docx(db, client_id)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{_filename("WorkingPaper", client, "docx")}"'},
    )


@router.get("/{client_id}/query-letter")
def query_letter(client_id: int, status: str = "Pending", format: str = "docx", db: Session = Depends(get_db)):
    client = _client_or_404(db, client_id)
    generate_queries_from_exceptions(db, client_id)
    if format == "json":
        rows = db.query(ClientQuery).filter(ClientQuery.client_id == client_id)
        if status:
            rows = rows.filter(ClientQuery.status == status)
        return [
            {
                "query_number": item.query_number,
                "category": item.category,
                "vendor": item.vendor,
                "transaction_date": item.transaction_date,
                "amount": item.amount,
                "documents_required": item.documents_required or item.required_document,
                "ca_note": item.ca_note,
                "status": item.status,
                "suggested_wording": item.suggested_wording,
            }
            for item in rows.order_by(ClientQuery.id.asc()).all()
        ]
    output = generate_query_letter_docx(db, client_id, status)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{_filename("ClientQueryLetter", client, "docx")}"'},
    )


def _client_or_404(db: Session, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Client not found")
    return client


def _filename(prefix: str, client: Client, ext: str) -> str:
    fy = (client.financial_year or "2025-26").replace(" ", "")
    pan = client.pan or f"client{client.id}"
    return f"{prefix}_{pan}_FY{fy}.{ext}"
