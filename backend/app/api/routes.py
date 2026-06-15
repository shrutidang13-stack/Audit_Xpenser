from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
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
    RiskScore,
    StatutoryAlert,
    UploadedFile,
    VendorRisk,
)
from app.schemas.api import ClientCreate, MappingConfirm, ReviewPatch
from app.services.audit_pipeline_service import run_audit
from app.services.export_service import client_queries_excel, exception_report_excel, working_paper_docx
from app.services.upload_service import store_upload
from app.services.utils import from_json


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
    return [_client(client) for client in db.query(Client).order_by(Client.created_at.desc()).all()]


@router.get("/clients/default")
def default_client(db: Session = Depends(get_db)):
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
    return _client(client)


@router.get("/clients/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Client not found")
    return _client(client)


@router.post("/upload/{client_id}/{category}")
def upload_file(client_id: int, category: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if category not in UPLOAD_CATEGORIES:
        raise HTTPException(404, "Upload category not found")
    if not db.get(Client, client_id):
        raise HTTPException(404, "Client not found")
    uploaded = store_upload(db, client_id, category, file)
    return _file(uploaded)


@router.get("/upload/{client_id}/files")
def list_files(client_id: int, db: Session = Depends(get_db)):
    return [_file(item) for item in db.query(UploadedFile).filter(UploadedFile.client_id == client_id).order_by(UploadedFile.created_at.desc()).all()]


@router.get("/mapping/{file_id}/preview")
def mapping_preview(file_id: int, db: Session = Depends(get_db)):
    uploaded = db.get(UploadedFile, file_id)
    if not uploaded:
        raise HTTPException(404, "File not found")
    mappings = db.query(ColumnMapping).filter(ColumnMapping.file_id == file_id).all()
    return {
        "file": _file(uploaded),
        "columns": from_json(uploaded.detected_columns, []),
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
    return {"status": "confirmed", "file_id": file_id}


@router.post("/process/run-audit/{client_id}")
def process_run_audit(client_id: int, db: Session = Depends(get_db)):
    try:
        return run_audit(db, client_id)
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
    return _obj(item, ["id", "client_id", "category", "filename", "file_type", "upload_status", "parse_status", "records_extracted", "ca_review_required", "error_message", "created_at"])


def _match(item: BillMatch) -> dict:
    return _obj(item, ["id", "transaction_id", "bill_id", "status", "score", "reason"])


def _score(item: RiskScore) -> dict:
    return _obj(item, ["id", "transaction_id", "score", "level", "reasons"])


def _trail(item: AuditTrail) -> dict:
    return _obj(item, ["id", "action", "details", "actor", "created_at"])


def _obj(item, fields: list[str]) -> dict:
    return {field: getattr(item, field) for field in fields}
