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
    form3cd_generated_at: Mapped[datetime | None] = mapped_column(DateTime)
    files = relationship("UploadedFile", back_populates="client")
    audit_runs = relationship("AuditRun", back_populates="client")


class UploadedFile(Base, TimestampMixin):
    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    filename: Mapped[str] = mapped_column(String(255))
    stored_path: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(20))
    upload_session_id: Mapped[str | None] = mapped_column(String(80), index=True)
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


class ProcessingExpense(Base, TimestampMixin):
    __tablename__ = "processing_expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"), index=True)
    schedule_order: Mapped[int] = mapped_column(Integer, default=0, index=True)
    sub_category: Mapped[str | None] = mapped_column(String(160), index=True)
    ledger_name: Mapped[str] = mapped_column(String(255), index=True)
    expense_type: Mapped[str] = mapped_column(String(80), index=True)
    amount: Mapped[float] = mapped_column(Float, default=0)
    debit_amount: Mapped[float] = mapped_column(Float, default=0)
    net_amount: Mapped[float] = mapped_column(Float, default=0)
    percentage_of_total: Mapped[float] = mapped_column(Float, default=0)
    source: Mapped[str] = mapped_column(String(120), default="Uploaded Data")
    validation_status: Mapped[str] = mapped_column(String(80), default="Ready for audit")
    validation_remarks: Mapped[str | None] = mapped_column(Text)


class ExpenseAuditResult(Base, TimestampMixin):
    __tablename__ = "expense_audit_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    ledger_name: Mapped[str] = mapped_column(String(255), index=True)
    expense_type: Mapped[str] = mapped_column(String(80), index=True)
    amount_as_per_audit: Mapped[float] = mapped_column(Float, default=0)
    amount_as_per_gl: Mapped[float | None] = mapped_column(Float)
    difference_amount: Mapped[float] = mapped_column(Float, default=0)
    tds_review: Mapped[str] = mapped_column(Text)
    gst_review: Mapped[str] = mapped_column(Text)
    payment_40a3_review: Mapped[str] = mapped_column(Text)
    gl_recording_check: Mapped[str] = mapped_column(Text)
    finding: Mapped[str] = mapped_column(Text)
    risk_level: Mapped[str] = mapped_column(String(40), default="Low")
    ca_review_status: Mapped[str] = mapped_column(String(40), default="Pending")
    ca_remarks: Mapped[str | None] = mapped_column(Text)
    statutory_reference_status: Mapped[str] = mapped_column(String(120))
    statutory_reference_note: Mapped[str | None] = mapped_column(Text)


class ReferenceDocument(Base, TimestampMixin):
    __tablename__ = "reference_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(120), index=True)
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(20), index=True)
    effective_date: Mapped[date | None] = mapped_column(Date, index=True)
    version_label: Mapped[str | None] = mapped_column(String(120))
    source_type: Mapped[str | None] = mapped_column(String(120))
    uploaded_by: Mapped[str] = mapped_column(String(80), default="system")
    parsing_status: Mapped[str] = mapped_column(String(80), default="Pending")
    indexed_status: Mapped[str] = mapped_column(String(80), default="Pending")
    notes: Mapped[str | None] = mapped_column(Text)
    chunks = relationship("ReferenceDocumentChunk", back_populates="document", cascade="all, delete-orphan")


class ReferenceDocumentChunk(Base, TimestampMixin):
    __tablename__ = "reference_document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reference_document_id: Mapped[int] = mapped_column(ForeignKey("reference_documents.id"), index=True)
    page_number: Mapped[int | None] = mapped_column(Integer, index=True)
    section_number: Mapped[str | None] = mapped_column(String(80), index=True)
    rule_number: Mapped[str | None] = mapped_column(String(80), index=True)
    heading: Mapped[str | None] = mapped_column(String(500))
    content_text: Mapped[str] = mapped_column(Text)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    document = relationship("ReferenceDocument", back_populates="chunks")


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
    extracted_vendor_name: Mapped[str | None] = mapped_column(String(255), index=True)
    extracted_vendor_gstin: Mapped[str | None] = mapped_column(String(20), index=True)
    extracted_invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    extracted_invoice_date: Mapped[date | None] = mapped_column(Date)
    extracted_taxable_value: Mapped[float | None] = mapped_column(Float)
    extracted_cgst: Mapped[float | None] = mapped_column(Float)
    extracted_sgst: Mapped[float | None] = mapped_column(Float)
    extracted_igst: Mapped[float | None] = mapped_column(Float)
    extracted_total_gst: Mapped[float | None] = mapped_column(Float)
    extracted_total_amount: Mapped[float | None] = mapped_column(Float)
    extraction_confidence: Mapped[float] = mapped_column(Float, default=0)
    extraction_status: Mapped[str] = mapped_column(String(80), default="Pending")
    ocr_review_required: Mapped[bool] = mapped_column(Boolean, default=False)


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
    duplicate_group_key: Mapped[str | None] = mapped_column(String(255), index=True)
    duplicate_reason: Mapped[str | None] = mapped_column(Text)
    duplicate_score: Mapped[float] = mapped_column(Float, default=0)


class BillMatchingRun(Base, TimestampMixin):
    __tablename__ = "bill_matching_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="completed")
    total_bills: Mapped[int] = mapped_column(Integer, default=0)
    total_book_entries: Mapped[int] = mapped_column(Integer, default=0)
    matched_count: Mapped[int] = mapped_column(Integer, default=0)
    probable_match_count: Mapped[int] = mapped_column(Integer, default=0)
    only_bill_count: Mapped[int] = mapped_column(Integer, default=0)
    only_books_count: Mapped[int] = mapped_column(Integer, default=0)
    mismatch_count: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0)
    high_risk_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    results = relationship("BillMatchingResult", back_populates="run", cascade="all, delete-orphan")


class BillMatchingResult(Base, TimestampMixin):
    __tablename__ = "bill_matching_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("bill_matching_runs.id"), index=True)
    bill_id: Mapped[int | None] = mapped_column(ForeignKey("bills.id"), index=True)
    expense_transaction_id: Mapped[int | None] = mapped_column(ForeignKey("expense_transactions.id"), index=True)
    gst_record_id: Mapped[int | None] = mapped_column(ForeignKey("gst_records.id"), index=True)
    fixed_asset_id: Mapped[int | None] = mapped_column(ForeignKey("fixed_assets.id"), index=True)
    match_status: Mapped[str] = mapped_column(String(60), index=True)
    match_score: Mapped[float] = mapped_column(Float, default=0)
    risk_level: Mapped[str] = mapped_column(String(40), default="Low", index=True)
    bill_file_name: Mapped[str | None] = mapped_column(String(255))
    bill_vendor_name: Mapped[str | None] = mapped_column(String(255))
    book_vendor_name: Mapped[str | None] = mapped_column(String(255))
    bill_gstin: Mapped[str | None] = mapped_column(String(20))
    book_gstin: Mapped[str | None] = mapped_column(String(20))
    bill_invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    book_invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    bill_invoice_date: Mapped[date | None] = mapped_column(Date)
    book_invoice_date: Mapped[date | None] = mapped_column(Date)
    bill_taxable_value: Mapped[float | None] = mapped_column(Float)
    book_taxable_value: Mapped[float | None] = mapped_column(Float)
    bill_gst_amount: Mapped[float | None] = mapped_column(Float)
    book_gst_amount: Mapped[float | None] = mapped_column(Float)
    bill_total_amount: Mapped[float | None] = mapped_column(Float)
    book_total_amount: Mapped[float | None] = mapped_column(Float)
    matched_ledger: Mapped[str | None] = mapped_column(String(255))
    gl_date: Mapped[date | None] = mapped_column(Date)
    gl_voucher_number: Mapped[str | None] = mapped_column(String(120))
    purchase_register_invoice_number: Mapped[str | None] = mapped_column(String(120))
    purchase_register_amount: Mapped[float | None] = mapped_column(Float)
    amount_difference: Mapped[float] = mapped_column(Float, default=0)
    gst_difference: Mapped[float] = mapped_column(Float, default=0)
    mismatch_reason: Mapped[str | None] = mapped_column(Text)
    suggested_action: Mapped[str | None] = mapped_column(Text)
    ca_review_status: Mapped[str] = mapped_column(String(40), default="Pending")
    run = relationship("BillMatchingRun", back_populates="results")


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
    exception_id: Mapped[int | None] = mapped_column(ForeignKey("audit_exceptions.id"), index=True)
    query_number: Mapped[str] = mapped_column(String(40))
    category: Mapped[str | None] = mapped_column(String(120))
    ledger: Mapped[str | None] = mapped_column(String(255))
    vendor: Mapped[str | None] = mapped_column(String(255))
    transaction_date: Mapped[date | None] = mapped_column(Date)
    amount: Mapped[float | None] = mapped_column(Float)
    issue_detected: Mapped[str] = mapped_column(Text)
    required_document: Mapped[str] = mapped_column(Text)
    documents_required: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(40), default="Medium")
    status: Mapped[str] = mapped_column(String(40), default="Open")
    suggested_wording: Mapped[str] = mapped_column(Text)
    client_response: Mapped[str | None] = mapped_column(Text)
    ca_note: Mapped[str | None] = mapped_column(Text)


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
    debit_amount: Mapped[float | None] = mapped_column(Float)
    credit_amount: Mapped[float | None] = mapped_column(Float)
    amount: Mapped[float | None] = mapped_column(Float)


class AuditRun(Base, TimestampMixin):
    __tablename__ = "audit_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    run_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_label: Mapped[str] = mapped_column(String(40), default="Low")
    total_vouchers: Mapped[int] = mapped_column(Integer, default=0)
    total_exceptions: Mapped[int] = mapped_column(Integer, default=0)
    indicative_amount: Mapped[float] = mapped_column(Float, default=0)
    client = relationship("Client", back_populates="audit_runs")
    exceptions = relationship("AuditException", back_populates="audit_run")


class AuditException(Base, TimestampMixin):
    __tablename__ = "audit_exceptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    audit_run_id: Mapped[int | None] = mapped_column(ForeignKey("audit_runs.id"), index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("expense_transactions.id"), index=True)
    voucher_date: Mapped[date | None] = mapped_column(Date)
    voucher_type: Mapped[str | None] = mapped_column(String(120))
    voucher_number: Mapped[str | None] = mapped_column(String(120), index=True)
    party_name: Mapped[str | None] = mapped_column(String(255), index=True)
    ledger_name: Mapped[str | None] = mapped_column(String(255), index=True)
    amount: Mapped[float | None] = mapped_column(Float)
    exception_type: Mapped[str] = mapped_column(String(120), index=True)
    exception_description: Mapped[str] = mapped_column(Text)
    risk_level: Mapped[str] = mapped_column(String(40), default="Medium", index=True)
    form_3cd_clause: Mapped[str | None] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(40), default="Pending", index=True)
    ca_remarks: Mapped[str | None] = mapped_column(Text)
    audit_run = relationship("AuditRun", back_populates="exceptions")


class FixedAssetClass(Base, TimestampMixin):
    __tablename__ = "fixed_asset_classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    schedule_ii_category: Mapped[str | None] = mapped_column(String(255))
    default_useful_life_years: Mapped[float] = mapped_column(Float, default=10)
    default_residual_percent: Mapped[float] = mapped_column(Float, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class FixedAsset(Base, TimestampMixin):
    __tablename__ = "fixed_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    asset_code: Mapped[str | None] = mapped_column(String(120), index=True)
    asset_description: Mapped[str | None] = mapped_column(String(500))
    asset_class_id: Mapped[int | None] = mapped_column(ForeignKey("fixed_asset_classes.id"), index=True)
    location: Mapped[str | None] = mapped_column(String(255))
    vendor_name: Mapped[str | None] = mapped_column(String(255), index=True)
    vendor_gstin: Mapped[str | None] = mapped_column(String(20), index=True)
    invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    invoice_date: Mapped[date | None] = mapped_column(Date)
    purchase_date: Mapped[date | None] = mapped_column(Date)
    put_to_use_date: Mapped[date | None] = mapped_column(Date)
    original_cost: Mapped[float] = mapped_column(Float, default=0)
    opening_gross_block: Mapped[float] = mapped_column(Float, default=0)
    opening_accumulated_depreciation: Mapped[float] = mapped_column(Float, default=0)
    opening_wdv: Mapped[float] = mapped_column(Float, default=0)
    residual_value: Mapped[float] = mapped_column(Float, default=0)
    residual_percent: Mapped[float] = mapped_column(Float, default=5)
    useful_life_schedule_ii: Mapped[float] = mapped_column(Float, default=10)
    useful_life_used: Mapped[float] = mapped_column(Float, default=10)
    depreciation_method: Mapped[str] = mapped_column(String(20), default="SLM")
    component_accounting_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    different_useful_life_reason: Mapped[str | None] = mapped_column(Text)
    source_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"), index=True)
    asset_class = relationship("FixedAssetClass")


class FixedAssetMovement(Base, TimestampMixin):
    __tablename__ = "fixed_asset_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    fixed_asset_id: Mapped[int | None] = mapped_column(ForeignKey("fixed_assets.id"), index=True)
    movement_type: Mapped[str] = mapped_column(String(40), index=True)
    movement_date: Mapped[date | None] = mapped_column(Date)
    amount: Mapped[float] = mapped_column(Float, default=0)
    invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255))
    remarks: Mapped[str | None] = mapped_column(Text)


class FixedAssetRun(Base, TimestampMixin):
    __tablename__ = "fixed_asset_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    financial_year: Mapped[str] = mapped_column(String(20), default="2025-26", index=True)
    status: Mapped[str] = mapped_column(String(40), default="completed")
    total_assets: Mapped[int] = mapped_column(Integer, default=0)
    total_additions: Mapped[float] = mapped_column(Float, default=0)
    total_disposals: Mapped[float] = mapped_column(Float, default=0)
    total_depreciation: Mapped[float] = mapped_column(Float, default=0)
    total_closing_wdv: Mapped[float] = mapped_column(Float, default=0)
    review_alerts_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)


class FixedAssetDepreciation(Base, TimestampMixin):
    __tablename__ = "fixed_asset_depreciations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    fixed_asset_id: Mapped[int] = mapped_column(ForeignKey("fixed_assets.id"), index=True)
    financial_year: Mapped[str] = mapped_column(String(20), index=True)
    opening_gross_block: Mapped[float] = mapped_column(Float, default=0)
    additions: Mapped[float] = mapped_column(Float, default=0)
    disposals: Mapped[float] = mapped_column(Float, default=0)
    closing_gross_block: Mapped[float] = mapped_column(Float, default=0)
    opening_accumulated_depreciation: Mapped[float] = mapped_column(Float, default=0)
    depreciation_for_year: Mapped[float] = mapped_column(Float, default=0)
    accumulated_depreciation_on_disposal: Mapped[float] = mapped_column(Float, default=0)
    closing_accumulated_depreciation: Mapped[float] = mapped_column(Float, default=0)
    opening_wdv: Mapped[float] = mapped_column(Float, default=0)
    closing_wdv: Mapped[float] = mapped_column(Float, default=0)
    profit_loss_on_disposal: Mapped[float] = mapped_column(Float, default=0)
    calculation_method: Mapped[str] = mapped_column(String(20), default="SLM")
    calculation_notes: Mapped[str | None] = mapped_column(Text)
    review_flag: Mapped[str | None] = mapped_column(String(120))


class FixedAssetReviewAlert(Base, TimestampMixin):
    __tablename__ = "fixed_asset_review_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    fixed_asset_id: Mapped[int | None] = mapped_column(ForeignKey("fixed_assets.id"), index=True)
    alert_type: Mapped[str] = mapped_column(String(120), index=True)
    severity: Mapped[str] = mapped_column(String(40), default="Medium", index=True)
    message: Mapped[str] = mapped_column(Text)
    suggested_action: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="Open", index=True)


class GSTRecoRun(Base, TimestampMixin):
    __tablename__ = "gst_reco_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    gstr_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"), index=True)
    books_file_id: Mapped[int | None] = mapped_column(ForeignKey("uploaded_files.id"), index=True)
    run_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    total_gstr_invoices: Mapped[int] = mapped_column(Integer, default=0)
    total_books_invoices: Mapped[int] = mapped_column(Integer, default=0)
    matched_count: Mapped[int] = mapped_column(Integer, default=0)
    only_in_gstr_count: Mapped[int] = mapped_column(Integer, default=0)
    only_in_books_count: Mapped[int] = mapped_column(Integer, default=0)
    amount_mismatch_count: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_invoices_count: Mapped[int] = mapped_column(Integer, default=0)
    itc_as_per_gstr: Mapped[float] = mapped_column(Float, default=0)
    itc_as_per_books: Mapped[float] = mapped_column(Float, default=0)
    net_itc_difference: Mapped[float] = mapped_column(Float, default=0)
    amount_tolerance: Mapped[float] = mapped_column(Float, default=2)
    date_tolerance_days: Mapped[int] = mapped_column(Integer, default=7)
    results = relationship("GSTRecoResult", back_populates="run", cascade="all, delete-orphan")


class GSTRecoResult(Base, TimestampMixin):
    __tablename__ = "gst_reco_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("gst_reco_runs.id"), index=True)
    gstr_source_ref: Mapped[str | None] = mapped_column(String(120))
    books_source_ref: Mapped[str | None] = mapped_column(String(120))
    vendor_name: Mapped[str | None] = mapped_column(String(255), index=True)
    gstin: Mapped[str | None] = mapped_column(String(20), index=True)
    invoice_number: Mapped[str | None] = mapped_column(String(120), index=True)
    gstr_invoice_date: Mapped[date | None] = mapped_column(Date)
    books_invoice_date: Mapped[date | None] = mapped_column(Date)
    gstr_taxable_value: Mapped[float | None] = mapped_column(Float)
    books_taxable_value: Mapped[float | None] = mapped_column(Float)
    gstr_tax_amount: Mapped[float | None] = mapped_column(Float)
    books_tax_amount: Mapped[float | None] = mapped_column(Float)
    difference_amount: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(60), index=True)
    risk_level: Mapped[str] = mapped_column(String(40), default="Low", index=True)
    suggested_action: Mapped[str] = mapped_column(Text)
    run = relationship("GSTRecoRun", back_populates="results")
