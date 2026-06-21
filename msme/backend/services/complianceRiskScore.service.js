const {
  compactMoney,
  getReportOrThrow,
  reportRows,
  roundMoney,
  totalDelayedPrincipal,
  totalInterest,
  totalOutstanding,
  verificationRows,
} = require("./complianceData.service");

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function categoryFor(score) {
  if (score >= 80) return "Low Risk";
  if (score >= 60) return "Moderate Risk";
  if (score >= 40) return "High Risk";
  return "Critical Risk";
}

function ratioScore(points, bad, base) {
  if (!base || bad <= 0) return points;
  return roundMoney(points * clamp(1 - (bad / base), 0, 1));
}

function calculateRiskScore(report) {
  const rows = reportRows(report);
  const summary = report.summary || {};
  const outstanding = totalOutstanding(report);
  const delayedPrincipal = totalDelayedPrincipal(report);
  const interest = totalInterest(report);
  const pendingVerification = Number(summary.pendingVerificationVendors || summary.excludedFromReport || 0);
  const reportVendors = Math.max(Number(summary.reportVendors || rows.length || 0), 1);
  const evidenceIssues = verificationRows(report).length;
  const mcaRows = report.schedules?.mcaMsmeForm1Data || [];
  const mcaInvalidRows = mcaRows.filter((row) => !["ready", "valid", "ok", ""].includes(String(row.validationStatus || "").toLowerCase())).length;

  const scoreBreakup = [
    {
      key: "verification",
      label: "MSME vendor verification completeness",
      maxPoints: 20,
      points: ratioScore(20, pendingVerification, reportVendors + pendingVerification),
      reason: pendingVerification ? `${pendingVerification} vendor(s) still need verification/evidence review.` : "All report vendors have usable MSME evidence.",
    },
    {
      key: "overdue_outstanding",
      label: "Outstanding dues beyond 45 days",
      maxPoints: 25,
      points: ratioScore(25, delayedPrincipal, outstanding || delayedPrincipal),
      reason: delayedPrincipal ? `${compactMoney(delayedPrincipal)} is delayed principal exposure.` : "No delayed unpaid principal exposure.",
    },
    {
      key: "interest",
      label: "Section 16 interest exposure",
      maxPoints: 15,
      points: ratioScore(15, interest, Math.max(outstanding, interest * 10)),
      reason: interest ? `${compactMoney(interest)} MSMED interest is computed.` : "No Section 16 interest exposure.",
    },
    {
      key: "tax_disallowance",
      label: "Section 43B(h) disallowance exposure",
      maxPoints: 20,
      points: ratioScore(20, Number(summary.totalDisallowed || delayedPrincipal), outstanding || delayedPrincipal),
      reason: summary.totalDisallowed ? `${compactMoney(summary.totalDisallowed)} is flagged for actual-payment disallowance.` : "No 43B(h) disallowance exposure.",
    },
    {
      key: "mca_readiness",
      label: "MCA MSME-1 filing readiness",
      maxPoints: 10,
      points: mcaRows.length ? ratioScore(10, mcaInvalidRows, mcaRows.length) : (pendingVerification ? 5 : 10),
      reason: mcaRows.length ? `${mcaRows.length - mcaInvalidRows}/${mcaRows.length} MCA rows are ready.` : "Readiness inferred from report verification status.",
    },
    {
      key: "audit_evidence",
      label: "Audit evidence completeness",
      maxPoints: 10,
      points: ratioScore(10, evidenceIssues, Math.max(rows.length, evidenceIssues)),
      reason: evidenceIssues ? `${evidenceIssues} evidence issue(s) require review.` : "Audit evidence schedules are complete.",
    },
  ];
  const score = Math.round(scoreBreakup.reduce((sum, item) => sum + item.points, 0));
  const topRisks = scoreBreakup
    .filter((item) => item.points < item.maxPoints)
    .sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points))
    .slice(0, 5)
    .map((item) => ({
      area: item.label,
      lostPoints: roundMoney(item.maxPoints - item.points),
      reason: item.reason,
    }));

  return {
    reportId: report.id,
    score,
    riskCategory: categoryFor(score),
    scoreBreakup,
    topRisks,
    generatedAt: new Date().toISOString(),
  };
}

function getRiskScore(reportId) {
  return calculateRiskScore(getReportOrThrow(reportId));
}

module.exports = { calculateRiskScore, getRiskScore, categoryFor };
