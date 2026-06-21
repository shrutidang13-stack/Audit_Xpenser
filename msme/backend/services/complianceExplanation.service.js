const {
  compactMoney,
  getReportOrThrow,
  reportRows,
  totalDelayedPrincipal,
  totalInterest,
} = require("./complianceData.service");
const { buildPaymentRecommendations } = require("./paymentRecommendation.service");

const DISCLAIMER = "This explanation is generated from computed report data and should be reviewed by a professional before filing.";

function vendorLine(row) {
  return `${row.vendorName}: Udyam ${row.udyamNumber || "not available"}, ${compactMoney(row.ledgerOutstandingAmount ?? row.outstandingAmount)} outstanding, ${compactMoney(row.disallowed || row.principalDisallowance43Bh)} disallowance, ${compactMoney(row.interest || row.interestDisallowanceSection23)} interest.`;
}

function recommendationLine(row) {
  return `${row.priorityRank}. ${row.vendorName} - ${row.priority}: ${row.recommendedAction}`;
}

function reportSnapshot(report, rows) {
  return [
    `MSME Compliance Report covers FY ${report.fiscalYear} with ${rows.length} reportable MSME vendor(s).`,
    `Delayed principal exposure is ${compactMoney(totalDelayedPrincipal(report))}. MSMED Section 16 interest exposure is ${compactMoney(totalInterest(report))}.`,
  ];
}

function clientExplanation({ report, rows, targetRows, recommendations }) {
  return [
    "Client Explanation",
    "",
    "Business summary:",
    ...reportSnapshot(report, rows),
    "",
    "Why this matters to management:",
    "The report highlights MSME suppliers where payment timing may create cash-flow, tax, interest, or filing consequences. It is written as an action list for owners and finance teams, not as a statutory certificate.",
    "",
    "Vendors needing attention:",
    ...(targetRows.length ? targetRows.map(vendorLine) : ["No reportable MSME vendors are available in this report."]),
    "",
    "Next payment actions:",
    ...(recommendations.length ? recommendations.map(recommendationLine) : ["No payment recommendation rows are available."]),
  ];
}

function auditorExplanation({ report, rows, targetRows }) {
  const verificationRows = report.schedules?.verificationRequired || [];
  return [
    "Auditor Explanation",
    "",
    "Audit lens:",
    ...reportSnapshot(report, rows),
    "",
    "Evidence basis:",
    "Vendor inclusion is based on report rows, Udyam details, ledger balances, invoice-aging data, and computed MSMED exposure available in the report schedules.",
    "",
    "Sample trace rows:",
    ...(targetRows.length ? targetRows.map(vendorLine) : ["No reportable MSME vendors are available in this report."]),
    "",
    "Review focus:",
    `${verificationRows.length} vendor/evidence item(s) are marked for verification review.`,
    "Reconcile Udyam status, PAN/name matching, appointed-day calculations, year-end outstanding balances, and whether the same amounts flow into Schedule III, Form 3CD Clause 22, and Section 43B(h) working papers.",
  ];
}

function taxImpactExplanation({ report, rows, recommendations }) {
  const clause22Rows = report.schedules?.form3cdClause22Disclosure || [];
  const section43BRows = report.schedules?.section43BDisclosure || [];
  return [
    "Tax Impact Explanation",
    "",
    "Tax exposure snapshot:",
    ...reportSnapshot(report, rows),
    "",
    "Section 43B(h) / actual-payment impact:",
    "Delayed principal is treated as a potential actual-payment disallowance where the statutory MSME payment window is crossed.",
    `${section43BRows.length} Section 43B disclosure row(s) are available in the tax schedules.`,
    "",
    "Section 23 MSMED interest impact:",
    "MSMED Section 16 interest is separately tracked because Section 23 treats that interest as inadmissible for income-tax purposes.",
    `${clause22Rows.length} Form 3CD Clause 22 disclosure row(s) are available for audit reporting support.`,
    "",
    "Tax mitigation queue:",
    ...(recommendations.length ? recommendations.map(recommendationLine) : ["No payment recommendation rows are available."]),
  ];
}

function mcaImpactExplanation({ report, rows, targetRows }) {
  const mcaRows = report.schedules?.mcaMsmeForm1Data || [];
  const readyRows = mcaRows.filter((row) => String(row.validationStatus || "").toLowerCase() !== "blocked");
  return [
    "MCA Filing Impact Explanation",
    "",
    "MSME-1 filing view:",
    ...reportSnapshot(report, rows),
    "",
    "Form readiness:",
    `${mcaRows.length} MCA MSME-1 row(s) are available from the report schedules; ${readyRows.length} appear usable unless later validation flags them.`,
    "",
    "Vendors likely to drive the return:",
    ...(targetRows.length ? targetRows.map(vendorLine) : ["No reportable MSME vendors are available in this report."]),
    "",
    "Filing action:",
    "Use this tab to prepare the half-year MCA MSME-1 position, validate supplier master details, confirm outstanding amounts, and capture SRN/upload evidence after filing.",
  ];
}

function explanationFor(report, type = "client", filters = {}) {
  const rows = reportRows(report);
  const selectedVendor = filters.vendorName
    ? rows.find((row) => String(row.vendorName || "").toLowerCase().includes(String(filters.vendorName).toLowerCase()))
    : null;
  const targetRows = selectedVendor ? [selectedVendor] : rows.slice(0, 5);
  const recommendations = buildPaymentRecommendations(report).recommendations.slice(0, 5);
  const context = { report, rows, targetRows, recommendations };
  const linesByType = {
    client: clientExplanation,
    auditor: auditorExplanation,
    tax_impact: taxImpactExplanation,
    mca_impact: mcaImpactExplanation,
  };
  const lines = [
    ...(linesByType[type] || clientExplanation)(context),
    "",
    DISCLAIMER,
  ];
  return {
    reportId: report.id,
    explanationType: type,
    outputText: lines.join("\n"),
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

function explain(input = {}) {
  return explanationFor(getReportOrThrow(input.reportId), input.explanationType || input.type || "client", input);
}

module.exports = { explain, explanationFor, DISCLAIMER };
