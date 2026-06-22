from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models import Client, ColumnMapping, UploadedFile
from app.models.tds_audit_models import TDSCase, TDSLayerResult
from app.services.retention_service import delete_uploaded_files


def reset_client_workspace(db: Session, client_id: int) -> dict:
    """Remove uploaded and generated client data while preserving the client profile."""
    client = db.get(Client, client_id)
    if not client:
        raise ValueError("Client not found")

    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id).all()
    file_ids = [item.id for item in files]
    if file_ids:
        db.execute(delete(ColumnMapping).where(ColumnMapping.file_id.in_(file_ids)))

    tds_case_ids = [
        item.tds_case_id
        for item in db.query(TDSCase.tds_case_id).filter(TDSCase.client_id == client_id).all()
    ]
    if tds_case_ids:
        db.execute(delete(TDSLayerResult).where(TDSLayerResult.tds_case_id.in_(tds_case_ids)))

    deleted_records = 0
    excluded_tables = {"clients", "uploaded_files", "column_mappings"}
    for table in reversed(Base.metadata.sorted_tables):
        if table.name in excluded_tables or "client_id" not in table.c:
            continue
        result = db.execute(delete(table).where(table.c.client_id == client_id))
        deleted_records += result.rowcount or 0

    upload_result = delete_uploaded_files(db, files)
    client.form3cd_generated_at = None
    db.commit()

    return {
        "status": "reset",
        "client_id": client_id,
        "deleted_files": upload_result["deleted_files"],
        "deleted_bytes": upload_result["deleted_bytes"],
        "deleted_records": deleted_records,
    }
