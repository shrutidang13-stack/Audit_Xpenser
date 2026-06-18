from app.services.processing_service import structured_schedule_for_regression


EXPECTED_DIRECT_LEDGERS = {
    "Factory Rent",
    "Freight Charges",
    "Transportation Exp",
    "Job Work",
    "Job Work for Vehicle",
    "SAUMYA (JOB WORK)",
}

EXPECTED_INDIRECT_LEDGERS = {
    "Accounting Charges",
    "Audit Fee",
    "Bank Charges",
    "Business Promotion",
    "Commision",
    "Courier Exp",
    "Electricity Exp",
    "Expenses Written Off",
    "Finance Charges",
    "Fuel Exp",
    "INTEREST PAID ON TDS",
    "Internet Exp",
    "Interest Paid on Gst",
    "Legal Exp",
    "Misc Exp",
    "Office Exp",
    "Office Rent",
    "Penalty",
    "Printing & Stationery",
    "Repair & Maintenance",
    "Roc Expenses",
    "Salary",
    "Software Renewal",
    "Staff Convence",
    "Staff Welfare",
    "Stock Insurance Charges",
    "Technical Fee",
    "Telephone Exp",
    "Travelling Expenses",
    "WARRANTY EXPENSE",
}


def test_structured_processing_schedule_matches_reference_workbook():
    schedule = structured_schedule_for_regression()

    assert round(schedule["total_direct_expenses"], 2) == 4299576.00
    assert round(schedule["total_indirect_expenses"], 2) == 11191783.75
    assert round(schedule["total_expenses"], 2) == 15491359.75
    assert schedule["total_ca_review_required"] == 0
    assert schedule["ca_review_required"] == []

    direct_ledgers = {row["ledger_name"] for row in schedule["direct_expenses"]}
    indirect_ledgers = {row["ledger_name"] for row in schedule["indirect_expenses"]}
    assert direct_ledgers == EXPECTED_DIRECT_LEDGERS
    assert indirect_ledgers == EXPECTED_INDIRECT_LEDGERS
    assert len(schedule["direct_expenses"]) == 6
    assert len(schedule["indirect_expenses"]) == 30


if __name__ == "__main__":
    test_structured_processing_schedule_matches_reference_workbook()
