const crypto = require("crypto");
const db = require("../config/database");
const importRepository = require("../repositories/importRepository");
const reportRepository = require("../repositories/reportRepository");
const { normalizeVendorName } = require("../utils/normalizeVendorName");

function nowIso() {
  return new Date().toISOString();
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function voucherKey(voucher = {}) {
  return String(voucher.billReference || voucher.invoiceNumber || voucher.voucherNumber || "").trim().toUpperCase();
}

function normalizedVendor(row = {}) {
  return row.normalizedVendorName || normalizeVendorName(row.vendorName || row.supplier || row.vendor || "");
}

function findPriorReport(currentReport) {
  const reports = reportRepository.listReports();
  const currentCreated = new Date(currentReport.createdAt || 0).getTime();
  return reports.find((report) =>
    report.id !== currentReport.id &&
    report.importRunId !== currentReport.importRunId &&
    report.fiscalYear !== currentReport.fiscalYear &&
    new Date(report.createdAt || 0).getTime() <= currentCreated
  ) || null;
}

function priorDisallowanceRows(priorReport) {
  const rows = priorReport?.schedules?.clause43BhFromClause22 || priorReport?.schedules?.disallowance43Bh || [];
  return rows.map((row) => ({
    financialYear: row.financialYear || priorReport.fiscalYear || "",
    vendorName: row.vendorName || row.supplier || "",
    normalizedVendorName: normalizedVendor(row),
    panNumber: row.panNumber || "",
    udyamNumber: row.udyamNumber || "",
    invoiceNumber: row.invoiceNumber || "",
    invoiceDate: row.invoiceDate || "",
    openingDisallowance: roundMoney(row.principalDisallowance || row.disallowanceAmount || 0),
    source: row.sourceClause || "Prior-year Clause 22(iii)(b)",
  })).filter((row) => row.normalizedVendorName && row.openingDisallowance > 0);
}

function currentPeriodPaymentRows(currentReport) {
  const vouchers = importRepository.getLedgerVouchersForReport(currentReport.importRunId, {
    financialYear: currentReport.fiscalYear,
  });
  return vouchers
    .filter((voucher) => Number(voucher.debit || 0) > 0 || /payment|bank|cash/i.test(voucher.voucherType || ""))
    .map((voucher) => ({
      vendorName: voucher.vendorName || voucher.ledgerName || "",
      normalizedVendorName: voucher.normalizedVendorName || voucher.normalizedLedgerName || normalizeVendorName(voucher.vendorName || voucher.ledgerName || ""),
      invoiceNumber: voucherKey(voucher),
      amount: roundMoney(Math.abs(Number(voucher.debit || voucher.amount || 0))),
      paymentDate: voucher.paymentDate || voucher.date || "",
      evidenceReference: voucher.voucherNumber || voucher.billReference || voucher.id || "",
      raw: voucher,
    }))
    .filter((row) => row.normalizedVendorName && row.amount > 0);
}

function computeRows({ currentReport, priorReport = null }) {
  const priorRows = priorDisallowanceRows(priorReport);
  const payments = currentPeriodPaymentRows(currentReport);
  const paymentsByVendor = new Map();
  for (const payment of payments) {
    if (!paymentsByVendor.has(payment.normalizedVendorName)) paymentsByVendor.set(payment.normalizedVendorName, []);
    paymentsByVendor.get(payment.normalizedVendorName).push({ ...payment, remaining: payment.amount });
  }

  return priorRows.map((prior) => {
    let remainingOpening = prior.openingDisallowance;
    let paidDuringYear = 0;
    const evidence = [];
    const vendorPayments = paymentsByVendor.get(prior.normalizedVendorName) || [];
    const invoiceKey = String(prior.invoiceNumber || "").trim().toUpperCase();
    const sortedPayments = [
      ...vendorPayments.filter((payment) => invoiceKey && payment.invoiceNumber === invoiceKey),
      ...vendorPayments.filter((payment) => !invoiceKey || payment.invoiceNumber !== invoiceKey),
    ];
    for (const payment of sortedPayments) {
      if (remainingOpening <= 0) break;
      if (payment.remaining <= 0) continue;
      const used = Math.min(payment.remaining, remainingOpening);
      payment.remaining = roundMoney(payment.remaining - used);
      remainingOpening = roundMoney(remainingOpening - used);
      paidDuringYear = roundMoney(paidDuringYear + used);
      evidence.push(payment.evidenceReference || payment.paymentDate || "payment-voucher");
    }
    return {
      reportId: currentReport.id,
      priorReportId: priorReport?.id || "",
      financialYear: currentReport.fiscalYear,
      vendorName: prior.vendorName,
      normalizedVendorName: prior.normalizedVendorName,
      panNumber: prior.panNumber,
      udyamNumber: prior.udyamNumber,
      invoiceNumber: prior.invoiceNumber,
      invoiceDate: prior.invoiceDate,
      openingDisallowance: prior.openingDisallowance,
      paidDuringYear,
      deductibleCurrentYear: paidDuringYear,
      closingCarryForward: remainingOpening,
      settlementSource: evidence.length ? "Tally current-year payment vouchers" : "No current-year settlement identified",
      evidenceReference: evidence.join(" | "),
      status: remainingOpening > 0 ? "partly_carried_forward" : "deductible_current_year",
      source: prior.source,
    };
  });
}

function replaceRegister(reportId, rows = []) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM msme_carry_forward_register WHERE report_id = ?").run(reportId);
    const insert = db.prepare(`
      INSERT INTO msme_carry_forward_register (
        id, report_id, prior_report_id, financial_year, vendor_name, normalized_vendor_name,
        pan_number, udyam_number, invoice_number, invoice_date, opening_disallowance,
        paid_during_year, deductible_current_year, closing_carry_forward, settlement_source,
        evidence_reference, status, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const timestamp = nowIso();
    for (const row of rows) {
      insert.run(
        crypto.randomUUID(),
        reportId,
        row.priorReportId || "",
        row.financialYear || "",
        row.vendorName || "",
        row.normalizedVendorName || "",
        row.panNumber || "",
        row.udyamNumber || "",
        row.invoiceNumber || "",
        row.invoiceDate || "",
        row.openingDisallowance || 0,
        row.paidDuringYear || 0,
        row.deductibleCurrentYear || 0,
        row.closingCarryForward || 0,
        row.settlementSource || "",
        row.evidenceReference || "",
        row.status || "computed",
        JSON.stringify(row),
        timestamp
      );
    }
  });
  tx();
}

function mapRegisterRow(row) {
  const raw = parseJson(row.raw_json, {});
  return {
    ...raw,
    id: row.id,
    reportId: row.report_id,
    priorReportId: row.prior_report_id,
    financialYear: row.financial_year,
    vendorName: row.vendor_name,
    normalizedVendorName: row.normalized_vendor_name,
    panNumber: row.pan_number,
    udyamNumber: row.udyam_number,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    openingDisallowance: row.opening_disallowance,
    paidDuringYear: row.paid_during_year,
    deductibleCurrentYear: row.deductible_current_year,
    closingCarryForward: row.closing_carry_forward,
    settlementSource: row.settlement_source,
    evidenceReference: row.evidence_reference,
    status: row.status,
    createdAt: row.created_at,
  };
}

function listRegister(reportId) {
  return db.prepare("SELECT * FROM msme_carry_forward_register WHERE report_id = ? ORDER BY vendor_name, invoice_number").all(reportId).map(mapRegisterRow);
}

function buildRegister(reportId, options = {}) {
  const currentReport = reportRepository.getReport(reportId);
  if (!currentReport) throw new Error("Report not found");
  const priorReport = options.priorReportId ? reportRepository.getReport(options.priorReportId) : findPriorReport(currentReport);
  const rows = computeRows({ currentReport, priorReport });
  replaceRegister(reportId, rows);
  return {
    reportId,
    priorReportId: priorReport?.id || "",
    rows,
    summary: {
      openingDisallowance: roundMoney(rows.reduce((sum, row) => sum + Number(row.openingDisallowance || 0), 0)),
      deductibleCurrentYear: roundMoney(rows.reduce((sum, row) => sum + Number(row.deductibleCurrentYear || 0), 0)),
      closingCarryForward: roundMoney(rows.reduce((sum, row) => sum + Number(row.closingCarryForward || 0), 0)),
      rowCount: rows.length,
    },
  };
}

function getOrBuildRegister(reportId, options = {}) {
  const existing = listRegister(reportId);
  if (existing.length && !options.refresh) {
    return {
      reportId,
      priorReportId: existing[0]?.priorReportId || "",
      rows: existing,
      summary: {
        openingDisallowance: roundMoney(existing.reduce((sum, row) => sum + Number(row.openingDisallowance || 0), 0)),
        deductibleCurrentYear: roundMoney(existing.reduce((sum, row) => sum + Number(row.deductibleCurrentYear || 0), 0)),
        closingCarryForward: roundMoney(existing.reduce((sum, row) => sum + Number(row.closingCarryForward || 0), 0)),
        rowCount: existing.length,
      },
    };
  }
  return buildRegister(reportId, options);
}

module.exports = { buildRegister, getOrBuildRegister, computeRows };
