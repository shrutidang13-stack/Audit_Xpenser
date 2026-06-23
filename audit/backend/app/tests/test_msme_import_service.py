from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from types import SimpleNamespace

from app.core.database import Base
from app.models import Client, ExpenseTransaction, UploadedFile
from app.services import msme_import_service


def test_msme_import_is_stored_and_audited_without_replacing_existing_upload(monkeypatch, tmp_path):
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    client = Client(name="Test Client")
    db.add(client)
    db.commit()
    db.refresh(client)
    existing = UploadedFile(
        client_id=client.id,
        category="gst-data",
        filename="existing.csv",
        stored_path=str(tmp_path / "existing.csv"),
        file_type=".csv",
    )
    db.add(existing)
    db.commit()

    monkeypatch.setattr(msme_import_service, "get_msme_dashboard_data", lambda: {
        "status": "available",
        "report_id": "report-7",
        "import_run_id": "run-3",
        "voucher_evidence": [{
            "vendorName": "Small Supplier",
            "invoiceNumber": "INV-9",
            "invoiceDate": "2025-04-10",
            "principalAmount": 12500,
            "daysDelayed": 12,
            "interestAmount": 135,
        }],
    })
    monkeypatch.setattr("app.services.upload_service.get_settings", lambda: SimpleNamespace(upload_dir=str(tmp_path)))

    result = msme_import_service.import_latest_msme_report_and_run_audit(db, client.id)

    assert result["rows_imported"] == 1
    assert result["report_id"] == "report-7"
    assert result["audit"]["transactions_reviewed"] == 1
    assert db.query(UploadedFile).filter_by(id=existing.id).one().filename == "existing.csv"
    imported = db.query(UploadedFile).filter_by(category="msme-report").one()
    transaction = db.query(ExpenseTransaction).filter_by(source_file_id=imported.id).one()
    assert transaction.vendor_name == "Small Supplier"
    assert transaction.amount == 12500


def test_msme_import_rejects_unavailable_connector(monkeypatch):
    monkeypatch.setattr(msme_import_service, "get_msme_dashboard_data", lambda: {
        "status": "offline",
        "message": "MSME Guard is not connected.",
    })

    try:
        msme_import_service.import_latest_msme_report_and_run_audit(None, 1)
        assert False, "Expected unavailable MSME connector to be rejected"
    except ValueError as exc:
        assert str(exc) == "MSME Guard is not connected."


def test_tally_xml_import_is_stored_without_running_audit(monkeypatch, tmp_path):
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    client = Client(name="Test Client")
    db.add(client)
    db.commit()
    db.refresh(client)
    xml = b"""<?xml version="1.0"?><ENVELOPE><BODY><DATA><TALLYMESSAGE><VOUCHER><DATE>20250410</DATE><VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME><VOUCHERNUMBER>7</VOUCHERNUMBER><PARTYLEDGERNAME>Supplier A</PARTYLEDGERNAME><ALLLEDGERENTRIES.LIST><LEDGERNAME>Supplier A</LEDGERNAME><AMOUNT>-12500</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE></DATA></BODY></ENVELOPE>"""
    fixture = tmp_path / "Tally XML.xml"
    fixture.write_bytes(xml)
    monkeypatch.setattr(msme_import_service, "DEMO_TALLY_XML_PATH", fixture)
    monkeypatch.setattr("app.services.upload_service.get_settings", lambda: SimpleNamespace(upload_dir=str(tmp_path)))

    result = msme_import_service.import_latest_tally_xml(db, client.id)

    assert result["vouchers_imported"] == 1
    assert "audit" not in result
    imported = db.query(UploadedFile).filter_by(category="expense-ledger").one()
    assert imported.filename == "Tally XML.xml"
    assert imported.file_type == ".xml"
    assert imported.records_extracted == 1
