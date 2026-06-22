const reportService = require("../services/report.service");
const { calculateRiskScore } = require("../services/complianceRiskScore.service");
const carryForwardService = require("../services/carryForward.service");
const { actorFromUser } = require("../middleware/auth");

async function createMSME(req, res, next) {
  try {
    const { importRunId, fiscalYear, asOnDate, bankRatePercent } = req.body || {};
    if (!importRunId) return res.status(400).json({ success: false, error: "importRunId is required" });
    const report = reportService.createMSMEReport({ importRunId, fiscalYear, asOnDate, bankRatePercent, actor: actorFromUser(req) });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

async function getReport(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

async function listReports(req, res, next) {
  try {
    const reports = req.query?.compact === "1" || req.query?.compact === "true"
      ? reportService.listReportHeaders()
      : reportService.listReports();
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
}

async function integrationSummary(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    const schedules = report.schedules || {};
    const voucherEvidence = schedulePayload(report, "voucherWiseDelayEvidence");
    const evidenceRows = voucherEvidence.voucherWiseDelayEvidence || [];
    const evidenceByInvoice = new Map(evidenceRows.map((row) => [
      `${row.financialYear || ""}|${row.vendorName || ""}|${row.invoiceNumber || ""}`,
      row,
    ]));
    const interestWorking = (schedules.msmedSection16Interest || []).map((row) => ({
      ...(evidenceByInvoice.get(`${row.financialYear || ""}|${row.vendorName || ""}|${row.invoiceNumber || ""}`) || {}),
      ...row,
    }));
    res.json({
      success: true,
      reportId: report.id,
      summary: schedulePayload(report, "summary"),
      ledgerSummary: schedulePayload(report, "creditorLedgerSummary"),
      riskScore: calculateRiskScore(report),
      voucherEvidence: evidenceRows.slice(0, 100),
      interestWorking,
      taxDisallowance: schedulePayload(report, "tax-disallowance"),
      form3cd: schedulePayload(report, "form-3cd"),
    });
  } catch (error) {
    next(error);
  }
}

async function downloadCsv(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    res.type("text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=MSME_Report_${report.id}.csv`);
    res.send(reportService.toCsv(report));
  } catch (error) {
    next(error);
  }
}

async function downloadXml(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    res.type("application/xml");
    res.setHeader("Content-Disposition", `attachment; filename=MSME_Report_${report.id}.xml`);
    res.send(reportService.toXml(report));
  } catch (error) {
    next(error);
  }
}

async function downloadXlsx(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=MSME_Compliance_Workbook_${report.id}.xlsx`);
    res.send(reportService.toWorkbookBuffer(report));
  } catch (error) {
    next(error);
  }
}

async function downloadPdf(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    const buffer = await reportService.toPdfBuffer(report);
    res.type("application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=MSME_Compliance_Report_${report.id}.pdf`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

async function evidenceBundle(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    res.type("application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=MSME_Evidence_Bundle_${report.id}.zip`);
    res.send(reportService.buildEvidenceBundle(report));
  } catch (error) {
    next(error);
  }
}

async function tallyReconciliation(req, res, next) {
  try {
    const report = reportService.getReport(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });
    res.type("text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=MSME_Tally_Reconciliation_${report.id}.csv`);
    res.send(reportService.toTallyReconciliationCsv(report));
  } catch (error) {
    next(error);
  }
}

async function carryForward(req, res, next) {
  try {
    const result = carryForwardService.getOrBuildRegister(req.params.id, {
      refresh: req.query.refresh === "1" || req.query.refresh === "true",
      priorReportId: req.query.priorReportId || "",
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

function schedulePayload(report, key) {
  const schedules = report.schedules || {};
  if (key === "summary") return { summary: report.summary, executiveSummary: schedules.executiveSummary || [] };
  if (key === "tax-disallowance") return {
    taxDisallowanceSummary: schedules.taxDisallowanceSummary || [],
    section43Bh: schedules.clause43BhFromClause22 || schedules.disallowance43Bh || [],
    section23: schedules.msmedSection23PermanentDisallowance || [],
  };
  if (key === "form-3cd") return {
    clause22: schedules.clause22Computation || schedules.clause22 || [],
    clause26: schedules.clause43BhFromClause22 || schedules.clause26 || [],
    clause26A: schedules.clause26CarryForwardRegister || [],
  };
  return { [key]: schedules[key] || [] };
}

function scheduleHandler(key) {
  return async (req, res, next) => {
    try {
      const report = reportService.getReport(req.params.id);
      if (!report) return res.status(404).json({ success: false, error: "Report not found" });
      res.json({ success: true, reportId: report.id, ...schedulePayload(report, key) });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  createMSME,
  getReport,
  listReports,
  integrationSummary,
  downloadCsv,
  downloadXml,
  downloadXlsx,
  downloadPdf,
  evidenceBundle,
  tallyReconciliation,
  carryForward,
  summary: scheduleHandler("summary"),
  ledgerSummary: scheduleHandler("creditorLedgerSummary"),
  voucherEvidence: scheduleHandler("voucherWiseDelayEvidence"),
  taxDisallowance: scheduleHandler("tax-disallowance"),
  scheduleIII: scheduleHandler("scheduleIIIDisclosure"),
  form3cd: scheduleHandler("form-3cd"),
  verificationRequired: scheduleHandler("verificationRequired"),
};
