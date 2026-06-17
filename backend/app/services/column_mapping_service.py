from rapidfuzz import fuzz


EXPECTED_FIELDS = {
    "expense-ledger": {
        "date": ["date", "txn date", "transaction date", "voucher date"],
        "voucher_number": ["voucher", "voucher no", "vch no", "entry no"],
        "ledger_name": ["ledger", "ledger name", "expense head", "account"],
        "vendor_name": ["vendor", "party", "supplier", "payee"],
        "narration": ["narration", "description", "particulars", "remarks"],
        "amount": ["amount", "debit", "credit", "value", "gross"],
        "debit_credit": ["dr/cr", "debit credit", "type"],
        "payment_mode": ["mode", "payment mode", "cash bank"],
        "invoice_number": ["invoice", "bill no", "invoice no", "ref no"],
        "gst_amount": ["gst", "tax", "cgst", "sgst", "igst"],
        "tds_amount": ["tds", "withholding"],
    },
    "vendor-master": {
        "name": ["vendor", "party", "supplier", "name"],
        "pan": ["pan"],
        "gstin": ["gstin", "gst no", "gst"],
        "address": ["address", "place"],
        "vendor_type": ["type", "category"],
        "contact": ["email", "mobile", "phone", "contact"],
    },
    "tds-data": {
        "vendor_or_pan": ["vendor", "party", "pan", "deductee"],
        "section": ["section"],
        "payment_amount": ["payment", "amount paid", "gross"],
        "tds_deducted": ["tds deducted", "deducted"],
        "tds_deposited": ["tds deposited", "deposited"],
        "challan_details": ["challan", "bsr", "cin"],
    },
    "gst-data": {
        "gstin": ["gstin", "supplier gstin", "ctin"],
        "vendor_name": ["vendor", "supplier", "party", "trdnm", "trade name"],
        "invoice_number": ["invoice", "inum", "bill", "invoice number"],
        "invoice_date": ["invoice date", "date", "dt"],
        "taxable_value": ["taxable", "taxable value", "txval"],
        "gst_amount": ["gst", "tax", "igst", "cgst", "sgst"],
        "itc_status": ["itc", "status"],
    },
    "bank-data": {
        "date": ["date", "txn date"],
        "particulars": ["particulars", "description", "narration"],
        "amount": ["amount", "debit", "credit"],
        "mode": ["mode", "type"],
        "reference_number": ["reference", "ref", "utr", "cheque"],
    },
    "trial-balance": {
        "ledger_name": ["ledger", "particulars", "account"],
        "debit_amount": ["debit", "dr"],
        "credit_amount": ["credit", "cr"],
        "amount": ["amount", "closing", "balance"],
    },
}


def suggest_mapping(category: str, columns: list[str]) -> list[dict]:
    expected = EXPECTED_FIELDS.get(category, EXPECTED_FIELDS["expense-ledger"])
    exact = EXACT_FIELDS.get(category, {})
    suggestions = []
    used_targets = set()
    for column in columns:
        best_target = ""
        best_score = 0
        normalized = column.lower().strip()
        if normalized in exact:
            best_target = exact[normalized]
            best_score = 100
        for target, aliases in expected.items():
            score = max(fuzz.token_sort_ratio(normalized, alias) for alias in aliases + [target])
            if score > best_score:
                best_score = score
                best_target = target
        if best_score >= 55 and best_target not in used_targets:
            used_targets.add(best_target)
            suggestions.append({"source_column": column, "target_field": best_target, "confidence": round(best_score / 100, 2)})
        else:
            suggestions.append({"source_column": column, "target_field": "", "confidence": 0})
    return suggestions


EXACT_FIELDS = {
    "trial-balance": {
        "ledger name": "ledger_name",
        "particulars": "ledger_name",
        "debit": "debit_amount",
        "credit": "credit_amount",
        "net amount": "amount",
        "amount": "amount",
    },
    "gst-data": {
        "ctin": "gstin",
        "trdnm": "vendor_name",
        "inum": "invoice_number",
        "dt": "invoice_date",
        "txval": "taxable_value",
        "itcavl": "itc_status",
        "igst": "gst_amount",
    }
}
