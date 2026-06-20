from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import Client, ExpenseTransaction
from app.models import tds_audit_models  # noqa: F401
from app.services.tds_audit_service import case_detail, cases, exceptions, run


def _db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    db.add(Client(id=1, name="TDS Test", financial_year="2025-26"))
    db.commit()
    return db


def test_tds_same_voucher_creates_four_layer_trail_and_form3cd_impact():
    db = _db()
    db.add_all([
        ExpenseTransaction(client_id=1, date=date(2025, 5, 1), voucher_number="V1", ledger_name="Professional Fees", vendor_name="Consultant", amount=-100000, gst_amount=18000),
        ExpenseTransaction(client_id=1, date=date(2025, 5, 1), voucher_number="V1", ledger_name="TDS Payable 194J", vendor_name="Consultant", amount=-5000, tds_amount=5000),
    ])
    db.commit()
    result = run(db, 1)
    assert result["status"] == "completed"
    detail = case_detail(db, 1, cases(db, 1)[0]["tds_case_id"])
    assert len(detail["layers"]) == 4
    titles = {item["exception_title"] for item in exceptions(db, 1)}
    assert "TDS appears short deducted" in titles
    assert "PAN not available for vendor" in titles
    assert "Possible Form 3CD Clause 34 reporting impact" in titles


def test_tds_separate_journal_and_missing_payment_are_detected():
    db = _db()
    db.add_all([
        ExpenseTransaction(client_id=1, date=date(2025, 6, 1), voucher_number="E1", ledger_name="Freight Charges", vendor_name="Carrier", amount=-50000),
        ExpenseTransaction(client_id=1, date=date(2025, 6, 8), voucher_number="J1", ledger_name="TDS on Contractor", vendor_name="Carrier", amount=-1000, tds_amount=1000),
    ])
    db.commit()
    run(db, 1)
    titles = {item["exception_title"] for item in exceptions(db, 1)}
    assert "TDS applicability identified but deduction not found" not in titles
    assert "TDS deducted but payment/challan not matched" in titles


def test_tds_no_source_data_is_graceful():
    db = _db()
    assert run(db, 1)["status"] == "no_data"
