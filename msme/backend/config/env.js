require("dotenv").config({ quiet: true });

const parseOrigins = (value) =>
  (value || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT || 3001),
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
  tallyHost: process.env.TALLY_HOST || "127.0.0.1",
  tallyPort: Number(process.env.TALLY_PORT || 9000),
  tallyCompanyName: process.env.TALLY_COMPANY_NAME || "",
  databasePath: process.env.DATABASE_PATH || "backend/data/msme-guard.sqlite",
  udyamFailureDir: process.env.UDYAM_FAILURE_DIR || "backend/storage/udyam-failures",
  udyamFallbackDataPath: process.env.UDYAM_FALLBACK_DATA_PATH || "C:\\Users\\shank\\Documents\\MSM\\msme\\data05.06.2026msme",
  udyamVerifierEngine: process.env.UDYAM_VERIFIER_ENGINE || "selenium",
  udyamOcrEnabled: process.env.UDYAM_OCR_ENABLED !== "false",
  udyamOcrPython: process.env.UDYAM_OCR_PYTHON || "python",
  tallyAllowUnfilteredVoucherRetry: process.env.TALLY_ALLOW_UNFILTERED_VOUCHER_RETRY === "true",
  msmeBankRatePercent: Number(process.env.MSME_BANK_RATE_PERCENT || 5.5),
  rbiCurrentRateUrls: parseCsv(process.env.RBI_CURRENT_RATE_URLS),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicChatModel: process.env.ANTHROPIC_CHAT_MODEL || "claude-sonnet-4-20250514",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "msme-guard",
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "",
  authDisabled: process.env.DISABLE_BACKEND_AUTH === "true",
};
