const tallyService = require("./tally.service");
const importRepository = require("../repositories/importRepository");
const vendorRepository = require("../repositories/vendorRepository");
const { enrichCreditorsWithVoucherAging } = require("./payableAging.service");
const { attachLedgerMetadata, buildStatementBundle, deriveSundryCreditors } = require("./financialStatements.service");
const { splitIntoFinancialYearPeriods } = require("../utils/financialYear");
const { normalizeVendorName } = require("../utils/normalizeVendorName");
const { hasReportableUdyam } = require("./msmeRuleEngine.service");

function buildVerificationSummary(creditors) {
  const total = creditors.length;
  const verifiedMSME = creditors.filter((row) =>
    row.vendorMaster?.isMSME &&
    ["verified", "approved"].includes(row.vendorMaster?.udyamStatus)
  ).length;
  const reportableMSME = creditors.filter((row) => hasReportableUdyam(row.vendorMaster)).length;
  const nonMSME = creditors.filter((row) => row.vendorMaster?.verificationStatus === "not_msme").length;
  const failed = creditors.filter((row) =>
    ["failed", "manual_fallback_required", "pending_manual_review", "rejected"].includes(row.vendorMaster?.udyamStatus)
  ).length;
  const pendingVerification = total - Math.max(verifiedMSME, reportableMSME) - nonMSME - failed;
  return { total, verifiedMSME: Math.max(verifiedMSME, reportableMSME), pendingVerification: Math.max(pendingVerification, 0), nonMSME, failedVerification: failed };
}

function enrichCreditors(creditors) {
  const master = vendorRepository.getAllVendors();
  const masterByNormalized = new Map(master.map((vendor) => [vendor.normalizedVendorName, vendor]));
  const masterByPan = new Map(master.filter((vendor) => vendor.panNumber).map((vendor) => [String(vendor.panNumber).toUpperCase(), vendor]));
  return creditors.map((creditor) => ({
    ...creditor,
    vendorMaster: masterByNormalized.get(creditor.normalizedVendorName)
      || masterByPan.get(String(creditor.panNumber || "").toUpperCase())
      || null,
  }));
}

function logImportStage(stage, details = {}) {
  console.log(`[tally-import] stage=${stage} ${JSON.stringify(details)}`);
}

function healthFailureMessage(health) {
  if (health.reachable === false) return health.error || health.message || "TallyPrime is not open or port 9000 is unreachable";
  if (health.portOpen === false) return "TallyPrime is not open or port 9000 is unreachable";
  if (health.serverRunning === false) return health.error || health.message || "Tally server is not running";
  if (health.xmlPostWorking === false) return "Tally server is reachable, but XML export request failed.";
  return null;
}

function createImportError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function statusForHealthFailure(health) {
  if (health.reachable === false || health.portOpen === false || health.serverRunning === false) return 503;
  if (health.xmlPostWorking === false) return 502;
  return 400;
}

function expectedDatesForFiscalYear(fiscalYear) {
  const match = String(fiscalYear || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const startYear = Number(match[1]);
  return {
    fromDate: `${startYear}0401`,
    toDate: `${startYear + 1}0331`,
  };
}

function normalizeCompactDate(value) {
  return String(value || "").replace(/-/g, "");
}

function isValidCompactDate(value) {
  if (!/^\d{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function assertImportPeriod({ periodType = "financial_year", fiscalYear, fromDate, toDate }) {
  const normalizedFrom = normalizeCompactDate(fromDate);
  const normalizedTo = normalizeCompactDate(toDate);
  if (!isValidCompactDate(normalizedFrom) || !isValidCompactDate(normalizedTo)) {
    throw new Error("fromDate and toDate must be valid dates in YYYYMMDD format.");
  }
  if (normalizedFrom > normalizedTo) throw new Error("fromDate must be before or equal to toDate.");
  if (periodType === "custom") return { fromDate: normalizedFrom, toDate: normalizedTo };
  const expected = expectedDatesForFiscalYear(fiscalYear);
  if (!expected) throw new Error("A valid fiscalYear is required for financial year imports.");
  if (normalizedFrom !== expected.fromDate || normalizedTo !== expected.toDate) {
    throw new Error(
      `Selected financial year ${fiscalYear} requires ${expected.fromDate} to ${expected.toDate}, received ${normalizedFrom} to ${normalizedTo}.`
    );
  }
  return { fromDate: normalizedFrom, toDate: normalizedTo };
}

function financialYearPeriodsForImport({ periodType = "financial_year", fiscalYear, fromDate, toDate, asOn, capToAsOn = true }) {
  const period = assertImportPeriod({ periodType, fiscalYear, fromDate, toDate });
  const periods = splitIntoFinancialYearPeriods({
    fromDate: period.fromDate,
    toDate: period.toDate,
    asOnDate: normalizeCompactDate(asOn),
    capToAsOn: Boolean(capToAsOn && asOn),
  });
  return periods.length ? periods : [{
    financialYear: fiscalYear || "custom",
    fyStartDate: period.fromDate,
    fyEndDate: period.toDate,
    reportFromDate: period.fromDate,
    reportToDate: period.toDate,
    asOnDate: normalizeCompactDate(asOn),
    cappedByAsOn: false,
  }];
}

function creditorRowsFromDaybook({ ledgerMetadata, ledgerVouchers, asOn }) {
  const creditors = deriveSundryCreditors(ledgerMetadata, ledgerVouchers);
  return creditors.map((creditor) => ({
    party: creditor.ledgerName,
    normalizedVendorName: creditor.normalizedLedgerName,
    outstandingAmount: Math.round(Number(creditor.outstandingAmount || 0) * 100) / 100,
    openingBalance: creditor.openingBalance,
    closingBalance: creditor.closingBalance,
    openingBalanceRaw: creditor.ledgerOpeningBalanceRaw || "",
    closingBalanceRaw: creditor.ledgerClosingBalanceRaw || "",
    openingBalanceType: "",
    closingBalanceType: creditor.closingBalance < 0 ? "credit" : creditor.closingBalance > 0 ? "debit" : "zero",
    payableBalance: creditor.closingBalance < 0 || creditor.outstandingAmount > 0,
    guid: creditor.guid || "",
    gstin: creditor.gstin || "",
    panNumber: creditor.panNumber || "",
    udyamNumber: creditor.udyamNumber || "",
    detectionReasons: [
      ...(creditor.isSundryCreditor ? ["creditor_parent_or_ancestor"] : []),
      ...(creditor.hasCurrentActivity ? ["current_period_activity"] : []),
      ...(creditor.reviewReason ? [creditor.reviewReason] : []),
    ],
    groupHierarchy: creditor.groupHierarchy || [],
    parent: creditor.parent || "",
    raw: {
      name: creditor.ledgerName,
      parent: creditor.parent || "",
      groupHierarchy: creditor.groupHierarchy || [],
      reviewReason: creditor.reviewReason || "",
      asOn,
    },
    daysOutstanding: null,
    bucket: "Unknown",
    delayed: false,
    interestLiability: 0,
    disallowanceAmount: 0,
    oldestInvoiceDate: "",
  }));
}

function tokenScore(left, right) {
  const leftTokens = new Set(String(left || "").split(/\s+/).filter((token) => token.length > 2));
  const rightTokens = new Set(String(right || "").split(/\s+/).filter((token) => token.length > 2));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const common = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return common / Math.max(leftTokens.size, rightTokens.size);
}

function creditorRowFromLedger({ ledger, vendorMaster, asOn }) {
  const payableOutstanding = Math.max(
    Number(ledger.ledgerPayableOutstanding || 0),
    -Number(ledger.closingBalance || 0),
    Number(ledger.outstandingAmount || 0),
    0
  );
  return {
    party: ledger.name || ledger.ledgerName || vendorMaster.vendorName,
    normalizedVendorName: ledger.normalizedName || normalizeVendorName(ledger.name || ledger.ledgerName || vendorMaster.vendorName),
    outstandingAmount: Math.round(payableOutstanding * 100) / 100,
    openingBalance: ledger.openingBalance || 0,
    closingBalance: ledger.closingBalance || -payableOutstanding,
    openingBalanceRaw: ledger.openingBalanceRaw || "",
    closingBalanceRaw: ledger.closingBalanceRaw || "",
    openingBalanceType: "",
    closingBalanceType: payableOutstanding > 0 ? "credit" : "zero",
    payableBalance: payableOutstanding > 0,
    guid: ledger.guid || "",
    gstin: ledger.gstin || "",
    panNumber: ledger.panNumber || vendorMaster.panNumber || "",
    udyamNumber: vendorMaster.udyamNumber || "",
    detectionReasons: ["uploaded_udyam_metadata_match"],
    validationFlags: ["RECOVERED_FROM_UPLOADED_UDYAM_MATCH"],
    groupHierarchy: ledger.groupHierarchy || ["Sundry Creditors"],
    parent: ledger.parent || "Sundry Creditors",
    raw: { ...(ledger.raw || ledger), asOn, recoveredFromUploadedUdyam: true },
    daysOutstanding: null,
    bucket: "Unknown",
    delayed: false,
    interestLiability: 0,
    disallowanceAmount: 0,
    oldestInvoiceDate: "",
  };
}

function creditorRowFromTargetedVouchers({ vendorMaster, vouchers, asOn }) {
  const debit = vouchers.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const credit = vouchers.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const voucherOutstanding = Math.max(credit - debit, 0);
  return {
    party: vendorMaster.vendorName,
    normalizedVendorName: vendorMaster.normalizedVendorName,
    outstandingAmount: Math.round(voucherOutstanding * 100) / 100,
    openingBalance: 0,
    closingBalance: -voucherOutstanding,
    openingBalanceRaw: "",
    closingBalanceRaw: "",
    openingBalanceType: "",
    closingBalanceType: voucherOutstanding > 0 ? "credit" : "zero",
    payableBalance: voucherOutstanding > 0,
    guid: "",
    gstin: "",
    panNumber: vendorMaster.panNumber || "",
    udyamNumber: vendorMaster.udyamNumber || "",
    detectionReasons: ["targeted_uploaded_udyam_ledger_vouchers"],
    validationFlags: ["TARGETED_LEDGER_LOOKUP", "VOUCHER_ONLY_OUTSTANDING"],
    groupHierarchy: ["Sundry Creditors"],
    parent: "Sundry Creditors",
    raw: { asOn, recoveredFromUploadedUdyam: true, targetedLedgerVoucherCount: vouchers.length },
    daysOutstanding: null,
    bucket: "Unknown",
    delayed: false,
    interestLiability: 0,
    disallowanceAmount: 0,
    oldestInvoiceDate: "",
  };
}

async function recoverUploadedUdyamCreditors({ creditors, ledgerMetadata, ledgerVoucherRows, financialYearPeriods, companyName, asOn, runId }) {
  const creditorByName = new Map(creditors.map((creditor) => [creditor.normalizedVendorName, creditor]));
  const allVendors = vendorRepository.getAllVendors().filter(hasReportableUdyam);
  const recoveredCreditors = [];
  const recoveredVouchers = [];
  for (const vendor of allVendors) {
    if (creditorByName.has(vendor.normalizedVendorName)) continue;
    const metadataMatch = ledgerMetadata.find((ledger) => {
      const ledgerName = ledger.normalizedName || normalizeVendorName(ledger.name || ledger.ledgerName);
      const panMatches = vendor.panNumber && String(ledger.panNumber || "").toUpperCase() === String(vendor.panNumber).toUpperCase();
      return ledgerName === vendor.normalizedVendorName || panMatches || tokenScore(ledgerName, vendor.normalizedVendorName) >= 0.8;
    });
    if (metadataMatch) {
      const recovered = creditorRowFromLedger({ ledger: metadataMatch, vendorMaster: vendor, asOn });
      if (recovered.outstandingAmount > 0) {
        logImportStage("uploadedUdyamRecovery", { status: "metadata_match", runId, vendorName: vendor.vendorName, ledgerName: recovered.party, outstandingAmount: recovered.outstandingAmount });
        recoveredCreditors.push(recovered);
        creditorByName.set(recovered.normalizedVendorName, recovered);
        continue;
      }
    }
    const targetPeriods = financialYearPeriods.length ? financialYearPeriods : [{ reportFromDate: "", reportToDate: "" }];
    const vendorRows = [];
    for (const fyPeriod of targetPeriods) {
      try {
        const rows = await tallyService.fetchLedgerVouchers({
          ledgerName: vendor.vendorName,
          from: fyPeriod.reportFromDate,
          to: fyPeriod.reportToDate,
          companyName,
        });
        vendorRows.push(...rows.map((row) => ({
          ...row,
          financialYear: fyPeriod.financialYear,
          fyStartDate: fyPeriod.fyStartDate,
          fyEndDate: fyPeriod.fyEndDate,
          reportFromDate: fyPeriod.reportFromDate,
          reportToDate: fyPeriod.reportToDate,
          asOnDate: fyPeriod.asOnDate || asOn,
          voucherSource: "Targeted Ledger Vouchers",
        })));
      } catch (error) {
        logImportStage("uploadedUdyamRecovery", { status: "targeted_lookup_failed", runId, vendorName: vendor.vendorName, error: error.message });
      }
    }
    if (vendorRows.length) {
      const recovered = creditorRowFromTargetedVouchers({ vendorMaster: vendor, vouchers: vendorRows, asOn });
      if (recovered.outstandingAmount > 0) {
        logImportStage("uploadedUdyamRecovery", { status: "targeted_lookup_match", runId, vendorName: vendor.vendorName, rows: vendorRows.length, outstandingAmount: recovered.outstandingAmount });
        recoveredCreditors.push(recovered);
        recoveredVouchers.push(...vendorRows);
        creditorByName.set(recovered.normalizedVendorName, recovered);
      }
    }
  }
  return {
    creditors: [...creditors, ...recoveredCreditors],
    ledgerVoucherRows: [...ledgerVoucherRows, ...recoveredVouchers],
    recoveredCount: recoveredCreditors.length,
    recoveredVoucherCount: recoveredVouchers.length,
  };
}

function countCreditorImpactRows(rows = [], creditors = []) {
  const creditorNames = new Set(
    creditors
      .flatMap((creditor) => [
        creditor.normalizedVendorName,
        normalizeVendorName(creditor.party || creditor.name || creditor.ledgerName),
      ])
      .filter(Boolean)
  );
  if (!creditorNames.size) return 0;
  return rows.filter((row) => {
    const names = [
      row.normalizedLedgerName,
      row.normalizedVendorName,
      normalizeVendorName(row.ledgerName),
      normalizeVendorName(row.vendorName),
      normalizeVendorName(row.partyLedgerName),
    ].filter(Boolean);
    return names.some((name) => creditorNames.has(name));
  }).length;
}

async function captureBaselineSnapshot({ importRunId, companyName, baselineDate = "2025-03-31" }) {
  try {
    const snapshot = await tallyService.fetchLedgerSnapshot({ companyName, asOnDate: baselineDate });
    const rows = snapshot.ledgers
      .filter((ledger) => ledger.isSundryCreditor)
      .map((ledger) => ({
        baselineDate,
        vendorName: ledger.name || ledger.ledgerName,
        ledgerName: ledger.name || ledger.ledgerName,
        normalizedVendorName: ledger.normalizedName,
        openingBalance: Number(ledger.openingBalance || 0),
        closingBalance: Number(ledger.closingBalance || 0),
        ledgerPayableOutstanding: Math.max(-Number(ledger.closingBalance || 0), 0),
        panNumber: ledger.panNumber || "",
        raw: ledger,
      }));
    importRepository.saveBaselineSnapshot(importRunId, rows);
    return { status: "available", baselineDate, rowCount: rows.length, warning: "" };
  } catch (error) {
    return { status: "unavailable", baselineDate, rowCount: 0, warning: `Baseline snapshot unavailable: ${error.message}` };
  }
}

async function importFromTally({ periodType = "financial_year", fiscalYear, fromDate, toDate, asOn, capToAsOn = true, companyName, actor }) {
  const period = assertImportPeriod({ periodType, fiscalYear, fromDate, toDate });
  const selectedFiscalYear = periodType === "custom" ? (fiscalYear || "custom") : fiscalYear;
  const selectedAsOn = asOn || new Date().toISOString().split("T")[0];
  const financialYearPeriods = financialYearPeriodsForImport({ periodType, fiscalYear, fromDate, toDate, asOn, capToAsOn });
  const runId = importRepository.createRun({
    fiscalYear: selectedFiscalYear,
    periodType,
    fromDate: period.fromDate,
    toDate: period.toDate,
    asOn: selectedAsOn,
    status: "running",
    actor,
  });

  try {
    logImportStage("ping", { status: "preflight_start", runId });
    const health = await tallyService.tallyHealth({ companyName });
    logImportStage("ping", {
      status: "preflight_result",
      runId,
      reachable: health.reachable,
      portOpen: health.portOpen,
      serverRunning: health.serverRunning,
      xmlPostWorking: health.xmlPostWorking,
      companyDetected: health.companyDetected,
      message: health.message,
      error: health.error,
    });
    const preflightError = healthFailureMessage(health);
    if (preflightError) throw createImportError(preflightError, statusForHealthFailure(health));

    logImportStage("ledgerMetadata", { status: "start", runId });
    const ledgerMetadataResult = await tallyService.fetchLedgerMetadata({ companyName: health.companyName || companyName });
    const selectedCompanyName = ledgerMetadataResult.companyName || health.companyName;
    logImportStage("ledgerMetadata", { status: "success", runId, ledgerCount: ledgerMetadataResult.ledgers.length });
    const metadataCreditorRows = creditorRowsFromDaybook({
      ledgerMetadata: ledgerMetadataResult.ledgers,
      ledgerVouchers: [],
      asOn: selectedAsOn,
    });

    logImportStage("daybookExport", { status: "start", runId, from: period.fromDate, to: period.toDate, financialYearPeriods });
    const dayBookResults = [];
    for (const fyPeriod of financialYearPeriods) {
      logImportStage("daybookExport", { status: "fy_start", runId, financialYear: fyPeriod.financialYear, from: fyPeriod.reportFromDate, to: fyPeriod.reportToDate, cappedByAsOn: fyPeriod.cappedByAsOn });
      let fyResult = await tallyService.fetchAllDayBookVouchers({
        from: fyPeriod.reportFromDate,
        to: fyPeriod.reportToDate,
        companyName: selectedCompanyName,
      });
      const creditorImpactRows = countCreditorImpactRows(fyResult.rows, metadataCreditorRows);
      if ((fyResult.rows.length === 0 || creditorImpactRows === 0) && metadataCreditorRows.length > 0) {
        const fallbackReason = fyResult.rows.length === 0
          ? "Full Day Book returned no parsed voucher rows"
          : "Full Day Book returned voucher rows, but none matched detected creditor ledgers";
        logImportStage("daybookExport", {
          status: "creditor_fallback_start",
          runId,
          financialYear: fyPeriod.financialYear,
          from: fyPeriod.reportFromDate,
          to: fyPeriod.reportToDate,
          creditorCount: metadataCreditorRows.length,
          dayBookRows: fyResult.rows.length,
          creditorImpactRows,
          reason: fallbackReason,
        });
        const fallbackResult = await tallyService.fetchAllCreditorLedgerVouchers({
          creditors: metadataCreditorRows,
          from: fyPeriod.reportFromDate,
          to: fyPeriod.reportToDate,
          companyName: selectedCompanyName,
        });
        fyResult = {
          ...fallbackResult,
          warnings: [
            ...(fyResult.warnings || []),
            ...(fallbackResult.warnings || []),
          ],
          voucherSource: fallbackResult.voucherSource || fyResult.voucherSource,
          fallbackUsed: true,
        };
        logImportStage("daybookExport", {
          status: "creditor_fallback_end",
          runId,
          financialYear: fyPeriod.financialYear,
          rows: fyResult.rows.length,
          voucherSource: fyResult.voucherSource,
          reason: fallbackReason,
        });
      }
      dayBookResults.push({
        ...fyResult,
        period: fyPeriod,
        rows: fyResult.rows.map((row) => ({
          ...row,
          financialYear: fyPeriod.financialYear,
          fyStartDate: fyPeriod.fyStartDate,
          fyEndDate: fyPeriod.fyEndDate,
          reportFromDate: fyPeriod.reportFromDate,
          reportToDate: fyPeriod.reportToDate,
          asOnDate: fyPeriod.asOnDate || selectedAsOn,
        })),
      });
      logImportStage("daybookExport", { status: "fy_success", runId, financialYear: fyPeriod.financialYear, rows: fyResult.rows.length });
    }
    const mergedDaybookRows = dayBookResults.flatMap((result) => result.rows);
    const dayBookWarnings = dayBookResults.flatMap((result) => result.warnings || []);
    const dayBookResult = {
      rows: mergedDaybookRows,
      warnings: dayBookWarnings,
      voucherSource: [...new Set(dayBookResults.map((result) => result.voucherSource).filter(Boolean))].join(" + ") || "Voucher Collection",
      fallbackUsed: dayBookResults.some((result) => result.fallbackUsed),
    };
    let ledgerVoucherRows = attachLedgerMetadata(dayBookResult.rows, ledgerMetadataResult.ledgers);
    let importedCreditors = creditorRowsFromDaybook({
      ledgerMetadata: ledgerMetadataResult.ledgers,
      ledgerVouchers: ledgerVoucherRows,
      asOn: selectedAsOn,
    });
    const recovery = await recoverUploadedUdyamCreditors({
      creditors: importedCreditors,
      ledgerMetadata: ledgerMetadataResult.ledgers,
      ledgerVoucherRows,
      financialYearPeriods,
      companyName: selectedCompanyName,
      asOn: selectedAsOn,
      runId,
    });
    importedCreditors = recovery.creditors;
    ledgerVoucherRows = recovery.ledgerVoucherRows;
    const statements = buildStatementBundle(ledgerVoucherRows, ledgerMetadataResult.ledgers);
    const data = {
      success: true,
      asOn: selectedAsOn,
      period,
      companyName: selectedCompanyName,
      companyNames: ledgerMetadataResult.companyNames,
      companyDetectionMethod: ledgerMetadataResult.companyDetectionMethod,
      summary: {
        totalCreditors: statements.sundryCreditors.length,
        totalOutstanding: Math.round(statements.sundryCreditors.reduce((sum, row) => sum + Number(row.outstandingAmount || 0), 0) * 100) / 100,
        tallySource: "full_daybook",
        creditorDiagnostics: {
          totalLedgersExported: ledgerMetadataResult.ledgers.length,
          detectedCreditorCount: statements.sundryCreditors.length,
          zeroDebitCreditorsWithActivity: statements.summary.zeroDebitCreditorsWithActivity,
        },
        warnings: [
          ...dayBookResult.warnings,
          ...(recovery.recoveredCount ? [`Recovered ${recovery.recoveredCount} uploaded Udyam creditor(s) from metadata/targeted ledger lookup.`] : []),
        ],
      },
      creditors: importedCreditors,
    };
    logImportStage("companyDetect", {
      status: "ledger_metadata_selected",
      runId,
      companyDetected: true,
      companyName: selectedCompanyName,
      fallbackMethodUsed: data.companyDetectionMethod || health.companyDetectionMethod,
    });
    logImportStage("creditorsExport", { status: "derived", runId, count: data.creditors.length });

    const ledgerVoucherResult = {
      rows: ledgerVoucherRows,
      warnings: dayBookResult.warnings,
      voucherSource: dayBookResult.voucherSource,
      fallbackUsed: dayBookResult.fallbackUsed,
    };
    logImportStage("vouchersExport", {
      status: "success",
      runId,
      exportedVoucherCount: ledgerVoucherResult.rows.length,
      parsedVoucherCount: ledgerVoucherResult.rows.length,
      importRunId: runId,
      rows: ledgerVoucherResult.rows.length,
      warnings: ledgerVoucherResult.warnings.length,
      voucherSource: ledgerVoucherResult.voucherSource,
      fallbackUsed: ledgerVoucherResult.fallbackUsed,
    });

    const agedCreditors = enrichCreditorsWithVoucherAging(data.creditors, ledgerVoucherResult.rows, selectedAsOn);
    const baselineSnapshotStatus = await captureBaselineSnapshot({
      importRunId: runId,
      companyName: selectedCompanyName,
      baselineDate: "2025-03-31",
    });
    logImportStage("persistImport", { status: "start", runId });
    importRepository.completeRun(runId, {
      summary: {
        ...data.summary,
        selectedFinancialYear: selectedFiscalYear,
        fiscalYear: selectedFiscalYear,
        periodType,
        fromDate: period.fromDate,
        toDate: period.toDate,
        asOn: selectedAsOn,
        capToAsOn: Boolean(capToAsOn),
        financialYears: financialYearPeriods.map((item) => item.financialYear),
        financialYearPeriods,
        cappedByAsOn: financialYearPeriods.some((item) => item.cappedByAsOn),
        companyName: selectedCompanyName,
        voucherSource: ledgerVoucherResult.voucherSource,
        fallbackUsed: ledgerVoucherResult.fallbackUsed,
        creditorsImported: data.creditors.length,
        vouchersParsed: ledgerVoucherResult.rows.length,
        ledgerVouchersFetched: ledgerVoucherResult.rows.length,
        ledgerVoucherWarnings: ledgerVoucherResult.warnings.length,
        ledgerVoucherWarningDetails: ledgerVoucherResult.warnings,
        statementSummary: statements.summary,
        diagnostics: {
          totalDaybookRows: ledgerVoucherResult.rows.length,
          detectedSundryCreditors: data.creditors.length,
          zeroDebitCreditorsWithActivity: statements.summary.zeroDebitCreditorsWithActivity,
          failedOrTruncatedBatches: ledgerVoucherResult.warnings.length,
        },
        baselineSnapshot: baselineSnapshotStatus,
        ledgerMetadata: ledgerMetadataResult.ledgers,
      },
      creditors: agedCreditors,
      ledgerVouchers: ledgerVoucherResult.rows,
    });
    const persistedCreditors = importRepository.getCreditors(runId);
    const ignoredNonSundry = importRepository.getIgnoredNonSundryCreditors(runId);
    const seedSummary = vendorRepository.seedFromImport(runId, persistedCreditors, actor || "unknown");
    const ledgerVoucherDiagnostics = importRepository.getLedgerVoucherDiagnostics(runId);
    const creditorVisibleVoucherCount = importRepository.getLedgerVouchers(runId, { limit: 1 }).total;
    logImportStage("dbDiagnostics", {
      importRunId: runId,
      voucherCountAfterImport: ledgerVoucherDiagnostics.persistedVoucherCount,
      sampleVoucher: ledgerVoucherDiagnostics.sampleVoucher ? {
        ledgerName: ledgerVoucherDiagnostics.sampleVoucher.ledgerName,
        date: ledgerVoucherDiagnostics.sampleVoucher.date,
        voucherType: ledgerVoucherDiagnostics.sampleVoucher.voucherType,
        voucherNumber: ledgerVoucherDiagnostics.sampleVoucher.voucherNumber,
        billReference: ledgerVoucherDiagnostics.sampleVoucher.billReference,
        amount: ledgerVoucherDiagnostics.sampleVoucher.amount,
      } : null,
    });
    logImportStage("persistImport", { status: "success", runId, persistedVoucherCount: ledgerVoucherDiagnostics.persistedVoucherCount });
    const run = importRepository.getRun(runId);
    const creditors = enrichCreditors(importRepository.getCreditors(runId));
    const ignoredNonSundrySamples = ignoredNonSundry.slice(0, 10).map((row) => row.party);
    return {
      success: true,
      importRun: {
        ...run,
        summary: {
          ...(run.summary || {}),
          ignoredNonSundryCount: ignoredNonSundry.length,
          ignoredNonSundrySamples,
        },
      },
      creditors,
      ledgerVoucherSummary: {
        totalRows: creditorVisibleVoucherCount,
        totalLedgers: data.creditors.length,
        failedLedgers: ledgerVoucherResult.warnings.length,
        persistedRows: creditorVisibleVoucherCount,
        voucherSource: ledgerVoucherResult.voucherSource,
        fallbackUsed: ledgerVoucherResult.fallbackUsed,
        totalDaybookRows: ledgerVoucherDiagnostics.persistedVoucherCount,
      },
      ledgerVoucherDiagnostics,
      seedSummary,
      warnings: ledgerVoucherResult.warnings,
      baselineSnapshot: run.summary?.baselineSnapshot || null,
      ignoredNonSundryCount: ignoredNonSundry.length,
      ignoredNonSundrySamples,
      verificationSummary: buildVerificationSummary(creditors),
    };
  } catch (error) {
    logImportStage("persistImport", { status: "failed", runId, error: error.message });
    importRepository.failRun(runId, error);
    throw error;
  }
}

function getImportRun(id, filters = {}) {
  const run = importRepository.getRun(id);
  if (!run) return null;
  const requestedFinancialYear = String(filters.financialYear || filters.fiscalYear || "").trim();
  const baseCreditors = enrichCreditors(importRepository.getCreditors(id));
  const creditors = requestedFinancialYear && requestedFinancialYear !== "all"
    ? enrichCreditorsWithVoucherAging(
      baseCreditors,
      importRepository.getLedgerVouchersForReport(id, { financialYear: requestedFinancialYear }),
      run.asOn,
      { preferVoucherOutstanding: true }
    ).filter((creditor) => Number(creditor.voucherCount || 0) > 0 || Math.abs(Number(creditor.outstandingAmount || 0)) > 0)
    : baseCreditors;
  const ignoredNonSundry = importRepository.getIgnoredNonSundryCreditors(id);
  return {
    importRun: {
      ...run,
      summary: {
        ...(run.summary || {}),
        ignoredNonSundryCount: ignoredNonSundry.length,
        ignoredNonSundrySamples: ignoredNonSundry.slice(0, 10).map((row) => row.party),
      },
    },
    creditors,
    verificationSummary: buildVerificationSummary(creditors),
  };
}

function getLatestCompletedImportRun(filters = {}) {
  const latest = importRepository.getLatestCompletedRun();
  if (!latest) return null;
  return getImportRun(latest.id, filters);
}

function compactImportRun(run) {
  if (!run) return run;
  const { ledgerMetadata, ...summary } = run.summary || {};
  return { ...run, summary };
}

function compactCreditor(row) {
  return {
    id: row.id,
    party: row.party,
    outstandingAmount: row.outstandingAmount,
    daysOutstanding: row.daysOutstanding,
    bucket: row.bucket,
    delayed: row.delayed,
    interestLiability: row.interestLiability,
    disallowanceAmount: row.disallowanceAmount,
    voucherCount: row.voucherCount,
  };
}

function getLatestCompletedImportSummary() {
  const latest = importRepository.getLatestCompletedRun();
  if (!latest) return null;
  const creditors = enrichCreditors(importRepository.getCreditors(latest.id));
  return {
    importRun: compactImportRun(latest),
    creditors: creditors.map(compactCreditor),
    verificationSummary: buildVerificationSummary(creditors),
  };
}

function compactStatement(statement, rowLimit = 100) {
  if (!statement) return {};
  return {
    ...statement,
    rows: Array.isArray(statement.rows) ? statement.rows.slice(0, rowLimit) : statement.rows,
    groups: Array.isArray(statement.groups)
      ? statement.groups.slice(0, rowLimit).map((group) => ({
        ...group,
        ledgers: Array.isArray(group.ledgers) ? group.ledgers.slice(0, rowLimit) : group.ledgers,
      }))
      : statement.groups,
  };
}

function getStatementSummary(importRunId, filters = {}) {
  const run = importRepository.getRun(importRunId);
  if (!run) return null;
  const rows = importRepository.getLedgerVouchersForReport(importRunId, filters);
  const bundle = buildStatementBundle(rows, ledgerMetadataForRun(run));
  return {
    importRun: compactImportRun(run),
    statements: {
      trialBalance: compactStatement(bundle.trialBalance),
      profitLoss: compactStatement(bundle.profitLoss),
      balanceSheet: compactStatement(bundle.balanceSheet),
    },
  };
}

function seedVendorMasterFromImport(importRunId, actor = "unknown") {
  const run = importRepository.getRun(importRunId);
  if (!run) throw new Error("Import run not found");
  if (run.status !== "completed") throw new Error("Import run is not completed");
  return vendorRepository.seedFromImport(importRunId, importRepository.getCreditors(importRunId), actor);
}

function getLedgerVouchers(importRunId, filters = {}) {
  const run = importRepository.getRun(importRunId);
  if (!run) return null;
  const requestedFinancialYear = filters.financialYear || filters.fiscalYear;
  const availableFinancialYears = run.summary?.financialYears || [];
  if (requestedFinancialYear && requestedFinancialYear !== "all" && run.fiscalYear !== "custom" && requestedFinancialYear !== run.fiscalYear) {
    throw new Error(`Import run fiscal year mismatch. Requested ${requestedFinancialYear}, but run belongs to ${run.fiscalYear}.`);
  }
  if (requestedFinancialYear && requestedFinancialYear !== "all" && run.fiscalYear === "custom" && availableFinancialYears.length && !availableFinancialYears.includes(requestedFinancialYear)) {
    throw new Error(`Import run does not contain financial year ${requestedFinancialYear}.`);
  }
  logImportStage("voucherQuery", { status: "start", importRunId, fiscalYear: run.fiscalYear });
  return {
    importRun: run,
    ledgerVouchers: importRepository.getLedgerVouchers(importRunId, filters),
  };
}

function getDaybook(importRunId, filters = {}) {
  const run = importRepository.getRun(importRunId);
  if (!run) return null;
  return {
    importRun: run,
    daybook: importRepository.getDaybookVouchers(importRunId, filters),
  };
}

function ledgerMetadataForRun(run) {
  return Array.isArray(run?.summary?.ledgerMetadata) ? run.summary.ledgerMetadata : [];
}

function getStatement(importRunId, type, filters = {}) {
  const run = importRepository.getRun(importRunId);
  if (!run) return null;
  const rows = importRepository.getLedgerVouchersForReport(importRunId, filters);
  const metadata = ledgerMetadataForRun(run);
  const bundle = buildStatementBundle(rows, metadata);
  const statement = type === "trial-balance"
    ? bundle.trialBalance
    : type === "balance-sheet"
      ? bundle.balanceSheet
      : type === "profit-loss"
        ? bundle.profitLoss
        : null;
  return statement ? { importRun: run, statement } : null;
}

module.exports = {
  importFromTally,
  captureBaselineSnapshot,
  getImportRun,
  getLatestCompletedImportRun,
  getLatestCompletedImportSummary,
  getStatementSummary,
  getLedgerVouchers,
  getDaybook,
  getStatement,
  seedVendorMasterFromImport,
  buildVerificationSummary,
  enrichCreditors,
  expectedDatesForFiscalYear,
  assertImportPeriod,
  financialYearPeriodsForImport,
};
