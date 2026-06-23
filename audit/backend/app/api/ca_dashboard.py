from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Client
from app.services.expense_audit_service import get_expense_audit_results
from app.services.form3cd_report_service import get_form3cd_report
from app.services.msme_connector_service import get_msme_dashboard_data
from app.services.report_service import get_exception_register_data


router = APIRouter(prefix="/api/ca-dashboard")


@router.get("/{client_id}")
def ca_dashboard(client_id: int, db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Client not found")

    auditxpenser = {
        "expense_audit": _safe(lambda: _expense_audit_snapshot(db, client_id), {"summary": {}, "rows": []}),
        "dashboard_summary": _safe(lambda: _dashboard_summary(db, client_id), {}),
        "gst_tds": _gst_tds_snapshot(db, client_id),
        "form3cd": _safe(lambda: get_form3cd_report(client, db), {}),
        "client_queries": _client_queries(db, client_id),
        "audit_summary": _safe(lambda: get_exception_register_data(db, client_id), {}),
    }
    msme_guard = get_msme_dashboard_data()
    return {
        "client_id": client_id,
        "financial_year": client.financial_year,
        "client": {
            "id": client.id,
            "name": client.name,
            "pan": client.pan,
            "gstin": client.gstin,
            "financial_year": client.financial_year,
        },
        "auditxpenser": auditxpenser,
        "msme_guard": msme_guard,
        "analytics": _analytics(auditxpenser, msme_guard),
    }


def _safe(func, fallback):
    try:
        return func()
    except Exception:
        return fallback


def _dashboard_summary(db: Session, client_id: int) -> dict:
    # Import lazily to avoid a router import cycle during FastAPI startup.
    from app.api.routes import dashboard_summary

    return dashboard_summary(client_id, db)


def _expense_audit_snapshot(db: Session, client_id: int) -> dict:
    data = get_expense_audit_results(db, client_id)
    rows = data.get("rows") or []
    data["summary"] = {
        **(data.get("summary") or {}),
        "payment_40a3_review_items": len([
            row
            for row in rows
            if row.get("payment_40a3_review") != "No difference noted from available data"
        ]),
    }
    return data


def _gst_tds_snapshot(db: Session, client_id: int) -> dict:
    from app.models import StatutoryAlert

    alerts = db.query(StatutoryAlert).filter(StatutoryAlert.client_id == client_id).all()
    return {
        "tds_alerts": len([item for item in alerts if item.alert_type == "TDS"]),
        "gst_alerts": len([item for item in alerts if item.alert_type == "GST"]),
        "rcm_alerts": len([item for item in alerts if item.alert_type == "RCM"]),
        "alerts": [
            {
                "id": item.id,
                "alert_type": item.alert_type,
                "issue": item.issue,
                "severity": item.severity,
                "suggested_review": item.suggested_review,
            }
            for item in alerts
        ],
    }


def _client_queries(db: Session, client_id: int) -> list[dict]:
    from app.models import ClientQuery

    rows = db.query(ClientQuery).filter(ClientQuery.client_id == client_id).order_by(ClientQuery.id.desc()).limit(100).all()
    return [
        {
            "id": item.id,
            "query_number": item.query_number,
            "category": item.category,
            "ledger": item.ledger,
            "vendor": item.vendor,
            "amount": item.amount,
            "priority": item.priority,
            "status": item.status,
            "issue_detected": item.issue_detected,
            "suggested_wording": item.suggested_wording,
        }
        for item in rows
    ]


def _analytics(auditxpenser: dict, msme_guard: dict) -> dict:
    audit_summary = auditxpenser.get("audit_summary") or {}
    expense_summary = (auditxpenser.get("expense_audit") or {}).get("summary") or {}
    msme_available = msme_guard.get("status") == "available"
    msme_risk_value = ((msme_guard.get("msme_compliance") or {}).get("risk_score") or {}).get("score")
    tax = msme_guard.get("tax_disallowance_43bh") or {}
    disallowance_rows = tax.get("taxDisallowanceSummary") or []
    tax_impact = sum(
        float(row.get("principalDisallowance") or 0) + float(row.get("interestPermanentDisallowance") or 0)
        for row in disallowance_rows
        if isinstance(row, dict)
    )
    critical = int(audit_summary.get("pending_query_count") or 0) + len(msme_guard.get("form3cd", {}).get("clause26", []) or [])
    expense_risk = int(audit_summary.get("audit_run", {}).get("risk_score") or audit_summary.get("latest_run", {}).get("risk_score") or 0)
    if not expense_risk and expense_summary:
        expense_risk = min(int(expense_summary.get("ca_review_required_count") or 0) * 10, 100)
    msme_risk = int(msme_risk_value or 0) if msme_available else None
    domain_scores = [expense_risk]
    if msme_risk is not None:
        domain_scores.append(msme_risk)
    return {
        "total_expense_risk": expense_risk,
        "total_msme_risk": msme_risk,
        "total_tax_impact": round(tax_impact, 2),
        "critical_issues_count": critical,
        "risk_score": min(100, max(domain_scores)),
        "risk_basis": "highest_domain",
        "msme_risk_available": msme_available,
    }
