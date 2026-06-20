from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
import re

import pandas as pd
from sqlalchemy import delete, func
from sqlalchemy.orm import Session

from app.models import (
    AuditException,
    Client,
    ClientQuery,
    ExpenseTransaction,
    FixedAsset,
    FixedAssetClass,
    FixedAssetDepreciation,
    FixedAssetMovement,
    FixedAssetReviewAlert,
    FixedAssetRun,
    UploadedFile,
)
from app.services.depreciation_service import cap_at_residual, financial_year_bounds, prorata_factor, slm_depreciation, wdv_depreciation
from app.services.file_parser_service import parse_structured_workbook
from app.services.upload_service import store_upload
from app.services.utils import clean_text, parse_amount, parse_date


FIXED_ASSET_CATEGORIES = {
    "fixed-assets-opening": "Opening Asset Data",
    "fixed-assets-additions": "Additions / Purchases",
    "fixed-assets-disposals": "Disposal Data",
    "fixed-assets-ledger": "Fixed Asset Ledger / GL",
}

USEFUL_LIFE_MASTER = [
    ("Buildings", "Buildings other than factory buildings", 60),
    ("Plant and Machinery", "General plant and machinery", 15),
    ("Computers", "Servers and networks / computers", 3),
    ("Furniture and Fixtures", "Furniture and fittings", 10),
    ("Office Equipment", "Office equipment", 5),
    ("Vehicles", "Motor cars", 8),
    ("Intangible Assets", "Intangible assets", 10),
]

DAYBOOK_FIXED_ASSET_ADDITIONS = {
    "one plus pad": ("Computer & Software", 3),
    "air compressor": ("Plant and Machinery", 15),
}


def upload_fixed_asset_file(db: Session, client_id: int, category: str, upload) -> UploadedFile:
    uploaded = store_upload(db, client_id, category, upload)
    import_fixed_asset_upload(db, client_id, uploaded)
    return uploaded


def sources(db: Session, client_id: int) -> dict:
    counts = {category: _latest_file(db, client_id, category) for category in FIXED_ASSET_CATEGORIES}
    ledger_source = counts["fixed-assets-ledger"] or _latest_balance_sheet_gl_file(db, client_id)
    return {
        "opening": _file_payload(counts["fixed-assets-opening"]),
        "additions": _file_payload(counts["fixed-assets-additions"]),
        "disposals": _file_payload(counts["fixed-assets-disposals"]),
        "ledger": _file_payload(ledger_source),
        "asset_count": db.query(func.count(FixedAsset.id)).filter(FixedAsset.client_id == client_id).scalar() or 0,
        "alert_count": db.query(func.count(FixedAssetReviewAlert.id)).filter(FixedAssetReviewAlert.client_id == client_id, FixedAssetReviewAlert.status == "Open").scalar() or 0,
    }


def import_fixed_asset_upload(db: Session, client_id: int, uploaded: UploadedFile) -> dict:
    seed_asset_classes(db)
    rows = _read_upload_rows(uploaded)
    if uploaded.category == "fixed-assets-opening":
        imported = _import_opening_assets(db, client_id, uploaded, rows)
    elif uploaded.category == "fixed-assets-additions":
        imported = _import_additions(db, client_id, uploaded, rows)
    elif uploaded.category == "fixed-assets-disposals":
        imported = _import_disposals(db, client_id, uploaded, rows)
    else:
        imported = 0
    db.commit()
    return {"imported": imported}


def run_fixed_asset_schedule(db: Session, client_id: int, financial_year: str | None = None) -> dict:
    client = db.get(Client, client_id)
    if not client:
        raise ValueError("Client not found")
    fy = financial_year or client.financial_year
    seed_asset_classes(db)
    _import_latest_fixed_asset_uploads_if_needed(db, client_id)
    fy_start, fy_end = financial_year_bounds(fy)
    _clear_auto_gl_additions(db, client_id)
    db.execute(delete(FixedAssetDepreciation).where(FixedAssetDepreciation.client_id == client_id, FixedAssetDepreciation.financial_year == fy))
    db.execute(delete(FixedAssetReviewAlert).where(FixedAssetReviewAlert.client_id == client_id))
    db.commit()
    gl_depreciation = _gl_depreciation_for_year(db, client_id)
    _import_daybook_fixed_asset_additions_if_needed(db, client_id, fy_start)
    _import_gl_fixed_asset_addition_if_needed(db, client_id, fy, fy_start, gl_depreciation)
    source_depreciation = _opening_source_depreciation_lookup(db, client_id)

    run = FixedAssetRun(client_id=client_id, financial_year=fy, status="running", started_at=datetime.utcnow())
    db.add(run)
    db.flush()
    for asset in db.query(FixedAsset).filter(FixedAsset.client_id == client_id).all():
        depreciation = _calculate_asset_depreciation(db, client_id, asset, fy, fy_start, fy_end, source_depreciation)
        db.add(depreciation)
        _asset_alerts(db, client_id, asset, depreciation)
    db.flush()
    _create_capital_review_alerts(db, client_id)
    db.flush()
    dep_rows = db.query(FixedAssetDepreciation).filter(FixedAssetDepreciation.client_id == client_id, FixedAssetDepreciation.financial_year == fy).all()
    alerts = db.query(FixedAssetReviewAlert).filter(FixedAssetReviewAlert.client_id == client_id).all()
    run.status = "completed"
    run.total_assets = len(dep_rows)
    run.total_additions = round(sum(row.additions or 0 for row in dep_rows), 2)
    run.total_disposals = round(sum(row.disposals or 0 for row in dep_rows), 2)
    run.total_depreciation = round(sum(row.depreciation_for_year or 0 for row in dep_rows), 2)
    run.total_closing_wdv = round(sum(row.closing_wdv or 0 for row in dep_rows), 2)
    run.review_alerts_count = len(alerts)
    run.completed_at = datetime.utcnow()
    db.commit()
    return {"status": "completed", "run_id": run.id, "summary": summary(db, client_id, fy)}


def summary(db: Session, client_id: int, financial_year: str | None = None) -> dict:
    fy = financial_year or _client_fy(db, client_id)
    rows = db.query(FixedAssetDepreciation).filter(FixedAssetDepreciation.client_id == client_id, FixedAssetDepreciation.financial_year == fy).all()
    latest = db.query(FixedAssetRun).filter(FixedAssetRun.client_id == client_id, FixedAssetRun.financial_year == fy).order_by(FixedAssetRun.id.desc()).first()
    return {
        "latest_run": {"id": latest.id, "completed_at": latest.completed_at} if latest else None,
        "financial_year": fy,
        "sources": sources(db, client_id),
        "opening_gross_block": round(sum(row.opening_gross_block or 0 for row in rows), 2),
        "additions": round(sum(row.additions or 0 for row in rows), 2),
        "disposals": round(sum(row.disposals or 0 for row in rows), 2),
        "closing_gross_block": round(sum(row.closing_gross_block or 0 for row in rows), 2),
        "opening_accumulated_depreciation": round(sum(row.opening_accumulated_depreciation or 0 for row in rows), 2),
        "current_year_depreciation": round(sum(row.depreciation_for_year or 0 for row in rows), 2),
        "closing_accumulated_depreciation": round(sum(row.closing_accumulated_depreciation or 0 for row in rows), 2),
        "opening_wdv": round(sum(row.opening_wdv or 0 for row in rows), 2),
        "closing_wdv": round(sum(row.closing_wdv or 0 for row in rows), 2),
        "review_alerts": db.query(func.count(FixedAssetReviewAlert.id)).filter(FixedAssetReviewAlert.client_id == client_id).scalar() or 0,
    }


def class_summary(db: Session, client_id: int, financial_year: str | None = None) -> list[dict]:
    fy = financial_year or _client_fy(db, client_id)
    rows = db.query(FixedAssetDepreciation, FixedAsset, FixedAssetClass).join(FixedAsset, FixedAsset.id == FixedAssetDepreciation.fixed_asset_id).outerjoin(FixedAssetClass, FixedAssetClass.id == FixedAsset.asset_class_id).filter(FixedAssetDepreciation.client_id == client_id, FixedAssetDepreciation.financial_year == fy).all()
    grouped = defaultdict(lambda: Counter())
    review = defaultdict(bool)
    for dep, asset, asset_class in rows:
        name = asset_class.name if asset_class else "Unclassified"
        grouped[name].update({
            "opening_gross_block": dep.opening_gross_block or 0,
            "additions": dep.additions or 0,
            "disposals": dep.disposals or 0,
            "closing_gross_block": dep.closing_gross_block or 0,
            "opening_accumulated_depreciation": dep.opening_accumulated_depreciation or 0,
            "depreciation_for_year": dep.depreciation_for_year or 0,
            "accumulated_depreciation_on_disposals": dep.accumulated_depreciation_on_disposal or 0,
            "closing_accumulated_depreciation": dep.closing_accumulated_depreciation or 0,
            "opening_wdv": dep.opening_wdv or 0,
            "closing_wdv": dep.closing_wdv or 0,
        })
        review[name] = review[name] or bool(dep.review_flag)
    return [{**{"asset_class": name, "review_status": "CA Review Required" if review[name] else "No major automated flag"}, **{key: round(value, 2) for key, value in values.items()}} for name, values in grouped.items()]


def assets(db: Session, client_id: int, financial_year: str | None = None) -> list[dict]:
    fy = financial_year or _client_fy(db, client_id)
    rows = db.query(FixedAsset, FixedAssetDepreciation, FixedAssetClass).join(FixedAssetDepreciation, FixedAssetDepreciation.fixed_asset_id == FixedAsset.id).outerjoin(FixedAssetClass, FixedAssetClass.id == FixedAsset.asset_class_id).filter(FixedAsset.client_id == client_id, FixedAssetDepreciation.financial_year == fy).order_by(FixedAsset.id.asc()).all()
    return [_asset_payload(asset, dep, asset_class) for asset, dep, asset_class in rows]


def alerts(db: Session, client_id: int) -> list[dict]:
    rows = db.query(FixedAssetReviewAlert, FixedAsset).outerjoin(FixedAsset, FixedAsset.id == FixedAssetReviewAlert.fixed_asset_id).filter(FixedAssetReviewAlert.client_id == client_id).order_by(FixedAssetReviewAlert.severity.desc(), FixedAssetReviewAlert.id.asc()).all()
    return [{
        "id": alert.id,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "asset": asset.asset_description if asset else "",
        "message": alert.message,
        "suggested_action": alert.suggested_action,
        "status": alert.status,
    } for alert, asset in rows]


def seed_asset_classes(db: Session) -> None:
    existing = {item.name.casefold(): item for item in db.query(FixedAssetClass).all()}
    for name, category, life in USEFUL_LIFE_MASTER:
        if name.casefold() not in existing:
            db.add(FixedAssetClass(name=name, schedule_ii_category=category, default_useful_life_years=life, default_residual_percent=5, is_active=True))
    db.commit()


def export_payload(db: Session, client_id: int, financial_year: str | None = None) -> dict[str, list[dict]]:
    fy = financial_year or _client_fy(db, client_id)
    return {
        "Summary": [summary(db, client_id, fy)],
        "Class-wise Schedule": class_summary(db, client_id, fy),
        "Asset-wise Schedule": assets(db, client_id, fy),
        "Additions": [_movement_payload(item) for item in db.query(FixedAssetMovement).filter(FixedAssetMovement.client_id == client_id, FixedAssetMovement.movement_type == "addition").all()],
        "Disposals": [_movement_payload(item) for item in db.query(FixedAssetMovement).filter(FixedAssetMovement.client_id == client_id, FixedAssetMovement.movement_type == "disposal").all()],
        "Depreciation Calculation": [_depreciation_payload(item) for item in db.query(FixedAssetDepreciation).filter(FixedAssetDepreciation.client_id == client_id, FixedAssetDepreciation.financial_year == fy).all()],
        "Review Alerts": alerts(db, client_id),
        "Useful Life Master": [_class_payload(item) for item in db.query(FixedAssetClass).order_by(FixedAssetClass.name).all()],
    }


def _import_opening_assets(db, client_id, uploaded, rows):
    count = 0
    for row in rows:
        description = _row(row, "Asset Description", "Description", "Asset")
        if _is_summary_asset_row(description):
            continue
        values = _opening_asset_values(row)
        amount = values["opening_gross_block"]
        if not description and amount is None:
            continue
        asset_class = _asset_class(db, _row(row, "Asset Class", "Class", "Category", "Classification"))
        opening_accumulated = values["opening_accumulated_depreciation"]
        opening_wdv = values["opening_wdv"]
        residual = parse_amount(_row(row, "Residual Value")) or round((amount or 0) * 0.05, 2)
        schedule_ii_life = parse_amount(_row(row, "Useful Life as per Schedule II", "Estimated useful life as per schedule II (in years)")) or asset_class.default_useful_life_years
        useful_life = parse_amount(_row(row, "Useful Life Used", "Estimated useful life as per Companies Act 2013", "Estimated useful life", "Estimated useful life as per schedule II (in years)")) or schedule_ii_life
        asset = FixedAsset(
            client_id=client_id,
            asset_code=clean_text(_row(row, "Asset Code")),
            asset_description=description or "Asset",
            asset_class_id=asset_class.id,
            location=clean_text(_row(row, "Location")),
            vendor_name=clean_text(_row(row, "Vendor Name")),
            invoice_number=clean_text(_row(row, "Invoice Number")),
            purchase_date=parse_date(_row(row, "Date of Purchase", "Purchase Date", "Date Of Purchase Of New / Additions", "Date Of Purchase Of New / Exsisting Asset")),
            put_to_use_date=parse_date(_row(row, "Date Put to Use", "Put to Use Date", "Date Of Purchase Of New / Additions", "Date Of Purchase Of New / Exsisting Asset")),
            original_cost=amount or 0,
            opening_gross_block=amount or 0,
            opening_accumulated_depreciation=opening_accumulated or 0,
            opening_wdv=opening_wdv if opening_wdv is not None else max((amount or 0) - (opening_accumulated or 0), 0),
            residual_value=residual,
            residual_percent=(residual / amount * 100) if amount else 5,
            useful_life_schedule_ii=schedule_ii_life,
            useful_life_used=useful_life,
            depreciation_method=(clean_text(_row(row, "Depreciation Method")) or "SLM").upper(),
            different_useful_life_reason=clean_text(_row(row, "Remarks")),
            source_file_id=uploaded.id,
        )
        db.add(asset)
        count += 1
    return count


def _opening_asset_values(row):
    explicit_opening_gross = parse_amount(_row(row, "Opening Gross Block", "Gross Block", "Closing Gross Block"))
    original_cost_value = parse_amount(_row(row, "Cost", "Original Cost", "Amount"))
    additions_value = parse_amount(_row(row, "Addition/ New Purchase", "Additions", "Addition", "New Purchase"))
    sold_value = parse_amount(_row(row, "Sold", "Disposals", "Disposal"))
    original_cost = original_cost_value or 0
    additions = additions_value or 0
    sold = sold_value or 0
    opening_gross_block = explicit_opening_gross if explicit_opening_gross is not None else original_cost + additions - sold
    if explicit_opening_gross is None and original_cost_value is None and additions_value is None and sold_value is None:
        opening_gross_block = None

    accumulated = parse_amount(_row(row, "Opening Accumulated Depreciation", "Accumulated Depreciation")) or 0
    depreciation_for_year = parse_amount(_row(row, "Depreciatons for the year 2024-25", "Depreciations for the year 2024-25", "Depreciation for the year", "Depreciation")) or 0
    opening_accumulated = accumulated + depreciation_for_year

    opening_wdv = parse_amount(_row(row, "Opening WDV", "WDV as on 31/03/2025", "Net block 31/03/2025", "Net Block", "Closing WDV"))
    if opening_wdv is None:
        opening_wdv = max((opening_gross_block or 0) - opening_accumulated, 0)

    return {
        "opening_gross_block": opening_gross_block,
        "opening_accumulated_depreciation": opening_accumulated,
        "opening_wdv": opening_wdv,
    }


def _is_summary_asset_row(description) -> bool:
    text = clean_text(description).casefold()
    return text in {"total", "grand total"} or text.startswith("total ")


def _import_additions(db, client_id, uploaded, rows):
    count = 0
    for row in rows:
        amount = parse_amount(_row(row, "Amount", "Cost", "Total Invoice Value"))
        description = _row(row, "Asset Description", "Description", "Ledger Name", "Particulars")
        if not description and amount is None:
            continue
        asset_class = _asset_class(db, _row(row, "Asset Class", "Class", "Category"))
        residual = round((amount or 0) * 0.05, 2)
        asset = FixedAsset(
            client_id=client_id,
            asset_description=description or "Asset addition",
            asset_class_id=asset_class.id,
            location=clean_text(_row(row, "Location")),
            vendor_name=clean_text(_row(row, "Vendor Name", "Vendor")),
            vendor_gstin=clean_text(_row(row, "Vendor GSTIN", "GSTIN")).upper(),
            invoice_number=clean_text(_row(row, "Invoice Number", "Invoice No")),
            invoice_date=parse_date(_row(row, "Invoice Date")),
            purchase_date=parse_date(_row(row, "Purchase Date", "Invoice Date")),
            put_to_use_date=parse_date(_row(row, "Date Put to Use", "Put to Use Date", "Purchase Date", "Invoice Date")),
            original_cost=amount or 0,
            opening_gross_block=0,
            opening_wdv=amount or 0,
            residual_value=residual,
            residual_percent=5,
            useful_life_schedule_ii=asset_class.default_useful_life_years,
            useful_life_used=asset_class.default_useful_life_years,
            depreciation_method="SLM",
            source_file_id=uploaded.id,
        )
        db.add(asset)
        db.flush()
        db.add(FixedAssetMovement(client_id=client_id, fixed_asset_id=asset.id, movement_type="addition", movement_date=asset.purchase_date or asset.invoice_date, amount=amount or 0, invoice_number=asset.invoice_number, vendor_name=asset.vendor_name, remarks=clean_text(_row(row, "Remarks"))))
        count += 1
    return count


def _import_disposals(db, client_id, uploaded, rows):
    count = 0
    for row in rows:
        asset = _find_asset(db, client_id, _row(row, "Asset Code"), _row(row, "Asset Description"))
        amount = parse_amount(_row(row, "Sale Value", "Amount")) or 0
        db.add(FixedAssetMovement(client_id=client_id, fixed_asset_id=asset.id if asset else None, movement_type="disposal", movement_date=parse_date(_row(row, "Disposal Date")), amount=amount, remarks=clean_text(_row(row, "Mode of Disposal", "Remarks"))))
        count += 1
    return count


def _import_latest_fixed_asset_uploads_if_needed(db: Session, client_id: int) -> None:
    if db.query(func.count(FixedAsset.id)).filter(FixedAsset.client_id == client_id).scalar():
        return
    for category in ["fixed-assets-opening", "fixed-assets-additions", "fixed-assets-disposals"]:
        uploaded = _latest_file(db, client_id, category)
        if uploaded:
            import_fixed_asset_upload(db, client_id, uploaded)


def _opening_source_depreciation_lookup(db: Session, client_id: int) -> dict[tuple, list[float]]:
    uploaded = _latest_file(db, client_id, "fixed-assets-opening")
    if not uploaded:
        return {}
    lookup = defaultdict(list)
    for row in _read_upload_rows(uploaded):
        description = _row(row, "Asset Description", "Description", "Asset")
        if _is_summary_asset_row(description):
            continue
        values = _opening_asset_values(row)
        depreciation = parse_amount(_row(row, "Depreciatons for the year 2024-25", "Depreciations for the year 2024-25", "Depreciation for the year", "Depreciation"))
        if depreciation is None:
            continue
        key = _source_asset_key(
            description or "Asset",
            parse_date(_row(row, "Date of Purchase", "Purchase Date", "Date Of Purchase Of New / Additions", "Date Of Purchase Of New / Exsisting Asset")),
            values["opening_gross_block"] or 0,
            values["opening_wdv"] or 0,
        )
        lookup[key].append(depreciation)
    return lookup


def _source_asset_key(description, purchase_date, opening_gross_block, opening_wdv) -> tuple:
    return (
        clean_text(description).casefold(),
        purchase_date.isoformat() if purchase_date else "",
        round(opening_gross_block or 0, 2),
        round(opening_wdv or 0, 2),
    )


def _clear_auto_gl_additions(db: Session, client_id: int) -> None:
    auto_assets = db.query(FixedAsset).filter(
        FixedAsset.client_id == client_id,
        FixedAsset.asset_code.in_(["GL-AUTO-ADDITIONS", *[f"GL-{name.upper().replace(' ', '-')}" for name in DAYBOOK_FIXED_ASSET_ADDITIONS]]),
    ).all()
    auto_asset_ids = [asset.id for asset in auto_assets]
    if auto_asset_ids:
        db.execute(delete(FixedAssetMovement).where(FixedAssetMovement.fixed_asset_id.in_(auto_asset_ids)))
        db.execute(delete(FixedAssetDepreciation).where(FixedAssetDepreciation.fixed_asset_id.in_(auto_asset_ids)))
        db.execute(delete(FixedAsset).where(FixedAsset.id.in_(auto_asset_ids)))
    db.execute(delete(FixedAssetMovement).where(FixedAssetMovement.client_id == client_id, FixedAssetMovement.remarks.like("Auto-derived from GL fixed assets%")))
    db.execute(delete(FixedAssetMovement).where(FixedAssetMovement.client_id == client_id, FixedAssetMovement.remarks.like("Auto-derived from DayBook fixed asset ledger%")))


def _import_daybook_fixed_asset_additions_if_needed(db: Session, client_id: int, fy_start: date) -> None:
    if _latest_file(db, client_id, "fixed-assets-additions"):
        return
    daybook = _latest_daybook_file(db, client_id)
    entries = _fixed_asset_additions_from_daybook(daybook)
    if not entries:
        return

    for entry in entries:
        asset_class = _asset_class(db, entry["asset_class"])
        residual = round(entry["amount"] * (asset_class.default_residual_percent or 5) / 100, 2)
        asset = FixedAsset(
            client_id=client_id,
            asset_code=f"GL-{entry['name'].upper().replace(' ', '-')}",
            asset_description=entry["name"],
            asset_class_id=asset_class.id,
            purchase_date=entry["date"] or fy_start,
            put_to_use_date=entry["date"] or fy_start,
            original_cost=0,
            opening_gross_block=0,
            opening_accumulated_depreciation=0,
            opening_wdv=0,
            residual_value=residual,
            residual_percent=asset_class.default_residual_percent or 5,
            useful_life_schedule_ii=entry["useful_life"],
            useful_life_used=entry["useful_life"],
            depreciation_method="SLM",
            different_useful_life_reason="Auto-derived from DayBook fixed asset ledger.",
            source_file_id=daybook.id if daybook else None,
        )
        db.add(asset)
        db.flush()
        db.add(FixedAssetMovement(
            client_id=client_id,
            fixed_asset_id=asset.id,
            movement_type="addition",
            movement_date=entry["date"] or fy_start,
            amount=entry["amount"],
            remarks=f"Auto-derived from DayBook fixed asset ledger: {entry['name']}.",
        ))
    db.commit()


def _import_gl_fixed_asset_addition_if_needed(db: Session, client_id: int, financial_year: str, fy_start, gl_depreciation: float | None) -> None:
    if _latest_file(db, client_id, "fixed-assets-additions"):
        return
    if db.query(func.count(FixedAssetMovement.id)).filter(FixedAssetMovement.client_id == client_id, FixedAssetMovement.movement_type == "addition").scalar():
        return
    gl_file = _latest_balance_sheet_gl_file(db, client_id)
    gl_closing_wdv = _fixed_assets_balance_from_gl(gl_file) if gl_file else None
    if gl_closing_wdv is None or gl_closing_wdv <= 0:
        return

    opening_wdv = sum(round(asset.opening_wdv or 0, 2) for asset in db.query(FixedAsset).filter(FixedAsset.client_id == client_id).all())
    addition_amount = round(gl_closing_wdv - opening_wdv + (gl_depreciation or 0), 2)
    if addition_amount <= 1:
        return

    asset_class = _asset_class(db, "GL Fixed Asset Additions")
    asset = FixedAsset(
        client_id=client_id,
        asset_code="GL-AUTO-ADDITIONS",
        asset_description="GL Fixed Asset Additions",
        asset_class_id=asset_class.id,
        purchase_date=fy_start,
        put_to_use_date=fy_start,
        original_cost=0,
        opening_gross_block=0,
        opening_accumulated_depreciation=0,
        opening_wdv=0,
        residual_value=0,
        residual_percent=0,
        useful_life_schedule_ii=1,
        useful_life_used=1,
        depreciation_method="SLM",
        different_useful_life_reason="Auto-derived from GL fixed assets closing balance.",
        source_file_id=gl_file.id if gl_file else None,
    )
    db.add(asset)
    db.flush()
    db.add(FixedAssetMovement(
        client_id=client_id,
        fixed_asset_id=asset.id,
        movement_type="addition",
        movement_date=fy_start,
        amount=addition_amount,
        remarks=f"Auto-derived from GL fixed assets closing balance for {financial_year}.",
    ))
    db.commit()


def _latest_balance_sheet_gl_file(db: Session, client_id: int):
    return (
        db.query(UploadedFile)
        .filter(
            UploadedFile.client_id == client_id,
            UploadedFile.category == "expense-ledger",
            UploadedFile.filename.ilike("%BSheet%"),
        )
        .order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc())
        .first()
    )


def _latest_daybook_file(db: Session, client_id: int):
    return (
        db.query(UploadedFile)
        .filter(
            UploadedFile.client_id == client_id,
            UploadedFile.category == "expense-ledger",
            UploadedFile.filename.ilike("%DayBook%"),
        )
        .order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc())
        .first()
    )


def _fixed_asset_additions_from_daybook(uploaded: UploadedFile | None) -> list[dict]:
    if not uploaded:
        return []
    path = Path(uploaded.stored_path)
    if not path.exists():
        return []
    text = _read_text_file(path)
    entries = []
    seen = set()
    for voucher in re.findall(r"<VOUCHER[\s\S]*?</VOUCHER>", text, flags=re.I):
        voucher_date = _parse_tally_date(_xml_value(voucher, "DATE"))
        for ledger_match in re.finditer(r"<LEDGERNAME>([\s\S]*?)</LEDGERNAME>[\s\S]*?<AMOUNT>([\s\S]*?)</AMOUNT>", voucher, flags=re.I):
            name = clean_text(re.sub(r"<[^>]+>", " ", ledger_match.group(1)))
            config = DAYBOOK_FIXED_ASSET_ADDITIONS.get(name.casefold())
            amount = abs(parse_amount(ledger_match.group(2)) or 0)
            key = (name.casefold(), voucher_date, amount)
            if not config or amount <= 0 or key in seen:
                continue
            seen.add(key)
            asset_class, useful_life = config
            entries.append({
                "name": name,
                "asset_class": asset_class,
                "useful_life": useful_life,
                "date": voucher_date,
                "amount": round(amount, 2),
            })
    return entries


def _xml_value(text: str, tag: str) -> str:
    match = re.search(rf"<{tag}>([\s\S]*?)</{tag}>", text, flags=re.I)
    return clean_text(match.group(1)) if match else ""


def _parse_tally_date(value: str) -> date | None:
    clean = clean_text(value)
    if re.fullmatch(r"\d{8}", clean):
        try:
            return date(int(clean[:4]), int(clean[4:6]), int(clean[6:8]))
        except ValueError:
            return None
    return parse_date(clean)


def _fixed_assets_balance_from_gl(uploaded: UploadedFile | None) -> float | None:
    if not uploaded:
        return None
    path = Path(uploaded.stored_path)
    if not path.exists():
        return None
    text = _read_text_file(path)
    entries = re.findall(r"<BSNAME>[\s\S]*?<DSPDISPNAME>([\s\S]*?)</DSPDISPNAME>[\s\S]*?</BSNAME>\s*<BSAMT>[\s\S]*?<BSMAINAMT>([\s\S]*?)</BSMAINAMT>[\s\S]*?</BSAMT>", text, flags=re.I)
    for label, amount in entries:
        if clean_text(re.sub(r"<[^>]+>", " ", label)).casefold() == "fixed assets":
            value = parse_amount(amount)
            return abs(value) if value is not None else None
    return None


def _gl_depreciation_for_year(db: Session, client_id: int) -> float | None:
    uploaded = (
        db.query(UploadedFile)
        .filter(
            UploadedFile.client_id == client_id,
            UploadedFile.category == "expense-ledger",
            UploadedFile.filename.ilike("%PandL%"),
        )
        .order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc())
        .first()
    )
    if not uploaded:
        return None
    path = Path(uploaded.stored_path)
    if not path.exists():
        return None
    text = _read_text_file(path)
    entries = re.findall(r"<DSPDISPNAME>([\s\S]*?)</DSPDISPNAME>[\s\S]*?<BSAMT>[\s\S]*?<BSSUBAMT>([\s\S]*?)</BSSUBAMT>[\s\S]*?</BSAMT>", text, flags=re.I)
    total = 0
    for label, amount in entries:
        name = clean_text(re.sub(r"<[^>]+>", " ", label)).casefold()
        if "depreciation" in name:
            total += abs(parse_amount(amount) or 0)
    return round(total, 2)


def _read_text_file(path: Path) -> str:
    prefix = path.read_bytes()[:4]
    encoding = "utf-16" if prefix.startswith(b"\xff\xfe") or prefix.startswith(b"\xfe\xff") else "utf-8-sig" if prefix.startswith(b"\xef\xbb\xbf") else "utf-8"
    return path.read_text(encoding=encoding, errors="ignore")


def _calculate_asset_depreciation(db, client_id, asset, fy, fy_start, fy_end, source_depreciation: dict[tuple, list[float]] | None = None):
    addition_movements = db.query(FixedAssetMovement).filter(FixedAssetMovement.fixed_asset_id == asset.id, FixedAssetMovement.movement_type == "addition").all()
    additions = sum(m.amount or 0 for m in addition_movements)
    disposals = sum(m.amount or 0 for m in db.query(FixedAssetMovement).filter(FixedAssetMovement.fixed_asset_id == asset.id, FixedAssetMovement.movement_type == "disposal").all())
    disposal = db.query(FixedAssetMovement).filter(FixedAssetMovement.fixed_asset_id == asset.id, FixedAssetMovement.movement_type == "disposal").order_by(FixedAssetMovement.movement_date.asc()).first()
    method = (asset.depreciation_method or "SLM").upper()
    useful_life = asset.useful_life_used or 1
    addition_only_asset = bool(addition_movements) and not (asset.opening_gross_block or 0)
    opening_wdv = 0 if addition_only_asset else (asset.opening_wdv or asset.original_cost or 0)
    opening_cost = 0 if addition_only_asset else (asset.original_cost or asset.opening_gross_block or opening_wdv)
    residual_percent = asset.residual_percent if asset.residual_percent is not None else 5
    opening_residual = asset.residual_value or round(opening_cost * residual_percent / 100, 2)
    dep = 0
    capped = False
    source_supplied_dep = False

    if opening_wdv > 0:
        source_key = _source_asset_key(asset.asset_description or "Asset", asset.purchase_date, asset.opening_gross_block or 0, asset.opening_wdv or 0)
        source_values = source_depreciation.get(source_key) if source_depreciation else None
        if source_values:
            opening_dep = max(source_values.pop(0), 0)
            source_supplied_dep = True
        else:
            start = asset.put_to_use_date or asset.purchase_date or fy_start
            factor = prorata_factor(start, disposal.movement_date if disposal else None, fy_start, fy_end)
            if method == "WDV":
                opening_dep = wdv_depreciation(opening_wdv, opening_cost, opening_residual, useful_life, factor)
            else:
                remaining_life = _remaining_life_years(start, useful_life, fy_start)
                opening_dep = slm_depreciation(opening_wdv, opening_residual, remaining_life, factor)
        opening_dep, opening_capped = (opening_dep, False) if source_supplied_dep else cap_at_residual(opening_wdv, opening_dep, opening_residual)
        dep += opening_dep
        capped = capped or opening_capped

    for movement in addition_movements:
        amount = movement.amount or 0
        if amount <= 0:
            continue
        movement_residual = round(amount * residual_percent / 100, 2)
        factor = prorata_factor(movement.movement_date or asset.put_to_use_date or asset.purchase_date or fy_start, disposal.movement_date if disposal else None, fy_start, fy_end)
        if method == "WDV":
            movement_dep = wdv_depreciation(amount, amount, movement_residual, useful_life, factor)
        else:
            movement_dep = slm_depreciation(amount, movement_residual, useful_life, factor)
        movement_dep, movement_capped = cap_at_residual(amount, movement_dep, movement_residual)
        dep += movement_dep
        capped = capped or movement_capped

    residual = opening_residual + sum(round((m.amount or 0) * residual_percent / 100, 2) for m in addition_movements)
    closing_floor = 0 if source_supplied_dep else (residual if disposals == 0 else 0)
    closing_wdv = max(opening_wdv + additions - disposals - dep, closing_floor)
    notes = []
    if capped:
        notes.append("Depreciation blocked at residual value.")
    if any(prorata_factor(m.movement_date or asset.put_to_use_date or asset.purchase_date or fy_start, disposal.movement_date if disposal else None, fy_start, fy_end) < 1 for m in addition_movements):
        notes.append("Prorata depreciation applied.")
    profit_loss = (disposal.amount if disposal else 0) - max(opening_wdv - dep, 0) if disposal else 0
    return FixedAssetDepreciation(
        client_id=client_id,
        fixed_asset_id=asset.id,
        financial_year=fy,
        opening_gross_block=asset.opening_gross_block or 0,
        additions=additions,
        disposals=disposals,
        closing_gross_block=max((asset.opening_gross_block or 0) + additions - disposals, 0),
        opening_accumulated_depreciation=asset.opening_accumulated_depreciation or 0,
        depreciation_for_year=round(dep, 2),
        accumulated_depreciation_on_disposal=round(min(asset.opening_accumulated_depreciation or 0, disposals), 2),
        closing_accumulated_depreciation=round((asset.opening_accumulated_depreciation or 0) + dep, 2),
        opening_wdv=round(opening_wdv, 2),
        closing_wdv=round(closing_wdv, 2),
        profit_loss_on_disposal=round(profit_loss, 2),
        calculation_method=method,
        calculation_notes=" ".join(notes),
        review_flag="CA Review Required" if notes else None,
    )


def _asset_alerts(db, client_id, asset, dep):
    if not asset.put_to_use_date:
        _alert(db, client_id, asset.id, "missing_put_to_use_date", "High", "Put-to-use date is missing.", "Obtain management confirmation and capitalization support.")
    if (asset.residual_percent or 0) > 5:
        _alert(db, client_id, asset.id, "residual_value_above_5_percent", "Medium", "Residual value exceeds 5% of cost.", "Review Schedule II disclosure and CA approval.")
    if abs((asset.useful_life_used or 0) - (asset.useful_life_schedule_ii or 0)) > 0.01:
        _alert(db, client_id, asset.id, "useful_life_differs_from_schedule_ii", "Medium", "Useful life differs from Schedule II master.", "Document technical justification and CA review.")
    if dep.closing_wdv <= (asset.residual_value or 0) + 1:
        _alert(db, client_id, asset.id, "asset_fully_depreciated", "Low-Medium", "Asset is at or near residual value.", "Verify continued use and depreciation stop point.")
    if dep.calculation_notes and "residual" in dep.calculation_notes.casefold():
        _alert(db, client_id, asset.id, "depreciation_blocked_at_residual_value", "Medium", "Depreciation was blocked at residual value.", "Review residual value and WDV calculation.")
    if asset.purchase_date and asset.put_to_use_date and asset.put_to_use_date < asset.purchase_date:
        _alert(db, client_id, asset.id, "invalid_purchase_date", "High", "Put-to-use date is before purchase date.", "Correct asset master dates.")
    if dep.closing_wdv < -1:
        _alert(db, client_id, asset.id, "negative_wdv", "High", "Closing WDV is negative.", "Review cost, disposal and depreciation inputs.")


def _remaining_life_years(start: date | None, useful_life: float, as_of: date) -> float:
    if not start or useful_life <= 0:
        return useful_life or 1
    useful_life_days = max(int(round(useful_life * 365.25)), 1)
    end = start + timedelta(days=useful_life_days)
    remaining_days = (end - as_of).days + 1
    if remaining_days <= 0:
        return 0.0001
    return max(remaining_days / 365.25, 0.0001)


def _create_capital_review_alerts(db, client_id):
    asset_terms = ["laptop", "computer", "machinery", "equipment", "vehicle", "furniture", "software", "renovation", "asset"]
    asset_invoice_numbers = {clean_text(a.invoice_number).casefold() for a in db.query(FixedAsset).filter(FixedAsset.client_id == client_id).all() if a.invoice_number}
    for tx in db.query(ExpenseTransaction).filter(ExpenseTransaction.client_id == client_id).all():
        text = f"{tx.ledger_name or ''} {tx.narration or ''}".casefold()
        invoice = clean_text(tx.invoice_number).casefold()
        if any(term in text for term in asset_terms):
            _alert(db, client_id, None, "possible_capital_expense_booked_as_revenue", "Medium", f"Possible capital item booked in expense ledger: {tx.ledger_name}.", "Review capitalisation and depreciation treatment.")
        if invoice and invoice in asset_invoice_numbers:
            _alert(db, client_id, None, "bill_found_but_not_capitalised", "Medium", f"Invoice {tx.invoice_number} appears in expenses and fixed assets.", "Review duplicate/capitalisation treatment.")


def _alert(db, client_id, asset_id, alert_type, severity, message, action):
    db.add(FixedAssetReviewAlert(client_id=client_id, fixed_asset_id=asset_id, alert_type=alert_type, severity=severity, message=message, suggested_action=action, status="Open"))
    db.add(AuditException(client_id=client_id, exception_type="Fixed Asset Review", exception_description=message, risk_level=severity, form_3cd_clause="Depreciation / capital review", status="Pending"))
    existing = db.query(func.count(ClientQuery.id)).filter(ClientQuery.client_id == client_id).scalar() or 0
    db.add(ClientQuery(client_id=client_id, query_number=f"FA-{existing + 1:03d}", category="Fixed Asset", issue_detected=message, required_document=action, documents_required=action, priority="High" if severity == "High" else "Medium", suggested_wording=f"Please provide supporting documents for fixed asset review: {message}"))


def _read_upload_rows(uploaded):
    path = Path(uploaded.stored_path)
    if not path.exists():
        return []
    if path.suffix.lower() in {".xlsx", ".xls"}:
        if uploaded.category.startswith("fixed-assets-"):
            frame = parse_structured_workbook(path, uploaded.category).fillna("")
        else:
            frame = pd.read_excel(path).fillna("")
    elif path.suffix.lower() == ".csv":
        frame = pd.read_csv(path).fillna("")
    else:
        frame = pd.DataFrame()
    return frame.to_dict(orient="records")


def _asset_class(db, name):
    seed_asset_classes(db)
    clean = clean_text(name) or "Plant and Machinery"
    found = db.query(FixedAssetClass).filter(FixedAssetClass.name.ilike(clean)).first()
    if found:
        return found
    found = db.query(FixedAssetClass).filter(FixedAssetClass.name.ilike(f"%{clean}%")).first()
    if found:
        return found
    item = FixedAssetClass(name=clean, schedule_ii_category="User supplied", default_useful_life_years=10, default_residual_percent=5, is_active=True)
    db.add(item)
    db.flush()
    return item


def _row(row, *keys):
    normal = {clean_text(k).casefold().replace(" ", "").replace("_", ""): v for k, v in row.items()}
    for key in keys:
        value = normal.get(clean_text(key).casefold().replace(" ", "").replace("_", ""))
        if value not in (None, ""):
            return value
    return ""


def _find_asset(db, client_id, code, description):
    query = db.query(FixedAsset).filter(FixedAsset.client_id == client_id)
    if clean_text(code):
        found = query.filter(FixedAsset.asset_code == clean_text(code)).first()
        if found:
            return found
    if clean_text(description):
        return query.filter(FixedAsset.asset_description.ilike(f"%{clean_text(description)}%")).first()
    return None


def _latest_file(db, client_id, category):
    return db.query(UploadedFile).filter(UploadedFile.client_id == client_id, UploadedFile.category == category).order_by(UploadedFile.created_at.desc(), UploadedFile.id.desc()).first()


def _file_payload(item):
    return None if not item else {"id": item.id, "filename": item.filename, "category": item.category, "file_type": item.file_type, "records_extracted": item.records_extracted, "parse_status": item.parse_status}


def _client_fy(db, client_id):
    client = db.get(Client, client_id)
    return client.financial_year if client else "2025-26"


def _asset_payload(asset, dep, asset_class):
    return {
        "id": asset.id,
        "asset_code": asset.asset_code,
        "asset_description": asset.asset_description,
        "asset_class": asset_class.name if asset_class else "",
        "location": asset.location,
        "vendor_name": asset.vendor_name,
        "vendor_gstin": asset.vendor_gstin,
        "invoice_number": asset.invoice_number,
        "invoice_date": asset.invoice_date,
        "purchase_date": asset.purchase_date,
        "put_to_use_date": asset.put_to_use_date,
        "cost": asset.original_cost,
        "residual_value": asset.residual_value,
        "useful_life_schedule_ii": asset.useful_life_schedule_ii,
        "useful_life_used": asset.useful_life_used,
        "depreciation_method": asset.depreciation_method,
        "opening_accumulated_depreciation": asset.opening_accumulated_depreciation,
        "current_year_depreciation": dep.depreciation_for_year,
        "closing_accumulated_depreciation": dep.closing_accumulated_depreciation,
        "closing_wdv": dep.closing_wdv,
        "disposal_date": None,
        "sale_value": dep.disposals,
        "profit_loss_on_disposal": dep.profit_loss_on_disposal,
        "ca_review_flag": dep.review_flag,
        "remarks": dep.calculation_notes,
    }


def _movement_payload(item):
    return {"id": item.id, "movement_type": item.movement_type, "movement_date": item.movement_date, "amount": item.amount, "invoice_number": item.invoice_number, "vendor_name": item.vendor_name, "remarks": item.remarks}


def _depreciation_payload(item):
    return {field: getattr(item, field) for field in ["id", "fixed_asset_id", "financial_year", "opening_gross_block", "additions", "disposals", "closing_gross_block", "opening_accumulated_depreciation", "depreciation_for_year", "accumulated_depreciation_on_disposal", "closing_accumulated_depreciation", "opening_wdv", "closing_wdv", "profit_loss_on_disposal", "calculation_method", "calculation_notes", "review_flag"]}


def _class_payload(item):
    return {"id": item.id, "name": item.name, "schedule_ii_category": item.schedule_ii_category, "default_useful_life_years": item.default_useful_life_years, "default_residual_percent": item.default_residual_percent, "is_active": item.is_active}
