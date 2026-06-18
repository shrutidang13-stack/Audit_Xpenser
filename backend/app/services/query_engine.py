from sqlalchemy.orm import Session

from app.models import AuditException, ClientQuery
from app.services.exception_register_service import map_exception_to_documents_required
from app.services.report_service import format_inr


def generate_queries_from_exceptions(db: Session, client_id: int, audit_run_id: int | None = None) -> list[ClientQuery]:
    query = db.query(AuditException).filter(AuditException.client_id == client_id, AuditException.status.in_(["Pending", "Under Review"]))
    if audit_run_id:
        query = query.filter(AuditException.audit_run_id == audit_run_id)
    created = []
    existing = {row.exception_id for row in db.query(ClientQuery.exception_id).filter(ClientQuery.client_id == client_id, ClientQuery.exception_id.isnot(None)).all()}
    next_number = (db.query(ClientQuery).filter(ClientQuery.client_id == client_id).count() or 0) + 1
    for exception in query.order_by(AuditException.id.asc()).all():
        if exception.id in existing:
            continue
        documents = map_exception_to_documents_required(exception.exception_type)
        query_text = _query_text(exception)
        item = ClientQuery(
            client_id=client_id,
            exception_id=exception.id,
            query_number=f"Q-{next_number:03d}",
            category=exception.exception_type,
            ledger=exception.ledger_name,
            vendor=exception.party_name,
            transaction_date=exception.voucher_date,
            amount=exception.amount,
            issue_detected=exception.exception_description,
            required_document=documents,
            documents_required=documents,
            priority=exception.risk_level or "Medium",
            status="Pending",
            suggested_wording=query_text,
            ca_note=exception.ca_remarks,
        )
        db.add(item)
        created.append(item)
        next_number += 1
    db.commit()
    return created


def _query_text(exception: AuditException) -> str:
    amount = format_inr(exception.amount or 0)
    party = exception.party_name or "the party"
    voucher = exception.voucher_number or "not available"
    date = exception.voucher_date.strftime("%d-%b-%Y") if exception.voucher_date else "not available"
    category = exception.exception_type or "review item"
    if "TDS" in category:
        return f"Please provide TDS applicability details for payment of {amount} to {party}, voucher {voucher} dated {date}, including deduction and challan references where available."
    if "GST" in category:
        return f"Please provide supplier invoice, GSTIN support, and GSTR-2B / ITC reconciliation for voucher {voucher} dated {date} involving {party}."
    if "Missing Bill" in category or "Supporting" in category:
        return f"Please provide original invoice or bill, payment proof, approval note, and business purpose support for {amount} paid to {party}, voucher {voucher} dated {date}."
    if "Cash" in category:
        return f"Please confirm payment mode and provide supporting voucher and business justification for cash payment review item of {amount} to {party}, voucher {voucher} dated {date}."
    if "Capital" in category:
        return f"Please clarify whether expenditure of {amount} booked under {exception.ledger_name or 'the ledger'} is revenue or capital in nature and provide supporting details."
    if "Business Purpose" in category:
        return f"Please provide a written business purpose explanation and supporting correspondence for voucher {voucher} dated {date}, amount {amount}, party {party}."
    if "Duplicate" in category:
        return f"Please provide copies of similar bills and payment details for duplicate document review involving {party}, voucher {voucher} dated {date}."
    return f"Please provide supporting documents and management explanation for {category} involving {party}, voucher {voucher} dated {date}, amount {amount}."
