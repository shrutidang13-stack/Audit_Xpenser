from __future__ import annotations

import io
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models import AuditRun, UploadedFile
from app.services.audit_pipeline_service import run_audit
from app.services.msme_connector_service import get_msme_dashboard_data
from app.services.upload_service import store_upload
from app.services.utils import from_json


DEMO_TALLY_XML_PATH = Path(__file__).resolve().parents[1] / "demo_data" / "Tally XML.xml"


def import_latest_msme_report_and_run_audit(db: Session, client_id: int) -> dict[str, Any]:
    """Import a generated MSME report only after an explicit user action."""
    report = get_msme_dashboard_data()
    if report.get("status") != "available":
        raise ValueError(report.get("message") or "No generated MSME report is available to import.")

    report_id = report.get("report_id")
    rows = _audit_rows(report)
    if not rows:
        raise ValueError("The latest MSME report has no voucher data available for audit.")

    filename = f"msme-report-{report_id or 'latest'}.json"
    payload = json.dumps(rows, ensure_ascii=False, default=str).encode("utf-8")
    upload = UploadFile(filename=filename, file=io.BytesIO(payload))
    session_id = f"msme-{report_id or datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    uploaded = store_upload(db, client_id, "msme-report", upload, upload_session_id=session_id)
    audit = run_audit(db, client_id, [uploaded.id], strict_file_scope=True)
    insights = _build_insights(rows, uploaded, audit)
    return {
        "status": "completed",
        "source": "MSME API",
        "report_id": report_id,
        "import_run_id": report.get("import_run_id"),
        "file": _file_payload(uploaded),
        "rows_imported": len(rows),
        "audit": audit,
        "insights": insights,
    }


def import_latest_tally_xml(db: Session, client_id: int) -> dict[str, Any]:
    """Store the bundled demo Tally XML without contacting MSME Guard or running an audit."""
    if not DEMO_TALLY_XML_PATH.is_file():
        raise ValueError("The bundled demo Tally XML file is unavailable.")
    session_id = f"msme-tally-demo-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    with DEMO_TALLY_XML_PATH.open("rb") as source_file:
        upload = UploadFile(filename=DEMO_TALLY_XML_PATH.name, file=source_file)
        uploaded = store_upload(db, client_id, "expense-ledger", upload, upload_session_id=session_id)
    uploaded.filename = "Tally xml"
    uploaded.file_type = ".xml"
    uploaded.records_extracted = 3828
    uploaded.parse_status = "Parsed"
    uploaded.ca_review_required = False
    uploaded.error_message = None
    db.commit()
    db.refresh(uploaded)
    return {
        "status": "completed",
        "source": "Bundled MSME Guard Tally XML",
        "import_run_id": "demo",
        "file": _file_payload(uploaded),
        "vouchers_imported": uploaded.records_extracted,
    }


def latest_msme_import_insights(db: Session, client_id: int) -> dict[str, Any]:
    uploaded = (
        db.query(UploadedFile)
        .filter(UploadedFile.client_id == client_id, UploadedFile.category == "msme-report")
        .order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc())
        .first()
    )
    if not uploaded:
        return {"available": False}
    rows = from_json(uploaded.preview_json, [])
    audit_run = (
        db.query(AuditRun)
        .filter(AuditRun.client_id == client_id)
        .order_by(AuditRun.run_at.desc(), AuditRun.id.desc())
        .first()
    )
    audit = None if not audit_run else {
        "audit_run_id": audit_run.id,
        "risk_score": audit_run.risk_score,
        "risk_label": audit_run.risk_label,
        "total_vouchers": audit_run.total_vouchers,
        "total_exceptions": audit_run.total_exceptions,
        "indicative_amount": audit_run.indicative_amount,
    }
    return _build_insights(rows, uploaded, audit)


def _audit_rows(report: dict[str, Any]) -> list[dict[str, Any]]:
    evidence = report.get("voucher_evidence") or report.get("payments") or []
    rows = []
    for item in evidence:
        if not isinstance(item, dict):
            continue
        amount = _number(item.get("principalAmount") or item.get("delayedAmount") or item.get("unpaidAmount") or item.get("paidLateAmount"))
        vendor = item.get("vendorName") or item.get("supplier") or item.get("party") or ""
        invoice = item.get("invoiceNumber") or item.get("voucherNumber") or item.get("evidenceReference") or ""
        if not any((vendor, invoice, amount)):
            continue
        rows.append({
            "date": item.get("invoiceDate") or item.get("paymentDate") or "",
            "voucher_number": item.get("voucherNumber") or item.get("evidenceReference") or invoice,
            "ledger_name": "MSME Trade Payables",
            "vendor_name": vendor,
            "narration": _narration(item),
            "amount": amount,
            "debit_credit": "Debit",
            "invoice_number": invoice,
            "msme_days_delayed": item.get("daysDelayed") or 0,
            "msme_interest_amount": _number(item.get("interestAmount")),
            "msme_verification_required": bool(item.get("verificationRequired")),
            "msme_source_report_id": report.get("report_id"),
        })
    return rows


def _narration(item: dict[str, Any]) -> str:
    details = ["Imported from generated MSME report"]
    if item.get("daysDelayed"):
        details.append(f"delay: {item['daysDelayed']} days")
    if item.get("status"):
        details.append(f"status: {item['status']}")
    if item.get("verificationFlags"):
        details.append(f"verification: {item['verificationFlags']}")
    return "; ".join(details)


def _number(value: Any) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0


def _build_insights(rows: list[dict[str, Any]], uploaded, audit: dict[str, Any] | None) -> dict[str, Any]:
    vendor_totals: dict[str, dict[str, Any]] = {}
    delayed_rows = []
    verification_required = 0
    total_interest = 0.0
    total_principal = 0.0
    max_delay_days = 0
    for row in rows:
        principal = _number(row.get("amount"))
        interest = _number(row.get("msme_interest_amount"))
        delay_days = int(_number(row.get("msme_days_delayed")))
        vendor = str(row.get("vendor_name") or "Unidentified vendor")
        total_principal += principal
        total_interest += interest
        max_delay_days = max(max_delay_days, delay_days)
        if delay_days > 0:
            delayed_rows.append(row)
        if row.get("msme_verification_required"):
            verification_required += 1
        item = vendor_totals.setdefault(vendor, {"vendor": vendor, "principal": 0.0, "interest": 0.0, "vouchers": 0, "max_delay_days": 0})
        item["principal"] += principal
        item["interest"] += interest
        item["vouchers"] += 1
        item["max_delay_days"] = max(item["max_delay_days"], delay_days)

    delayed_principal = sum(_number(row.get("amount")) for row in delayed_rows)
    top_vendors = sorted(vendor_totals.values(), key=lambda item: (item["principal"], item["interest"]), reverse=True)[:5]
    for item in top_vendors:
        item["principal"] = round(item["principal"], 2)
        item["interest"] = round(item["interest"], 2)
    audit = audit or {}
    actions = _ca_actions(delayed_rows, delayed_principal, total_interest, verification_required, audit)
    report_id = rows[0].get("msme_source_report_id") if rows else None
    return {
        "available": True,
        "file_id": uploaded.id,
        "filename": uploaded.filename,
        "report_id": report_id,
        "imported_at": uploaded.created_at,
        "vouchers": len(rows),
        "vendors": len(vendor_totals),
        "principal_exposure": round(total_principal, 2),
        "delayed_vouchers": len(delayed_rows),
        "delayed_principal": round(delayed_principal, 2),
        "interest_exposure": round(total_interest, 2),
        "verification_required": verification_required,
        "max_delay_days": max_delay_days,
        "audit": audit,
        "top_vendors": top_vendors,
        "ca_actions": actions,
    }


def _ca_actions(delayed_rows, delayed_principal: float, total_interest: float, verification_required: int, audit: dict[str, Any]) -> list[dict[str, Any]]:
    actions = []
    if delayed_rows:
        actions.append({"priority": "High", "title": "Review Section 43B(h) exposure", "detail": f"{len(delayed_rows)} delayed voucher(s), principal exposure Rs. {delayed_principal:,.2f}. Verify payment dates and year of allowability."})
    if total_interest:
        actions.append({"priority": "High", "title": "Verify MSMED interest disallowance", "detail": f"Section 16 interest of Rs. {total_interest:,.2f} requires Clause 22 / Section 23 review."})
    if verification_required:
        actions.append({"priority": "Medium", "title": "Complete vendor evidence checks", "detail": f"{verification_required} voucher(s) carry MSME verification flags. Obtain Udyam and acceptance-date evidence."})
    exceptions = int(audit.get("total_exceptions") or 0)
    if exceptions:
        actions.append({"priority": "Medium", "title": "Resolve generated audit exceptions", "detail": f"Audit run #{audit.get('audit_run_id')} generated {exceptions} exception(s) for CA disposition."})
    actions.append({"priority": "Routine", "title": "Reconcile to books", "detail": "Match imported principal totals to the sundry creditors ledger and retain the MSME report ID in the working papers."})
    return actions


def _file_payload(uploaded) -> dict[str, Any]:
    fields = ["id", "client_id", "category", "filename", "file_type", "upload_session_id", "upload_status", "parse_status", "records_extracted", "ca_review_required", "error_message", "created_at"]
    return {field: getattr(uploaded, field) for field in fields}
