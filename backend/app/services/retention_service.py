from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import (
    AuditException,
    AuditRun,
    BankTransaction,
    Bill,
    ClientQuery,
    ColumnMapping,
    ExpenseTransaction,
    GSTRecord,
    ProcessingExpense,
    TDSRecord,
    TrialBalanceLine,
    UploadedFile,
    Vendor,
)


def prune_upload_sessions(db: Session, client_id: int, category: str, keep: int | None = None) -> dict:
    settings = get_settings()
    keep = keep if keep is not None else settings.upload_retention_runs
    keep_files = settings.upload_retention_files
    if keep <= 0:
        keep = 1
    if keep_files <= 0:
        keep_files = 1
    files = db.query(UploadedFile).filter(
        UploadedFile.client_id == client_id,
        UploadedFile.category == category,
    ).order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc()).all()
    sessions = _upload_sessions(files)
    old_sessions, old_files = _files_to_prune(sessions, keep, keep_files)
    deleted = delete_uploaded_files(db, old_files)
    orphans = cleanup_orphan_upload_files(db, client_id, category)
    return {
        "kept_sessions": min(len(sessions), keep),
        "kept_files": max(len(files) - len(old_files), 0),
        "file_limit": keep_files,
        "deleted_sessions": len(old_sessions),
        "deleted_files": deleted["deleted_files"],
        "deleted_bytes": deleted["deleted_bytes"],
        "deleted_orphan_files": orphans["deleted_orphan_files"],
        "deleted_orphan_bytes": orphans["deleted_orphan_bytes"],
    }


def delete_uploaded_files(db: Session, files: list[UploadedFile]) -> dict:
    if not files:
        return {"deleted_files": 0, "deleted_bytes": 0}
    file_ids = [item.id for item in files]
    deleted_bytes = 0
    db.execute(delete(ColumnMapping).where(ColumnMapping.file_id.in_(file_ids)))
    db.execute(delete(ExpenseTransaction).where(ExpenseTransaction.source_file_id.in_(file_ids)))
    db.execute(delete(Vendor).where(Vendor.source_file_id.in_(file_ids)))
    db.execute(delete(Bill).where(Bill.source_file_id.in_(file_ids)))
    db.execute(delete(TDSRecord).where(TDSRecord.source_file_id.in_(file_ids)))
    db.execute(delete(GSTRecord).where(GSTRecord.source_file_id.in_(file_ids)))
    db.execute(delete(BankTransaction).where(BankTransaction.source_file_id.in_(file_ids)))
    db.execute(delete(TrialBalanceLine).where(TrialBalanceLine.source_file_id.in_(file_ids)))
    db.query(ProcessingExpense).filter(ProcessingExpense.source_file_id.in_(file_ids)).update(
        {ProcessingExpense.source_file_id: None},
        synchronize_session=False,
    )
    for item in files:
        deleted_bytes += _delete_upload_file(item.stored_path)
        db.delete(item)
    db.commit()
    return {"deleted_files": len(files), "deleted_bytes": deleted_bytes}


def prune_audit_runs(db: Session, client_id: int, keep: int | None = None) -> dict:
    keep = keep if keep is not None else get_settings().audit_retention_runs
    if keep <= 0:
        keep = 1
    runs = db.query(AuditRun).filter(AuditRun.client_id == client_id).order_by(AuditRun.run_at.desc(), AuditRun.id.desc()).all()
    old_runs = runs[keep:]
    old_run_ids = [run.id for run in old_runs]
    if not old_run_ids:
        return {"kept_runs": min(len(runs), keep), "deleted_runs": 0, "deleted_exceptions": 0}
    old_exception_ids = [
        row.id
        for row in db.query(AuditException.id).filter(AuditException.audit_run_id.in_(old_run_ids)).all()
    ]
    if old_exception_ids:
        db.execute(delete(ClientQuery).where(ClientQuery.exception_id.in_(old_exception_ids)))
    db.execute(delete(AuditException).where(AuditException.audit_run_id.in_(old_run_ids)))
    db.execute(delete(AuditRun).where(AuditRun.id.in_(old_run_ids)))
    db.commit()
    return {"kept_runs": min(len(runs), keep), "deleted_runs": len(old_runs), "deleted_exceptions": len(old_exception_ids)}


def trim_log_files(root: Path | None = None, max_bytes: int | None = None) -> dict:
    settings = get_settings()
    base = root or Path.cwd().parent
    max_bytes = max_bytes if max_bytes is not None else settings.log_retention_bytes
    if max_bytes <= 0:
        return {"trimmed_logs": 0, "freed_bytes": 0}
    log_files = list((base / "backend").glob("*.log")) + list((base / "frontend").glob("*.log"))
    trimmed = 0
    freed = 0
    for path in log_files:
        if not path.is_file():
            continue
        size = path.stat().st_size
        if size <= max_bytes:
            continue
        with path.open("rb") as handle:
            handle.seek(-max_bytes, 2)
            tail = handle.read()
        with path.open("wb") as handle:
            handle.write(tail)
        trimmed += 1
        freed += max(size - max_bytes, 0)
    return {"trimmed_logs": trimmed, "freed_bytes": freed}


def cleanup_orphan_upload_files(db: Session, client_id: int, category: str) -> dict:
    settings = get_settings()
    upload_root = Path(settings.upload_dir).resolve()
    category_root = (Path(settings.upload_dir) / str(client_id) / category).resolve()
    if not category_root.is_dir() or not category_root.is_relative_to(upload_root):
        return {"deleted_orphan_files": 0, "deleted_orphan_bytes": 0}
    referenced = {
        Path(path).resolve()
        for (path,) in db.query(UploadedFile.stored_path).filter(
            UploadedFile.client_id == client_id,
            UploadedFile.category == category,
        ).all()
        if path
    }
    deleted_files = 0
    deleted_bytes = 0
    for path in category_root.rglob("*"):
        if not path.is_file() or path in referenced:
            continue
        try:
            size = path.stat().st_size
            path.unlink()
            deleted_files += 1
            deleted_bytes += size
        except OSError:
            continue
    _remove_empty_parents(category_root, upload_root)
    return {"deleted_orphan_files": deleted_files, "deleted_orphan_bytes": deleted_bytes}


def _upload_sessions(files: list[UploadedFile]) -> list[dict]:
    grouped = {}
    for item in files:
        session_id = item.upload_session_id or f"legacy-file-{item.id}"
        session = grouped.setdefault(session_id, {"session_id": session_id, "files": [], "created_at": item.created_at, "latest_id": item.id})
        session["files"].append(item)
        if item.created_at and (not session["created_at"] or item.created_at > session["created_at"]):
            session["created_at"] = item.created_at
        session["latest_id"] = max(session["latest_id"], item.id)
    return sorted(grouped.values(), key=lambda item: (item["created_at"], item["latest_id"]), reverse=True)


def _files_to_prune(sessions: list[dict], keep_sessions: int, keep_files: int) -> tuple[list[dict], list[UploadedFile]]:
    old_sessions = sessions[keep_sessions:]
    old_file_ids = {item.id for session in old_sessions for item in session["files"]}
    kept_file_count = 0
    for session in sessions[:keep_sessions]:
        ordered_files = sorted(session["files"], key=lambda item: (item.created_at, item.id), reverse=True)
        for item in ordered_files:
            kept_file_count += 1
            if kept_file_count > keep_files:
                old_file_ids.add(item.id)
    by_id = {item.id: item for session in sessions for item in session["files"]}
    return old_sessions, [by_id[file_id] for file_id in old_file_ids if file_id in by_id]


def _delete_upload_file(stored_path: str | None) -> int:
    if not stored_path:
        return 0
    settings = get_settings()
    upload_root = Path(settings.upload_dir).resolve()
    path = Path(stored_path).resolve()
    try:
        if not path.is_file() or not path.is_relative_to(upload_root):
            return 0
        size = path.stat().st_size
        path.unlink()
        _remove_empty_parents(path.parent, upload_root)
        return size
    except OSError:
        return 0


def _remove_empty_parents(path: Path, stop_at: Path) -> None:
    while path != stop_at and path.is_relative_to(stop_at):
        try:
            path.rmdir()
        except OSError:
            return
        path = path.parent
