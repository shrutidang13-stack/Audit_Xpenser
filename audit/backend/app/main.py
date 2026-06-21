from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.api.audit import router as audit_router
from app.api.bill_matching import router as bill_matching_router
from app.api.ca_dashboard import router as ca_dashboard_router
from app.api.fixed_assets import router as fixed_assets_router
from app.api.gst_reco import router as gst_reco_router
from app.api.reports import router as reports_router
from app.api.tds_audit import router as tds_audit_router
from app.api.routes import router
from app.core.database import Base, engine
from app import models  # noqa: F401
from app.services.retention_service import trim_log_files
from app.services.schema_service import ensure_reporting_schema


Base.metadata.create_all(bind=engine)
ensure_reporting_schema()
trim_log_files(Path(__file__).resolve().parents[2])

app = FastAPI(
    title="AuditXpenser API",
    description="AI Expense Verification & Tax Audit Risk Engine with cautious CA review outputs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(ca_dashboard_router)
app.include_router(audit_router)
app.include_router(fixed_assets_router)
app.include_router(bill_matching_router)
app.include_router(gst_reco_router)
app.include_router(reports_router)
app.include_router(tds_audit_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "auditxpenser"}
