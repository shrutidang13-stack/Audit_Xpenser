from io import BytesIO

import pandas as pd
from sqlalchemy.orm import Session

from app.services.fixed_asset_service import export_payload


def fixed_asset_excel(db: Session, client_id: int, financial_year: str | None = None) -> BytesIO:
    output = BytesIO()
    payload = export_payload(db, client_id, financial_year)
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for sheet, rows in payload.items():
            frame = pd.DataFrame(rows)
            if frame.empty:
                frame = pd.DataFrame([{"status": "No data available"}])
            frame = frame.rename(columns={
                "opening_wdv": "Opening Net Block",
                "closing_wdv": "Closing Net Block",
            })
            frame.to_excel(writer, index=False, sheet_name=sheet[:31])
    output.seek(0)
    return output
