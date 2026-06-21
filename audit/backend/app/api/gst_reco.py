from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.api import GSTRecoRunRequest
from app.services.gst_reco_service import results, run_gst_reco, source_status, summary


router = APIRouter(prefix="/api/gst-reco")


@router.get("/{client_id}/sources")
def gst_reco_sources(client_id: int, db: Session = Depends(get_db)):
    return source_status(db, client_id)


@router.post("/{client_id}/run")
def gst_reco_run(client_id: int, payload: GSTRecoRunRequest | None = None, db: Session = Depends(get_db)):
    try:
        return run_gst_reco(db, client_id, payload or GSTRecoRunRequest())
    except ValueError as exc:
        message = str(exc)
        status_code = 400 if "not found" in message.lower() else 404
        raise HTTPException(status_code, message)


@router.get("/{client_id}/summary")
def gst_reco_summary(client_id: int, db: Session = Depends(get_db)):
    return summary(db, client_id)


@router.get("/{client_id}/results")
def gst_reco_results(client_id: int, status: str | None = None, risk_level: str | None = None, db: Session = Depends(get_db)):
    return results(db, client_id, status=status, risk_level=risk_level)
