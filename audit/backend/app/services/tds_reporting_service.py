import json

from sqlalchemy.orm import Session

from app.models.tds_audit_models import TDSAuditRun, TDSCase, TDSException, TDSLayerResult


def summary(db: Session, client_id: int) -> dict:
    cases = db.query(TDSCase).filter(TDSCase.client_id == client_id)
    exceptions = db.query(TDSException).filter(TDSException.client_id == client_id)
    titles = [row.exception_title for row in exceptions.all()]
    return {
        "total_tds_cases": cases.count(),
        "tds_not_deducted": titles.count("TDS applicability identified but deduction not found"),
        "tds_short_deducted": titles.count("TDS appears short deducted"),
        "tds_deducted_but_not_paid": titles.count("TDS deducted but payment/challan not matched"),
        "late_deposit": titles.count("TDS deposited after due date"),
        "wrong_section": titles.count("TDS deducted under possible wrong section"),
        "pan_missing": titles.count("PAN not available for vendor"),
        "form_3cd_impact": exceptions.filter(TDSException.possible_form_3cd_impact.is_(True)).count(),
        "possible_40aia_impact": exceptions.filter(TDSException.possible_40aia_impact.is_(True)).count(),
        "ca_review_required": cases.filter(TDSCase.ca_review_required.is_(True)).count(),
    }


def case_payload(item: TDSCase) -> dict:
    fields = [
        "tds_case_id", "vendor_name", "vendor_pan", "vendor_gstin", "expense_ledger", "invoice_no",
        "voucher_no", "voucher_date", "gross_amount", "gst_amount", "tds_base_amount", "expected_tds_section",
        "expected_tds_rate", "expected_tds_amount", "actual_tds_section", "actual_tds_amount",
        "tds_deduction_date", "tds_payment_date", "challan_no", "challan_amount", "status", "risk_level",
        "ca_review_required", "form_3cd_clause", "disallowance_section",
    ]
    return {field: getattr(item, field) for field in fields}


def exception_payload(item: TDSException) -> dict:
    return {field: getattr(item, field) for field in [
        "id", "tds_case_id", "exception_type", "exception_title", "exception_description", "amount_impact",
        "possible_form_3cd_impact", "possible_40aia_impact", "risk_level", "ca_review_required",
        "suggested_query", "suggested_working_paper_note", "status",
    ]}


def layer_payload(item: TDSLayerResult) -> dict:
    return {
        "layer_name": item.layer_name,
        "status": item.layer_status,
        "expected": json.loads(item.expected_value_json or "{}"),
        "actual": json.loads(item.actual_value_json or "{}"),
        "remarks": item.remarks or "",
        "evidence": json.loads(item.evidence_json or "{}"),
    }


def form_3cd_impact(db: Session, client_id: int) -> dict:
    rows = db.query(TDSException).filter(TDSException.client_id == client_id, TDSException.possible_form_3cd_impact.is_(True)).all()
    return {
        "clause": "Form 3CD Clause 34(a)/(b)",
        "status": "Possible Form 3CD impact - CA Review Required",
        "items": [exception_payload(row) for row in rows],
    }
