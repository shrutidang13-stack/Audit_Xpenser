const {
  daysBetween,
  getReportOrThrow,
  invoiceRows,
  reportRows,
  roundMoney,
} = require("./complianceData.service");

function riskScoreForInvoice(row, asOnDate) {
  const outstanding = Number(row.unpaidAmount ?? row.pendingAmount ?? row.outstandingAmount ?? row.principalAmount ?? 0);
  const delayDays = Number(row.daysDelayed ?? row.delayDays ?? 0);
  const daysUntilDue = row.appointedDay || row.dueDate ? daysBetween(asOnDate, row.appointedDay || row.dueDate) : 999;
  const disallowance = Number(row.disallowanceAmount ?? row.principalDisallowance ?? row.exposure43Bh ?? 0);
  const interest = Number(row.interestAmount ?? row.interest ?? 0);
  const verificationPenalty = row.verificationRequired ? 100000 : 0;
  return (delayDays * 1000) + (outstanding / 1000) + (disallowance / 500) + (interest / 100) + verificationPenalty - Math.min(daysUntilDue, 999);
}

function priorityLabel(row, asOnDate) {
  if (row.verificationRequired) return "Manual Review Required";
  const delayDays = Number(row.daysDelayed ?? row.delayDays ?? 0);
  const outstanding = Number(row.unpaidAmount ?? row.pendingAmount ?? row.outstandingAmount ?? row.principalAmount ?? 0);
  if (delayDays > 0 && outstanding > 0) return "Immediate";
  const dueDate = row.appointedDay || row.dueDate;
  const daysRemaining = dueDate ? daysBetween(asOnDate, dueDate) : 999;
  if (daysRemaining <= 15) return "Before 45 Days";
  if (String(dueDate || "").slice(5) <= "03-31") return "Before Year-End";
  return "Monitor";
}

function sourceRows(report) {
  const invoices = invoiceRows(report).filter((row) => Number(row.unpaidAmount ?? row.pendingAmount ?? row.outstandingAmount ?? row.principalAmount ?? 0) > 0);
  if (invoices.length) return invoices;
  return reportRows(report).map((row) => ({
    vendorName: row.vendorName,
    invoiceNumber: "Ledger closing balance",
    outstandingAmount: row.ledgerOutstandingAmount ?? row.outstandingAmount,
    dueDate: row.oldestInvoiceDate || row.asOnDate,
    daysDelayed: row.delayDays,
    disallowanceAmount: row.disallowed,
    interestAmount: row.interest,
    verificationRequired: row.outstandingMismatch,
    riskReason: row.mismatchReason || "",
  }));
}

function buildPaymentRecommendations(report, options = {}) {
  const asOnDate = options.asOnDate || report.summary?.asOnDate || report.asOnDate || new Date().toISOString().slice(0, 10);
  const recommendations = sourceRows(report)
    .map((row) => {
      const outstanding = roundMoney(row.unpaidAmount ?? row.pendingAmount ?? row.outstandingAmount ?? row.principalAmount ?? 0);
      const dueDate = row.appointedDay || row.dueDate || "";
      const daysOverdue = Number(row.daysDelayed ?? row.delayDays ?? 0);
      const daysRemaining = dueDate ? Math.max(daysBetween(asOnDate, dueDate), 0) : "";
      const priority = priorityLabel(row, asOnDate);
      const riskReason = row.riskReason || [
        daysOverdue > 0 ? `${daysOverdue} day(s) overdue` : "",
        Number(row.disallowanceAmount ?? row.principalDisallowance ?? row.exposure43Bh ?? 0) > 0 ? "43B(h) exposure" : "",
        Number(row.interestAmount ?? row.interest ?? 0) > 0 ? "MSMED interest exposure" : "",
        row.verificationRequired ? "Evidence review required" : "",
      ].filter(Boolean).join("; ") || "Within monitoring threshold";
      return {
        priorityRank: 0,
        vendorName: row.vendorName || row.supplier || row.supplierName || "",
        invoiceNumber: row.invoiceNumber || row.voucherNumber || "",
        outstandingAmount: outstanding,
        dueDate,
        daysOverdue,
        daysRemaining,
        interestExposure: roundMoney(row.interestAmount ?? row.interest ?? 0),
        disallowanceExposure: roundMoney(row.disallowanceAmount ?? row.principalDisallowance ?? row.exposure43Bh ?? 0),
        priority,
        riskReason,
        recommendedAction: priority === "Immediate"
          ? "Pay immediately and retain payment evidence."
          : priority === "Manual Review Required"
            ? "Resolve evidence/matching issue before relying on the report."
            : priority === "Before 45 Days"
              ? "Schedule payment before the statutory deadline."
              : priority === "Before Year-End"
                ? "Pay before year-end if cash-flow permits."
                : "Monitor until due date approaches.",
        _score: riskScoreForInvoice(row, asOnDate),
      };
    })
    .sort((a, b) => b._score - a._score)
    .map((row, index) => {
      const { _score, ...clean } = row;
      return { ...clean, priorityRank: index + 1 };
    });
  return { reportId: report.id, asOnDate, recommendations, generatedAt: new Date().toISOString() };
}

function getPaymentRecommendations(reportId, options = {}) {
  return buildPaymentRecommendations(getReportOrThrow(reportId), options);
}

module.exports = { buildPaymentRecommendations, getPaymentRecommendations };
