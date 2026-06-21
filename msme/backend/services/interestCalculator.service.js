const {
  getConfiguredBankRatePercent,
  getDefaultAnnualInterestRate,
  calculateInvoiceInterest,
} = require("./msmeRuleEngine.service");

function parseDate(value, fieldName) {
  const date = new Date(value || "");
  if (!value || Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.status = 400;
    throw error;
  }
  return date;
}

function daysBetween(fromDate, toDate) {
  return Math.max(Math.floor((toDate - fromDate) / 86400000), 0);
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeAnnualRate(value) {
  if (value === "" || value == null) return getDefaultAnnualInterestRate();
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error("annualInterestRate must be a non-negative number");
    error.status = 400;
    throw error;
  }
  return parsed > 1 ? parsed / 100 : parsed;
}

function calculateMSMEInterest(input = {}) {
  const principal = Number(input.principal);
  if (!Number.isFinite(principal) || principal <= 0) {
    const error = new Error("principal must be greater than 0");
    error.status = 400;
    throw error;
  }

  const invoiceDate = parseDate(input.invoiceDate, "invoiceDate");
  const asOnDate = parseDate(input.asOnDate || input.paymentDate, "asOnDate");
  const hasExplicitAnnualRate = input.annualInterestRate !== "" && input.annualInterestRate != null;
  const annualInterestRate = hasExplicitAnnualRate ? normalizeAnnualRate(input.annualInterestRate) : null;
  const bankRatePercent = getConfiguredBankRatePercent();
  const due = calculateInvoiceInterest({
    invoiceDate: input.invoiceDate,
    acceptanceDate: input.acceptanceDate,
    deemedAcceptanceDate: input.deemedAcceptanceDate,
    hasWrittenAgreement: input.hasWrittenAgreement === true || input.hasWrittenAgreement === "true",
    agreedPaymentDays: input.agreedPaymentDays,
    agreementEvidence: input.agreementEvidence || input.agreementEvidenceLink,
    principal,
    amount: principal,
    interestPrincipal: principal,
    paymentDate: input.paymentDate || "",
    asOnDate: input.asOnDate || input.paymentDate,
  }, {}, {
    asOnDate: input.asOnDate || input.paymentDate,
    ...(hasExplicitAnnualRate ? { annualInterestRate, bankRatePercent } : {}),
  });
  const daysOutstanding = daysBetween(invoiceDate, asOnDate);

  return {
    vendorName: input.vendorName || "",
    principal: roundMoney(principal),
    invoiceDate: invoiceDate.toISOString().slice(0, 10),
    asOnDate: asOnDate.toISOString().slice(0, 10),
    daysOutstanding,
    acceptanceDate: due.acceptanceDate,
    deemedAcceptanceDate: due.deemedAcceptanceDate,
    baseDate: due.baseDate,
    baseDateSource: due.baseDateSource,
    allowedPaymentDays: due.allowedPaymentDays,
    appointedDay: due.appointedDay,
    interestStartDate: due.interestStartDate,
    delayDays: due.delayDays,
    bankRatePercent: due.bankRatePercent,
    annualInterestRate: due.annualInterestRate,
    annualInterestRatePercent: due.annualInterestRatePercent,
    interestRateSource: due.interestRateSource,
    ratePeriods: due.ratePeriods,
    interest: due.interest,
    totalPayable: roundMoney(principal + due.interest),
    isDelayed: due.delayDays > 0,
    verificationRequired: due.verificationRequired,
    verificationFlags: due.verificationFlags,
    legalNote: due.delayDays > 0
      ? "MSME delayed-payment interest is calculated with monthly rests after the allowed payment period."
      : "No MSME delayed-payment interest applies because the invoice is within the allowed payment period.",
  };
}

module.exports = {
  calculateMSMEInterest,
};
