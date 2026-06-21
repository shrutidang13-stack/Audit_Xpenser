from app.services.fixed_asset_service import _is_summary_asset_row, _opening_asset_values


def test_opening_asset_values_include_additions_for_depreciation_schedule():
    row = {
        "Asset": "Cooler",
        "Original Cost": 0,
        "Accumulated Depreciation": "",
        "Addition/ New Purchase": 24850,
        "Sold": 0,
        "Depreciatons for the year 2024-25": 2557.479167,
        "Net block 31/03/2025": 22292.520833,
    }

    values = _opening_asset_values(row)

    assert values["opening_gross_block"] == 24850
    assert round(values["opening_accumulated_depreciation"], 2) == 2557.48
    assert round(values["opening_wdv"], 2) == 22292.52


def test_opening_asset_values_use_original_cost_and_current_year_depreciation():
    row = {
        "Asset": "Laptop",
        "Original Cost": 73800,
        "Accumulated Depreciation": 40702.75,
        "Addition/ New Purchase": 0,
        "Sold": 0,
        "Depreciatons for the year 2024-25": 23370,
        "Net block 31/03/2025": 9727.25,
    }

    values = _opening_asset_values(row)

    assert values["opening_gross_block"] == 73800
    assert values["opening_accumulated_depreciation"] == 64072.75
    assert values["opening_wdv"] == 9727.25


def test_fixed_asset_summary_rows_are_skipped():
    assert _is_summary_asset_row("TOTAL")
    assert _is_summary_asset_row("Grand Total")
    assert not _is_summary_asset_row("Furniture")
