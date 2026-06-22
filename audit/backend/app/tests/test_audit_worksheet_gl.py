from types import SimpleNamespace

from app.services.audit_worksheet_service import (
    _add_depreciation_row,
    _add_msme_interest_row,
    generate_msme_interest_worksheet,
)
from app.services.expense_audit_service import _structured_gl_amount


def test_structured_data_debit_is_the_primary_gl_amount():
    row = SimpleNamespace(ledger_name="Factory Rent", debit_amount=440000, net_amount=440000, amount=440000)

    assert _structured_gl_amount(row, {"factory rent": 0}) == 440000


def test_raw_gl_mapping_is_only_a_fallback_when_structured_debit_is_empty():
    row = SimpleNamespace(ledger_name="Factory Rent", debit_amount=0, net_amount=440000, amount=440000)

    assert _structured_gl_amount(row, {"factory rent": 440000}) == 440000


def test_depreciation_is_not_injected_without_a_calculated_schedule():
    assert _add_depreciation_row([], None) == []


def test_calculated_depreciation_is_added_with_its_actual_amount():
    rows = _add_depreciation_row([], 274126.66)

    assert rows[0]["amount_as_per_audit"] == 274126.66
    assert rows[0]["difference_amount"] == 274126.66


def test_msme_interest_is_added_with_zero_gl_and_complete_working():
    source = {
        "status": "available",
        "interest": {
            "working": [
                {
                    "financialYear": "2025-26",
                    "vendorName": "MSME Supplier",
                    "invoiceNumber": "INV-1",
                    "delayedAmount": 100000,
                    "daysDelayed": 45,
                    "rbiBankRate": 5.75,
                    "bankRatePeriods": "2025-04-01 to 2025-09-30: 5.75%",
                    "interestPayable": 2126.71,
                }
            ]
        },
    }

    row = _add_msme_interest_row([], source)[0]
    detail = generate_msme_interest_worksheet(row)

    assert row["ledger_name"] == "MSME Interest"
    assert row["amount_as_per_audit"] == 2126.71
    assert row["amount_as_per_gl"] == 0
    assert row["difference_amount"] == 2126.71
    assert detail["rows"][0]["Invoice Number"] == "INV-1"
    assert detail["rows"][0]["Interest Payable"] == 2126.71


def test_msme_interest_is_not_added_when_connector_is_unavailable():
    assert _add_msme_interest_row([], {"status": "offline", "interest": {}}) == []
