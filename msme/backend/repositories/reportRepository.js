const crypto = require("crypto");
const db = require("../config/database");

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function mapReport(row) {
  if (!row) return null;
  const payload = parseJson(row.report_json, []);
  const included = Array.isArray(payload) ? payload : payload.included || [];
  const excluded = Array.isArray(payload) ? [] : payload.excluded || [];
  return {
    id: row.id,
    importRunId: row.import_run_id,
    fiscalYear: row.fiscal_year,
    status: row.status,
    summary: parseJson(row.summary_json, {}),
    report: included,
    excluded,
    schedules: Array.isArray(payload) ? {} : payload.schedules || {},
    createdBy: row.created_by || "",
    createdAt: row.created_at,
  };
}

function createReport({ importRunId, fiscalYear, summary, report, actor }) {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO compliance_reports (
      id, import_run_id, fiscal_year, status, summary_json, report_json, created_by, created_at
    ) VALUES (?, ?, ?, 'generated', ?, ?, ?, ?)
  `).run(id, importRunId, fiscalYear, JSON.stringify(summary), JSON.stringify(report), actor || "unknown", nowIso());
  return getReport(id);
}

function getReport(id) {
  return mapReport(db.prepare("SELECT * FROM compliance_reports WHERE id = ?").get(id));
}

function listReports() {
  return db.prepare("SELECT * FROM compliance_reports ORDER BY created_at DESC LIMIT 50").all().map(mapReport);
}

function listReportHeaders() {
  return db.prepare(`
    SELECT id, import_run_id, fiscal_year, status, summary_json, created_by, created_at
    FROM compliance_reports
    ORDER BY created_at DESC
    LIMIT 50
  `).all().map((row) => ({
    id: row.id,
    importRunId: row.import_run_id,
    fiscalYear: row.fiscal_year,
    status: row.status,
    summary: parseJson(row.summary_json, {}),
    createdBy: row.created_by || "",
    createdAt: row.created_at,
  }));
}

module.exports = { createReport, getReport, listReports, listReportHeaders };
