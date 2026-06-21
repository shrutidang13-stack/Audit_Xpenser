const reportService = require("./report.service");
const { getReportOrThrow } = require("./complianceData.service");
const { getRiskScore } = require("./complianceRiskScore.service");
const { getPaymentRecommendations } = require("./paymentRecommendation.service");
const { explanationFor } = require("./complianceExplanation.service");

function jsonFile(name, data) {
  return { name, content: JSON.stringify(data || {}, null, 2) };
}

function csvFromRows(rows = [], headers = []) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const keys = headers.length ? headers : Object.keys(rows[0] || {});
  return [
    keys.join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
  ].join("\n");
}

async function buildAuditEvidencePack(reportId, options = {}) {
  const report = getReportOrThrow(reportId);
  const schedules = report.schedules || {};
  const riskScore = getRiskScore(reportId);
  const recommendations = getPaymentRecommendations(reportId);
  const clientExplanation = explanationFor(report, "client");
  const auditorExplanation = explanationFor(report, "auditor");
  const includePdf = options.includePdf !== false;
  const files = [
    { name: "01-msme-compliance-workbook.xlsx", content: reportService.toWorkbookBuffer(report) },
    includePdf
      ? { name: "02-msme-report-summary.pdf", content: await reportService.toPdfBuffer(report) }
      : { name: "02-msme-report-summary.txt", content: "PDF rendering skipped for fast backend test execution." },
    { name: "03-msme-vendor-verification-summary.csv", content: csvFromRows(schedules.msmeVendorRegistry || report.report || []) },
    { name: "04-delayed-payment-register.csv", content: csvFromRows(schedules.voucherWiseDelayEvidence || schedules.invoiceAging || []) },
    { name: "05-section-16-interest-working.csv", content: csvFromRows(schedules.msmedSection16Interest || schedules.interestCalculation || []) },
    { name: "06-clause-22-annexure.csv", content: csvFromRows(schedules.clause22Computation || schedules.clause22 || []) },
    { name: "07-clause-26-43bh-annexure.csv", content: csvFromRows(schedules.clause26 || schedules.clause43BhFromClause22 || []) },
    { name: "08-mca-msme1-readiness.csv", content: csvFromRows(schedules.mcaMsmeForm1Data || []) },
    { name: "09-tally-import-summary.json", content: JSON.stringify({ importRunId: report.importRunId, fiscalYear: report.fiscalYear, summary: report.summary }, null, 2) },
    { name: "10-rule-version-summary.json", content: JSON.stringify({ ruleVersion: report.summary?.ruleVersion || "active-rule-pack", applicableAct: report.summary?.applicableAct, applicableSection: report.summary?.applicableSection }, null, 2) },
    { name: "11-exception-list.csv", content: csvFromRows(report.excluded || schedules.verificationRequired || []) },
    { name: "12-calculation-assumptions-note.txt", content: (schedules.assumptionsAndNotes || []).map((row) => `${row.area || "General"}: ${row.assumption || row.notes || ""} Impact: ${row.impact || ""}`).join("\n") || "Computed from persisted MSME report data. Review before filing." },
    jsonFile("13-computed-report-backup.json", report),
    jsonFile("14-compliance-risk-score.json", riskScore),
    jsonFile("15-payment-recommendations.json", recommendations),
    { name: "16-client-explanation.txt", content: clientExplanation.outputText },
    { name: "17-auditor-explanation.txt", content: auditorExplanation.outputText },
  ];
  return reportService.buildSimpleZip(files);
}

module.exports = { buildAuditEvidencePack, csvFromRows };
