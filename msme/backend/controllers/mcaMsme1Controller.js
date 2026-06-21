const path = require("path");
const mcaMsme1Service = require("../services/mcaMsme1.service");
const { actorFromUser } = require("../middleware/auth");

async function preview(req, res, next) {
  try {
    const { reportId, halfYear, reasonOverrides } = req.body || {};
    if (!reportId) return res.status(400).json({ success: false, error: "reportId is required" });
    res.json({ success: true, preview: mcaMsme1Service.buildPreview({ reportId, halfYear, reasonOverrides }) });
  } catch (error) {
    next(error);
  }
}

async function generate(req, res, next) {
  try {
    const { reportId, halfYear, reasonOverrides } = req.body || {};
    if (!reportId) return res.status(400).json({ success: false, error: "reportId is required" });
    const result = mcaMsme1Service.generate({ reportId, halfYear, reasonOverrides, actor: actorFromUser(req) });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    res.json({ success: true, filings: mcaMsme1Service.listFilings() });
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const filePath = mcaMsme1Service.downloadPath(req.params.id);
    res.type("application/vnd.ms-excel.sheet.macroEnabled.12");
    res.setHeader("Content-Disposition", `attachment; filename=${path.basename(filePath)}`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

async function recordSrn(req, res, next) {
  try {
    const { srn } = req.body || {};
    if (!srn) return res.status(400).json({ success: false, error: "srn is required" });
    res.json({ success: true, filing: mcaMsme1Service.recordSrn(req.params.id, { srn, actor: actorFromUser(req) }) });
  } catch (error) {
    next(error);
  }
}

async function startUpload(req, res, next) {
  try {
    const { filingId, mcaUserId } = req.body || {};
    if (!filingId) return res.status(400).json({ success: false, error: "filingId is required" });
    const result = mcaMsme1Service.startUpload(filingId, { mcaUserId });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function uploadExcel(req, res, next) {
  try {
    const { reportId, fileName, contentBase64, companyDetails, fiscalYear, halfYear } = req.body || {};
    if (!reportId) return res.status(400).json({ success: false, error: "reportId is required" });
    if (!contentBase64) return res.status(400).json({ success: false, error: "contentBase64 is required" });
    res.json({ success: true, ...mcaMsme1Service.uploadExcel({ reportId, fileName, contentBase64, companyDetails, fiscalYear, halfYear, actor: actorFromUser(req) }) });
  } catch (error) {
    next(error);
  }
}

async function validate(req, res, next) {
  try {
    const { filingId } = req.body || {};
    if (!filingId) return res.status(400).json({ success: false, error: "filingId is required" });
    res.json({ success: true, ...mcaMsme1Service.validationReport(filingId) });
  } catch (error) {
    next(error);
  }
}

async function generateXml(req, res, next) {
  try {
    const { filingId, companyDetails } = req.body || {};
    if (!filingId) return res.status(400).json({ success: false, error: "filingId is required" });
    res.json({ success: true, ...mcaMsme1Service.generateXml({ filingId, companyDetails, actor: actorFromUser(req) }) });
  } catch (error) {
    next(error);
  }
}

async function downloadXml(req, res, next) {
  try {
    const filePath = mcaMsme1Service.xmlDownloadPath(req.params.id);
    res.type("application/xml");
    res.setHeader("Content-Disposition", `attachment; filename=${path.basename(filePath)}`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

async function validationReport(req, res, next) {
  try {
    res.json({ success: true, ...mcaMsme1Service.validationReport(req.params.id) });
  } catch (error) {
    next(error);
  }
}

module.exports = { preview, generate, list, download, recordSrn, startUpload, uploadExcel, validate, generateXml, downloadXml, validationReport };
