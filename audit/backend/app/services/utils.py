import hashlib
import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any


def to_json(value: Any) -> str:
    return json.dumps(value, default=str, ensure_ascii=False)


def from_json(value: str | None, fallback: Any = None) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def parse_amount(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).replace(",", "").replace("₹", "").strip()
    text = re.sub(r"[^0-9.\-]", "", text)
    try:
        return float(text)
    except ValueError:
        return None


def parse_date(value: Any) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    for fmt in ("%Y%m%d", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%d.%m.%Y"):
        try:
            text = str(value).strip()
            return datetime.strptime(text[:8] if fmt == "%Y%m%d" else text[:10], fmt).date()
        except ValueError:
            continue
    try:
        parsed = datetime.fromisoformat(str(value).strip())
        return parsed.date()
    except ValueError:
        return None


def valid_gstin(gstin: str | None) -> bool:
    if not gstin:
        return False
    return bool(re.fullmatch(r"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]", gstin.strip().upper()))


def valid_pan(pan: str | None) -> bool:
    if not pan:
        return False
    return bool(re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", pan.strip().upper()))


def risk_level(score: int) -> str:
    if score >= 80:
        return "High Risk"
    if score >= 60:
        return "Medium-High Risk"
    if score >= 40:
        return "Medium Risk"
    if score >= 20:
        return "Low-Medium Risk"
    return "Low Risk"
