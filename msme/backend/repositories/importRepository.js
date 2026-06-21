const crypto = require("crypto");
const db = require("../config/database");
const { normalizeVendorName } = require("../utils/normalizeVendorName");
const { isSundryCreditorRow } = require("../utils/sundryCreditor");
const { fiscalYearForDate, fiscalYearDates } = require("../utils/financialYear");

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function logImportStage(stage, details = {}) {
  console.log(`[tally-import] stage=${stage} ${JSON.stringify(details)}`);
}

function mapRun(row) {
  if (!row) return null;
  return {
    id: row.id,
    fiscalYear: row.fiscal_year,
    periodType: row.period_type || "financial_year",
    fromDate: row.from_date,
    toDate: row.to_date,
    asOn: row.as_on,
    companyName: row.company_name || "",
    status: row.status,
    error: row.error || "",
    summary: parseJson(row.summary_json, {}),
    createdBy: row.created_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function compactRunForList(run) {
  if (!run) return run;
  const { ledgerMetadata, ...summary } = run.summary || {};
  return { ...run, summary };
}

function mapCreditor(row, vendorMaster = null) {
  const raw = parseJson(row.raw_json, {});
  const sundryCreditor = isSundryCreditorRow(raw);
  return {
    id: row.id,
    importRunId: row.import_run_id,
    party: row.vendor_name,
    normalizedVendorName: row.normalized_vendor_name,
    outstandingAmount: row.outstanding_amount,
    daysOutstanding: row.days_outstanding,
    bucket: row.bucket || "Unknown",
    delayed: Boolean(row.delayed),
    interestLiability: row.interest_liability,
    disallowanceAmount: row.disallowance_amount,
    oldestInvoiceDate: row.oldest_invoice_date || "",
    openingBalance: Number(row.opening_balance ?? raw.openingBalance ?? 0),
    closingBalance: Number(row.closing_balance ?? raw.closingBalance ?? 0),
    openingBalanceRaw: row.opening_balance_raw || raw.openingBalanceRaw || "",
    closingBalanceRaw: row.closing_balance_raw || raw.closingBalanceRaw || "",
    openingBalanceType: raw.openingBalanceType || "",
    closingBalanceType: raw.closingBalanceType || "",
    ledgerOutstandingAmount: Number(raw.ledgerOutstandingAmount ?? row.outstanding_amount ?? 0),
    voucherOutstandingAmount: Number(raw.voucherOutstandingAmount ?? 0),
    outstandingMismatch: Boolean(raw.outstandingMismatch),
    mismatchReason: raw.mismatchReason || "",
    payableAging: raw.payableAging || null,
    voucherCount: Number(row.voucher_count ?? raw.voucherCount ?? 0),
    detectedUdyamNumber: raw.udyamNumber || raw.detectedUdyamNumber || "",
    gstin: raw.gstin || "",
    panNumber: row.pan_number || raw.panNumber || "",
    agreedPaymentDays: Number(row.agreed_payment_days ?? raw.agreedPaymentDays ?? 0),
    parent: raw.parent || "",
    groupHierarchy: Array.isArray(raw.groupHierarchy) ? raw.groupHierarchy : [],
    detectionReasons: Array.isArray(raw.detectionReasons) ? raw.detectionReasons : [],
    isSundryCreditor: sundryCreditor,
    raw,
    vendorMaster,
  };
}

function mapLedgerVoucher(row) {
  const raw = parseJson(row.raw_json, {});
  return {
    id: row.id,
    importRunId: row.import_run_id,
    fiscalYear: row.fiscal_year || "",
    financialYear: row.financial_year || row.fiscal_year || fiscalYearForDate(row.voucher_date),
    fyStartDate: row.fy_start_date || fiscalYearDates(row.financial_year || row.fiscal_year || fiscalYearForDate(row.voucher_date))?.fyStartDate || "",
    fyEndDate: row.fy_end_date || fiscalYearDates(row.financial_year || row.fiscal_year || fiscalYearForDate(row.voucher_date))?.fyEndDate || "",
    reportFromDate: row.report_from_date || "",
    reportToDate: row.report_to_date || "",
    asOnDate: row.as_on_date || "",
    companyName: row.company_name || "",
    vendorName: row.vendor_name || row.ledger_name,
    normalizedVendorName: row.normalized_vendor_name || row.normalized_ledger_name,
    ledgerName: row.ledger_name,
    normalizedLedgerName: row.normalized_ledger_name,
    date: row.voucher_date || "",
    particulars: row.particulars || "",
    voucherType: row.voucher_type || "",
    voucherNumber: row.voucher_number || "",
    debit: row.debit || 0,
    credit: row.credit || 0,
    amount: row.amount || 0,
    billReference: row.bill_reference || "",
    pendingAmount: row.pending_amount || 0,
    partyLedgerName: row.party_ledger_name || "",
    ledgerParent: row.ledger_parent || "",
    groupHierarchy: parseJson(row.group_hierarchy_json, []),
    voucherSource: row.voucher_source || "Day Book",
    invoiceDate: row.invoice_date || raw.invoiceDate || row.voucher_date || "",
    acceptanceDate: row.acceptance_date || raw.acceptanceDate || "",
    deemedAcceptanceDate: row.deemed_acceptance_date || raw.deemedAcceptanceDate || "",
    agreedPaymentDays: Number(row.agreement_credit_days ?? raw.agreedPaymentDays ?? 0),
    hasWrittenAgreement: row.has_written_agreement == null
      ? Boolean(raw.hasWrittenAgreement || Number(raw.agreedPaymentDays || 0) > 0 || raw.agreementEvidence)
      : Boolean(row.has_written_agreement),
    agreementEvidence: row.agreement_evidence_link || raw.agreementEvidence || "",
    appointedDay: row.appointed_day || raw.appointedDay || "",
    paymentDate: row.payment_date || raw.paymentDate || "",
    evidenceStatus: row.evidence_status || "pending_review",
    verificationRequired: Boolean(row.verification_required || raw.verificationRequired),
    verificationFlags: parseJson(row.verification_flags_json, raw.verificationFlags || []),
    raw,
    createdAt: row.created_at,
  };
}

function createRun({ fiscalYear, periodType = "financial_year", fromDate, toDate, asOn, companyName, status = "running", actor }) {
  const timestamp = nowIso();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO tally_import_runs (
      id, fiscal_year, period_type, from_date, to_date, as_on, company_name, status, summary_json, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, fiscalYear, periodType, fromDate, toDate, asOn, companyName || "", status, "{}", actor || "unknown", timestamp, timestamp);
  return id;
}

function completeRun(id, { summary, creditors, ledgerVouchers = [] }) {
  let persistedVoucherCount = 0;
  let sampleVoucher = null;
  const runContext = db.prepare("SELECT fiscal_year, company_name FROM tally_import_runs WHERE id = ?").get(id) || {};
  const fiscalYear = summary?.fiscalYear || runContext.fiscal_year || "";
  const companyName = summary?.companyName || runContext.company_name || "";
  const defaultPeriod = Array.isArray(summary?.financialYearPeriods) && summary.financialYearPeriods.length === 1
    ? summary.financialYearPeriods[0]
    : null;
  logImportStage("voucherPersist", {
    status: "start",
    importRunId: id,
    fiscalYear,
    companyName,
    exportedVoucherCount: ledgerVouchers.length,
    parsedVoucherCount: ledgerVouchers.length,
  });
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM tally_import_creditors WHERE import_run_id = ?").run(id);
    db.prepare("DELETE FROM tally_ledger_vouchers WHERE import_run_id = ?").run(id);
    const insert = db.prepare(`
      INSERT INTO tally_import_creditors (
        id, import_run_id, vendor_name, normalized_vendor_name, outstanding_amount, days_outstanding,
        bucket, delayed, interest_liability, disallowance_amount, oldest_invoice_date,
        pan_number, agreed_payment_days, opening_balance, closing_balance, opening_balance_raw, closing_balance_raw, voucher_count, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const voucherCountsByVendor = new Map();
    for (const voucher of ledgerVouchers) {
      const vendorName = voucher.vendorName || voucher.ledgerName;
      const normalizedVendorName = voucher.normalizedVendorName || voucher.normalizedLedgerName || normalizeVendorName(vendorName);
      if (!normalizedVendorName) continue;
      voucherCountsByVendor.set(normalizedVendorName, (voucherCountsByVendor.get(normalizedVendorName) || 0) + 1);
    }
    const seenCreditors = new Set();
    let duplicateCreditorCount = 0;
    for (const creditor of creditors) {
      const normalizedVendorName = creditor.normalizedVendorName || normalizeVendorName(creditor.party);
      const creditorKey = [
        normalizedVendorName,
        String(creditor.panNumber || "").trim().toUpperCase(),
        Number(creditor.outstandingAmount || 0),
        Number(creditor.openingBalance || 0),
        Number(creditor.closingBalance || 0),
        String(creditor.openingBalanceRaw || ""),
        String(creditor.closingBalanceRaw || ""),
      ].join("|");
      if (seenCreditors.has(creditorKey)) {
        duplicateCreditorCount += 1;
        continue;
      }
      seenCreditors.add(creditorKey);
      const voucherCount = voucherCountsByVendor.get(normalizedVendorName) || creditor.voucherCount || 0;
      insert.run(
        crypto.randomUUID(),
        id,
        creditor.party,
        normalizedVendorName,
        creditor.outstandingAmount || 0,
        creditor.daysOutstanding ?? null,
        creditor.bucket || "Unknown",
        creditor.delayed ? 1 : 0,
        creditor.interestLiability || 0,
        creditor.disallowanceAmount || 0,
        creditor.oldestInvoiceDate || "",
        creditor.panNumber || "",
        creditor.agreedPaymentDays || creditor.vendorMaster?.agreedPaymentDays || 0,
        creditor.openingBalance || 0,
        creditor.closingBalance || 0,
        creditor.openingBalanceRaw || "",
        creditor.closingBalanceRaw || "",
        voucherCount,
        JSON.stringify({ ...creditor, voucherCount })
      );
    }
    const insertVoucher = db.prepare(`
      INSERT INTO tally_ledger_vouchers (
        id, import_run_id, fiscal_year, financial_year, fy_start_date, fy_end_date, report_from_date, report_to_date, as_on_date,
        company_name, vendor_name, normalized_vendor_name,
        ledger_name, normalized_ledger_name, voucher_date, particulars, voucher_type,
        voucher_number, debit, credit, amount, bill_reference, pending_amount, party_ledger_name,
        ledger_parent, group_hierarchy_json, voucher_source, invoice_date, acceptance_date, deemed_acceptance_date,
        has_written_agreement, agreement_credit_days, agreement_evidence_link, appointed_day, payment_date,
        evidence_status, verification_required, verification_flags_json, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const timestamp = nowIso();
    const seenVouchers = new Set();
    let duplicateVoucherCount = 0;
    for (const voucher of ledgerVouchers) {
      const vendorName = voucher.vendorName || voucher.ledgerName;
      const normalizedVendorName = voucher.normalizedVendorName || voucher.normalizedLedgerName || normalizeVendorName(vendorName);
      const derivedFinancialYear = voucher.financialYear || defaultPeriod?.financialYear || fiscalYearForDate(voucher.date) || fiscalYear;
      const fyDates = fiscalYearDates(derivedFinancialYear) || {};
      const voucherKey = [
        normalizedVendorName,
        voucher.date || "",
        voucher.voucherType || "",
        voucher.voucherNumber || "",
        voucher.amount || Math.max(voucher.debit || 0, voucher.credit || 0),
        voucher.billReference || "",
      ].join("|");
      if (seenVouchers.has(voucherKey)) {
        duplicateVoucherCount += 1;
        continue;
      }
      seenVouchers.add(voucherKey);
      const raw = voucher.raw || voucher;
      const invoiceDate = voucher.invoiceDate || raw.invoiceDate || voucher.date || "";
      const acceptanceDate = voucher.acceptanceDate || raw.acceptanceDate || "";
      const deemedAcceptanceDate = voucher.deemedAcceptanceDate || raw.deemedAcceptanceDate || "";
      const agreementDays = Number(voucher.agreedPaymentDays ?? raw.agreedPaymentDays ?? 0);
      const hasWrittenAgreement = voucher.hasWrittenAgreement ?? raw.hasWrittenAgreement ?? (agreementDays > 0 ? true : null);
      const verificationFlags = voucher.verificationFlags || raw.verificationFlags || [];
      insertVoucher.run(
        crypto.randomUUID(),
        id,
        fiscalYear,
        derivedFinancialYear,
        voucher.fyStartDate || defaultPeriod?.fyStartDate || fyDates.fyStartDate || "",
        voucher.fyEndDate || defaultPeriod?.fyEndDate || fyDates.fyEndDate || "",
        voucher.reportFromDate || defaultPeriod?.reportFromDate || "",
        voucher.reportToDate || defaultPeriod?.reportToDate || "",
        voucher.asOnDate || defaultPeriod?.asOnDate || summary?.asOn || "",
        companyName,
        vendorName,
        normalizedVendorName,
        voucher.ledgerName,
        voucher.normalizedLedgerName || normalizedVendorName,
        voucher.date || "",
        voucher.particulars || "",
        voucher.voucherType || "",
        voucher.voucherNumber || "",
        voucher.debit || 0,
        voucher.credit || 0,
        voucher.amount || Math.max(voucher.debit || 0, voucher.credit || 0),
        voucher.billReference || "",
        voucher.pendingAmount || 0,
        voucher.partyLedgerName || "",
        voucher.ledgerParent || "",
        JSON.stringify(voucher.groupHierarchy || []),
        voucher.voucherSource || "Day Book",
        invoiceDate,
        acceptanceDate,
        deemedAcceptanceDate,
        hasWrittenAgreement == null ? null : (hasWrittenAgreement ? 1 : 0),
        agreementDays || null,
        voucher.agreementEvidence || raw.agreementEvidence || "",
        voucher.appointedDay || raw.appointedDay || "",
        voucher.paymentDate || raw.paymentDate || "",
        voucher.evidenceStatus || raw.evidenceStatus || "pending_review",
        voucher.verificationRequired || raw.verificationRequired ? 1 : 0,
        JSON.stringify(verificationFlags),
        JSON.stringify(raw),
        timestamp
      );
    }
    persistedVoucherCount = db.prepare("SELECT COUNT(*) AS total FROM tally_ledger_vouchers WHERE import_run_id = ?").get(id).total;
    sampleVoucher = db.prepare("SELECT * FROM tally_ledger_vouchers WHERE import_run_id = ? ORDER BY voucher_date ASC, ledger_name ASC LIMIT 1").get(id);
    const finalSummary = {
      ...(summary || {}),
      vouchersPersisted: persistedVoucherCount,
      duplicateVouchersSkipped: duplicateVoucherCount,
      duplicateCreditorsSkipped: duplicateCreditorCount,
    };
    db.prepare(`
      UPDATE tally_import_runs
      SET status = 'completed', company_name = ?, summary_json = ?, error = '', updated_at = ?
      WHERE id = ?
    `).run(companyName, JSON.stringify(finalSummary), nowIso(), id);
  });
  tx();
  logImportStage("voucherPersist", {
    status: "success",
    importRunId: id,
    fiscalYear,
    companyName,
    persistedVoucherCount,
    duplicateVouchersSkipped: ledgerVouchers.length - persistedVoucherCount,
    sampleVoucher: sampleVoucher ? {
      ledgerName: sampleVoucher.ledger_name,
      date: sampleVoucher.voucher_date,
      voucherType: sampleVoucher.voucher_type,
      voucherNumber: sampleVoucher.voucher_number,
      billReference: sampleVoucher.bill_reference || "",
      voucherSource: sampleVoucher.voucher_source || "Day Book",
      amount: sampleVoucher.amount,
    } : null,
  });
}

function failRun(id, error) {
  db.prepare("UPDATE tally_import_runs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?").run(
    error.message || String(error),
    nowIso(),
    id
  );
}

function getRun(id) {
  return mapRun(db.prepare("SELECT * FROM tally_import_runs WHERE id = ?").get(id));
}

function listRuns() {
  return db.prepare("SELECT * FROM tally_import_runs ORDER BY created_at DESC LIMIT 50").all().map(mapRun).map(compactRunForList);
}

function getLatestCompletedRun() {
  return mapRun(db.prepare("SELECT * FROM tally_import_runs WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1").get());
}

function getRawCreditorRows(importRunId) {
  return db.prepare("SELECT * FROM tally_import_creditors WHERE import_run_id = ? ORDER BY outstanding_amount DESC").all(importRunId);
}

function getIgnoredNonSundryCreditors(importRunId) {
  return getRawCreditorRows(importRunId)
    .map((row) => mapCreditor(row))
    .filter((row) => !isSundryCreditorRow(row));
}

function getCreditors(importRunId) {
  return getRawCreditorRows(importRunId).map((row) => mapCreditor(row)).filter(isSundryCreditorRow);
}

function getSundryCreditorNames(importRunId) {
  return new Set(getCreditors(importRunId).map((creditor) => creditor.normalizedVendorName).filter(Boolean));
}

function isAllFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "all" || normalized === "all ledgers" || normalized === "all voucher types";
}

function getLedgerVouchers(importRunId, filters = {}) {
  const where = ["import_run_id = ?"];
  const params = [importRunId];
  const sundryNames = getSundryCreditorNames(importRunId);
  const hasCreditorRows = getRawCreditorRows(importRunId).length > 0;
  if (hasCreditorRows && sundryNames.size === 0) {
    where.push("1 = 0");
  } else if (sundryNames.size > 0) {
    where.push(`normalized_ledger_name IN (${Array.from(sundryNames).map(() => "?").join(",")})`);
    params.push(...Array.from(sundryNames));
  }
  const ledgerName = isAllFilter(filters.ledgerName) ? "" : filters.ledgerName;
  const voucherType = isAllFilter(filters.voucherType) ? "" : filters.voucherType;

  if (ledgerName) {
    where.push("normalized_ledger_name = ?");
    params.push(normalizeVendorName(ledgerName));
  }
  if (voucherType) {
    where.push("LOWER(voucher_type) = LOWER(?)");
    params.push(voucherType);
  }
  const requestedFinancialYear = String(filters.financialYear || filters.fiscalYear || "").trim();
  if (requestedFinancialYear && requestedFinancialYear.toLowerCase() !== "all" && requestedFinancialYear !== "custom") {
    where.push("(financial_year = ? OR (financial_year = '' AND fiscal_year = ?))");
    params.push(requestedFinancialYear, requestedFinancialYear);
  }
  if (filters.fromDate) {
    where.push("voucher_date >= ?");
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    where.push("voucher_date <= ?");
    params.push(filters.toDate);
  }
  if (filters.search) {
    where.push("(LOWER(ledger_name) LIKE LOWER(?) OR LOWER(particulars) LIKE LOWER(?) OR LOWER(voucher_number) LIKE LOWER(?) OR LOWER(bill_reference) LIKE LOWER(?))");
    const query = `%${filters.search}%`;
    params.push(query, query, query, query);
  }

  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 250, 1), 1000);
  const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);
  const whereSql = where.join(" AND ");
  const rows = db.prepare(`
    SELECT * FROM tally_ledger_vouchers
    WHERE ${whereSql}
    ORDER BY voucher_date ASC, ledger_name ASC, voucher_number ASC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset).map(mapLedgerVoucher);
  const total = db.prepare(`SELECT COUNT(*) AS total FROM tally_ledger_vouchers WHERE ${whereSql}`).get(...params).total;
  logImportStage("voucherQuery", {
    importRunId,
    filters: {
      ledgerName: ledgerName || null,
      voucherType: voucherType || null,
      fromDate: filters.fromDate || null,
      toDate: filters.toDate || null,
      search: filters.search || null,
    },
    queriedVoucherCount: rows.length,
    total,
    limit,
    offset,
    sampleVoucher: rows[0] ? {
      ledgerName: rows[0].ledgerName,
      date: rows[0].date,
      voucherType: rows[0].voucherType,
      voucherNumber: rows[0].voucherNumber,
      billReference: rows[0].billReference,
      voucherSource: rows[0].voucherSource,
      amount: rows[0].amount,
    } : null,
  });
  return { rows, total, limit, offset };
}

function getAllLedgerVouchers(importRunId) {
  const sundryNames = getSundryCreditorNames(importRunId);
  const hasCreditorRows = getRawCreditorRows(importRunId).length > 0;
  const rows = db.prepare(`
    SELECT * FROM tally_ledger_vouchers
    WHERE import_run_id = ?
    ORDER BY voucher_date ASC, ledger_name ASC, voucher_number ASC
  `).all(importRunId).map(mapLedgerVoucher);
  if (hasCreditorRows && !sundryNames.size) return [];
  if (!sundryNames.size) return rows;
  return rows.filter((row) => sundryNames.has(row.normalizedLedgerName || row.normalizedVendorName));
}

function getLedgerVouchersForReport(importRunId, filters = {}) {
  const requestedFinancialYear = String(filters.financialYear || filters.fiscalYear || "").trim();
  return getAllLedgerVouchers(importRunId).filter((row) => {
    if (requestedFinancialYear && requestedFinancialYear.toLowerCase() !== "all" && requestedFinancialYear !== "custom") {
      if (row.financialYear !== requestedFinancialYear && row.fiscalYear !== requestedFinancialYear) return false;
    }
    if (filters.fromDate && row.date < filters.fromDate) return false;
    if (filters.toDate && row.date > filters.toDate) return false;
    return true;
  });
}

function getDaybookVouchers(importRunId, filters = {}) {
  const where = ["import_run_id = ?"];
  const params = [importRunId];
  if (filters.ledgerName) {
    where.push("normalized_ledger_name = ?");
    params.push(normalizeVendorName(filters.ledgerName));
  }
  if (filters.voucherType) {
    where.push("LOWER(voucher_type) = LOWER(?)");
    params.push(filters.voucherType);
  }
  const requestedFinancialYear = String(filters.financialYear || filters.fiscalYear || "").trim();
  if (requestedFinancialYear && requestedFinancialYear.toLowerCase() !== "all" && requestedFinancialYear !== "custom") {
    where.push("(financial_year = ? OR (financial_year = '' AND fiscal_year = ?))");
    params.push(requestedFinancialYear, requestedFinancialYear);
  }
  if (filters.search) {
    where.push("(LOWER(ledger_name) LIKE LOWER(?) OR LOWER(particulars) LIKE LOWER(?) OR LOWER(voucher_number) LIKE LOWER(?) OR LOWER(bill_reference) LIKE LOWER(?))");
    const query = `%${filters.search}%`;
    params.push(query, query, query, query);
  }
  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 250, 1), 1000);
  const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);
  const whereSql = where.join(" AND ");
  const rows = db.prepare(`
    SELECT * FROM tally_ledger_vouchers
    WHERE ${whereSql}
    ORDER BY voucher_date ASC, ledger_name ASC, voucher_number ASC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset).map(mapLedgerVoucher);
  const total = db.prepare(`SELECT COUNT(*) AS total FROM tally_ledger_vouchers WHERE ${whereSql}`).get(...params).total;
  return { rows, total, limit, offset };
}

function getAllDaybookVouchers(importRunId) {
  return db.prepare(`
    SELECT * FROM tally_ledger_vouchers
    WHERE import_run_id = ?
    ORDER BY voucher_date ASC, ledger_name ASC, voucher_number ASC
  `).all(importRunId).map(mapLedgerVoucher);
}

function getLedgerVoucherDiagnostics(importRunId) {
  const total = db.prepare("SELECT COUNT(*) AS total FROM tally_ledger_vouchers WHERE import_run_id = ?").get(importRunId).total;
  const sample = db.prepare("SELECT * FROM tally_ledger_vouchers WHERE import_run_id = ? ORDER BY voucher_date ASC, ledger_name ASC LIMIT 1").get(importRunId);
  return {
    importRunId,
    persistedVoucherCount: total,
    sampleVoucher: sample ? mapLedgerVoucher(sample) : null,
  };
}

function saveBaselineSnapshot(importRunId, rows = []) {
  const timestamp = nowIso();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM msme_baseline_snapshots WHERE import_run_id = ?").run(importRunId);
    const insert = db.prepare(`
      INSERT INTO msme_baseline_snapshots (
        id, import_run_id, baseline_date, vendor_name, normalized_vendor_name, opening_balance,
        closing_balance, ledger_payable_outstanding, pan_number, raw_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const row of rows) {
      insert.run(
        crypto.randomUUID(),
        importRunId,
        row.baselineDate || row.baseline_date || "2025-03-31",
        row.vendorName || row.ledgerName || row.party || "",
        row.normalizedVendorName || row.normalizedLedgerName || normalizeVendorName(row.vendorName || row.ledgerName || row.party),
        Number(row.openingBalance || 0),
        Number(row.closingBalance || 0),
        Number(row.ledgerPayableOutstanding ?? row.outstandingAmount ?? Math.max(-Number(row.closingBalance || 0), 0)),
        row.panNumber || "",
        JSON.stringify(row.raw || row),
        timestamp
      );
    }
  });
  tx();
  return getBaselineSnapshot(importRunId);
}

function getBaselineSnapshot(importRunId, baselineDate = "") {
  const params = [importRunId];
  let where = "import_run_id = ?";
  if (baselineDate) {
    where += " AND baseline_date = ?";
    params.push(baselineDate);
  }
  return db.prepare(`
    SELECT * FROM msme_baseline_snapshots
    WHERE ${where}
    ORDER BY vendor_name ASC
  `).all(...params).map((row) => ({
    id: row.id,
    importRunId: row.import_run_id,
    baselineDate: row.baseline_date,
    vendorName: row.vendor_name,
    normalizedVendorName: row.normalized_vendor_name,
    openingBalance: Number(row.opening_balance || 0),
    closingBalance: Number(row.closing_balance || 0),
    ledgerPayableOutstanding: Number(row.ledger_payable_outstanding || 0),
    panNumber: row.pan_number || "",
    raw: parseJson(row.raw_json, {}),
    createdAt: row.created_at,
  }));
}

module.exports = {
  createRun,
  completeRun,
  failRun,
  getRun,
  getLatestCompletedRun,
  listRuns,
  getCreditors,
  getIgnoredNonSundryCreditors,
  getLedgerVouchers,
  getAllLedgerVouchers,
  getLedgerVouchersForReport,
  getDaybookVouchers,
  getAllDaybookVouchers,
  getLedgerVoucherDiagnostics,
  saveBaselineSnapshot,
  getBaselineSnapshot,
  mapCreditor,
  mapLedgerVoucher,
};
