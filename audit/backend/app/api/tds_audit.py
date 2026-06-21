from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Client
from app.services import tds_audit_service
from app.services.tds_reporting_service import form_3cd_impact, summary


router = APIRouter(prefix="/api/tds-audit", tags=["tds-audit"])


@router.post("/{client_id}/run")
def run(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return tds_audit_service.run(db, client_id)


@router.get("/{client_id}/cases")
def cases(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return tds_audit_service.cases(db, client_id)


@router.get("/{client_id}/cases/{tds_case_id}")
def case_detail(client_id: int, tds_case_id: str, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    result = tds_audit_service.case_detail(db, client_id, tds_case_id)
    if not result:
        raise HTTPException(404, "TDS case not found")
    return result


@router.get("/{client_id}/exceptions")
def exceptions(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return tds_audit_service.exceptions(db, client_id)


@router.get("/{client_id}/summary")
def audit_summary(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return summary(db, client_id)


@router.get("/{client_id}/form-3cd-impact")
def audit_form_3cd_impact(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return form_3cd_impact(db, client_id)


def _ensure_client(db: Session, client_id: int) -> None:
    if not db.get(Client, client_id):
        raise HTTPException(404, "Client not found")
