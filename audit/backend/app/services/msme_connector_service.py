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
        self.token = settings.msme_api_token.strip()

    def dashboard(self) -> dict[str, Any]:
        if not self.enabled:
            return {**MSME_EMPTY, "status": "not_configured", "message": "MSME Guard is not connected."}

        try:
            with httpx.Client(base_url=self.base_url, timeout=self.timeout, headers=self._headers()) as client:
                health = self._safe_get(client, "/api/health", auth_required=False)
                if not health["ok"]:
                    return self._offline("offline", health["message"])

                latest = self._safe_get(client, "/api/tally/imports/latest")
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

                if import_run_id:
                    payload["profit_loss"] = self._statement(client, import_run_id, "profit-loss")
                    payload["trial_balance"] = self._statement(client, import_run_id, "trial-balance")
                    payload["balance_sheet"] = self._statement(client, import_run_id, "balance-sheet")

                if report_id:
                    payload["msme_compliance"] = {
                        **payload["msme_compliance"],
                        "summary": self._report_section(client, report_id, "summary"),
                        "ledger_summary": self._report_section(client, report_id, "ledger-summary"),
                        "risk_score": self._safe_value(client, f"/api/compliance/risk-score/{report_id}", "riskScore", {}),
                    }
                    payload["payments"] = self._report_section(client, report_id, "voucher-evidence")
                    payload["tax_disallowance_43bh"] = self._report_section(client, report_id, "tax-disallowance")
                    payload["form3cd"] = self._report_section(client, report_id, "form-3cd")
                    payload["interest"] = self._interest_from_sections(payload)

                return payload
        except httpx.ConnectError:
            return self._offline("offline", "MSME Guard is not connected.")
        except httpx.TimeoutException:
            return self._offline("offline", "MSME Guard request timed out.")
        except Exception as exc:
            return self._offline("error", str(exc))

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def _safe_get(self, client: httpx.Client, path: str, auth_required: bool = True) -> dict[str, Any]:
        try:
            response = client.get(path)
            if response.status_code == 401 and auth_required:
                return {"ok": False, "status_code": 401, "message": "MSME Guard authentication failed.", "data": None}
            response.raise_for_status()
            return {"ok": True, "status_code": response.status_code, "message": "", "data": response.json()}
        except httpx.ConnectError:
            return {"ok": False, "status_code": None, "message": "MSME Guard is not connected.", "data": None}
        except httpx.TimeoutException:
            return {"ok": False, "status_code": None, "message": "MSME Guard request timed out.", "data": None}
        except httpx.HTTPStatusError as exc:
            return {"ok": False, "status_code": exc.response.status_code, "message": self._error_message(exc.response), "data": None}
        except Exception as exc:
            return {"ok": False, "status_code": None, "message": str(exc), "data": None}

    def _latest_report_id(self, client: httpx.Client, import_run_id: Any) -> Any:
        reports = self._safe_get(client, "/api/reports")
        if not reports["ok"]:
            return None
        rows = (reports["data"] or {}).get("reports") or []
        if import_run_id:
            for report in rows:
                if str(report.get("importRunId") or report.get("import_run_id") or "") == str(import_run_id):
                    return report.get("id")
        return rows[0].get("id") if rows else None

    def _statement(self, client: httpx.Client, import_run_id: Any, statement: str) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/tally/imports/{import_run_id}/{statement}")
        if not data["ok"]:
            return {"status": "unavailable", "message": data["message"], "statement": {}}
        return (data["data"] or {}).get("statement") or data["data"] or {}

    def _report_section(self, client: httpx.Client, report_id: Any, section: str) -> dict[str, Any]:
        data = self._safe_get(client, f"/api/reports/{report_id}/{section}")
        if not data["ok"]:
            return {"status": "unavailable", "message": data["message"]}
        return data["data"] or {}

    def _safe_value(self, client: httpx.Client, path: str, key: str, default: Any) -> Any:
        data = self._safe_get(client, path)
        if not data["ok"]:
            return default
        return (data["data"] or {}).get(key, default)

    def _interest_from_sections(self, payload: dict[str, Any]) -> dict[str, Any]:
        compliance = payload.get("msme_compliance") or {}
        summary = compliance.get("summary") or {}
        tax = payload.get("tax_disallowance_43bh") or {}
        return {
            "summary": summary.get("summary") or {},
            "tax_disallowance": tax.get("taxDisallowanceSummary") or [],
            "section23": tax.get("section23") or [],
        }

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
