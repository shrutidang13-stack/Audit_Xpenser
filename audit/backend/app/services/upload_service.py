from pathlib import Path
from shutil import copyfileobj
from concurrent.futures import ThreadPoolExecutor
import logging
import time

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.config import get_settings
from app.models import ColumnMapping, UploadedFile
from app.services.audit_trail_service import log_event
from app.services.bill_extraction_service import extract_bill_from_upload
from app.services.file_parser_service import parse_file
from app.services.retention_service import prune_upload_sessions
from app.services.utils import to_json


BILL_PARSE_WORKERS = 2
_bill_upload_executor = ThreadPoolExecutor(max_workers=BILL_PARSE_WORKERS, thread_name_prefix="bill-upload")
logger = logging.getLogger(__name__)


def store_upload(db: Session, client_id: int, category: str, upload: UploadFile, upload_session_id: str | None = None) -> UploadedFile:
    settings = get_settings()
    target = _save_upload_file(settings.upload_dir, client_id, category, upload)

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


def store_bill_upload_pending(db: Session, client_id: int, upload: UploadFile, upload_session_id: str | None = None) -> UploadedFile:
    start = time.perf_counter()
    settings = get_settings()
    target = _save_upload_file(settings.upload_dir, client_id, "bills", upload)
    record = UploadedFile(
        client_id=client_id,
        category="bills",
        filename=upload.filename,
        stored_path=str(target),
        file_type=target.suffix.lower(),
        upload_session_id=upload_session_id,
        upload_status="Uploaded",
        parse_status="Pending",
        records_extracted=0,
        ca_review_required=False,
        error_message=None,
        detected_columns=to_json([]),
        preview_json=to_json([]),
        raw_text="",
        file_hash=None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    log_event(db, client_id, "Bill uploaded", f"{upload.filename} uploaded as bills; parsing queued.")
    logger.info("bill_upload_saved file_id=%s filename=%s elapsed=%.3fs", record.id, record.filename, time.perf_counter() - start)
    return record


def queue_bill_upload_processing(file_id: int) -> None:
    _bill_upload_executor.submit(_process_bill_upload, file_id)


def _process_bill_upload(file_id: int) -> None:
    start = time.perf_counter()
    db = SessionLocal()
    try:
        uploaded = db.get(UploadedFile, file_id)
        if not uploaded or uploaded.category != "bills":
            return
        uploaded.parse_status = "Processing"
        uploaded.error_message = None
        db.commit()
        logger.info("bill_parse_started file_id=%s filename=%s", uploaded.id, uploaded.filename)

        parsed = parse_file(Path(uploaded.stored_path), "bills")
        uploaded.parse_status = parsed["status"]
        uploaded.records_extracted = parsed["records"]
        uploaded.ca_review_required = parsed["ca_review_required"]
        uploaded.error_message = parsed["error"]
        uploaded.detected_columns = to_json(parsed["columns"])
        uploaded.preview_json = to_json(parsed["preview"])
        uploaded.raw_text = parsed["raw_text"]
        uploaded.file_hash = parsed["hash"]
        db.query(ColumnMapping).filter(ColumnMapping.file_id == uploaded.id).delete()
        for item in parsed.get("mapping", []):
            db.add(ColumnMapping(file_id=uploaded.id, **item))
        extract_bill_from_upload(db, uploaded, force_parse_missing_text=False)
        db.commit()
        log_event(db, uploaded.client_id, "Bill processed", f"{uploaded.filename} bill parsing completed; parse status {uploaded.parse_status}.")
        prune_upload_sessions(db, uploaded.client_id, "bills")
        logger.info("bill_parse_completed file_id=%s filename=%s status=%s elapsed=%.3fs", uploaded.id, uploaded.filename, uploaded.parse_status, time.perf_counter() - start)
    except Exception as exc:
        db.rollback()
        uploaded = db.get(UploadedFile, file_id)
        if uploaded:
            uploaded.parse_status = "Failed"
            uploaded.ca_review_required = True
            uploaded.error_message = str(exc)
            db.commit()
            logger.exception("bill_parse_failed file_id=%s filename=%s elapsed=%.3fs", uploaded.id, uploaded.filename, time.perf_counter() - start)
        else:
            logger.exception("bill_parse_failed file_id=%s elapsed=%.3fs", file_id, time.perf_counter() - start)
    finally:
        db.close()


def _save_upload_file(upload_dir: str, client_id: int, category: str, upload: UploadFile) -> Path:
    upload_root = Path(upload_dir) / str(client_id) / category
    upload_root.mkdir(parents=True, exist_ok=True)
    target = upload_root / upload.filename
    counter = 1
    while target.exists():
        target = upload_root / f"{target.stem}-{counter}{target.suffix}"
        counter += 1
    with target.open("wb") as handle:
        copyfileobj(upload.file, handle)
    return target
