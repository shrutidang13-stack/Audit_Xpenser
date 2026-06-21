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
  return {
    id: row.id,
    sourceMsmeReportId: row.source_msme_report_id,
    importRunId: row.import_run_id,
    companyName: row.company_name,
    financialYear: row.financial_year,
    assessmentYear: row.assessment_year,
    formType: row.form_type,
    status: row.status,
    validationStatus: row.validation_status,
    generatedJsonSnapshot: parseJson(row.generated_json_snapshot, {}),
    generatedPdfPath: row.generated_pdf_path || "",
    createdBy: row.created_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClause(row) {
  if (!row) return null;
  return {
    id: row.id,
    reportId: row.report_id,
    clauseNo: row.clause_no,
    title: row.clause_title,
    schemaKey: row.schema_key,
    sourceType: row.source_type,
    status: row.status,
    amount: Number(row.amount || 0),
    remarks: row.remarks || "",
    annexureRef: row.annexure_ref || "",
    evidenceRef: row.evidence_ref || "",
    reviewStatus: row.review_status,
    payload: parseJson(row.payload_json, {}),
    updatedBy: row.updated_by || "",
    updatedAt: row.updated_at,
  };
}

function mapAnnexure(row) {
  return {
    id: row.id,
    reportId: row.report_id,
    annexureType: row.annexure_type,
    title: row.title,
    sourceSchedule: row.source_schedule,
    payload: parseJson(row.payload_json, []),
    createdAt: row.created_at,
  };
}

function mapValidation(row) {
  return {
    id: row.id,
    reportId: row.report_id,
    severity: row.severity,
    code: row.code,
    message: row.message,
    schemaPath: row.schema_path,
    clauseNo: row.clause_no,
    createdAt: row.created_at,
  };
}

function createReport(input) {
  const timestamp = nowIso();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO tax_audit_reports (
      id, source_msme_report_id, import_run_id, company_name, financial_year, assessment_year,
      form_type, status, validation_status, generated_json_snapshot, generated_pdf_path, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.sourceMsmeReportId,
    input.importRunId,
    input.companyName || "",
    input.financialYear,
    input.assessmentYear,
    input.formType,
    input.status || "draft",
    input.validationStatus || "not_run",
    JSON.stringify(input.generatedJsonSnapshot || {}),
    input.generatedPdfPath || "",
    input.actor || "unknown",
    timestamp,
    timestamp
  );
  return getReport(id);
}

function updateReport(id, patch = {}) {
  const current = getReport(id);
  if (!current) return null;
  db.prepare(`
    UPDATE tax_audit_reports
    SET status = ?, validation_status = ?, generated_json_snapshot = ?, generated_pdf_path = ?, updated_at = ?
    WHERE id = ?
  `).run(
    patch.status || current.status,
    patch.validationStatus || current.validationStatus,
    JSON.stringify(patch.generatedJsonSnapshot ?? current.generatedJsonSnapshot ?? {}),
    patch.generatedPdfPath ?? current.generatedPdfPath ?? "",
    nowIso(),
    id
  );
  return getReport(id);
}

function getReport(id) {
  return mapReport(db.prepare("SELECT * FROM tax_audit_reports WHERE id = ?").get(id));
}

function listReports() {
  return db.prepare("SELECT * FROM tax_audit_reports ORDER BY created_at DESC LIMIT 50").all().map(mapReport);
}

function saveDetails(tableName, reportId, payload, actor = "unknown") {
  const timestamp = nowIso();
  db.prepare(`
    INSERT INTO ${tableName} (report_id, payload_json, updated_by, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(report_id) DO UPDATE SET payload_json = excluded.payload_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at
  `).run(reportId, JSON.stringify(payload || {}), actor, timestamp);
}

function getDetails(tableName, reportId) {
  const row = db.prepare(`SELECT payload_json FROM ${tableName} WHERE report_id = ?`).get(reportId);
  return parseJson(row?.payload_json, {});
}

function replaceClauses(reportId, clauses = [], actor = "unknown") {
  const timestamp = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM tax_audit_clauses WHERE report_id = ?").run(reportId);
    const insert = db.prepare(`
      INSERT INTO tax_audit_clauses (
        id, report_id, clause_no, clause_title, schema_key, source_type, status, amount,
        remarks, annexure_ref, evidence_ref, review_status, payload_json, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const clause of clauses) {
      insert.run(
        crypto.randomUUID(),
        reportId,
        clause.clauseNo,
        clause.title || "",
        clause.schemaKey || "",
        clause.sourceType || "manual",
        clause.status || "na",
        Number(clause.amount || 0),
        clause.remarks || "",
        clause.annexureRef || "",
        clause.evidenceRef || "",
        clause.reviewStatus || "requires_review",
        JSON.stringify(clause.payload || {}),
        actor,
        timestamp
      );
    }
  });
  tx();
}

function listClauses(reportId) {
  return db.prepare("SELECT * FROM tax_audit_clauses WHERE report_id = ? ORDER BY CAST(clause_no AS REAL), clause_no").all(reportId).map(mapClause);
}

function updateClause(reportId, clauseNo, patch = {}, actor = "unknown", comment = "") {
  const current = db.prepare("SELECT * FROM tax_audit_clauses WHERE report_id = ? AND clause_no = ?").get(reportId, String(clauseNo));
  if (!current) return null;
  const before = mapClause(current);
  const next = {
    ...before,
    ...patch,
    payload: patch.payload ?? before.payload,
  };
  db.prepare(`
    UPDATE tax_audit_clauses
    SET status = ?, amount = ?, remarks = ?, annexure_ref = ?, evidence_ref = ?, review_status = ?, payload_json = ?, updated_by = ?, updated_at = ?
    WHERE report_id = ? AND clause_no = ?
  `).run(
    next.status,
    Number(next.amount || 0),
    next.remarks || "",
    next.annexureRef || "",
    next.evidenceRef || "",
    next.reviewStatus || "requires_review",
    JSON.stringify(next.payload || {}),
    actor,
    nowIso(),
    reportId,
    String(clauseNo)
  );
  for (const key of ["status", "amount", "remarks", "annexureRef", "evidenceRef", "reviewStatus", "payload"]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(next[key])) {
      logEdit(reportId, "clause", before.id, key, before[key], next[key], actor, comment);
    }
  }
  return listClauses(reportId).find((clause) => clause.clauseNo === String(clauseNo));
}

function replaceAnnexures(reportId, annexures = []) {
  const timestamp = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM tax_audit_annexures WHERE report_id = ?").run(reportId);
    const insert = db.prepare(`
      INSERT INTO tax_audit_annexures (id, report_id, annexure_type, title, source_schedule, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const annexure of annexures) {
      insert.run(crypto.randomUUID(), reportId, annexure.annexureType, annexure.title, annexure.sourceSchedule || "", JSON.stringify(annexure.payload || []), timestamp);
    }
  });
  tx();
}

function listAnnexures(reportId) {
  return db.prepare("SELECT * FROM tax_audit_annexures WHERE report_id = ? ORDER BY annexure_type, title").all(reportId).map(mapAnnexure);
}

function replaceValidation(reportId, errors = []) {
  const timestamp = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM tax_audit_validation_errors WHERE report_id = ?").run(reportId);
    const insert = db.prepare(`
      INSERT INTO tax_audit_validation_errors (id, report_id, severity, code, message, schema_path, clause_no, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const error of errors) {
      insert.run(crypto.randomUUID(), reportId, error.severity, error.code, error.message, error.schemaPath || "", error.clauseNo || "", timestamp);
    }
  });
  tx();
}

function listValidation(reportId) {
  return db.prepare("SELECT * FROM tax_audit_validation_errors WHERE report_id = ? ORDER BY severity ASC, created_at ASC").all(reportId).map(mapValidation);
}

function createVersion(reportId, snapshot, actor = "unknown") {
  const versionNo = (db.prepare("SELECT MAX(version_no) AS versionNo FROM tax_audit_report_versions WHERE report_id = ?").get(reportId).versionNo || 0) + 1;
  db.prepare(`
    INSERT INTO tax_audit_report_versions (id, report_id, version_no, snapshot_json, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), reportId, versionNo, JSON.stringify(snapshot || {}), actor, nowIso());
  return versionNo;
}

function logEdit(reportId, entityType, entityId, fieldName, oldValue, newValue, actor = "unknown", comment = "") {
  db.prepare(`
    INSERT INTO tax_audit_edit_log (id, report_id, entity_type, entity_id, field_name, old_value, new_value, changed_by, changed_at, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    reportId,
    entityType,
    entityId || "",
    fieldName,
    JSON.stringify(oldValue ?? null),
    JSON.stringify(newValue ?? null),
    actor,
    nowIso(),
    comment || ""
  );
}

function listEditLog(reportId) {
  return db.prepare("SELECT * FROM tax_audit_edit_log WHERE report_id = ? ORDER BY changed_at DESC").all(reportId).map((row) => ({
    id: row.id,
    reportId: row.report_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    fieldName: row.field_name,
    oldValue: parseJson(row.old_value, null),
    newValue: parseJson(row.new_value, null),
    changedBy: row.changed_by || "",
    changedAt: row.changed_at,
    comment: row.comment || "",
  }));
}

module.exports = {
  createReport,
  updateReport,
  getReport,
  listReports,
  saveDetails,
  getDetails,
  replaceClauses,
  listClauses,
  updateClause,
  replaceAnnexures,
  listAnnexures,
  replaceValidation,
  listValidation,
  createVersion,
  logEdit,
  listEditLog,
};
