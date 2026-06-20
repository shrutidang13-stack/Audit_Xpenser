from datetime import date
from math import pow


def financial_year_bounds(financial_year: str) -> tuple[date, date]:
    start_year = int(str(financial_year).split("-")[0])
    return date(start_year, 4, 1), date(start_year + 1, 3, 31)


def days_in_use(start: date | None, end: date | None, fy_start: date, fy_end: date) -> int:
    active_start = max(start or fy_start, fy_start)
    active_end = min(end or fy_end, fy_end)
    if active_end < active_start:
        return 0
    return (active_end - active_start).days + 1


def prorata_factor(start: date | None, end: date | None, fy_start: date, fy_end: date) -> float:
    return days_in_use(start, end, fy_start, fy_end) / ((fy_end - fy_start).days + 1)


def slm_depreciation(cost: float, residual: float, useful_life: float, factor: float) -> float:
    if cost <= residual or useful_life <= 0 or factor <= 0:
        return 0
    return max((cost - residual) / useful_life * factor, 0)


def wdv_rate(cost: float, residual: float, useful_life: float) -> float:
    if cost <= 0 or residual < 0 or useful_life <= 0 or residual >= cost:
        return 0
    return 1 - pow(residual / cost, 1 / useful_life)


def wdv_depreciation(opening_wdv: float, cost: float, residual: float, useful_life: float, factor: float) -> float:
    if opening_wdv <= residual or factor <= 0:
        return 0
    return max(opening_wdv * wdv_rate(cost, residual, useful_life) * factor, 0)


def cap_at_residual(opening_wdv: float, depreciation: float, residual: float) -> tuple[float, bool]:
    allowed = max(opening_wdv - residual, 0)
    if depreciation > allowed:
        return allowed, True
    return depreciation, False
