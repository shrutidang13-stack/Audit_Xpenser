# MSME Verification Refactor

## Architecture

- React imports creditors from Tally through the backend.
- Backend enriches imported creditors with `VendorMaster` data.
- The frontend blocks report generation until every imported vendor is either:
  - verified through Udyam, or
  - saved as Non-MSME by the user.
- Only vendors with `verificationStatus = verified` and `isMSME = true` enter MSME delay, interest, Form-1, and disallowance reporting.

## Backend APIs

- `GET /api/vendors/unverified?names=Vendor A|Vendor B`
- `POST /api/vendors/verify-udyam`
- `POST /api/vendors/save-status`
- `GET /api/vendors/master`
- `GET /api/vendors/audit-trail`
- `GET /api/creditors?from=YYYYMMDD&to=YYYYMMDD`
- `GET /api/status`

## Storage

The MVP implementation persists operational data in SQLite:

- `backend/data/msme-guard.sqlite`

The schema/migration reference is in:

- `backend/migrations/001_vendor_master_schema.sql`

## Security

- Frontend Anthropic keys were removed.
- The optional AI compliance chat now calls `POST /api/ai/chat`; the key lives in backend `.env`.
- The backend uses `dotenv`, `helmet`, `cors`, and `express-rate-limit`.
- Configure allowed origins using `CORS_ORIGINS`.

## GST Verification Provider

GST verification is adapter-based and never assumed in production.

Environment variables:

```bash
GST_VERIFIER_PROVIDER=sandbox
GST_API_BASE_URL=https://provider.example
GST_API_KEY=your-key
GST_API_SECRET=your-secret-if-required
GST_VERIFY_TIMEOUT_MS=15000
GST_ALLOW_ASSUMED_PASS=false
```

Supported provider names:

- `sandbox`
- `surepass`
- `mock`

Use `mock` only in development/tests. Recommended production providers are external licensed GST/KYB verification providers. If no provider is configured, if the provider times out, or if the response is uncertain, vendors are marked `manual_review_required` and excluded from final verified reports. `GST_ALLOW_ASSUMED_PASS=true` is for local development only and must not be used in production.

Manual GST evidence workflow:

- `POST /api/vendors/:id/gst-proof` stores GST proof URL/metadata and marks `pending_manual_review`.
- `POST /api/vendors/:id/gst-approve` marks GST as `approved`; approved GST can enter reports if Udyam is also verified/approved.
- `POST /api/vendors/:id/gst-reject` marks GST as `rejected`.
- `GET /api/vendors/gst-manual-review` lists GST vendors requiring review.

## Udyam Verification

The verifier:

- validates Udyam format before browser automation
- retries failed attempts
- handles timeouts and manual/captcha fallback
- closes Puppeteer cleanly
- writes failure screenshots under `backend/storage/udyam-failures`
- returns structured verification data

Manual evidence workflow:

- `POST /api/vendors/:id/udyam-proof` stores proof URL/metadata and marks the vendor `pending_manual_review`.
- `POST /api/vendors/:id/udyam-approve` marks proof as `approved`; approved vendors may enter reports if GST status is passed.
- `POST /api/vendors/:id/udyam-reject` marks proof as `rejected`; rejected vendors remain excluded.
- `GET /api/vendors/manual-review` lists `manual_fallback_required` and `pending_manual_review` vendors.

Manual verification checklist:

- Captcha/anti-bot/timeout from Udyam automation must create `manual_fallback_required`.
- `manual_fallback_required`, `pending_manual_review`, `rejected`, and `not_started` vendors must not appear in final CSV/XML report vendors.
- Approved proof vendors may appear in final reports only when GST status is `passed`.
- CSV/XML exports include an excluded vendors section with the exclusion reason.
- `GET /api/tally/health` must return clear errors when TallyPrime is closed, XML server is disabled, port 9000 is unreachable, no company is loaded, or XML is invalid.
- In `NODE_ENV=production`, backend auth requires `FIREBASE_SERVICE_ACCOUNT_PATH`; missing or invalid files fail startup with a clear error.
- `POST /api/run-full-audit` returns database, Firebase, Tally, import, Udyam/manual review, and report-generation summary.

## Running

Install dependencies:

```bash
npm install
```

Start the full MVP app. This runs both the Express backend and React frontend:

```bash
npm start
```

Start backend only:

```bash
npm run start:backend
```

Start React only:

```bash
npm run start:frontend
```

If the old `tally-proxy.js` is needed for manual debugging, it now defaults to port `3002`. The Express backend owns port `3001`.

For local backend smoke testing without Firebase tokens only, set:

```bash
DISABLE_BACKEND_AUTH=true
```

Do not use that setting for real users.
