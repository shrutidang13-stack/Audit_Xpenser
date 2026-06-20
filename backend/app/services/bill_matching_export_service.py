from io import BytesIO

import pandas as pd
from sqlalchemy.orm import Session

from app.services.bill_matching_service import export_payload


def bill_matching_excel(db: Session, client_id: int) -> BytesIO:
    output = BytesIO()
    payload = export_payload(db, client_id)
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for sheet, rows in payload.items():
            frame = pd.DataFrame(rows)
            if frame.empty:
                frame = pd.DataFrame([{"status": "No data available"}])
            frame.to_excel(writer, index=False, sheet_name=sheet[:31])
    output.seek(0)
    return output
