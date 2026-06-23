from pathlib import Path
from shutil import copyfileobj

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import ColumnMapping, UploadedFile
from app.services.audit_trail_service import log_event
from app.services.file_parser_service import parse_file
from app.services.retention_service import prune_upload_sessions
from app.services.utils import to_json


def store_upload(db: Session, client_id: int, category: str, upload: UploadFile, upload_session_id: str | None = None) -> UploadedFile:
    settings = get_settings()
    upload_root = Path(settings.upload_dir) / str(client_id) / category
    upload_root.mkdir(parents=True, exist_ok=True)
    target = upload_root / upload.filename
    counter = 1
    while target.exists():
        target = upload_root / f"{target.stem}-{counter}{target.suffix}"
        counter += 1
    with target.open("wb") as handle:
        copyfileobj(upload.file, handle)

    parsed = parse_file(target, category)
    record = UploadedFile(
        client_id=client_id,
        category=category,
        filename=upload.filename,
        stored_path=str(target),
        file_type=target.suffix.lower(),
        upload_session_id=upload_session_id,
        parse_status=parsed["status"],
        records_extracted=parsed["records"],
        ca_review_required=parsed["ca_review_required"],
        error_message=parsed["error"],
        detected_columns=to_json(parsed["columns"]),
        preview_json=to_json(parsed["preview"]),
        raw_text=parsed["raw_text"],
        file_hash=parsed["hash"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    for item in parsed.get("mapping", []):
        db.add(ColumnMapping(file_id=record.id, **item))
    db.commit()
    log_event(db, client_id, "File uploaded", f"{upload.filename} uploaded as {category}; parse status {record.parse_status}.")
    prune_upload_sessions(db, client_id, category)
    db.refresh(record)
    return record
