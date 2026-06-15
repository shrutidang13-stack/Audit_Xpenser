from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    pan: Mapped[str | None] = mapped_column(String(20))
    gstin: Mapped[str | None] = mapped_column(String(20))
    financial_year: Mapped[str] = mapped_column(String(20), default="2025-26")
    files = relationship("UploadedFile", back_populates="client")


class UploadedFile(Base, TimestampMixin):
    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    stored_path: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(20))
    upload_status: Mapped[str] = mapped_column(String(40), default="Uploaded")
    parse_status: Mapped[str] = mapped_column(String(60), default="Pending")
    records_extracted: Mapped[int] = mapped_column(Integer, default=0)
    ca_review_required: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    detected_columns: Mapped[str | None] = mapped_column(Text)
    preview_json: Mapped[str | None] = mapped_column(Text)
    raw_text: Mapped[str | None] = mapped_column(Text)
    file_hash: Mapped[str | None] = mapped_column(String(128), index=True)
    client = relationship("Client", back_populates="files")


class ColumnMapping(Base, TimestampMixin):
    __tablename__ = "column_mappings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("uploaded_files.id"), index=True)
    source_column: Mapped[str] = mapped_column(String(255))
    target_field: Mapped[str] = mapped_column(String(120))
    confidence: Mapped[float] = mapped_column(Float, default=0)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)


class Vendor(Base, TimestampMixin):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"))
    source_ref: Mapped[str | None] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(255), index=True)
    pan: Mapped[str | None] = mapped_column(String(20), index=True)
    gstin: Mapped[str | None] = mapped_column(String(20), index=True)
    address: Mapped[str | None] = mapped_column(Text)
    vendor_type: Mapped[str | None] = mapped_column(String(80))
    contact: Mapped[str | None] = mapped_column(String(120))


class ExpenseTransaction(Base, TimestampMixin):
    __tablename__ = "expense_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"))
    source_ref: Mapped[str | None] = mapped_column(String(80))
    date: Mapped[date | None] = mapped_column(Date)
    voucher_number: Mapped[str | None] = mapped_column(String(120))
    ledger_name: Mapped[str | None] = mapped_column(String(255), index=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255), index=True)
    narration: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Float, default=0)
    debit_credit: Mapped[str | None] = mapped_column(String(20))
    payment_mode: Mapped[str | None] = mapped_column(String(80))
    invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    gst_amount: Mapped[float | None] = mapped_column(Float)
    tds_amount: Mapped[float | None] = mapped_column(Float)


class Bill(Base, TimestampMixin):
    __tablename__ = "bills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"))
    source_ref: Mapped[str | None] = mapped_column(String(80))
    vendor_name: Mapped[str | None] = mapped_column(String(255), index=True)
    invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    invoice_date: Mapped[date | None] = mapped_column(Date)
    amount: Mapped[float | None] = mapped_column(Float)
    gstin: Mapped[str | None] = mapped_column(String(20))
    pan: Mapped[str | None] = mapped_column(String(20))
    extracted_text: Mapped[str | None] = mapped_column(Text)
    readable: Mapped[bool] = mapped_column(Boolean, default=True)


class BillMatch(Base, TimestampMixin):
    __tablename__ = "bill_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("expense_transactions.id"))
    bill_id: Mapped[int | None] = mapped_column(ForeignKey("bills.id"))
    status: Mapped[str] = mapped_column(String(80), default="CA Review Required")
    score: Mapped[float] = mapped_column(Float, default=0)
    reason: Mapped[str | None] = mapped_column(Text)


class TDSRecord(Base, TimestampMixin):
    __tablename__ = "tds_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"))
    vendor_or_pan: Mapped[str | None] = mapped_column(String(255), index=True)
    section: Mapped[str | None] = mapped_column(String(40))
    payment_amount: Mapped[float | None] = mapped_column(Float)
    tds_deducted: Mapped[float | None] = mapped_column(Float)
    tds_deposited: Mapped[float | None] = mapped_column(Float)
    challan_details: Mapped[str | None] = mapped_column(Text)


class GSTRecord(Base, TimestampMixin):
    __tablename__ = "gst_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"))
    gstin: Mapped[str | None] = mapped_column(String(20), index=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255))
    invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    invoice_date: Mapped[date | None] = mapped_column(Date)
    taxable_value: Mapped[float | None] = mapped_column(Float)
    gst_amount: Mapped[float | None] = mapped_column(Float)
    itc_status: Mapped[str | None] = mapped_column(String(120))


class BankTransaction(Base, TimestampMixin):
    __tablename__ = "bank_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"))
    date: Mapped[date | None] = mapped_column(Date)
    particulars: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[float | None] = mapped_column(Float)
    mode: Mapped[str | None] = mapped_column(String(80))
    reference_number: Mapped[str | None] = mapped_column(String(120))


class ExpenseClassification(Base, TimestampMixin):
    __tablename__ = "expense_classifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    transaction_id: Mapped[int] = mapped_column(ForeignKey("expense_transactions.id"), index=True)
    category: Mapped[str] = mapped_column(String(120))
    confidence: Mapped[float] = mapped_column(Float, default=0)
    basis: Mapped[str | None] = mapped_column(Text)


class VendorRisk(Base, TimestampMixin):
    __tablename__ = "vendor_risks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"))
    vendor_name: Mapped[str | None] = mapped_column(String(255))
    issue: Mapped[str] = mapped_column(String(255))
    severity: Mapped[str] = mapped_column(String(40))
    suggested_action: Mapped[str] = mapped_column(Text)


class StatutoryAlert(Base, TimestampMixin):
    __tablename__ = "statutory_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("expense_transactions.id"))
    alert_type: Mapped[str] = mapped_column(String(80))
    issue: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(40))
    suggested_review: Mapped[str] = mapped_column(Text)


class CapitalReview(Base, TimestampMixin):
    __tablename__ = "capital_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("expense_transactions.id"))
    amount: Mapped[float | None] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(Text)
    suggested_review_area: Mapped[str] = mapped_column(String(255))
    ca_review_required: Mapped[bool] = mapped_column(Boolean, default=True)


class BusinessPurposeRisk(Base, TimestampMixin):
    __tablename__ = "business_purpose_risks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("expense_transactions.id"))
    issue: Mapped[str] = mapped_column(Text)
    query_suggestion: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(40))


class DuplicateBillFlag(Base, TimestampMixin):
    __tablename__ = "duplicate_bill_flags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    bill_id: Mapped[int | None] = mapped_column(ForeignKey("bills.id"))
    issue: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(40))


class Form3CDImpact(Base, TimestampMixin):
    __tablename__ = "form3cd_impacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_type: Mapped[str] = mapped_column(String(80))
    source_id: Mapped[int | None] = mapped_column(Integer)
    clause_area: Mapped[str] = mapped_column(String(120))
    observation: Mapped[str] = mapped_column(Text)
    suggested_review: Mapped[str] = mapped_column(Text)


class RiskScore(Base, TimestampMixin):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("expense_transactions.id"))
    score: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[str] = mapped_column(String(40))
    reasons: Mapped[str] = mapped_column(Text)


class ClientQuery(Base, TimestampMixin):
    __tablename__ = "client_queries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    query_number: Mapped[str] = mapped_column(String(40))
    ledger: Mapped[str | None] = mapped_column(String(255))
    vendor: Mapped[str | None] = mapped_column(String(255))
    transaction_date: Mapped[date | None] = mapped_column(Date)
    amount: Mapped[float | None] = mapped_column(Float)
    issue_detected: Mapped[str] = mapped_column(Text)
    required_document: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(40), default="Medium")
    status: Mapped[str] = mapped_column(String(40), default="Open")
    suggested_wording: Mapped[str] = mapped_column(Text)


class WorkingPaper(Base, TimestampMixin):
    __tablename__ = "working_papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    file_path: Mapped[str | None] = mapped_column(String(500))


class AuditTrail(Base, TimestampMixin):
    __tablename__ = "audit_trails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), index=True)
    action: Mapped[str] = mapped_column(String(120))
    details: Mapped[str] = mapped_column(Text)
    actor: Mapped[str] = mapped_column(String(80), default="system")


class TrialBalanceLine(Base, TimestampMixin):
    __tablename__ = "trial_balance_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"))
    ledger_name: Mapped[str | None] = mapped_column(String(255))
    amount: Mapped[float | None] = mapped_column(Float)

