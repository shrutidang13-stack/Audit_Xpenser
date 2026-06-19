# AuditXpenser

AuditXpenser is a CA-facing expense verification and tax audit risk review system. It lets auditors upload real client records, parse Day Book and supporting files, run automated audit checks, review risk dashboards, generate client queries, and export audit working papers.

The current hackathon build is seeded for:

- Client: Nxtmobility Energy Private Limited
- PAN: AAHCN9637N
- GSTIN: 09AAHCN9637N1ZK
- Financial year: 2025-26

AuditXpenser uses cautious professional wording such as "Possible review required", "Potential Form 3CD impact", "Indicative risk score", and "CA Review Required". It does not provide final legal conclusions.

## Problem Statement

Expense audit work requires checking Day Books, bills, vouchers, TDS challans, GST records, and supporting documents across disconnected files. This makes it hard for CAs to quickly identify missing bills, duplicate invoices, statutory review areas, capital-vs-revenue risks, and Form 3CD impact points.

AuditXpenser brings those records into one upload-first workflow and creates audit-ready review outputs from actual uploaded data.

## Key Features

- Upload-first workflow with a seeded client workspace
- Day Book / Tally Book upload and parsing
- Bill, invoice, voucher, TDS challan, GST, and supporting document uploads
- Column mapping preview for tabular files
- Rule-based expense classification
- Bill-to-ledger matching
- Missing bill and duplicate/suspicious bill flags
- TDS, GST, and RCM review alerts
- Capital-vs-revenue review cases
- Business purpose review flags
- Indicative risk scoring
- Potential Form 3CD impact mapping
- Client query generation
- Excel exception reports
- Word working paper export
- Mock AI fallback when API keys are not configured

## Tech Stack

- Frontend: React, Tailwind CSS, React Router, Axios, Recharts, TanStack Table
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL through Docker Compose, with SQLite fallback for local development
- File processing: pandas, openpyxl, xlrd, pdfplumber, PyMuPDF, Pillow, xmltodict
- Exports: openpyxl/pandas and python-docx
- AI layer: mock provider by default, with environment hooks for OpenAI/Gemini

## Folder Structure

```text
auditxpenser/
  backend/
    app/
      api/
      core/
      models/
      schemas/
      services/
    requirements.txt
    Dockerfile
  frontend/
    src/
      components/
      lib/
      pages/
    package.json
    Dockerfile
  sample-data/
  docker-compose.yml
  README.md
```

## Environment Variables

Create `backend/.env` for local backend runs:

```env
DATABASE_URL=sqlite:///./auditxpenser.db
AI_PROVIDER=mock
OPENAI_API_KEY=
GEMINI_API_KEY=
UPLOAD_DIR=uploads
APP_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_USE_TLS=true
```

For Docker Compose:

```env
DATABASE_URL=postgresql://auditxpenser:auditxpenser@db:5432/auditxpenser
```

AI provider failures never block the audit workflow. If API keys are missing or a provider fails, AuditXpenser falls back to mock AI.

## Docker Setup

From the project folder:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/api/health
- API docs: http://localhost:8000/docs

## Local Setup

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Upload Areas

The current hackathon screen focuses on:

- Day Book / Tally Day Book
- Tally Book / Trial Balance
- Bills / Invoices / Vouchers
- TDS Challan
- GST Data / GSTR-2B
- Supporting Documents

Supported formats:

- `.xlsx`
- `.xls`
- `.csv`
- `.pdf`
- `.jpg`
- `.jpeg`
- `.png`
- `.xml`
- `.json`

Unreadable or partially readable files are stored and marked for CA review rather than crashing the workflow.

## Demo Flow

1. Open the app.
2. The seeded Nxtmobility client workspace loads automatically.
3. Upload the Day Book or Tally Book / Trial Balance.
4. Upload bills, invoices, vouchers, TDS challan, GST data, and supporting documents.
5. Review column mapping where applicable.
6. Run Expense Audit.
7. Review dashboard and exception pages.
8. Export client queries, exception report, and working paper.

## Safety And Language Policy

AuditXpenser avoids final legal terms such as:

- Disallowed
- Non-compliant
- Default confirmed
- Wrong treatment
- Tax violation

Preferred wording:

- Possible review required
- Potential Form 3CD impact
- Indicative risk score
- CA Review Required
- Suggested query
- Possible statutory review

## Known Limitations

- OCR for images is optional and not enabled by default.
- PDF and XML extraction are best-effort.
- Rule-based checks are indicative and require CA judgement.
- Alembic migrations are not included in this MVP.
- Authentication and role-based permissions are not included.
- Direct GST/TDS portal integrations are future scope.

## Future Scope

- Direct Tally API integration
- GST portal integration
- TDS return reconciliation
- Bank statement payment proof matching
- AI sampling engine
- Multi-year expense trend analysis
- Email/WhatsApp query sending
- Full Form 3CD expansion
- Peer-review-ready audit documentation pack
- Vendor MCA/GST status verification
