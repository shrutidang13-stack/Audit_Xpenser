from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TDSAuditRun(Base):
    __tablename__ = "tds_audit_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(Integer, index=True)
    run_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    financial_year: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(40), default="completed")
    source_note: Mapped[str | None] = mapped_column(Text)
    total_entries_scanned: Mapped[int] = mapped_column(Integer, default=0)
    total_tds_cases: Mapped[int] = mapped_column(Integer, default=0)
    total_exceptions: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)


class TDSCase(Base):
    __tablename__ = "tds_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(Integer, index=True)
    run_id: Mapped[str] = mapped_column(String(80), index=True)
    tds_case_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255))
    vendor_pan: Mapped[str | None] = mapped_column(String(20))
    vendor_gstin: Mapped[str | None] = mapped_column(String(20))
    invoice_no: Mapped[str | None] = mapped_column(String(120))
    invoice_date: Mapped[date | None] = mapped_column(Date)
    voucher_no: Mapped[str | None] = mapped_column(String(120))
    voucher_date: Mapped[date | None] = mapped_column(Date)
    expense_ledger: Mapped[str | None] = mapped_column(String(255))
    expense_nature: Mapped[str | None] = mapped_column(String(160))
    gross_amount: Mapped[float] = mapped_column(Float, default=0)
    gst_amount: Mapped[float] = mapped_column(Float, default=0)
    tds_base_amount: Mapped[float] = mapped_column(Float, default=0)
    expected_tds_section: Mapped[str | None] = mapped_column(String(20))
    expected_tds_rate: Mapped[float] = mapped_column(Float, default=0)
    expected_tds_amount: Mapped[float] = mapped_column(Float, default=0)
    actual_tds_section: Mapped[str | None] = mapped_column(String(20))
    actual_tds_amount: Mapped[float] = mapped_column(Float, default=0)
    tds_deduction_date: Mapped[date | None] = mapped_column(Date)
    tds_payment_date: Mapped[date | None] = mapped_column(Date)
    challan_no: Mapped[str | None] = mapped_column(String(120))
    challan_amount: Mapped[float] = mapped_column(Float, default=0)
    return_form_type: Mapped[str | None] = mapped_column(String(20))
    return_quarter: Mapped[str | None] = mapped_column(String(20))
    form_3cd_clause: Mapped[str | None] = mapped_column(String(80))
    disallowance_section: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(80), default="CA Review Required")
    risk_level: Mapped[str] = mapped_column(String(40), default="Medium")
    ca_review_required: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TDSLayerResult(Base):
    __tablename__ = "tds_layer_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tds_case_id: Mapped[str] = mapped_column(String(80), index=True)
    layer_name: Mapped[str] = mapped_column(String(80), index=True)
    layer_status: Mapped[str] = mapped_column(String(40))
    expected_value_json: Mapped[str | None] = mapped_column(Text)
    actual_value_json: Mapped[str | None] = mapped_column(Text)
    remarks: Mapped[str | None] = mapped_column(Text)
    evidence_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TDSException(Base):
    __tablename__ = "tds_exceptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(Integer, index=True)
    run_id: Mapped[str] = mapped_column(String(80), index=True)
    tds_case_id: Mapped[str] = mapped_column(String(80), index=True)
    exception_type: Mapped[str] = mapped_column(String(120), index=True)
    exception_title: Mapped[str] = mapped_column(String(255))
    exception_description: Mapped[str] = mapped_column(Text)
    amount_impact: Mapped[float] = mapped_column(Float, default=0)
    possible_form_3cd_impact: Mapped[bool] = mapped_column(Boolean, default=False)
    possible_40aia_impact: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_level: Mapped[str] = mapped_column(String(40), default="Medium")
    ca_review_required: Mapped[bool] = mapped_column(Boolean, default=True)
    suggested_query: Mapped[str | None] = mapped_column(Text)
    suggested_working_paper_note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="Open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
