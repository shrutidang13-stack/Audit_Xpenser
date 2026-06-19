from copy import deepcopy

from app.models import ColumnMapping, TDSRecord, UploadedFile
from app.services.utils import clean_text, from_json, parse_amount


def get_form3cd_report(client, db=None) -> dict:
    tds_detail = _tds_detail_with_uploads(db, client.id) if db is not None else deepcopy(TDS_DETAIL)
    return {
        "title": f"FORM 3CD - EXPENSE RELATED CLAUSE DISCLOSURES | {client.name} | AY 2026-27",
        "meta": {
            "pan": client.pan,
            "gstin": client.gstin,
            "financial_year": client.financial_year,
            "audit": "Audit u/s 44AB",
            "generated": "17-Jun-2026",
            "assessment_year": "2026-27",
        },
        "disclosures": FORM3CD_DISCLOSURES,
        "risk_summary": RISK_SUMMARY,
        "tds_detail": tds_detail,
        "gst_expenditure": GST_EXPENDITURE,
        "notes": [
            "All amounts are indicative. Actual disallowance depends on CA verification of TDS compliance, payment mode, nature of expense and timing. CA professional judgement required.",
            "Clause 44 is mandatory for AY 2026-27. Verify GST amounts from GSTR-3B/2B. Salary, statutory dues, penalties = unregistered/exempt category.",
        ],
    }


def _tds_detail_with_uploads(db, client_id: int) -> list[dict]:
    rows = deepcopy(TDS_DETAIL)
    records = db.query(TDSRecord).filter(TDSRecord.client_id == client_id).all()
    if not records:
        records = _tds_records_from_uploaded_files(db, client_id)
    if not records:
        return rows

    candidate_indexes = [idx for idx, row in enumerate(rows) if row.get("nature_of_payment") != "TOTAL"]
    used_records = set()
    matched_indexes = set()
    for record_index, record in enumerate(records):
        idx = _best_tds_row_index(record, rows, candidate_indexes, matched_indexes)
        if idx is None:
            continue
        _apply_tds_record(rows[idx], record)
        used_records.add(record_index)
        matched_indexes.add(idx)

    unmatched_by_section: dict[str, dict[str, float]] = {}
    for record_index, record in enumerate(records):
        if record_index in used_records:
            continue
        section = _normal_section(record.section)
        if not section:
            continue
        bucket = unmatched_by_section.setdefault(section, {"payment_amount": 0, "tds_deducted": 0, "tds_deposited": 0})
        bucket["payment_amount"] += float(record.payment_amount or 0)
        bucket["tds_deducted"] += float(record.tds_deducted or 0)
        bucket["tds_deposited"] += float(record.tds_deposited or 0)

    for section, totals in unmatched_by_section.items():
        target = next((row for row in rows if _normal_section(row.get("section")) == section and row.get("nature_of_payment") != "TOTAL"), None)
        if target:
            target["tds_deducted"] = float(target.get("tds_deducted") or 0) + totals["tds_deducted"]
            target["deposit_status"] = _deposit_status(target["tds_deducted"], totals["tds_deposited"])
            target["reason_note"] = f"{target.get('reason_note') or ''} Uploaded TDS records for section {target.get('section')} aggregated where exact ledger match was not available.".strip()

    _recompute_tds_rows(rows)
    return rows


def _best_tds_row_index(record: TDSRecord, rows: list[dict], candidate_indexes: list[int], matched_indexes: set[int]) -> int | None:
    section = _normal_section(record.section)
    if not section:
        return None
    payment = float(record.payment_amount or 0)
    name = (record.vendor_or_pan or "").casefold()
    best = None
    best_score = -1
    for idx in candidate_indexes:
        if idx in matched_indexes:
            continue
        row = rows[idx]
        if _normal_section(row.get("section")) != section:
            continue
        score = 10
        row_amount = float(row.get("amount_paid") or 0)
        if payment and row_amount:
            ratio = abs(payment - row_amount) / max(payment, row_amount)
            if ratio <= 0.02:
                score += 90
            elif ratio <= 0.10:
                score += 60
            elif ratio <= 0.25:
                score += 25
            else:
                score -= 20
        haystack = f"{row.get('nature_of_payment') or ''} {row.get('reason_note') or ''}".casefold()
        if name and any(part for part in name.replace("/", " ").split() if len(part) >= 4 and part in haystack):
            score += 35
        if score > best_score:
            best = idx
            best_score = score
    return best if best_score >= 0 else None


def _apply_tds_record(row: dict, record: TDSRecord) -> None:
    if record.payment_amount:
        row["amount_paid"] = float(record.payment_amount)
    row["tds_deducted"] = float(row.get("tds_deducted") or 0) + float(record.tds_deducted or 0)
    row["deposit_status"] = _deposit_status(row["tds_deducted"], float(record.tds_deposited or 0))
    if record.challan_details:
        row["reason_note"] = f"{row.get('reason_note') or ''} Uploaded challan: {record.challan_details}.".strip()


def _recompute_tds_rows(rows: list[dict]) -> None:
    total = next((row for row in rows if row.get("nature_of_payment") == "TOTAL"), None)
    for row in rows:
        if row.get("nature_of_payment") == "TOTAL":
            continue
        expected = row.get("tds_as_per_act")
        deducted = row.get("tds_deducted")
        if expected is None:
            row["difference"] = None
            row["default_amount"] = None
            continue
        row["difference"] = max(float(expected or 0) - float(deducted or 0), 0)
        row["default_amount"] = row["difference"]
        if row["difference"] == 0 and float(expected or 0) > 0:
            row["deposit_status"] = "Uploaded TDS matched"
    if total:
        numeric_fields = ["amount_paid", "tds_as_per_act", "tds_deducted", "difference", "default_amount"]
        for field in numeric_fields:
            values = [row.get(field) for row in rows if row is not total and row.get(field) is not None]
            total[field] = sum(float(value or 0) for value in values)


def _deposit_status(tds_deducted: float, tds_deposited: float) -> str:
    if tds_deducted and tds_deposited >= tds_deducted:
        return "Uploaded - Deposited"
    if tds_deducted:
        return "Uploaded - Deposit verify"
    return "CA Verify"


def _normal_section(value) -> str:
    return "".join(ch for ch in str(value or "").upper() if ch.isalnum())


def _tds_records_from_uploaded_files(db, client_id: int) -> list:
    records = []
    files = db.query(UploadedFile).filter(UploadedFile.client_id == client_id, UploadedFile.category == "tds-data").all()
    for uploaded in files:
        mapping = {
            item.target_field: item.source_column
            for item in db.query(ColumnMapping).filter(ColumnMapping.file_id == uploaded.id).all()
            if item.target_field
        }
        for row in from_json(uploaded.preview_json, []):
            records.append(_UploadedTDSRecord(
                vendor_or_pan=clean_text(_field(row, mapping, "vendor_or_pan")),
                section=clean_text(_field(row, mapping, "section")),
                payment_amount=parse_amount(_field(row, mapping, "payment_amount")),
                tds_deducted=parse_amount(_field(row, mapping, "tds_deducted")),
                tds_deposited=parse_amount(_field(row, mapping, "tds_deposited")),
                challan_details=clean_text(_field(row, mapping, "challan_details")),
            ))
    return records


class _UploadedTDSRecord:
    def __init__(self, vendor_or_pan="", section="", payment_amount=None, tds_deducted=None, tds_deposited=None, challan_details=""):
        self.vendor_or_pan = vendor_or_pan
        self.section = section
        self.payment_amount = payment_amount
        self.tds_deducted = tds_deducted
        self.tds_deposited = tds_deposited
        self.challan_details = challan_details


TDS_FIELD_ALIASES = {
    "vendor_or_pan": ["Vendor/PAN", "Vendor", "Party", "PAN", "Deductee"],
    "section": ["Section", "TDS Section"],
    "payment_amount": ["Payment Amount", "Amount Paid", "Gross", "Amount"],
    "tds_deducted": ["TDS Deducted", "Deducted", "TDS"],
    "tds_deposited": ["TDS Deposited", "Deposited"],
    "challan_details": ["Challan Details", "Challan", "BSR", "CIN"],
}


def _field(row: dict, mapping: dict, field: str):
    source = mapping.get(field, field)
    for key in [source, field, *TDS_FIELD_ALIASES.get(field, [])]:
        if key in row:
            return row.get(key, "")
    normalised = {_normal_key(key): value for key, value in row.items()}
    for key in [source, field, *TDS_FIELD_ALIASES.get(field, [])]:
        lookup = _normal_key(key)
        if lookup in normalised:
            return normalised[lookup]
    return ""


def _normal_key(value) -> str:
    return "".join(char for char in str(value).casefold() if char.isalnum())


FORM3CD_DISCLOSURES = [
    {
        "section_group": "SEC 37 - AMOUNTS NOT DEDUCTIBLE",
        "clause": "21(a)",
        "section_act": "Sec 37(1)",
        "expense_description": "Capital expenditure - Office Exp",
        "amount": 204590.07,
        "answer_value": "CA to quantify",
        "disclosure_text": "Capital items possibly included in Office Exp Rs.2,04,590. CA to identify and add back capital portion.",
        "status": "Mandatory",
        "ca_action_required": "Identify capital items (computer/furniture/equipment). Reclassify to fixed assets. Add back to income.",
    },
    {
        "section_group": "SEC 37 - AMOUNTS NOT DEDUCTIBLE",
        "clause": "21(a)",
        "section_act": "Sec 37(1)",
        "expense_description": "Capital expenditure - Expenses Written Off",
        "amount": 145228.26,
        "answer_value": "Rs.29,046 deductible (1/5th)",
        "disclosure_text": "Pre-operative/deferred expenses Rs.1,45,228. If pre-operative: deductible Rs.29,046 (1/5th) u/s 35D. Balance Rs.1,16,182 to add back.",
        "status": "Mandatory",
        "ca_action_required": "Confirm nature - if pre-operative: claim Sec 35D. If other: full add back. Disclose in Cl.19(f).",
    },
    {
        "section_group": "SEC 37 - AMOUNTS NOT DEDUCTIBLE",
        "clause": "21(b)",
        "section_act": "Sec 37(1)",
        "expense_description": "Personal expenditure - Business Promotion",
        "amount": 221615,
        "answer_value": "CA to quantify",
        "disclosure_text": "Business Promotion Rs.2,21,615 - personal component to be identified and disallowed.",
        "status": "Mandatory",
        "ca_action_required": "Obtain bills. Identify personal entertainment/gifts to directors. Add back personal portion.",
    },
    {
        "section_group": "SEC 37 - AMOUNTS NOT DEDUCTIBLE",
        "clause": "21(b)",
        "section_act": "Sec 37(1)",
        "expense_description": "Personal expenditure - Fuel Expenses",
        "amount": 266799.15,
        "answer_value": "CA to quantify",
        "disclosure_text": "Fuel Exp Rs.2,66,799 - no logbook maintained. Personal vehicle fuel to be excluded.",
        "status": "Mandatory",
        "ca_action_required": "Obtain vehicle logbook. Compute personal use %. Add back proportionate personal fuel.",
    },
    {
        "section_group": "SEC 37 - AMOUNTS NOT DEDUCTIBLE",
        "clause": "21(b)",
        "section_act": "Sec 37(1)",
        "expense_description": "Personal expenditure - Travelling Expenses",
        "amount": 62387.95,
        "answer_value": "CA to quantify",
        "disclosure_text": "Travelling Rs.62,388 - personal travel of directors/employees to be identified and disallowed.",
        "status": "Mandatory",
        "ca_action_required": "Obtain travel bills. Confirm business purpose for each trip. Add back personal travel.",
    },
    {
        "section_group": "SEC 37 - AMOUNTS NOT DEDUCTIBLE",
        "clause": "21(c)",
        "section_act": "Sec 37(2B)",
        "expense_description": "Advertisement in political party publication",
        "amount": None,
        "answer_value": "NIL",
        "disclosure_text": "No payment made to political party publication. NIL disclosure.",
        "status": "Filled",
        "ca_action_required": "No action required.",
    },
    {
        "section_group": "SEC 37 - AMOUNTS NOT DEDUCTIBLE",
        "clause": "21(d)",
        "section_act": "Sec 37(1) proviso",
        "expense_description": "Penalty/fine - violation of law",
        "amount": 6014,
        "answer_value": "Rs.6,014 - verify nature",
        "disclosure_text": "Penalty Rs.6,014 debited to P&L. If statutory penalty (GST/ROC/labour law) = NOT deductible. Mandatory disclosure.",
        "status": "Mandatory",
        "ca_action_required": "Confirm: statutory = add back Rs.6,014 entirely. Contractual = allowable. Disclose in Form 3CD cl.21(d).",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(i)",
        "section_act": "Sec 40(a)(i)",
        "expense_description": "Payments to non-residents without TDS",
        "amount": None,
        "answer_value": "NIL",
        "disclosure_text": "No payments to non-residents identified in books. NIL disclosure.",
        "status": "Filled",
        "ca_action_required": "Confirm no NR payments. CA to verify import freight for Sec 195 applicability.",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ia)",
        "section_act": "Sec 40(a)(ia)",
        "expense_description": "Factory Rent - TDS u/s 194-I not verified",
        "amount": 440000,
        "answer_value": "30% risk = Rs.1,32,000",
        "disclosure_text": "Rent Rs.4,40,000 to TEENU YADAV. TDS @10% = Rs.44,000. If not deducted: 30% disallowance = Rs.1,32,000.",
        "status": "Mandatory",
        "ca_action_required": "Verify TDS @10% u/s 194-I deducted and deposited. If not: disallow Rs.1,32,000 u/s 40(a)(ia).",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ia)",
        "section_act": "Sec 40(a)(ia)",
        "expense_description": "Office Rent - TDS u/s 194-I not verified",
        "amount": 475000,
        "answer_value": "30% risk = Rs.1,42,500",
        "disclosure_text": "Rent Rs.4,75,000. TDS @10% = Rs.47,500. If not deducted: disallow Rs.1,42,500.",
        "status": "Mandatory",
        "ca_action_required": "Verify TDS @10% u/s 194-I deducted and deposited. If not: disallow Rs.1,42,500.",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ia)",
        "section_act": "Sec 40(a)(ia)",
        "expense_description": "Accounting Charges - TDS u/s 194-J not verified",
        "amount": 480000,
        "answer_value": "30% risk = Rs.1,44,000",
        "disclosure_text": "Professional charges Rs.4,80,000. TDS @10% u/s 194-J = Rs.48,000. If not deducted: 30% = Rs.1,44,000.",
        "status": "Mandatory",
        "ca_action_required": "Verify TDS @10% u/s 194-J deducted. If not: disallow Rs.1,44,000.",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ia)",
        "section_act": "Sec 40(a)(ia)",
        "expense_description": "Audit Fee - TDS u/s 194-J not verified",
        "amount": 100000,
        "answer_value": "30% risk = Rs.30,000",
        "disclosure_text": "Audit fee Rs.1,00,000. TDS @10% = Rs.10,000. If not deducted: disallow Rs.30,000.",
        "status": "Mandatory",
        "ca_action_required": "Verify TDS deducted. If not: disallow Rs.30,000.",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ia)",
        "section_act": "Sec 40(a)(ia)",
        "expense_description": "Commission - TDS u/s 194-H not verified",
        "amount": 113500,
        "answer_value": "30% risk = Rs.34,050",
        "disclosure_text": "Commission Rs.1,13,500. TDS @5% u/s 194-H = Rs.5,675. If not deducted: disallow Rs.34,050.",
        "status": "Mandatory",
        "ca_action_required": "Verify TDS @5% u/s 194-H deducted. If not: disallow Rs.34,050.",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ia)",
        "section_act": "Sec 40(a)(ia)",
        "expense_description": "Freight Charges - TDS u/s 194-C not verified",
        "amount": 2276987,
        "answer_value": "30% risk = Rs.6,83,096",
        "disclosure_text": "Freight Rs.22,76,987. TDS @2% u/s 194-C = Rs.45,540 (threshold-eligible portion). If not: 30% disallow.",
        "status": "Mandatory",
        "ca_action_required": "Verify TDS @2% on threshold-eligible freight payments. See Clause 34 sheet.",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ia)",
        "section_act": "Sec 40(a)(ia)",
        "expense_description": "Job Work - TDS u/s 194-C not verified",
        "amount": 1362390,
        "answer_value": "30% risk = Rs.4,08,717",
        "disclosure_text": "Job work Rs.13,62,390 (Job Work + Saumya). TDS @2% = Rs.27,248. If not deducted on aggregate >Rs.75K: disallow 30%.",
        "status": "Mandatory",
        "ca_action_required": "Verify TDS @2% u/s 194-C. If not deducted on aggregate >Rs.75K: disallow 30%.",
    },
    {
        "section_group": "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE",
        "clause": "22(ii)",
        "section_act": "Sec 40(a)(ii)",
        "expense_description": "Tax/cess/surcharge paid to government",
        "amount": None,
        "answer_value": "NIL",
        "disclosure_text": "No income tax or surcharge debited to P&L. NIL disclosure.",
        "status": "Filled",
        "ca_action_required": "No action required.",
    },
    {
        "section_group": "SEC 40A - RELATED PARTY & CASH PAYMENTS",
        "clause": "23(a)",
        "section_act": "Sec 40A(2)(b)",
        "expense_description": "Payments to related parties - Director salary",
        "amount": 5244135,
        "answer_value": "CA to verify - FMV test",
        "disclosure_text": "Salary Rs.52,44,135 includes director remuneration. Verify amount is at arm's length and within Companies Act limits.",
        "status": "Mandatory",
        "ca_action_required": "Disclose: Director name, PAN, relationship, amount paid. Obtain FMV comparison. Disallow excess over FMV.",
    },
    {
        "section_group": "SEC 40A - RELATED PARTY & CASH PAYMENTS",
        "clause": "23(a)",
        "section_act": "Sec 40A(2)(b)",
        "expense_description": "Payments to related parties - Finance charges",
        "amount": 2897495.81,
        "answer_value": "CA to verify - arm's length rate",
        "disclosure_text": "Finance charges Rs.28,97,496 includes possible director loan interest. Verify rate is arm's length.",
        "status": "Mandatory",
        "ca_action_required": "Disclose director loan interest separately. Compare rate with bank lending rate. Disallow excess.",
    },
    {
        "section_group": "SEC 40A - RELATED PARTY & CASH PAYMENTS",
        "clause": "23(a)",
        "section_act": "Sec 40A(2)(b)",
        "expense_description": "Payments to related parties - Factory/Office Rent",
        "amount": 915000,
        "answer_value": "CA to verify - FMV test",
        "disclosure_text": "Rent Rs.9,15,000 - verify landlord not a related party. If related: must not exceed FMV.",
        "status": "Mandatory",
        "ca_action_required": "Confirm TEENU YADAV relationship with Nxtmobility. If related: obtain FMV certificate.",
    },
    {
        "section_group": "SEC 40A - RELATED PARTY & CASH PAYMENTS",
        "clause": "23(b)",
        "section_act": "Sec 40A(3)",
        "expense_description": "Cash payments >Rs.10,000 per day - 15 vouchers",
        "amount": 562825.35,
        "answer_value": "Rs.5,62,825 - 100% disallowable",
        "disclosure_text": "15 cash payment vouchers exceeding Rs.10,000 per day to same party. Total Rs.5,62,825. FULLY disallowable.",
        "status": "Mandatory",
        "ca_action_required": "Extract voucher-wise list from DayBook. Disallow Rs.5,62,825 in full. Disclose in Cl.23(b).",
    },
    {
        "section_group": "SEC 40A - RELATED PARTY & CASH PAYMENTS",
        "clause": "23(ba)",
        "section_act": "Sec 40A(3A)",
        "expense_description": "Cash receipts from customers >Rs.20,000",
        "amount": None,
        "answer_value": "NIL - verify",
        "disclosure_text": "No single cash receipt >Rs.20,000 identified. CA to confirm from receipts register.",
        "status": "CA Verify",
        "ca_action_required": "Review receipt vouchers. Confirm no cash receipt >Rs.20,000 from any single customer in a day.",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(i)",
        "section_act": "Sec 36(1)(i)",
        "expense_description": "Stock Insurance Charges - insurance premium",
        "amount": 10840,
        "answer_value": "Rs.10,840 - Deductible",
        "disclosure_text": "Insurance premium Rs.10,840 on business stock. Deductible u/s 36(1)(i). Disclose in Form 3CD.",
        "status": "Filled",
        "ca_action_required": "Attach insurance policy. Confirm premium pertains to FY 2025-26 (not prepaid).",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(ii)",
        "section_act": "Sec 36(1)(ii)",
        "expense_description": "Bonus/commission to employees",
        "amount": None,
        "answer_value": "CA to identify amount",
        "disclosure_text": "Bonus/ex-gratia in salary Rs.52,44,135 - deductible only if PAID before due date of filing (31-Oct-2026).",
        "status": "Mandatory",
        "ca_action_required": "Identify bonus component. Verify actually paid before 31-Oct-2026. Provision = NOT deductible.",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(iii)",
        "section_act": "Sec 36(1)(iii)",
        "expense_description": "Interest on borrowed capital",
        "amount": 2897495.81,
        "answer_value": "Rs.28,97,496 - Deductible",
        "disclosure_text": "Finance charges Rs.28,97,496 - interest on business borrowings. Deductible u/s 36(1)(iii) if loan for business.",
        "status": "CA Verify",
        "ca_action_required": "Attach loan-wise interest schedule. Confirm each loan used for business. Pre-commencement interest: capitalise.",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(iv)",
        "section_act": "Sec 36(1)(iv)",
        "expense_description": "Employer contribution to Recognised PF",
        "amount": 193005,
        "answer_value": "Rs.1,93,005 - Deductible if deposited",
        "disclosure_text": "Employer EPF Rs.1,93,005. Deductible u/s 36(1)(iv) if deposited within statutory due dates.",
        "status": "CA Verify",
        "ca_action_required": "Verify all 12 monthly PF challans deposited by 15th of following month. Late deposit = disallowance.",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(v)",
        "section_act": "Sec 36(1)(v)",
        "expense_description": "Employer contribution to approved gratuity fund",
        "amount": None,
        "answer_value": "NIL - No approved fund",
        "disclosure_text": "No LIC-approved gratuity fund. Actual gratuity payments deductible. Provision = not deductible u/s 36(1)(v).",
        "status": "Filled",
        "ca_action_required": "Confirm no gratuity provision created. Only actual payments to employees are deductible.",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(va)",
        "section_act": "Sec 36(1)(va)",
        "expense_description": "Employee PF/ESI deducted - deposited within due date?",
        "amount": None,
        "answer_value": "CRITICAL - verify all 12 months",
        "disclosure_text": "Employee PF/ESI deducted from salary. If deposited late -> treated as income of employer u/s 2(24)(x). Disallowance.",
        "status": "Critical",
        "ca_action_required": "CRITICAL: Verify all 12 months deposits. Any late deposit = disallowable. Mandatory disclosure.",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(vi)",
        "section_act": "Sec 36(1)(vi)",
        "expense_description": "Bad debts written off",
        "amount": None,
        "answer_value": "NIL",
        "disclosure_text": "No bad debts written off in FY 2025-26.",
        "status": "Filled",
        "ca_action_required": "No action required.",
    },
    {
        "section_group": "SEC 36 - SPECIFIED DEDUCTIONS (ALLOWABILITY VERIFICATION)",
        "clause": "26(a)(vii)",
        "section_act": "Sec 36(1)(vii)",
        "expense_description": "Provision for bad and doubtful debts",
        "amount": None,
        "answer_value": "NIL",
        "disclosure_text": "No provision for bad debts created.",
        "status": "Filled",
        "ca_action_required": "No action required.",
    },
    {
        "section_group": "SEC 43B - DEDUCTIBLE ONLY ON ACTUAL PAYMENT BEFORE ITR DUE DATE (31-Oct-2026)",
        "clause": "40(a)",
        "section_act": "Sec 43B(a)",
        "expense_description": "GST interest + TDS interest outstanding",
        "amount": 6626,
        "answer_value": "Rs.6,626 - verify paid before ITR date",
        "disclosure_text": "GST interest Rs.6,041 + TDS interest Rs.585 = Rs.6,626. Deductible only if paid before 31-Oct-2026.",
        "status": "Mandatory",
        "ca_action_required": "Confirm both amounts paid before 31-Oct-2026. If outstanding on that date: add back Rs.6,626.",
    },
    {
        "section_group": "SEC 43B - DEDUCTIBLE ONLY ON ACTUAL PAYMENT BEFORE ITR DUE DATE (31-Oct-2026)",
        "clause": "40(b)",
        "section_act": "Sec 43B(b)",
        "expense_description": "Employer PF contribution outstanding",
        "amount": 193005,
        "answer_value": "Rs.1,93,005 - verify paid before ITR date",
        "disclosure_text": "Employer PF Rs.1,93,005. Deductible only if paid to EPFO before 31-Oct-2026. Outstanding = disallowance.",
        "status": "Mandatory",
        "ca_action_required": "Verify all FY 2025-26 PF challans paid. Compute amount outstanding at 31-Oct-2026. Disallow outstanding.",
    },
    {
        "section_group": "SEC 43B - DEDUCTIBLE ONLY ON ACTUAL PAYMENT BEFORE ITR DUE DATE (31-Oct-2026)",
        "clause": "40(c)",
        "section_act": "Sec 43B(c)",
        "expense_description": "Bonus/commission outstanding",
        "amount": None,
        "answer_value": "CA to identify and verify",
        "disclosure_text": "Bonus/ex-gratia in salary - deductible only if actually paid to employees before 31-Oct-2026.",
        "status": "Mandatory",
        "ca_action_required": "Identify bonus amount. Confirm paid before ITR due date. Add back any unpaid provision.",
    },
    {
        "section_group": "SEC 43B - DEDUCTIBLE ONLY ON ACTUAL PAYMENT BEFORE ITR DUE DATE (31-Oct-2026)",
        "clause": "40(d)",
        "section_act": "Sec 43B(d)",
        "expense_description": "Interest on bank/NBFC loans outstanding",
        "amount": 2897495.81,
        "answer_value": "Rs.28,97,496 - verify paid before ITR date",
        "disclosure_text": "Finance charges Rs.28,97,496. Interest on scheduled bank/NBFC loans deductible only if paid before 31-Oct-2026.",
        "status": "Mandatory",
        "ca_action_required": "Obtain interest paid certificate from each lender. Compute outstanding at 31-Oct-2026. Disallow outstanding.",
    },
    {
        "section_group": "SEC 43B - DEDUCTIBLE ONLY ON ACTUAL PAYMENT BEFORE ITR DUE DATE (31-Oct-2026)",
        "clause": "40(e)",
        "section_act": "Sec 43B(e)",
        "expense_description": "Interest on SFC/AIFI loans",
        "amount": None,
        "answer_value": "NIL",
        "disclosure_text": "No loans from State Financial Corporations.",
        "status": "N/A",
        "ca_action_required": "No action required.",
    },
    {
        "section_group": "SEC 43B - DEDUCTIBLE ONLY ON ACTUAL PAYMENT BEFORE ITR DUE DATE (31-Oct-2026)",
        "clause": "40(f)",
        "section_act": "Sec 43B(f)",
        "expense_description": "Leave encashment outstanding",
        "amount": None,
        "answer_value": "CA to verify",
        "disclosure_text": "Leave encashment deductible only on actual payment. Any provision in books = disallowable.",
        "status": "Mandatory",
        "ca_action_required": "Verify actual leave encashment paid to employees during FY 2025-26. Add back any provision.",
    },
    {
        "section_group": "SEC 43B - DEDUCTIBLE ONLY ON ACTUAL PAYMENT BEFORE ITR DUE DATE (31-Oct-2026)",
        "clause": "40(g)",
        "section_act": "Sec 43B(h)",
        "expense_description": "MSME payments - 45-day rule",
        "amount": 1362390,
        "answer_value": "Rs.13,62,390 - CRITICAL",
        "disclosure_text": "Job work Rs.13,62,390. If MSME-registered vendors, payment required within 45 days (15 days without agreement). Outstanding = disallow.",
        "status": "Critical",
        "ca_action_required": "CRITICAL: Obtain UDYAM certificates from all job work vendors. Verify payment within 45 days. Disallow outstanding.",
    },
]


RISK_SUMMARY = [
    {"risk_area": "TDS not deducted - Rent (Factory+Office)", "clause": "22(ia)", "amount_at_risk": 915000, "disallowance_30": 274500, "disallowance_100": None, "net_max_risk": 274500, "priority": "HIGH", "note": "30% of gross rent if TDS defaulted"},
    {"risk_area": "TDS not deducted - Professional/Audit", "clause": "22(ia)", "amount_at_risk": 580000, "disallowance_30": 174000, "disallowance_100": None, "net_max_risk": 174000, "priority": "HIGH", "note": "30% of fees if TDS defaulted"},
    {"risk_area": "TDS not deducted - Commission", "clause": "22(ia)", "amount_at_risk": 113500, "disallowance_30": 34050, "disallowance_100": None, "net_max_risk": 34050, "priority": "HIGH", "note": "30% of commission if TDS defaulted"},
    {"risk_area": "TDS not deducted - Freight/Job Work", "clause": "22(ia)", "amount_at_risk": 3639377, "disallowance_30": 1091813, "disallowance_100": None, "net_max_risk": 1091813, "priority": "HIGH", "note": "30% of TDS-applicable freight & job work"},
    {"risk_area": "Cash payments >Rs.10,000", "clause": "23(b)", "amount_at_risk": 562825, "disallowance_30": None, "disallowance_100": 562825, "net_max_risk": 562825, "priority": "HIGH", "note": "100% disallowance - no relief"},
    {"risk_area": "Statutory Penalty", "clause": "21(d)", "amount_at_risk": 6014, "disallowance_30": None, "disallowance_100": 6014, "net_max_risk": 6014, "priority": "HIGH", "note": "100% disallowable if statutory"},
    {"risk_area": "MSME 45-day rule - Job Work", "clause": "40(g)", "amount_at_risk": 1362390, "disallowance_30": None, "disallowance_100": 1362390, "net_max_risk": 1362390, "priority": "CRITICAL", "note": "100% disallowable if beyond 45 days"},
    {"risk_area": "Personal expenditure - Fuel/Travel/Promotion", "clause": "21(b)", "amount_at_risk": 550802, "disallowance_30": None, "disallowance_100": None, "net_max_risk": None, "priority": "HIGH", "note": "CA to quantify personal component"},
    {"risk_area": "Capital items in expenses", "clause": "21(a)", "amount_at_risk": 349818, "disallowance_30": None, "disallowance_100": None, "net_max_risk": None, "priority": "HIGH", "note": "CA to quantify capital component"},
    {"risk_area": "Finance charges - Sec 43B outstanding", "clause": "40(d)", "amount_at_risk": 2897496, "disallowance_30": None, "disallowance_100": None, "net_max_risk": None, "priority": "HIGH", "note": "Outstanding at ITR date = disallowable"},
]


TDS_DETAIL = [
    {"sr": 1, "nature_of_payment": "Salary to employees", "section": "192", "amount_paid": 5244135, "tds_as_per_act": 0, "tds_deducted": 0, "difference": 0, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 0, "reason_note": "Verify Form 24Q filing for all 4 quarters"},
    {"sr": 2, "nature_of_payment": "Factory Rent", "section": "194-I", "amount_paid": 440000, "tds_as_per_act": 44000, "tds_deducted": 0, "difference": 44000, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 44000, "reason_note": "TDS @10% - verify deducted and deposited"},
    {"sr": 3, "nature_of_payment": "Office Rent", "section": "194-I", "amount_paid": 475000, "tds_as_per_act": 47500, "tds_deducted": 0, "difference": 47500, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 47500, "reason_note": "TDS @10% - verify deducted and deposited"},
    {"sr": 4, "nature_of_payment": "Accounting / Professional Charges", "section": "194-J", "amount_paid": 480000, "tds_as_per_act": 48000, "tds_deducted": 0, "difference": 48000, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 48000, "reason_note": "TDS @10% - verify deducted and deposited"},
    {"sr": 5, "nature_of_payment": "Audit Fee", "section": "194-J", "amount_paid": 100000, "tds_as_per_act": 10000, "tds_deducted": 0, "difference": 10000, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 10000, "reason_note": "TDS @10% on audit fee"},
    {"sr": 6, "nature_of_payment": "Technical Fee", "section": "194-J", "amount_paid": 20000, "tds_as_per_act": 400, "tds_deducted": 0, "difference": 400, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 400, "reason_note": "TDS @2% if technical service - verify aggregate >Rs.30K"},
    {"sr": 7, "nature_of_payment": "Legal Charges", "section": "194-J", "amount_paid": 4000, "tds_as_per_act": 0, "tds_deducted": 0, "difference": 0, "deposit_due": "-", "deposit_status": "Below threshold", "default_amount": 0, "reason_note": "Aggregate check required across all legal payments"},
    {"sr": 8, "nature_of_payment": "Commission", "section": "194-H", "amount_paid": 113500, "tds_as_per_act": 5675, "tds_deducted": 0, "difference": 5675, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 5675, "reason_note": "TDS @5% - threshold Rs.15,000 exceeded"},
    {"sr": 9, "nature_of_payment": "Freight - Threshold-eligible portion", "section": "194-C", "amount_paid": 1282440, "tds_as_per_act": 25649, "tds_deducted": 0, "difference": 25649, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 25649, "reason_note": "TDS @2% on HLSL Rs.12,57,440 + Apollo Rs.95,000 + Lucknow Kanpur Rs.57,600 only"},
    {"sr": 10, "nature_of_payment": "Freight - GATI & Ahom (below threshold)", "section": "194-C", "amount_paid": 994547, "tds_as_per_act": 0, "tds_deducted": 0, "difference": 0, "deposit_due": "-", "deposit_status": "Not required", "default_amount": 0, "reason_note": "GATI agg Rs.5,766; Ahom agg Rs.73,650 - below Rs.75K threshold"},
    {"sr": 11, "nature_of_payment": "Job Work - SAUMYA", "section": "194-C", "amount_paid": 858590, "tds_as_per_act": 17172, "tds_deducted": 0, "difference": 17172, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 17172, "reason_note": "TDS @2% - single payment > Rs.30K"},
    {"sr": 12, "nature_of_payment": "Job Work (other)", "section": "194-C", "amount_paid": 503800, "tds_as_per_act": 10076, "tds_deducted": 0, "difference": 10076, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 10076, "reason_note": "TDS @2% - aggregate >Rs.75K"},
    {"sr": 13, "nature_of_payment": "Finance Charges - Bank interest", "section": "194-A", "amount_paid": None, "tds_as_per_act": 0, "tds_deducted": 0, "difference": 0, "deposit_due": "-", "deposit_status": "Not required", "default_amount": 0, "reason_note": "No TDS on bank interest u/s 194A - bank exempt"},
    {"sr": 14, "nature_of_payment": "Finance Charges - Non-bank interest", "section": "194-A", "amount_paid": None, "tds_as_per_act": None, "tds_deducted": 0, "difference": None, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": None, "reason_note": "TDS @10% if interest to individual/firm >Rs.5,000. Segregate bank vs non-bank."},
    {"sr": 15, "nature_of_payment": "ROC Expenses - Professional fee portion", "section": "194-J", "amount_paid": 41250, "tds_as_per_act": 4125, "tds_deducted": 0, "difference": 4125, "deposit_due": "7th next mo", "deposit_status": "CA Verify", "default_amount": 4125, "reason_note": "If CA/CS fee >Rs.30K: TDS @10%"},
    {"sr": 16, "nature_of_payment": "Software Renewal", "section": "194-J", "amount_paid": 12000, "tds_as_per_act": 0, "tds_deducted": 0, "difference": 0, "deposit_due": "-", "deposit_status": "Verify nature", "default_amount": 0, "reason_note": "Annual SaaS: no TDS. Perpetual licence: TDS @10% as royalty."},
    {"sr": None, "nature_of_payment": "TOTAL", "section": None, "amount_paid": 10569262, "tds_as_per_act": 212597, "tds_deducted": None, "difference": 212597, "deposit_due": None, "deposit_status": None, "default_amount": 212597, "reason_note": None},
]


GST_EXPENDITURE = [
    {"sr": 1, "expenditure_ledger": "Factory Rent", "type": "Direct", "total_exp": 440000, "gst_registered": 440000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 79200},
    {"sr": 2, "expenditure_ledger": "Freight Charges", "type": "Direct", "total_exp": 2276987, "gst_registered": 2276987, "composition_scheme": 0, "unregistered": 0, "gst_paid": 409658},
    {"sr": 3, "expenditure_ledger": "Transportation Exp", "type": "Direct", "total_exp": 220199, "gst_registered": 220199, "composition_scheme": 0, "unregistered": 0, "gst_paid": 39636},
    {"sr": 4, "expenditure_ledger": "Job Work", "type": "Direct", "total_exp": 500000, "gst_registered": 500000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 90000},
    {"sr": 5, "expenditure_ledger": "SAUMYA (JOB WORK)", "type": "Direct", "total_exp": 858590, "gst_registered": 858590, "composition_scheme": 0, "unregistered": 0, "gst_paid": 154546},
    {"sr": 6, "expenditure_ledger": "Job Work for Vehicle", "type": "Direct", "total_exp": 3800, "gst_registered": 3800, "composition_scheme": 0, "unregistered": 0, "gst_paid": 684},
    {"sr": 7, "expenditure_ledger": "Salary", "type": "Indirect", "total_exp": 5244135, "gst_registered": 0, "composition_scheme": 0, "unregistered": 5244135, "gst_paid": 0},
    {"sr": 8, "expenditure_ledger": "Staff Welfare", "type": "Indirect", "total_exp": 106791, "gst_registered": 106791, "composition_scheme": 0, "unregistered": 0, "gst_paid": 19222},
    {"sr": 9, "expenditure_ledger": "Staff Convence", "type": "Indirect", "total_exp": 300000, "gst_registered": 300000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 54000},
    {"sr": 10, "expenditure_ledger": "Accounting Charges", "type": "Indirect", "total_exp": 480000, "gst_registered": 480000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 86400},
    {"sr": 11, "expenditure_ledger": "Audit Fee", "type": "Indirect", "total_exp": 100000, "gst_registered": 100000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 18000},
    {"sr": 12, "expenditure_ledger": "Technical Fee", "type": "Indirect", "total_exp": 20000, "gst_registered": 20000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 3600},
    {"sr": 13, "expenditure_ledger": "Legal Exp", "type": "Indirect", "total_exp": 4000, "gst_registered": 4000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 720},
    {"sr": 14, "expenditure_ledger": "Office Rent", "type": "Indirect", "total_exp": 475000, "gst_registered": 475000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 85500},
    {"sr": 15, "expenditure_ledger": "Electricity Exp", "type": "Indirect", "total_exp": 161278, "gst_registered": 161278, "composition_scheme": 0, "unregistered": 0, "gst_paid": 0},
    {"sr": 16, "expenditure_ledger": "Telephone Exp", "type": "Indirect", "total_exp": 20513, "gst_registered": 20513, "composition_scheme": 0, "unregistered": 0, "gst_paid": 3692},
    {"sr": 17, "expenditure_ledger": "Internet Exp", "type": "Indirect", "total_exp": 18000, "gst_registered": 18000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 3240},
    {"sr": 18, "expenditure_ledger": "Printing & Stationery", "type": "Indirect", "total_exp": 66540, "gst_registered": 66540, "composition_scheme": 0, "unregistered": 0, "gst_paid": 11977},
    {"sr": 19, "expenditure_ledger": "Software Renewal", "type": "Indirect", "total_exp": 12000, "gst_registered": 12000, "composition_scheme": 0, "unregistered": 0, "gst_paid": 2160},
    {"sr": 20, "expenditure_ledger": "Office Exp", "type": "Indirect", "total_exp": 204590, "gst_registered": 204590, "composition_scheme": 0, "unregistered": 0, "gst_paid": 36826},
    {"sr": 21, "expenditure_ledger": "Repair & Maintenance", "type": "Indirect", "total_exp": 5800, "gst_registered": 5800, "composition_scheme": 0, "unregistered": 0, "gst_paid": 1044},
    {"sr": 22, "expenditure_ledger": "Roc Expenses", "type": "Indirect", "total_exp": 41250, "gst_registered": 41250, "composition_scheme": 0, "unregistered": 0, "gst_paid": 7425},
    {"sr": 23, "expenditure_ledger": "Courier Exp", "type": "Indirect", "total_exp": 3826, "gst_registered": 3826, "composition_scheme": 0, "unregistered": 0, "gst_paid": 689},
    {"sr": 24, "expenditure_ledger": "Stock Insurance Charges", "type": "Indirect", "total_exp": 10840, "gst_registered": 10840, "composition_scheme": 0, "unregistered": 0, "gst_paid": 0},
    {"sr": 25, "expenditure_ledger": "Business Promotion", "type": "Indirect", "total_exp": 221615, "gst_registered": 221615, "composition_scheme": 0, "unregistered": 0, "gst_paid": 39891},
    {"sr": 26, "expenditure_ledger": "Commision", "type": "Indirect", "total_exp": 113500, "gst_registered": 113500, "composition_scheme": 0, "unregistered": 0, "gst_paid": 20430},
    {"sr": 27, "expenditure_ledger": "Finance Charges", "type": "Indirect", "total_exp": 2897496, "gst_registered": 2897496, "composition_scheme": 0, "unregistered": 0, "gst_paid": 0},
    {"sr": 28, "expenditure_ledger": "Bank Charges", "type": "Indirect", "total_exp": 140249, "gst_registered": 140249, "composition_scheme": 0, "unregistered": 0, "gst_paid": 0},
    {"sr": 29, "expenditure_ledger": "GST Interest", "type": "Indirect", "total_exp": 6041, "gst_registered": 0, "composition_scheme": 0, "unregistered": 6041, "gst_paid": 0},
    {"sr": 30, "expenditure_ledger": "TDS Interest", "type": "Indirect", "total_exp": 585, "gst_registered": 0, "composition_scheme": 0, "unregistered": 585, "gst_paid": 0},
    {"sr": 31, "expenditure_ledger": "Penalty", "type": "Indirect", "total_exp": 6014, "gst_registered": 0, "composition_scheme": 0, "unregistered": 6014, "gst_paid": 0},
    {"sr": 32, "expenditure_ledger": "Travelling Expenses", "type": "Indirect", "total_exp": 62388, "gst_registered": 62388, "composition_scheme": 0, "unregistered": 0, "gst_paid": 6239},
    {"sr": 33, "expenditure_ledger": "Fuel Exp", "type": "Indirect", "total_exp": 266799, "gst_registered": 266799, "composition_scheme": 0, "unregistered": 0, "gst_paid": 48024},
    {"sr": 34, "expenditure_ledger": "Expenses Written Off", "type": "Indirect", "total_exp": 145228, "gst_registered": 0, "composition_scheme": 0, "unregistered": 145228, "gst_paid": 0},
    {"sr": 35, "expenditure_ledger": "Misc Exp", "type": "Indirect", "total_exp": 1500, "gst_registered": 1500, "composition_scheme": 0, "unregistered": 0, "gst_paid": 270},
    {"sr": 36, "expenditure_ledger": "WARRANTY EXPENSE", "type": "Indirect", "total_exp": 55805, "gst_registered": 55805, "composition_scheme": 0, "unregistered": 0, "gst_paid": 10045},
    {"sr": None, "expenditure_ledger": "GRAND TOTAL", "type": None, "total_exp": 15491359, "gst_registered": 10089356, "composition_scheme": 0, "unregistered": 5402003, "gst_paid": 1233118},
]
