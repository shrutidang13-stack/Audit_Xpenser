from app.api.ca_dashboard import _analytics


def test_overall_risk_uses_highest_domain_without_dilution():
    result = _analytics(
        {
            "audit_summary": {"audit_run": {"risk_score": 0}},
            "expense_audit": {"summary": {}},
        },
        {
            "status": "available",
            "msme_compliance": {"risk_score": {"score": 20}},
            "tax_disallowance_43bh": {},
            "form3cd": {},
        },
    )

    assert result["total_expense_risk"] == 30
    assert result["total_msme_risk"] == 20
    assert result["risk_score"] == 30
    assert result["risk_basis"] == "highest_domain"


def test_unavailable_msme_risk_is_not_reported_as_zero():
    result = _analytics(
        {"audit_summary": {}, "expense_audit": {"summary": {}}},
        {"status": "error", "form3cd": {}},
    )

    assert result["total_msme_risk"] is None
    assert result["msme_risk_available"] is False
