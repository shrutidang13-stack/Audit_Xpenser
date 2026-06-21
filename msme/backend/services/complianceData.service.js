const reportService = require("./report.service");

function getReportOrThrow(reportId) {
  const report = reportService.getReport(reportId);
  if (!report) {
    const error = new Error("Report not found");
    error.status = 404;
    throw error;
  }
  return report;
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function reportRows(report) {
  return Array.isArray(report?.report) ? report.report : [];
}

function invoiceRows(report) {
  const schedules = report?.schedules || {};
  const rows = schedules.invoiceAging || schedules.voucherWiseDelayEvidence || [];
  if (rows.length) return rows;
  return reportRows(report).flatMap((row) => (row.invoiceAging || []).map((invoice) => ({
    ...invoice,
    vendorName: invoice.vendorName || row.vendorName,
    panNumber: invoice.panNumber || row.panNumber,
    udyamNumber: invoice.udyamNumber || row.udyamNumber,
    financialYear: invoice.financialYear || row.financialYear || report.fiscalYear,
  })));
}

function verificationRows(report) {
  return report?.schedules?.verificationRequired || report?.schedules?.pendingVerification || [];
}

function totalOutstanding(report) {
  return roundMoney(reportRows(report).reduce((sum, row) => sum + Number(row.ledgerOutstandingAmount ?? row.outstandingAmount ?? 0), 0));
}

function totalDelayedPrincipal(report) {
  return roundMoney(reportRows(report).reduce((sum, row) => sum + Number(row.principalDisallowance43Bh ?? row.disallowed ?? 0), 0));
}

function totalInterest(report) {
  return roundMoney(Number(report?.summary?.totalInterest || reportRows(report).reduce((sum, row) => sum + Number(row.interest || row.interestDisallowanceSection23 || 0), 0)));
}

function parseDate(value) {
  const text = String(value || "");
  const normalized = /^\d{8}$/.test(text) ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(from, to) {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) return 0;
  return Math.floor((end - start) / 86400000);
}

function compactMoney(value) {
  return `Rs ${roundMoney(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

module.exports = {
  getReportOrThrow,
  roundMoney,
  reportRows,
  invoiceRows,
  verificationRows,
  totalOutstanding,
  totalDelayedPrincipal,
  totalInterest,
  parseDate,
  daysBetween,
  compactMoney,
};
