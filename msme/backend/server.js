const express = require("express");
const env = require("./config/env");
const tallyService = require("./services/tally.service");
const securityMiddleware = require("./middleware/security");
const tallyRoutes = require("./routes/tallyRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const aiRoutes = require("./routes/aiRoutes");
const reportRoutes = require("./routes/reportRoutes");
const auditRoutes = require("./routes/auditRoutes");
const purchaseInvoiceRoutes = require("./routes/purchaseInvoiceRoutes");
const legalRoutes = require("./routes/legalRoutes");
const msmeRoutes = require("./routes/msmeRoutes");
const mcaMsme1Routes = require("./routes/mcaMsme1Routes");
const mcaMsme1FilingAutomationRoutes = require("./routes/mcaMsme1FilingAutomationRoutes");
const taxAuditRoutes = require("./routes/taxAuditRoutes");
const rbiBankRateRoutes = require("./routes/rbiBankRateRoutes");
const complianceRoutes = require("./routes/complianceRoutes");
const { requireAuth } = require("./middleware/auth");

const app = express();

securityMiddleware(app);
app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: ["text/xml", "application/xml", "text/plain"], limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "msme-guard-backend" });
});

app.use("/api", requireAuth);
app.use("/api", tallyRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api", purchaseInvoiceRoutes);
app.use("/api", reportRoutes);
app.use("/api", auditRoutes);
app.use("/api", legalRoutes);
app.use("/api", msmeRoutes);
app.use("/api", mcaMsme1Routes);
app.use("/api", mcaMsme1FilingAutomationRoutes);
app.use("/api", taxAuditRoutes);
app.use("/api", rbiBankRateRoutes);
app.use("/api", complianceRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.type("text/plain").send(
    [
      "MSME Guard Backend",
      "GET  /api/health",
      "GET  /api/status",
      "POST /api/tally/import",
      "GET  /api/tally/imports/:id",
      "GET  /api/vendors/master",
      "POST /api/vendors/verify-udyam",
      "POST /api/vendors/save-status",
      "GET  /api/purchase-invoices",
      "POST /api/purchase-invoices",
      "GET  /api/legal/rules",
      "POST /api/msme/interest-calculator",
      "POST /api/mca/msme1/generate",
      "POST /api/reports/msme",
      "POST /api/tax-audit/reports",
      "GET  /api/compliance/risk-score/:reportId",
      "POST /api/compliance/payment-simulation",
      "POST /api/run-full-audit",
    ].join("\n")
  );
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Internal server error",
    ...(error.diagnostics ? { diagnostics: error.diagnostics } : {}),
  });
});

const server = app.listen(env.port, "127.0.0.1", () => {
  console.log(`MSME Guard backend running on http://127.0.0.1:${env.port}`);
  console.log(`Forwarding Tally XML requests to http://${env.tallyHost}:${env.tallyPort}`);
  console.log(`Backend PID ${process.pid}; Tally voucher exporter: batched, timeout ${process.env.TALLY_VOUCHER_TIMEOUT_MS || 60000}ms`);
  tallyService.startupValidation().catch((error) => {
    console.warn(`[tally] startup validation failed: ${error.message}`);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.port} is already in use. Stop the existing backend or set PORT to another value.`);
    return;
  }
  console.error("MSME Guard backend startup error:", error);
});

module.exports = { app, server };
