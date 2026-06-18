from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import AuditException, Client, ClientQuery
from app.schemas.api import AuditRunRequest, ReviewPatch
from app.services.audit_pipeline_service import run_audit
from app.services.exception_register_service import latest_audit_run, summarize_exceptions
from app.services.query_engine import generate_queries_from_exceptions
from app.services.report_service import get_exception_register_data


router = APIRouter(prefix="/api/audit")


@router.post("/{client_id}/run")
def audit_run(client_id: int, payload: AuditRunRequest | None = None, db: Session = Depends(get_db)):
    if not db.get(Client, client_id):
        raise HTTPException(404, "Client not found")
    return run_audit(db, client_id, payload.file_ids if payload else None)


@router.get("/{client_id}/summary")
def audit_summary(client_id: int, db: Session = Depends(get_db)):
    if not db.get(Client, client_id):
        raise HTTPException(404, "Client not found")
    data = get_exception_register_data(db, client_id)
    run = data["audit_run"]
    return {
        "latest_run": run,
        "client": data["client"],
        "total_vouchers": run["total_vouchers"],
        "total_exceptions": data["total_exceptions"],
        "total_indicative_amount": data["indicative_amount"],
        "risk_score": run["risk_score"],
        "risk_label": run["risk_label"],
        "category_summary": data["category_summary"],
        "risk_summary": data["risk_summary"],
        "form_3cd_summary": data["form_3cd_summary"],
        "pending_query_count": data["pending_query_count"],
    }


@router.get("/{client_id}/exceptions")
def audit_exceptions(
    client_id: int,
    category: str | None = None,
    exception_type: str | None = None,
    risk_level: str | None = None,
    status: str | None = None,
    search: str | None = None,
    form_3cd_clause: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    sort_by: str = "id",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
):
    run = latest_audit_run(db, client_id)
    query = db.query(AuditException).filter(AuditException.client_id == client_id)
    if run:
        query = query.filter(AuditException.audit_run_id == run.id)
    selected_type = exception_type or category
    if selected_type:
        query = query.filter(AuditException.exception_type.ilike(f"%{selected_type.replace('_', ' ')}%"))
    if risk_level:
        query = query.filter(AuditException.risk_level == risk_level)
    if status:
        query = query.filter(AuditException.status == status)
    if form_3cd_clause:
        query = query.filter(AuditException.form_3cd_clause.ilike(f"%{form_3cd_clause}%"))
    if search:
        like = f"%{search}%"
        query = query.filter(or_(AuditException.party_name.ilike(like), AuditException.voucher_number.ilike(like), AuditException.ledger_name.ilike(like)))
    total = query.count()
    sort_column = getattr(AuditException, sort_by, AuditException.id)
    query = query.order_by(desc(sort_column) if sort_order.lower() == "desc" else asc(sort_column))
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "summary": summarize_exceptions(db, client_id, run.id if run else None),
        "exceptions": [_exception(item) for item in items],
    }


@router.patch("/{client_id}/exceptions/{exception_id}")
def patch_audit_exception(client_id: int, exception_id: int, payload: ReviewPatch, db: Session = Depends(get_db)):
    item = db.get(AuditException, exception_id)
    if not item or item.client_id != client_id:
        raise HTTPException(404, "Exception not found")
    if payload.status:
        allowed = {"Pending", "Under Review", "Resolved", "Not Applicable"}
        if payload.status not in allowed:
            raise HTTPException(400, "Unsupported status")
        item.status = payload.status
    if payload.comment is not None:
        item.ca_remarks = payload.comment
    db.commit()
    generate_queries_from_exceptions(db, client_id, item.audit_run_id)
    db.refresh(item)
    return _exception(item)


@router.post("/{client_id}/queries/generate")
def generate_queries(client_id: int, db: Session = Depends(get_db)):
    run = latest_audit_run(db, client_id)
    created = generate_queries_from_exceptions(db, client_id, run.id if run else None)
    return {"created": len(created)}


@router.get("/{client_id}/queries")
def list_queries(client_id: int, status: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(100, ge=1, le=200), db: Session = Depends(get_db)):
    query = db.query(ClientQuery).filter(ClientQuery.client_id == client_id)
    if status:
        query = query.filter(ClientQuery.status == status)
    total = query.count()
    items = query.order_by(ClientQuery.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "queries": [
            {
                "id": item.id,
                "query_number": item.query_number,
                "category": item.category,
                "vendor": item.vendor,
                "ledger": item.ledger,
                "transaction_date": item.transaction_date,
                "amount": item.amount,
                "documents_required": item.documents_required or item.required_document,
                "client_response": item.client_response,
                "ca_note": item.ca_note,
                "status": item.status,
                "suggested_wording": item.suggested_wording,
            }
            for item in items
        ],
    }


def _exception(item: AuditException) -> dict:
    return {
        "id": item.id,
        "audit_run_id": item.audit_run_id,
        "transaction_id": item.transaction_id,
        "voucher_date": item.voucher_date,
        "voucher_type": item.voucher_type,
        "voucher_number": item.voucher_number,
        "party_name": item.party_name,
        "ledger_name": item.ledger_name,
        "amount": item.amount,
        "exception_type": item.exception_type,
        "exception_description": item.exception_description,
        "risk_level": item.risk_level,
        "form_3cd_clause": item.form_3cd_clause,
        "status": item.status,
        "ca_remarks": item.ca_remarks,
    }
