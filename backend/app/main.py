from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.database import Base, engine
from app import models  # noqa: F401


Base.metadata.create_all(bind=engine)

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


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "auditxpenser"}
