from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings


MSME_EMPTY = {
    "status": "not_configured",
    "import_run_id": None,
    "report_id": None,
    "message": "",
    "sundry_creditors": [],
    "profit_loss": {},
    "trial_balance": {},
    "balance_sheet": {},
    "payments": [],
    "voucher_evidence": [],
    "msme_compliance": {},
    "tax_disallowance_43bh": {},
    "interest": {},
    "form3cd": {},
}


class MSMEConnector:
    def __init__(self) -> None:
        settings = get_settings()
        self.enabled = settings.msme_enabled
        self.base_url = settings.msme_api_base_url.rstrip("/")
        self.timeout = settings.msme_timeout_seconds
        self.optional_timeout = min(max(self.timeout, 1), 3)
        self.report_timeout = min(max(self.timeout, 10), 25)
        self.token = settings.msme_api_token.strip()

    def dashboard(self) -> dict[str, Any]:
        if not self.enabled:
            return {**MSME_EMPTY, "status": "not_configured", "message": "MSME Guard is not connected."}

        try:
            with httpx.Client(base_url=self.base_url, timeout=self.timeout, headers=self._headers()) as client:
                health = self._safe_get(client, "/api/health", auth_required=False)
                if not health["ok"]:
                    return self._offline("offline", health["message"])

                latest = self._safe_get(client, "/api/tally/imports/latest/summary")
                if not latest["ok"]:
                    return self._offline(self._status_from_error(latest), latest["message"])

                latest_data = latest["data"] or {}
                import_run = latest_data.get("importRun") or latest_data.get("import_run") or {}
                import_run_id = import_run.get("id") or latest_data.get("importRunId")
                creditors = latest_data.get("creditors") or []

                report_id = self._latest_report_id(client, import_run_id)
                payload = {
                    **MSME_EMPTY,
                    "status": "available",
                    "import_run_id": import_run_id,
                    "report_id": report_id,
                    "message": "MSME Guard connected.",
                    "sundry_creditors": creditors,
                    "msme_compliance": {
                        "import_summary": import_run.get("summary") or {},
                        "verification_summary": latest_data.get("verificationSummary") or {},
                    },
                }
                self._apply_latest_import_fallbacks(payload, latest_data)

                if import_run_id:
                    statements = self._statement_summary(client, import_run_id)
                    payload["profit_loss"] = statements.get("profitLoss") or {}
                    payload["trial_balance"] = statements.get("trialBalance") or {}
                    payload["balance_sheet"] = statements.get("balanceSheet") or {}

                if report_id:
                    integration = self._integration_report(client, report_id)
                    tax_disallowance = self._tax_disallowance_report(client, report_id)
                    form3cd = self._form3cd_report(client, report_id)
                    payload["msme_compliance"] = {
                        **payload["msme_compliance"],
                        "summary": integration.get("summary") or {},
                        "ledger_summary": integration.get("ledgerSummary") or {},
                        "risk_score": integration.get("riskScore") or {},
                    }
                    payload["payments"] = integration.get("voucherEvidence") or []
                    payload["voucher_evidence"] = payload["payments"]
                    payload["tax_disallowance_43bh"] = tax_disallowance or integration.get("taxDisallowance") or {}
                    payload["form3cd"] = self._normalise_form3cd(form3cd or integration.get("form3cd") or {})
                    payload["interest"] = self._interest_from_sections(payload, integration)
                    self._apply_latest_import_fallbacks(payload, latest_data)

                return payload
        except httpx.ConnectError:
            return self._offline("offline", "MSME Guard is not connected.")
        except httpx.TimeoutException:
            return self._offline("offline", "MSME Guard is not connected.")
        except Exception:
            return self._offline("error", "MSME Guard service is unavailable on port 3001.")

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def _safe_get(self, client: httpx.Client, path: str, auth_required: bool = True, timeout: float | None = None) -> dict[str, Any]:
        try:
            response = client.get(path, timeout=timeout)
            if response.status_code == 401 and auth_required:
                return {"ok": False, "status_code": 401, "message": "MSME Guard authentication failed.", "data": None}
            response.raise_for_status()
            return {"ok": True, "status_code": response.status_code, "message": "", "data": response.json()}
        except httpx.ConnectError:
            return {"ok": False, "status_code": None, "message": "MSME Guard is not connected.", "data": None}
        except httpx.TimeoutException:
            return {"ok": False, "status_code": None, "message": "MSME Guard is not connected.", "data": None}
        except httpx.HTTPStatusError as exc:
            return {"ok": False, "status_code": exc.response.status_code, "message": self._error_message(exc.response), "data": None}
        except Exception as exc:
            return {"ok": False, "status_code": None, "message": str(exc), "data": None}

    def _latest_report_id(self, client: httpx.Client, import_run_id: Any) -> Any:
        reports = self._safe_get(client, "/api/reports?compact=1", timeout=self.report_timeout)
        if not reports["ok"]:
            return None
        rows = (reports["data"] or {}).get("reports") or []
        if import_run_id:
            for report in rows:
                if str(report.get("importRunId") or report.get("import_run_id") or "") == str(import_run_id):
                    return report.get("id")
        return rows[0].get("id") if rows else None

    def _statement(self, client: httpx.Client, import_run_id: Any, statement: str) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/tally/imports/{import_run_id}/{statement}", timeout=self.optional_timeout)
        if not data["ok"]:
            return {"status": "unavailable", "message": data["message"], "statement": {}}
        return (data["data"] or {}).get("statement") or data["data"] or {}

    def _statement_summary(self, client: httpx.Client, import_run_id: Any) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/tally/imports/{import_run_id}/statements/summary", timeout=self.optional_timeout)
        if not data["ok"]:
            return {}
        return (data["data"] or {}).get("statements") or {}

    def _report_section(self, client: httpx.Client, report_id: Any, section: str) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/reports/{report_id}/{section}", timeout=self.optional_timeout)
        if not data["ok"]:
            return {"status": "unavailable", "message": data["message"]}
        return data["data"] or {}

    def _integration_report(self, client: httpx.Client, report_id: Any) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/reports/{report_id}/integration-summary", timeout=self.report_timeout)
        if not data["ok"]:
            return {}
        return data["data"] or {}

    def _tax_disallowance_report(self, client: httpx.Client, report_id: Any) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/reports/{report_id}/tax-disallowance", timeout=self.report_timeout)
        if not data["ok"]:
            return {}
        return data["data"] or {}

    def _form3cd_report(self, client: httpx.Client, report_id: Any) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/reports/{report_id}/form-3cd", timeout=self.report_timeout)
        if not data["ok"]:
            return {}
        return data["data"] or {}

    def _safe_value(self, client: httpx.Client, path: str, key: str, default: Any) -> Any:
        data = self._safe_get(client, path)
        if not data["ok"]:
            return default
        return (data["data"] or {}).get(key, default)

    def _interest_from_sections(self, payload: dict[str, Any], integration: dict[str, Any] | None = None) -> dict[str, Any]:
        compliance = payload.get("msme_compliance") or {}
        summary = compliance.get("summary") or {}
        tax = payload.get("tax_disallowance_43bh") or {}
        return {
            "summary": summary.get("summary") or {},
            "tax_disallowance": tax.get("taxDisallowanceSummary") or [],
            "section23": tax.get("section23") or [],
            "working": (integration or {}).get("interestWorking") or [],
        }

    def _normalise_form3cd(self, form3cd: dict[str, Any]) -> dict[str, Any]:
        clause22 = []
        for row in form3cd.get("clause22") or []:
            clause22.append({
                **row,
                "amountInadmissible": row.get("amountInadmissible", row.get("clause22iiiBOutstandingDisallowance", row.get("outstandingBalanceDisallowance", 0))),
                "interestPayable": row.get("interestPayable", row.get("interestUnderSection16", 0)),
                "remarks": row.get("remarks") or row.get("source") or "",
            })
        clause26 = []
        for row in form3cd.get("clause26") or []:
            clause26.append({
                **row,
                "supplier": row.get("supplier") or row.get("vendorName") or "",
                "invoiceNumber": row.get("invoiceNumber") or "",
                "disallowanceAmount": row.get("disallowanceAmount", row.get("principalDisallowance", 0)),
                "status": row.get("status") or row.get("paymentStatus") or row.get("allowedInYear") or "",
            })
        return {**form3cd, "clause22": clause22, "clause26": clause26}

    def _apply_latest_import_fallbacks(self, payload: dict[str, Any], latest_data: dict[str, Any]) -> None:
        creditors = latest_data.get("creditors") or payload.get("sundry_creditors") or []
        import_run = latest_data.get("importRun") or latest_data.get("import_run") or {}
        import_summary = import_run.get("summary") or {}
        verification_summary = latest_data.get("verificationSummary") or {}

        delayed_creditors = [row for row in creditors if row.get("delayed")]
        disallowance_rows = [
            {
                "vendorName": row.get("party") or row.get("vendorName") or "",
                "section": "43B(h)",
                "principalDisallowance": round(float(row.get("disallowanceAmount") or 0), 2),
                "interestPermanentDisallowance": round(float(row.get("interestLiability") or 0), 2),
                "daysOutstanding": row.get("daysOutstanding"),
                "bucket": row.get("bucket"),
            }
            for row in creditors
            if float(row.get("disallowanceAmount") or 0) or float(row.get("interestLiability") or 0)
        ]
        voucher_rows = [
            {
                "vendorName": row.get("party") or "",
                "invoiceNumber": "-",
                "paymentDate": "-",
                "principalAmount": row.get("outstandingAmount") or 0,
                "interestAmount": row.get("interestLiability") or 0,
                "bucket": row.get("bucket"),
                "voucherCount": row.get("voucherCount") or 0,
            }
            for row in creditors
            if row.get("voucherCount") or row.get("outstandingAmount")
        ]
        clause26_rows = [
            {
                "supplier": row["vendorName"],
                "invoiceNumber": "-",
                "disallowanceAmount": row["principalDisallowance"],
                "status": row.get("bucket") or "Delayed",
            }
            for row in disallowance_rows
        ]
        clause22_rows = [
            {
                "supplier": row.get("party") or "",
                "amountInadmissible": round(float(row.get("interestLiability") or row.get("disallowanceAmount") or 0), 2),
                "interestPayable": round(float(row.get("interestLiability") or 0), 2),
                "remarks": f"MSME delayed/outstanding creditor fallback from latest import. Bucket: {row.get('bucket') or 'Not available'}",
            }
            for row in creditors
            if float(row.get("disallowanceAmount") or 0) or row.get("delayed")
        ]

        total_creditors = int(import_summary.get("totalCreditors") or len(creditors) or 0)
        verified_msmes = int(verification_summary.get("verifiedMSME") or 0)
        pending = int(verification_summary.get("pendingVerification") or verification_summary.get("pending") or 0)
        delayed_count = len(delayed_creditors)
        risk_score = min(100, int((delayed_count / max(total_creditors, 1)) * 100) + (10 if verified_msmes else 0))

        payload["payments"] = payload.get("payments") or voucher_rows
        payload["voucher_evidence"] = payload.get("voucher_evidence") or payload["payments"]
        payload["tax_disallowance_43bh"] = payload.get("tax_disallowance_43bh") or {}
        if not payload["tax_disallowance_43bh"].get("taxDisallowanceSummary"):
            payload["tax_disallowance_43bh"]["taxDisallowanceSummary"] = disallowance_rows
        payload["form3cd"] = payload.get("form3cd") or {}
        if not payload["form3cd"].get("clause22"):
            payload["form3cd"]["clause22"] = clause22_rows
        if not payload["form3cd"].get("clause26"):
            payload["form3cd"]["clause26"] = clause26_rows
        payload["interest"] = payload.get("interest") or {}
        if not payload["interest"].get("section23"):
            payload["interest"]["section23"] = [
                {
                    "vendorName": row.get("party") or "",
                    "invoiceNumber": "-",
                    "interestPayable": row.get("interestLiability") or 0,
                    "permanentlyDisallowedAmount": row.get("interestLiability") or row.get("disallowanceAmount") or 0,
                }
                for row in creditors
                if float(row.get("interestLiability") or 0) or float(row.get("disallowanceAmount") or 0) or row.get("delayed")
            ]
        compliance = payload.setdefault("msme_compliance", {})
        compliance.setdefault("import_summary", import_summary)
        compliance.setdefault("verification_summary", verification_summary)
        compliance.setdefault("summary", {})
        compliance["summary"] = {
            "totalCreditors": total_creditors,
            "totalOutstanding": import_summary.get("totalOutstanding") or sum(float(row.get("outstandingAmount") or 0) for row in creditors),
            "delayedCreditors": delayed_count,
            "verifiedMSME": verified_msmes,
            "pendingVerification": pending,
            **(compliance.get("summary") or {}),
        }
        compliance["risk_score"] = compliance.get("risk_score") or {"score": risk_score}

    def _offline(self, status: str, message: str) -> dict[str, Any]:
        return {**MSME_EMPTY, "status": status, "message": message or "MSME Guard is not connected."}

    def _status_from_error(self, result: dict[str, Any]) -> str:
        return "auth_failed" if result.get("status_code") == 401 else "error"

    def _error_message(self, response: httpx.Response) -> str:
        try:
            data = response.json()
        except Exception:
            return response.text[:500] or f"MSME Guard returned HTTP {response.status_code}."
        return data.get("error") or data.get("message") or f"MSME Guard returned HTTP {response.status_code}."


def get_msme_dashboard_data() -> dict[str, Any]:
    return MSMEConnector().dashboard()
