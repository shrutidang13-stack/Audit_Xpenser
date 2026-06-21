const { calculateInvoiceInterest } = require("./msmeRuleEngine.service");
const { buildPaymentRecommendations } = require("./paymentRecommendation.service");
const {
  getReportOrThrow,
  invoiceRows,
  roundMoney,
} = require("./complianceData.service");

function matchesSelection(row, selected = []) {
  if (!selected.length) return true;
  return selected.some((item) => {
    const vendorMatches = !item.vendorName || String(row.vendorName || row.supplier || "").toLowerCase() === String(item.vendorName).toLowerCase();
    const invoiceMatches = !item.invoiceNumber || String(row.invoiceNumber || row.voucherNumber || "").toLowerCase() === String(item.invoiceNumber).toLowerCase();
    return vendorMatches && invoiceMatches;
  });
}

function candidateRows(report, input) {
  const scenario = String(input.scenario || "selected").toLowerCase();
  let rows = invoiceRows(report).filter((row) => Number(row.unpaidAmount ?? row.pendingAmount ?? row.outstandingAmount ?? 0) > 0);
  if (scenario === "pay_all_overdue" || scenario === "pay all overdue vendors") {
    rows = rows.filter((row) => Number(row.daysDelayed ?? row.delayDays ?? 0) > 0);
  } else if (scenario === "pay_top_10" || scenario === "pay top 10 high-risk vendors") {
    const recommendations = buildPaymentRecommendations(report).recommendations.slice(0, 10);
    rows = rows.filter((row) => recommendations.some((rec) =>
      rec.vendorName === (row.vendorName || row.supplier) &&
      (!rec.invoiceNumber || rec.invoiceNumber === (row.invoiceNumber || row.voucherNumber || ""))
    ));
  } else if (scenario === "before_31_march" || scenario === "pay vendors before 31 march") {
    rows = rows.filter((row) => String(row.dueDate || row.appointedDay || "").slice(5) <= "03-31");
  } else {
    rows = rows.filter((row) => matchesSelection(row, input.selected || input.selectedVendors || input.selectedInvoices || []));
  }
  return rows;
}

function simulatePayment(report, input = {}) {
  const simulationDate = input.paymentDate || input.simulationDate || new Date().toISOString().slice(0, 10);
  const selectedRows = candidateRows(report, input);
  let remainingBudget = input.amountToPay == null || input.amountToPay === "" ? Infinity : Number(input.amountToPay);
  const simulatedPayments = [];
  let disallowanceReduction = 0;
  let outstandingReduction = 0;
  let currentInterest = 0;
  let simulatedInterest = 0;

  for (const row of selectedRows) {
    if (remainingBudget <= 0) break;
    const outstanding = roundMoney(row.unpaidAmount ?? row.pendingAmount ?? row.outstandingAmount ?? row.principalAmount ?? 0);
    if (outstanding <= 0) continue;
    const paid = Math.min(outstanding, remainingBudget);
    const currentRowInterest = Number(row.interestAmount ?? row.interest ?? 0);
    const recalculated = calculateInvoiceInterest(
      {
        invoiceDate: row.invoiceDate || row.date,
        acceptanceDate: row.acceptanceDate,
        deemedAcceptanceDate: row.deemedAcceptanceDate,
        amount: paid,
        unpaidAmount: paid,
        pendingAmount: paid,
        paymentDate: simulationDate,
        hasWrittenAgreement: true,
        agreedPaymentDays: row.agreedPaymentDays || row.allowedPaymentDays || 45,
      },
      { agreedPaymentDays: row.agreedPaymentDays || row.allowedPaymentDays || 45 },
      { asOnDate: simulationDate }
    );
    currentInterest += currentRowInterest;
    simulatedInterest += recalculated.interest;
    outstandingReduction += paid;
    if (Number(row.daysDelayed ?? row.delayDays ?? 0) > 0 || Number(row.exposure43Bh || row.disallowanceAmount || 0) > 0) {
      disallowanceReduction += paid;
    }
    simulatedPayments.push({
      vendorName: row.vendorName || row.supplier || "",
      invoiceNumber: row.invoiceNumber || row.voucherNumber || "",
      currentOutstanding: outstanding,
      simulatedPayment: roundMoney(paid),
      simulationDate,
      currentInterest: roundMoney(currentRowInterest),
      simulatedInterest: roundMoney(recalculated.interest),
      interestDelta: roundMoney(currentRowInterest - recalculated.interest),
      disallowanceReduction: Number(row.daysDelayed ?? row.delayDays ?? 0) > 0 ? roundMoney(paid) : 0,
    });
    remainingBudget = Number.isFinite(remainingBudget) ? roundMoney(remainingBudget - paid) : Infinity;
  }

  const paidKeys = new Set(simulatedPayments.map((row) => `${row.vendorName}|${row.invoiceNumber}`));
  const vendorsStillAtRisk = buildPaymentRecommendations(report).recommendations
    .filter((row) => !paidKeys.has(`${row.vendorName}|${row.invoiceNumber}`) && ["Immediate", "Manual Review Required"].includes(row.priority))
    .slice(0, 10);

  return {
    reportId: report.id,
    simulationOnly: true,
    label: "Simulation Only",
    scenarioName: input.scenarioName || input.scenario || "Custom simulation",
    input: { ...input, simulationDate },
    disallowanceReduction: roundMoney(disallowanceReduction),
    outstandingExposureReduction: roundMoney(outstandingReduction),
    interestImpact: roundMoney(currentInterest - simulatedInterest),
    currentInterest: roundMoney(currentInterest),
    simulatedInterest: roundMoney(simulatedInterest),
    simulatedPayments,
    vendorsStillAtRisk,
    suggestedPaymentPriority: buildPaymentRecommendations(report).recommendations.slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}

function runPaymentSimulation(input = {}) {
  return simulatePayment(getReportOrThrow(input.reportId), input);
}

module.exports = { simulatePayment, runPaymentSimulation };
