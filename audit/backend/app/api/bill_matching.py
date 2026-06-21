from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Client
from app.services.bill_extraction_service import extract_bills
from app.services import bill_matching_service


router = APIRouter(prefix="/api/bill-matching", tags=["bill-matching"])


class ReviewPayload(BaseModel):
    result_id: int
    status: str = "Reviewed"


class QueryPayload(BaseModel):
    result_id: int


@router.get("/{client_id}/sources")
def sources(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return bill_matching_service.sources(db, client_id)


@router.post("/{client_id}/extract")
def extract(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return extract_bills(db, client_id)


@router.post("/{client_id}/run")
def run(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return bill_matching_service.run_bill_matching(db, client_id)


@router.get("/{client_id}/summary")
def summary(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return bill_matching_service.summary(db, client_id)


@router.get("/{client_id}/results")
def results(client_id: int, status: str | None = None, risk_level: str | None = None, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return bill_matching_service.results(db, client_id, status, risk_level)


@router.get("/{client_id}/duplicates")
def duplicates(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return bill_matching_service.duplicates(db, client_id)


@router.post("/{client_id}/create-query")
def create_query(client_id: int, payload: QueryPayload, db: Session = Depends(get_db)):
    try:
        return bill_matching_service.create_query(db, client_id, payload.result_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.post("/{client_id}/mark-reviewed")
def mark_reviewed(client_id: int, payload: ReviewPayload, db: Session = Depends(get_db)):
    try:
        return bill_matching_service.mark_reviewed(db, client_id, payload.result_id, payload.status)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


def _ensure_client(db: Session, client_id: int) -> None:
    if not db.get(Client, client_id):
        raise HTTPException(404, "Client not found")
