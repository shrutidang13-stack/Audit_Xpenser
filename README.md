# Final CA Suite

This workspace keeps the two CA applications independent and connects them through APIs only.

```text
final_ca_suite/
  audit/  AuditXpenser FastAPI + React dashboard
  msme/   MSME Guard Node/Express + React app
```

## Architecture

- AuditXpenser remains the main dashboard.
- MSME Guard runs as a separate service, normally on `http://127.0.0.1:3001`.
- The AuditXpenser frontend calls only the AuditXpenser backend.
- The AuditXpenser backend optionally calls MSME Guard through `MSME_API_BASE_URL`.
- If MSME Guard is offline or not configured, AuditXpenser continues to work and the Complete CA Dashboard shows the MSME status as unavailable.

## AuditXpenser

```powershell
cd audit\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```powershell
cd audit\frontend
npm install
npm run dev
```

AuditXpenser defaults:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

Optional MSME connector settings in `audit/backend/.env`:

```env
MSME_ENABLED=true
MSME_API_BASE_URL=http://127.0.0.1:3001
MSME_TIMEOUT_SECONDS=30
MSME_API_TOKEN=
```

## MSME Guard

```powershell
cd msme
npm install
npm run start:backend
```

MSME Guard backend defaults:

- Backend: `http://127.0.0.1:3001`
- Tally XML server target: `http://127.0.0.1:9000`

For local integration without Firebase bearer tokens:

```env
DISABLE_BACKEND_AUTH=true
```

## Combined Dashboard

AuditXpenser exposes:

```text
GET /api/ca-dashboard/{client_id}
```

The frontend page is:

```text
/client/{client_id}/ca-dashboard
```

It combines:

- AuditXpenser expense audit, GST/TDS/RCM, Form 3CD and client query data
- MSME Guard sundry creditors, profit and loss, trial balance, balance sheet, payment evidence, 43B(h), interest and Form 3CD data when MSME Guard is available

## Notes

The `msme/` folder is kept as an independent source checkout. Large generated/cache/legal binary artifacts from the upstream repository are intentionally excluded from this local suite copy to avoid unreliable multi-hundred-MB transfers. Application source, backend routes/controllers/services, frontend source, package files, and small legal rule metadata are present.
