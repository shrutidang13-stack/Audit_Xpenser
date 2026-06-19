from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.models import (
    AuditTrail,
    Bill,
    BillMatch,
    CapitalReview,
    Client,
    ClientQuery,
    ColumnMapping,
    ExpenseTransaction,
    Form3CDImpact,
    ProcessingExpense,
    ReferenceDocument,
    RiskScore,
    StatutoryAlert,
    UploadedFile,
    VendorRisk,
)
from app.schemas.api import AuditRunRequest, ClientCreate, MappingConfirm, ReviewPatch
from app.services.audit_pipeline_service import run_audit
from app.services.audit_worksheet_service import (
    generate_expense_worksheet_docx,
    generate_expense_worksheet_pdf,
    generate_expense_worksheet_xlsx,
    generate_audit_worksheet_docx,
    generate_audit_worksheet_pdf,
    generate_audit_worksheet_xlsx,
    get_audit_worksheet_data,
    get_ledger_worksheet_data,
)
from app.services.column_mapping_service import suggest_mapping
from app.services.export_service import client_queries_excel, exception_report_excel, working_paper_docx
from app.services.expense_audit_service import get_expense_audit_results, run_expense_audit
from app.services.file_parser_service import parse_file
from app.services.form3cd_report_service import get_form3cd_report
from app.services.processing_service import generate_processing_data, get_processing_schedule
from app.services.reference_library_service import (
    get_reference_document,
    get_reference_document_chunks,
    parse_reference_document,
    save_reference_document,
    search_reference_library,
)
from app.services.retention_service import delete_uploaded_files
from app.services.upload_service import store_upload
from app.services.utils import from_json, parse_date, to_json


router = APIRouter(prefix="/api")
DEFAULT_CLIENT_NAME = "Nxtmobility Energy Private Limited"
DEFAULT_CLIENT_PAN = "AAHCN9637N"
DEFAULT_CLIENT_GSTIN = "09AAHCN9637N1ZK"
DEFAULT_CLIENT_FY = "2025-26"


UPLOAD_CATEGORIES = {
    "expense-ledger",
    "vendor-master",
    "bills",
    "tds-data",
    "gst-data",
    "bank-data",
    "trial-balance",
    "supporting-documents",
}


@router.post("/clients")
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    client = Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return _client(client)


@router.get("/clients")
def list_clients(db: Session = Depends(get_db)):
    return [_client(_get_or_create_default_client(db))]


@router.get("/clients/default")
def default_client(db: Session = Depends(get_db)):
    return _client(_get_or_create_default_client(db))


def _get_or_create_default_client(db: Session) -> Client:
    client = db.query(Client).filter(Client.pan == DEFAULT_CLIENT_PAN).order_by(Client.id.asc()).first()
    if not client:
        client = Client(name=DEFAULT_CLIENT_NAME, pan=DEFAULT_CLIENT_PAN, gstin=DEFAULT_CLIENT_GSTIN, financial_year=DEFAULT_CLIENT_FY)
        db.add(client)
        db.commit()
        db.refresh(client)
    else:
        client.name = DEFAULT_CLIENT_NAME
        client.pan = DEFAULT_CLIENT_PAN
        client.gstin = DEFAULT_CLIENT_GSTIN
        client.financial_year = DEFAULT_CLIENT_FY
        db.commit()
        db.refresh(client)
    return client


@router.get("/clients/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Client not found")
    return _client(client)


@router.post("/upload/{client_id}/{category}")
def upload_file(
    client_id: int,
    category: str,
    replace_existing: bool = False,
    upload_session_id: str | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if category not in UPLOAD_CATEGORIES:
        raise HTTPException(404, "Upload category not found")
    if not db.get(Client, client_id):
        raise HTTPException(404, "Client not found")
    if replace_existing:
        _clear_uploaded_category(db, client_id, category)
    uploaded = store_upload(db, client_id, category, file, upload_session_id=upload_session_id)
    return _file(uploaded)


@router.get("/upload/{client_id}/files")
def list_files(client_id: int, db: Session = Depends(get_db)):
    return [_file(item) for item in db.query(UploadedFile).filter(UploadedFile.client_id == client_id).order_by(UploadedFile.created_at.desc()).all()]


@router.get("/mapping/{file_id}/preview")
def mapping_preview(file_id: int, db: Session = Depends(get_db)):
    uploaded = db.get(UploadedFile, file_id)
    if not uploaded:
        raise HTTPException(404, "File not found")
    _refresh_parsed_upload_if_needed(db, uploaded)
    mappings = db.query(ColumnMapping).filter(ColumnMapping.file_id == file_id).all()
    columns = from_json(uploaded.detected_columns, [])
    if _should_refresh_suggestions(uploaded, mappings):
        db.query(ColumnMapping).filter(ColumnMapping.file_id == file_id).delete()
        mappings = []
        for item in suggest_mapping(uploaded.category, columns):
            mapping = ColumnMapping(file_id=file_id, **item)
            db.add(mapping)
            mappings.append(mapping)
        db.commit()
    return {
        "file": _file(uploaded),
        "columns": columns,
        "preview": from_json(uploaded.preview_json, [])[:25],
        "mappings": [{"source_column": m.source_column, "target_field": m.target_field, "confidence": m.confidence, "confirmed": m.confirmed} for m in mappings],
    }


@router.post("/mapping/{file_id}/confirm")
def confirm_mapping(file_id: int, payload: MappingConfirm, db: Session = Depends(get_db)):
    uploaded = db.get(UploadedFile, file_id)
    if not uploaded:
        raise HTTPException(404, "File not found")
    db.query(ColumnMapping).filter(ColumnMapping.file_id == file_id).delete()
    for item in payload.mappings:
        if item.target_field:
            db.add(ColumnMapping(file_id=file_id, source_column=item.source_column, target_field=item.target_field, confidence=1, confirmed=True))
    db.commit()
    processing = {}
    if payload.generate_processing:
        processing = generate_processing_data(db, uploaded.client_id, payload.file_ids or [file_id])
    return {"status": "confirmed", "mapping_saved": True, "file_id": file_id, **processing}


@router.get("/processing/{client_id}")
def processing_schedule(client_id: int, db: Session = Depends(get_db)):
    try:
        return get_processing_schedule(db, client_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.post("/reference-library/upload")
def upload_reference_document(
    background_tasks: BackgroundTasks,
    title: str = Form(""),
    category: str = Form("Other"),
    effective_date: str = Form(""),
    version_label: str = Form(""),
    source_type: str = Form("Uploaded Reference"),
    notes: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        document = save_reference_document(
            db,
            file,
            title=title,
            category=category,
            effective_date=parse_date(effective_date),
            version_label=version_label or None,
            source_type=source_type or "Uploaded Reference",
            notes=notes or None,
            uploaded_by="system",
            parse_immediately=False,
        )
        background_tasks.add_task(_parse_reference_document_task, document.id)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return {
        "document_id": document.id,
        "title": document.title,
        "category": document.category,
        "parsing_status": document.parsing_status,
        "indexed_status": document.indexed_status,
        "message": "Reference document uploaded. Parsing will continue in the background.",
    }


@router.get("/reference-library")
def list_reference_documents(
    category: str | None = None,
    search: str | None = None,
    effective_date: str | None = None,
    parsing_status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(ReferenceDocument)
    if category:
        query = query.filter(ReferenceDocument.category == category)
    if search:
        like = f"%{search}%"
        query = query.filter(ReferenceDocument.title.ilike(like) | ReferenceDocument.notes.ilike(like) | ReferenceDocument.file_name.ilike(like))
    parsed_effective_date = parse_date(effective_date)
    if parsed_effective_date:
        query = query.filter(ReferenceDocument.effective_date == parsed_effective_date)
    if parsing_status:
        query = query.filter(ReferenceDocument.parsing_status == parsing_status)
    return [_reference_document(item, include_counts=True) for item in query.order_by(ReferenceDocument.created_at.desc()).all()]


@router.get("/reference-library/search")
def reference_library_search(q: str = Query(..., min_length=1), category: str | None = None, db: Session = Depends(get_db)):
    return {"query": q, "results": search_reference_library(db, q, category)}


@router.get("/reference-library/{document_id}")
def reference_document_detail(document_id: int, db: Session = Depends(get_db)):
    try:
        document = get_reference_document(db, document_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    chunks = get_reference_document_chunks(db, document_id)
    return {**_reference_document(document), "chunks": [_reference_chunk(item) for item in chunks[:250]]}


@router.get("/reference-library/{document_id}/view")
def reference_document_view(document_id: int, db: Session = Depends(get_db)):
    try:
        document = get_reference_document(db, document_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    path = Path(document.file_path)
    if not path.exists():
        raise HTTPException(404, "Reference file not found")
    return FileResponse(path, filename=document.file_name, media_type=_media_type(document.file_type))


@router.post("/reference-library/{document_id}/parse")
def reference_document_parse(document_id: int, db: Session = Depends(get_db)):
    try:
        document = parse_reference_document(db, document_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    return _reference_document(document, include_counts=True)


@router.delete("/reference-library/{document_id}")
def delete_reference_document(document_id: int, db: Session = Depends(get_db)):
    document = db.get(ReferenceDocument, document_id)
    if not document:
        raise HTTPException(404, "Reference document not found")
    path = Path(document.file_path)
    db.delete(document)
    db.commit()
    try:
        if path.exists():
            path.unlink()
    except OSError:
        pass
    return {"status": "deleted", "document_id": document_id}


@router.post("/process/run-audit/{client_id}")
def process_run_audit(client_id: int, payload: AuditRunRequest | None = None, db: Session = Depends(get_db)):
    try:
        return run_audit(db, client_id, payload.file_ids if payload else None)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.post("/expense-audit/{client_id}/run")
def expense_audit_run(client_id: int, db: Session = Depends(get_db)):
    try:
        return run_expense_audit(db, client_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.get("/expense-audit/{client_id}/results")
def expense_audit_results(client_id: int, db: Session = Depends(get_db)):
    try:
        return get_expense_audit_results(db, client_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.get("/audit-worksheet/{client_id}")
def audit_worksheet(client_id: int, db: Session = Depends(get_db)):
    try:
        return get_audit_worksheet_data(db, client_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.get("/audit-worksheet/{client_id}/download")
def audit_worksheet_download(client_id: int, format: str = "xlsx", ledger_name: str | None = None, result_id: int | None = None, db: Session = Depends(get_db)):
    requested = format.lower().strip()
    try:
        if requested == "xlsx":
            output = generate_expense_worksheet_xlsx(db, client_id, ledger_name=ledger_name, result_id=result_id) if ledger_name or result_id else generate_audit_worksheet_xlsx(db, client_id)
            return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=audit-worksheet.xlsx"})
        if requested == "docx":
            output = generate_expense_worksheet_docx(db, client_id, ledger_name=ledger_name, result_id=result_id) if ledger_name or result_id else generate_audit_worksheet_docx(db, client_id)
            return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=audit-worksheet.docx"})
        if requested == "pdf":
            output = generate_expense_worksheet_pdf(db, client_id, ledger_name=ledger_name, result_id=result_id) if ledger_name or result_id else generate_audit_worksheet_pdf(db, client_id)
            return StreamingResponse(output, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=audit-worksheet.pdf"})
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    except Exception as exc:
        if requested == "pdf":
            raise HTTPException(500, f"PDF export could not be generated: {exc}")
        raise
    raise HTTPException(400, "Unsupported audit worksheet download format")


@router.get("/audit-worksheet/{client_id}/ledger/{result_id}")
def audit_worksheet_ledger(client_id: int, result_id: int, db: Session = Depends(get_db)):
    try:
        return get_ledger_worksheet_data(db, client_id, result_id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))


@router.get("/process/status/{client_id}")
def process_status(client_id: int, db: Session = Depends(get_db)):
    latest = db.query(AuditTrail).filter(AuditTrail.client_id == client_id).order_by(AuditTrail.created_at.desc()).first()
    return {"status": "completed" if latest and "completed" in latest.details.lower() else "ready", "latest_event": _trail(latest) if latest else None}


@router.get("/dashboard/{client_id}/summary")
def dashboard_summary(client_id: int, db: Session = Depends(get_db)):
    total_expenses = db.query(func.count(ExpenseTransaction.id)).filter(ExpenseTransaction.client_id == client_id).scalar() or 0
    total_amount = db.query(func.coalesce(func.sum(ExpenseTransaction.amount), 0)).filter(ExpenseTransaction.client_id == client_id).scalar() or 0
    high_risk = db.query(func.count(RiskScore.id)).filter(RiskScore.client_id == client_id, RiskScore.score >= 60).scalar() or 0
    alerts = db.query(func.count(StatutoryAlert.id)).filter(StatutoryAlert.client_id == client_id).scalar() or 0
    missing_bills = db.query(func.count(BillMatch.id)).filter(BillMatch.client_id == client_id, BillMatch.status == "Bill Missing").scalar() or 0
    files = db.query(func.count(UploadedFile.id)).filter(UploadedFile.client_id == client_id).scalar() or 0
    levels = db.query(RiskScore.level, func.count(RiskScore.id)).filter(RiskScore.client_id == client_id).group_by(RiskScore.level).all()
    categories = db.query(StatutoryAlert.alert_type, func.count(StatutoryAlert.id)).filter(StatutoryAlert.client_id == client_id).group_by(StatutoryAlert.alert_type).all()
    return {
        "total_expenses": total_expenses,
        "total_amount": total_amount,
        "high_risk": high_risk,
        "statutory_alerts": alerts,
        "missing_bills": missing_bills,
        "files_uploaded": files,
        "risk_levels": [{"name": level or "Unscored", "value": count} for level, count in levels],
        "alert_mix": [{"name": alert_type, "value": count} for alert_type, count in categories],
    }


@router.get("/dashboard/{client_id}/bill-matches")
def bill_matches(client_id: int, db: Session = Depends(get_db)):
    rows = []
    for match in db.query(BillMatch).filter(BillMatch.client_id == client_id).order_by(BillMatch.id.desc()).all():
        tx = db.get(ExpenseTransaction, match.transaction_id) if match.transaction_id else None
        bill = db.get(Bill, match.bill_id) if match.bill_id else None
        rows.append({**_match(match), "ledger": tx.ledger_name if tx else None, "vendor": (tx.vendor_name if tx else bill.vendor_name if bill else None), "amount": tx.amount if tx else bill.amount if bill else None, "invoice_number": tx.invoice_number if tx else bill.invoice_number if bill else None})
    return rows


@router.get("/dashboard/{client_id}/high-risk-expenses")
def high_risk_expenses(client_id: int, db: Session = Depends(get_db)):
    rows = []
    scores = db.query(RiskScore).filter(RiskScore.client_id == client_id).order_by(RiskScore.score.desc()).all()
    for score in scores:
        tx = db.get(ExpenseTransaction, score.transaction_id) if score.transaction_id else None
        rows.append({**_score(score), "ledger": tx.ledger_name if tx else None, "vendor": tx.vendor_name if tx else None, "amount": tx.amount if tx else None, "date": tx.date if tx else None})
    return rows


@router.get("/dashboard/{client_id}/statutory-alerts")
def statutory_alerts(client_id: int, db: Session = Depends(get_db)):
    return [_obj(a, ["id", "transaction_id", "alert_type", "issue", "severity", "suggested_review"]) for a in db.query(StatutoryAlert).filter(StatutoryAlert.client_id == client_id).all()]


@router.get("/dashboard/{client_id}/capital-review")
def capital_review(client_id: int, db: Session = Depends(get_db)):
    return [_obj(a, ["id", "transaction_id", "amount", "reason", "suggested_review_area", "ca_review_required"]) for a in db.query(CapitalReview).filter(CapitalReview.client_id == client_id).all()]


@router.get("/dashboard/{client_id}/vendor-risks")
def vendor_risks(client_id: int, db: Session = Depends(get_db)):
    return [_obj(a, ["id", "vendor_name", "issue", "severity", "suggested_action"]) for a in db.query(VendorRisk).filter(VendorRisk.client_id == client_id).all()]


@router.get("/dashboard/{client_id}/form3cd-impact")
def form3cd(client_id: int, db: Session = Depends(get_db)):
    return [_obj(a, ["id", "source_type", "source_id", "clause_area", "observation", "suggested_review"]) for a in db.query(Form3CDImpact).filter(Form3CDImpact.client_id == client_id).all()]


@router.get("/dashboard/{client_id}/form3cd-report")
def form3cd_report(client_id: int, db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Client not found")
    return get_form3cd_report(client, db)


@router.get("/dashboard/{client_id}/client-queries")
def client_queries(client_id: int, db: Session = Depends(get_db)):
    return [_obj(a, ["id", "query_number", "ledger", "vendor", "transaction_date", "amount", "issue_detected", "required_document", "priority", "status", "suggested_wording"]) for a in db.query(ClientQuery).filter(ClientQuery.client_id == client_id).all()]


@router.get("/dashboard/{client_id}/audit-trail")
def audit_trail(client_id: int, db: Session = Depends(get_db)):
    return [_trail(a) for a in db.query(AuditTrail).filter(AuditTrail.client_id == client_id).order_by(AuditTrail.created_at.desc()).all()]


@router.patch("/review/exception/{exception_id}")
def patch_exception(exception_id: int, payload: ReviewPatch):
    return {"status": "noted", "exception_id": exception_id, "review_status": payload.status, "comment": payload.comment}


@router.patch("/review/query/{query_id}")
def patch_query(query_id: int, payload: ReviewPatch, db: Session = Depends(get_db)):
    query = db.get(ClientQuery, query_id)
    if not query:
        raise HTTPException(404, "Query not found")
    if payload.status:
        query.status = payload.status
    db.commit()
    return {"status": "updated", "query_id": query_id}


@router.post("/review/exception/{exception_id}/comment")
def comment_exception(exception_id: int, payload: ReviewPatch):
    return {"status": "comment recorded", "exception_id": exception_id, "comment": payload.comment}


@router.get("/export/{client_id}/client-queries")
def export_queries(client_id: int, db: Session = Depends(get_db)):
    output = client_queries_excel(db, client_id)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=client-queries.xlsx"})


@router.get("/export/{client_id}/exception-report")
def export_exceptions(client_id: int, db: Session = Depends(get_db)):
    output = exception_report_excel(db, client_id)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=exception-report.xlsx"})


@router.get("/export/{client_id}/working-paper")
def export_working_paper(client_id: int, db: Session = Depends(get_db)):
    output = working_paper_docx(db, client_id)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=working-paper.docx"})


def _client(client: Client) -> dict:
    return _obj(client, ["id", "name", "pan", "gstin", "financial_year", "created_at"])


def _file(item: UploadedFile) -> dict:
    return _obj(item, ["id", "client_id", "category", "filename", "file_type", "upload_session_id", "upload_status", "parse_status", "records_extracted", "ca_review_required", "error_message", "created_at"])


def _match(item: BillMatch) -> dict:
    return _obj(item, ["id", "transaction_id", "bill_id", "status", "score", "reason"])


def _score(item: RiskScore) -> dict:
    return _obj(item, ["id", "transaction_id", "score", "level", "reasons"])


def _trail(item: AuditTrail) -> dict:
    return _obj(item, ["id", "action", "details", "actor", "created_at"])


def _reference_document(item: ReferenceDocument, include_counts: bool = False) -> dict:
    data = _obj(item, ["id", "title", "category", "file_name", "file_type", "effective_date", "version_label", "source_type", "uploaded_by", "parsing_status", "indexed_status", "notes", "created_at"])
    if include_counts:
        data["chunk_count"] = len(item.chunks or [])
    return data


def _reference_chunk(item) -> dict:
    return _obj(item, ["id", "page_number", "section_number", "rule_number", "heading", "content_text", "chunk_index"])


def _media_type(file_type: str) -> str:
    media_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
    return media_types.get(file_type, "application/octet-stream")


def _parse_reference_document_task(document_id: int) -> None:
    db = SessionLocal()
    try:
        parse_reference_document(db, document_id)
    finally:
        db.close()


def _obj(item, fields: list[str]) -> dict:
    return {field: getattr(item, field) for field in fields}


def _clear_uploaded_category(db: Session, client_id: int, category: str) -> None:
    old_files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id, UploadedFile.category == category).all()
    delete_uploaded_files(db, old_files)
    if category == "expense-ledger":
        db.query(ProcessingExpense).filter(ProcessingExpense.client_id == client_id).delete(synchronize_session=False)
    db.commit()


def _should_refresh_suggestions(uploaded: UploadedFile, mappings: list[ColumnMapping]) -> bool:
    if not mappings:
        return True
    mapped_columns = {mapping.source_column for mapping in mappings}
    current_columns = set(from_json(uploaded.detected_columns, []))
    if mapped_columns != current_columns:
        return True
    if uploaded.category != "gst-data":
        return False
    pairs = {(mapping.source_column.lower(), mapping.target_field) for mapping in mappings}
    stale_pairs = {
        ("irn", "invoice_number"),
        ("irngendate", "invoice_date"),
        ("supprd", "vendor_name"),
    }
    return bool(pairs & stale_pairs)


def _refresh_parsed_upload_if_needed(db: Session, uploaded: UploadedFile) -> None:
    columns = from_json(uploaded.detected_columns, [])
    has_large_xml_placeholder = columns == ["rows.row.xml_note"]
    if uploaded.category != "expense-ledger" or uploaded.file_type != ".xml" or not has_large_xml_placeholder:
        return
    parsed = parse_file(Path(uploaded.stored_path), uploaded.category)
    if parsed["records"] <= uploaded.records_extracted:
        return
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
    db.commit()
    db.refresh(uploaded)
