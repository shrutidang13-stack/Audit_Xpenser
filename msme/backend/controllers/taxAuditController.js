const taxAuditReportService = require("../services/taxAuditReport.service");
const schemaService = require("../services/taxAuditSchema.service");
const { actorFromUser } = require("../middleware/auth");

async function create(req, res, next) {
  try {
    const { msmeReportId, formType, assessmentYear } = req.body || {};
    if (!msmeReportId) return res.status(400).json({ success: false, error: "msmeReportId is required" });
    const report = taxAuditReportService.createReport({ msmeReportId, formType, assessmentYear, actor: actorFromUser(req) });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

function list(req, res, next) {
  try {
    res.json({ success: true, reports: taxAuditReportService.listReports() });
  } catch (error) {
    next(error);
  }
}

function get(req, res, next) {
  try {
    const report = taxAuditReportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Tax audit report not found" });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

function schema(req, res, next) {
  try {
    res.json({ success: true, schema: schemaService.metadata(req.params.formType) });
  } catch (error) {
    next(error);
  }
}

function updateAssessee(req, res, next) {
  try {
    const report = taxAuditReportService.updateDetails(req.params.id, "assessee", req.body || {}, actorFromUser(req), req.body?.comment || "");
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

function updateAuditor(req, res, next) {
  try {
    const report = taxAuditReportService.updateDetails(req.params.id, "auditor", req.body || {}, actorFromUser(req), req.body?.comment || "");
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

function updateClause(req, res, next) {
  try {
    const report = taxAuditReportService.updateClause(req.params.id, req.params.clauseNo, req.body || {}, actorFromUser(req), req.body?.comment || "");
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

function validate(req, res, next) {
  try {
    const report = taxAuditReportService.validateReport(req.params.id, { actor: actorFromUser(req) });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

function downloadJson(req, res, next) {
  try {
    const content = taxAuditReportService.getJsonExport(req.params.id);
    res.type("application/json");
    res.setHeader("Content-Disposition", `attachment; filename=Tax_Audit_${req.params.id}.json`);
    res.send(content);
  } catch (error) {
    next(error);
  }
}

async function downloadPdf(req, res, next) {
  try {
    const pdf = await taxAuditReportService.generatePdf(req.params.id);
    res.type("application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Tax_Audit_Draft_${req.params.id}.pdf`);
    res.send(pdf.buffer);
  } catch (error) {
    next(error);
  }
}

async function downloadPackage(req, res, next) {
  try {
    const zip = await taxAuditReportService.exportPackage(req.params.id);
    res.type("application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=Tax_Audit_Export_${req.params.id}.zip`);
    res.send(zip);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  get,
  schema,
  updateAssessee,
  updateAuditor,
  updateClause,
  validate,
  downloadJson,
  downloadPdf,
  downloadPackage,
};
