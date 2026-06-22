from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Client
from app.services import fixed_asset_service


router = APIRouter(prefix="/api/fixed-assets", tags=["fixed-assets"])


@router.get("/{client_id}/sources")
def sources(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return fixed_asset_service.sources(db, client_id)


@router.post("/{client_id}/upload/opening")
def upload_opening(client_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    uploaded = fixed_asset_service.upload_fixed_asset_file(db, client_id, "fixed-assets-opening", file)
    return {"status": "uploaded", "file_id": uploaded.id, "filename": uploaded.filename}


@router.post("/{client_id}/upload/additions")
def upload_additions(client_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    uploaded = fixed_asset_service.upload_fixed_asset_file(db, client_id, "fixed-assets-additions", file)
    return {"status": "uploaded", "file_id": uploaded.id, "filename": uploaded.filename}


@router.post("/{client_id}/upload/disposals")
def upload_disposals(client_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    uploaded = fixed_asset_service.upload_fixed_asset_file(db, client_id, "fixed-assets-disposals", file)
    return {"status": "uploaded", "file_id": uploaded.id, "filename": uploaded.filename}


@router.post("/{client_id}/run")
def run(client_id: int, financial_year: str | None = None, db: Session = Depends(get_db)):
    try:
        return fixed_asset_service.run_fixed_asset_schedule(db, client_id, financial_year)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.get("/{client_id}/summary")
def summary(client_id: int, financial_year: str | None = None, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return fixed_asset_service.summary(db, client_id, financial_year)


@router.get("/{client_id}/class-summary")
def class_summary(client_id: int, financial_year: str | None = None, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return fixed_asset_service.class_summary(db, client_id, financial_year)


@router.get("/{client_id}/assets")
def assets(client_id: int, financial_year: str | None = None, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return fixed_asset_service.assets(db, client_id, financial_year)


@router.get("/{client_id}/income-tax")
def income_tax_schedule(client_id: int, financial_year: str | None = None, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return fixed_asset_service.income_tax_schedule(db, client_id, financial_year)


@router.get("/{client_id}/alerts")
def alerts(client_id: int, db: Session = Depends(get_db)):
    _ensure_client(db, client_id)
    return fixed_asset_service.alerts(db, client_id)


def _ensure_client(db: Session, client_id: int) -> None:
    if not db.get(Client, client_id):
        raise HTTPException(404, "Client not found")
