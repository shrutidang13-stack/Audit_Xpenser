const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const XLSX = require("xlsx");

process.env.DATABASE_PATH = "backend/data/test-msme-guard.sqlite";
process.env.DISABLE_BACKEND_AUTH = "true";

const { normalizeVendorName } = require("../utils/normalizeVendorName");
const { validateUdyamNumber, verifyUdyamNumber } = require("../services/udyamVerifier.service");
const env = require("../config/env");
const {
  parseLedgerCollection,
  parseLedgerVouchers,
  parseVoucherCollection,
  computeFIFOAging,
  tallyHealth,
  fetchCreditors,
  fetchAllCreditorLedgerVouchers,
  buildPeriodBatches,
  buildLedgerCollectionXML,
  buildLedgerVouchersXML,
  buildVoucherObjectCollectionXML,
  parseCompanyNames,
  normalizeCompanyName,
  parseTallyProcessList,
  companyContextStatus,
} = require("../services/tally.service");
const { createMSMEReport, calculateExcludedRows, calculateReportRows, buildEvidenceBundle, toCsv, toTallyReconciliationCsv, toWorkbookBuffer } = require("../services/report.service");
const { buildPayableAgingFromVouchers, enrichCreditorsWithVoucherAging } = require("../services/payableAging.service");
const { buildTrialBalance, buildBalanceSheet, buildProfitLoss, deriveSundryCreditors } = require("../services/financialStatements.service");
const { evaluateVendor, loadRulePack } = require("../services/msmeRuleEngine.service");
const { calculateMSMEInterest } = require("../services/interestCalculator.service");
const udyamFallbackService = require("../services/udyamFallback.service");
const vendorRepository = require("../repositories/vendorRepository");
const purchaseInvoiceRepository = require("../repositories/purchaseInvoiceRepository");
const importRepository = require("../repositories/importRepository");
const reportRepository = require("../repositories/reportRepository");
const tallyImportService = require("../services/tallyImport.service");
const mcaMsme1Service = require("../services/mcaMsme1.service");
const taxAuditSchemaService = require("../services/taxAuditSchema.service");
const taxAuditReportService = require("../services/taxAuditReport.service");
const carryForwardService = require("../services/carryForward.service");
const rbiBankRateService = require("../services/rbiBankRate.service");
const complianceRiskScoreService = require("../services/complianceRiskScore.service");
const paymentRecommendationService = require("../services/paymentRecommendation.service");
const paymentSimulatorService = require("../services/paymentSimulator.service");
const complianceExplanationService = require("../services/complianceExplanation.service");
const auditEvidencePackService = require("../services/auditEvidencePack.service");
const mcaFilingAutomationService = require("../services/mcaMsme1FilingAutomation.service");
const db = require("../config/database");

function seedTestBankRate({ id = "unit-test-default-rbi-rate", from = "2020-01-01", to = null, rate = 5.5 } = {}) {
  db.prepare(`
    INSERT OR IGNORE INTO rbi_bank_rates (
      id, effective_from_date, effective_to_date, bank_rate, source_url, downloaded_pdf_path,
      source_type, is_manual_override, override_reason, created_by, fetched_at, created_at
    ) VALUES (?, ?, ?, ?, 'unit_test_seed', '', 'official_fetch', 0, '', 'unit-test', '2026-06-09T00:00:00.000Z', '2026-06-09T00:00:00.000Z')
  `).run(id, from, to, rate);
}

test.before(() => {
  seedTestBankRate();
});

function withMockTally(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        port,
        close: () => new Promise((closeResolve, closeReject) => server.close((error) => (error ? closeReject(error) : closeResolve()))),
      });
    });
    server.on("error", reject);
  });
}

async function runWithTallyPort(port, fn, options = {}) {
  const oldPort = env.tallyPort;
  const oldHost = env.tallyHost;
  const oldCompany = env.tallyCompanyName;
  const oldProcessCompany = process.env.TALLY_COMPANY_NAME;
  env.tallyPort = port;
  env.tallyHost = "localhost";
  env.tallyCompanyName = options.companyName === undefined ? "Test Company" : options.companyName;
  if (env.tallyCompanyName) process.env.TALLY_COMPANY_NAME = env.tallyCompanyName;
  else delete process.env.TALLY_COMPANY_NAME;
  try {
    return await fn();
  } finally {
    env.tallyPort = oldPort;
    env.tallyHost = oldHost;
    env.tallyCompanyName = oldCompany;
    if (oldProcessCompany == null) delete process.env.TALLY_COMPANY_NAME;
    else process.env.TALLY_COMPANY_NAME = oldProcessCompany;
  }
}

function readRequestBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
  });
}

function sendXml(res, xml, statusCode = 200) {
  res.writeHead(statusCode, { "Content-Type": "text/xml" });
  res.end(xml);
}

function voucherXml({ ledgerName = "Acme Supplier", date = "20250501", number = "1", amount = "-1000.00", bill = "BILL-1" } = {}) {
  return `<VOUCHER VCHTYPE="Purchase"><DATE>${date}</DATE><VOUCHERNUMBER>${number}</VOUCHERNUMBER><PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME><ALLLEDGERENTRIES.LIST><LEDGERNAME>${ledgerName}</LEDGERNAME><AMOUNT>${amount}</AMOUNT><BILLALLOCATIONS.LIST><NAME>${bill}</NAME><AMOUNT>${amount}</AMOUNT></BILLALLOCATIONS.LIST></ALLLEDGERENTRIES.LIST></VOUCHER>`;
}

test("normalizes common legal suffixes and special characters", () => {
  assert.equal(normalizeVendorName("  Acme Pvt. Ltd. "), "ACME");
  assert.equal(normalizeVendorName("Bright-Star LLP"), "BRIGHT STAR");
  assert.equal(normalizeVendorName("A&B Private Limited"), "A AND B");
});

test("validates Udyam number format", () => {
  assert.equal(validateUdyamNumber("UDYAM-DL-01-1234567"), true);
  assert.equal(validateUdyamNumber("UDYAM-DL-1-1234567"), false);
  assert.equal(validateUdyamNumber("UDYAM-XX-00-0000000"), false);
  assert.equal(validateUdyamNumber("ABC"), false);
});

test("invalid Udyam verification preserves the submitted number", async () => {
  const result = await verifyUdyamNumber("UDYAM-XX-00-0000000");
  assert.equal(result.udyamNumber, "UDYAM-XX-00-0000000");
  assert.equal(result.verified, false);
  assert.equal(result.verificationStatus, "invalid_format");
});

test("detects standard Sundry Creditors ledgers from all-ledger export", () => {
  const xml = `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON><CLOSINGBALANCE>1000.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.equal(creditors.length, 1);
  assert.equal(creditors[0].name, "Acme Supplier");
  assert.equal(creditors[0].outstandingAmount, 1000);
  assert.equal(creditors[0].closingBalance, -1000);
  assert.equal(creditors[0].closingBalanceType, "credit");
  assert.ok(creditors[0].detectionReasons.includes("creditor_parent_or_ancestor"));
});

test("detects Sundry Creditors ledgers even when List of Accounts omits balances", () => {
  const xml = `<ENVELOPE><LEDGER NAME="Balance Missing Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.equal(creditors.length, 1);
  assert.equal(creditors[0].name, "Balance Missing Supplier");
  assert.equal(creditors[0].outstandingAmount, 0);
  assert.ok(creditors[0].detectionReasons.includes("balance_unavailable_parent_match"));
});

test("detects custom creditor subgroups through group hierarchy", () => {
  const ledgerXml = `<ENVELOPE><LEDGER NAME="EV Vendor"><PARENT>EV Trade Vendors</PARENT><CLOSINGBALANCE>2500.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`;
  const groupXml = `<ENVELOPE><GROUP NAME="EV Trade Vendors"><PARENT>Sundry Creditors</PARENT></GROUP></ENVELOPE>`;
  const creditors = parseLedgerCollection(ledgerXml, "Sundry Creditors", groupXml);
  assert.equal(creditors.length, 1);
  assert.equal(creditors[0].name, "EV Vendor");
  assert.equal(creditors[0].outstandingAmount, 2500);
  assert.deepEqual(creditors[0].groupHierarchy, ["EV Trade Vendors", "Sundry Creditors"]);
});

test("excludes non-Sundry ledgers even when bill-wise or payable-like", () => {
  const xml = `<ENVELOPE>
    <LEDGER NAME="Purchase"><PARENT>Purchase Accounts</PARENT><ISBILLWISEON>Yes</ISBILLWISEON><CLOSINGBALANCE>1000.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="Purchase Import"><PARENT>Purchase Accounts</PARENT><ISBILLWISEON>Yes</ISBILLWISEON><CLOSINGBALANCE>1000.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="Prepaid Expenditure"><PARENT>Current Assets</PARENT><ISBILLWISEON>Yes</ISBILLWISEON><CLOSINGBALANCE>1000.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="SALARY To Employee"><PARENT>Current Liabilities</PARENT><ISBILLWISEON>Yes</ISBILLWISEON><CLOSINGBALANCE>1000.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="INPUT IGST"><PARENT>Duties & Taxes</PARENT><ISBILLWISEON>Yes</ISBILLWISEON><CLOSINGBALANCE>1000.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="Real Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>500.00 Cr</CLOSINGBALANCE></LEDGER>
  </ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.deepEqual(creditors.map((creditor) => creditor.name), ["Real Supplier"]);
});

test("detects trade payable groups and custom groups under Sundry Creditors", () => {
  const ledgerXml = `<ENVELOPE>
    <LEDGER NAME="Generic Payable"><PARENT>Trade Payables</PARENT><CLOSINGBALANCE>900.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="Child Payable"><PARENT>Trade Vendors</PARENT><CLOSINGBALANCE>800.00 Cr</CLOSINGBALANCE></LEDGER>
  </ENVELOPE>`;
  const groupXml = `<ENVELOPE><GROUP NAME="Trade Vendors"><PARENT>Sundry Creditors</PARENT></GROUP></ENVELOPE>`;
  const creditors = parseLedgerCollection(ledgerXml, "Sundry Creditors", groupXml);
  assert.deepEqual(creditors.map((creditor) => creditor.name), ["Generic Payable", "Child Payable"]);
});

test("excludes rows with missing group lineage", () => {
  const xml = `<ENVELOPE><LEDGER NAME="No Parent Supplier"><CLOSINGBALANCE>900.00 Cr</CLOSINGBALANCE><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.equal(creditors.length, 0);
});

test("detects creditor parents with trailing spaces and mixed case", () => {
  const xml = `<ENVELOPE><LEDGER NAME="Messy Supplier"><PARENT>  sUnDrY   cReDiToRs  </PARENT><CLOSINGBALANCE>750.00 Cr</CLOSINGBALANCE></LEDGER></ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.equal(creditors.length, 1);
  assert.equal(creditors[0].outstandingAmount, 750);
});

test("excludes creditor ledgers with debit closing balance from outstanding creditors", () => {
  const xml = `<ENVELOPE>
    <LEDGER NAME="Credit Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>200.00 Dr</OPENINGBALANCE><CLOSINGBALANCE>1000.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="Debit Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>500.00 Cr</OPENINGBALANCE><CLOSINGBALANCE>250.00 Dr</CLOSINGBALANCE></LEDGER>
  </ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.deepEqual(creditors.map((creditor) => creditor.name), ["Credit Supplier"]);
  assert.equal(creditors[0].outstandingAmount, 1000);
  assert.equal(creditors[0].openingBalance, 200);
  assert.equal(creditors[0].openingBalanceType, "debit");
  assert.equal(creditors[0].closingBalance, -1000);
  assert.equal(creditors[0].closingBalanceType, "credit");
});

test("parses parenthesized and marker balances with debit credit types", () => {
  const xml = `<ENVELOPE>
    <LEDGER NAME="Paren Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>(125.50)</OPENINGBALANCE><CLOSINGBALANCE>250.25 Cr</CLOSINGBALANCE></LEDGER>
  </ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.equal(creditors.length, 1);
  assert.equal(creditors[0].openingBalance, 125.5);
  assert.equal(creditors[0].openingBalanceType, "debit");
  assert.equal(creditors[0].closingBalance, -250.25);
  assert.equal(creditors[0].outstandingAmount, 250.25);
});

test("detects ledger alias names when Tally omits NAME attribute", () => {
  const xml = `<ENVELOPE><LEDGER><NAME.LIST><NAME>Alias Supplier</NAME></NAME.LIST><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>400.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.equal(creditors.length, 1);
  assert.equal(creditors[0].name, "Alias Supplier");
});

test("returns empty creditor collection for non-creditor ledgers", () => {
  const xml = `<ENVELOPE><LEDGER NAME="Sales Account"><PARENT>Sales Accounts</PARENT><CLOSINGBALANCE>0.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.equal(creditors.length, 0);
});

test("parses ledger voucher rows with debit and credit columns", () => {
  const xml = `<ENVELOPE><VOUCHER VCHTYPE="Journal">
    <DATE>20250531</DATE>
    <VOUCHERNUMBER>417558218</VOUCHERNUMBER>
    <ALLLEDGERENTRIES.LIST><LEDGERNAME>Accounting Charges</LEDGERNAME><AMOUNT>36000.00</AMOUNT></ALLLEDGERENTRIES.LIST>
    <ALLLEDGERENTRIES.LIST><LEDGERNAME>Agreema Associates</LEDGERNAME><AMOUNT>-36000.00</AMOUNT></ALLLEDGERENTRIES.LIST>
  </VOUCHER><VOUCHER VCHTYPE="Payment">
    <DATE>20251007</DATE>
    <VOUCHERNUMBER>1367</VOUCHERNUMBER>
    <ALLLEDGERENTRIES.LIST><LEDGERNAME>Agreema Associates</LEDGERNAME><AMOUNT>100000.00</AMOUNT></ALLLEDGERENTRIES.LIST>
    <ALLLEDGERENTRIES.LIST><LEDGERNAME>Axis Bank</LEDGERNAME><AMOUNT>-100000.00</AMOUNT></ALLLEDGERENTRIES.LIST>
  </VOUCHER></ENVELOPE>`;
  const rows = parseLedgerVouchers(xml, "AGREEMA ASSOCIATES");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].credit, 36000);
  assert.equal(rows[0].particulars, "Accounting Charges");
  assert.equal(rows[1].debit, 100000);
  assert.equal(rows[1].particulars, "Axis Bank");
});

test("detects common creditor group aliases from ledger hierarchy", () => {
  const xml = `<ENVELOPE>
    <LEDGER NAME="Trade Supplier"><PARENT>Trade Payables</PARENT><CLOSINGBALANCE>900.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="Supplier Group Vendor"><PARENT>Supplier</PARENT><CLOSINGBALANCE>500.00 Cr</CLOSINGBALANCE></LEDGER>
    <LEDGER NAME="Advance Vendor"><PARENT>Advance to Supplier</PARENT><CLOSINGBALANCE>1000.00 Dr</CLOSINGBALANCE></LEDGER>
  </ENVELOPE>`;
  const creditors = parseLedgerCollection(xml);
  assert.deepEqual(creditors.map((creditor) => creditor.name), ["Trade Supplier", "Supplier Group Vendor"]);
});

test("does not count CMPINFO voucher counters as voucher rows", () => {
  const xml = `<ENVELOPE><BODY><DESC><CMPINFO><VOUCHER>0</VOUCHER></CMPINFO></DESC><DATA><COLLECTION></COLLECTION></DATA></BODY></ENVELOPE>`;
  assert.equal(parseVoucherCollection(xml).length, 0);
});

test("parses Tally Ledger Vouchers display rows", () => {
  const xml = `<ENVELOPE>
    <DSPVCHDATE>31-Mar-26</DSPVCHDATE>
    <DSPVCHLEDACCOUNT>TRIO VELOCID</DSPVCHLEDACCOUNT>
    <DSPVCHTYPE>Jrnl</DSPVCHTYPE>
    <DSPVCHDRAMT></DSPVCHDRAMT>
    <DSPVCHCRAMT>545606.00</DSPVCHCRAMT>
    <DSPVCHDATE>28-Mar-26</DSPVCHDATE>
    <DSPVCHLEDACCOUNT>Axis Bank</DSPVCHLEDACCOUNT>
    <DSPVCHTYPE>Pymt</DSPVCHTYPE>
    <DSPVCHDRAMT>-5000.00</DSPVCHDRAMT>
    <DSPVCHCRAMT></DSPVCHCRAMT>
  </ENVELOPE>`;
  const rows = parseLedgerVouchers(xml, "Upgrid Solutions Private Limited");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].date, "2026-03-31");
  assert.equal(rows[0].credit, 545606);
  assert.equal(rows[0].particulars, "TRIO VELOCID");
  assert.equal(rows[1].date, "2026-03-28");
  assert.equal(rows[1].debit, 5000);
  assert.equal(rows[1].particulars, "Axis Bank");
});

test("parses lightweight voucher collection rows with bill references", () => {
  const xml = `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", number: "V-1", amount: "-1200.00", bill: "AGST-1" })}</ENVELOPE>`;
  const rows = parseVoucherCollection(xml, ["Acme Supplier"]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ledgerName, "Acme Supplier");
  assert.equal(rows[0].credit, 1200);
  assert.equal(rows[0].billReference, "AGST-1");
  assert.equal(rows[0].pendingAmount, 1200);
});

test("parses Day Book voucher rows when creditor amount is only in bill allocations", () => {
  const xml = `<ENVELOPE><VOUCHER VCHTYPE="Purchase">
    <DATE>20250502</DATE>
    <VOUCHERNUMBER>PB-1</VOUCHERNUMBER>
    <PARTYLEDGERNAME>Acme Supplier</PARTYLEDGERNAME>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>Acme Supplier</LEDGERNAME>
      <BILLALLOCATIONS.LIST><NAME>INV-77</NAME><AMOUNT>-1400.00</AMOUNT></BILLALLOCATIONS.LIST>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER></ENVELOPE>`;
  const rows = parseVoucherCollection(xml, ["Acme Supplier"]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].date, "2025-05-02");
  assert.equal(rows[0].voucherNumber, "PB-1");
  assert.equal(rows[0].voucherType, "Purchase");
  assert.equal(rows[0].ledgerName, "Acme Supplier");
  assert.equal(rows[0].credit, 1400);
  assert.equal(rows[0].billReference, "INV-77");
});

test("parses Day Book voucher rows from party ledger when Tally omits creditor ledger entry", () => {
  const xml = `<ENVELOPE><VOUCHER VCHTYPE="Journal">
    <DATE>20250503</DATE>
    <VOUCHERNUMBER>J-1</VOUCHERNUMBER>
    <PARTYLEDGERNAME>Acme Supplier</PARTYLEDGERNAME>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>Purchase Expenses</LEDGERNAME>
      <AMOUNT>900.00</AMOUNT>
      <BILLALLOCATIONS.LIST><NAME>INV-88</NAME><AMOUNT>-900.00</AMOUNT></BILLALLOCATIONS.LIST>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER></ENVELOPE>`;
  const rows = parseVoucherCollection(xml, ["Acme Supplier"]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ledgerName, "Acme Supplier");
  assert.equal(rows[0].voucherType, "Journal");
  assert.equal(rows[0].credit, 900);
  assert.equal(rows[0].billReference, "INV-88");
});

test("computes FIFO aging from purchases and payments", () => {
  const aging = computeFIFOAging(
    [{ party: "Acme", date: "2026-01-01", amount: 1000 }],
    [{ party: "Acme", date: "2026-01-10", amount: 200 }],
    "2026-03-01"
  );
  assert.equal(aging.Acme.daysOutstanding, 59);
  assert.equal(aging.Acme.bucket, "46-60 days");
});

test("builds financial-year voucher batches by quarter", () => {
  const batches = buildPeriodBatches("20250401", "20260331", 3);
  assert.deepEqual(batches.map((batch) => batch.label), ["Apr-Jun", "Jul-Sep", "Oct-Dec", "Jan-Mar"]);
  assert.equal(batches[0].from, "20250401");
  assert.equal(batches[3].to, "20260331");
});

test("custom import period accepts arbitrary valid date range and rejects reversed dates", () => {
  assert.deepEqual(
    tallyImportService.assertImportPeriod({
      periodType: "custom",
      fiscalYear: "custom",
      fromDate: "2025-05-01",
      toDate: "2025-05-31",
    }),
    { fromDate: "20250501", toDate: "20250531" }
  );
  assert.throws(
    () => tallyImportService.assertImportPeriod({
      periodType: "custom",
      fiscalYear: "custom",
      fromDate: "20250531",
      toDate: "20250501",
    }),
    /fromDate must be before or equal to toDate/
  );
});

test("custom two-year import period splits into FY chunks and caps by as-on by default", () => {
  const periods = tallyImportService.financialYearPeriodsForImport({
    periodType: "custom",
    fiscalYear: "custom",
    fromDate: "20250401",
    toDate: "20270331",
    asOn: "2026-05-28",
  });
  assert.deepEqual(periods.map((period) => period.financialYear), ["2025-26", "2026-27"]);
  assert.deepEqual(periods.map((period) => [period.reportFromDate, period.reportToDate]), [
    ["20250401", "20260331"],
    ["20260401", "20260528"],
  ]);
  assert.equal(periods[1].cappedByAsOn, true);
});

test("custom two-year import period can cap current FY by as-on when requested", () => {
  const periods = tallyImportService.financialYearPeriodsForImport({
    periodType: "custom",
    fiscalYear: "custom",
    fromDate: "20250401",
    toDate: "20270331",
    asOn: "2026-05-28",
    capToAsOn: true,
  });
  assert.deepEqual(periods.map((period) => period.financialYear), ["2025-26", "2026-27"]);
  assert.deepEqual(periods.map((period) => [period.reportFromDate, period.reportToDate]), [
    ["20250401", "20260331"],
    ["20260401", "20260528"],
  ]);
  assert.equal(periods[1].cappedByAsOn, true);
});

test("parses full Day Book voucher collection rows for non-creditor and creditor ledgers", () => {
  const xml = `<ENVELOPE><VOUCHER VCHTYPE="Purchase">
    <DATE>20250502</DATE>
    <VOUCHERNUMBER>PB-FULL</VOUCHERNUMBER>
    <PARTYLEDGERNAME>Acme Supplier</PARTYLEDGERNAME>
    <ALLLEDGERENTRIES.LIST><LEDGERNAME>Acme Supplier</LEDGERNAME><AMOUNT>-1400.00</AMOUNT></ALLLEDGERENTRIES.LIST>
    <ALLLEDGERENTRIES.LIST><LEDGERNAME>Purchase Accounts</LEDGERNAME><AMOUNT>1400.00</AMOUNT></ALLLEDGERENTRIES.LIST>
  </VOUCHER></ENVELOPE>`;
  const rows = parseVoucherCollection(xml);
  assert.deepEqual(rows.map((row) => row.ledgerName), ["Acme Supplier", "Purchase Accounts"]);
  assert.equal(rows[0].credit, 1400);
  assert.equal(rows[1].debit, 1400);
});

test("derived statements and creditors use ledger metadata with activity review bucket", () => {
  const ledgers = [
    { name: "Activity Supplier", parent: "Sundry Creditors", groupHierarchy: ["Sundry Creditors"], openingBalance: 0, closingBalance: 0, isSundryCreditor: true },
    { name: "Purchase Accounts", parent: "Purchase Accounts", groupHierarchy: ["Purchase Accounts"], openingBalance: 0, closingBalance: 500 },
  ];
  const vouchers = [
    { ledgerName: "Activity Supplier", normalizedLedgerName: "ACTIVITY SUPPLIER", date: "2025-04-01", voucherType: "Purchase", credit: 500, amount: 500 },
    { ledgerName: "Purchase Accounts", normalizedLedgerName: "PURCHASE ACCOUNTS", date: "2025-04-01", voucherType: "Purchase", debit: 500, amount: 500 },
  ];
  const trial = buildTrialBalance(vouchers, ledgers);
  const balance = buildBalanceSheet(vouchers, ledgers);
  const profit = buildProfitLoss(vouchers, ledgers);
  const creditors = deriveSundryCreditors(ledgers, vouchers);
  assert.equal(trial.summary.totalDebit, 500);
  assert.equal(trial.summary.totalCredit, 500);
  assert.equal(balance.summary.groupCount >= 1, true);
  assert.equal(profit.summary.groupCount >= 1, true);
  assert.equal(creditors.length, 1);
  assert.equal(creditors[0].reviewReason, "current_activity_without_credit_closing");
});

test("export builders inject explicit SVCURRENTCOMPANY", () => {
  for (const xml of [
    buildLedgerCollectionXML("Acme & Sons"),
    buildLedgerVouchersXML("20250401", "20260331", "Supplier One", "Acme & Sons"),
  ]) {
    assert.match(xml, /<SVEXPORTFORMAT>\$\$SysName:XML<\/SVEXPORTFORMAT>/);
    assert.match(xml, /<SVCURRENTCOMPANY>Acme &amp; Sons<\/SVCURRENTCOMPANY>/);
  }
});

test("voucher collection export includes a Tally-side date filter", () => {
  const xml = buildVoucherObjectCollectionXML("20250401", "20250630", "Acme & Sons");
  assert.match(xml, /<SVCURRENTCOMPANY>Acme &amp; Sons<\/SVCURRENTCOMPANY>/);
  assert.match(xml, /<SVFROMDATE>20250401<\/SVFROMDATE>/);
  assert.match(xml, /<SVTODATE>20250630<\/SVTODATE>/);
  assert.match(xml, /<FILTERS>MSMEVoucherDateFilter<\/FILTERS>/);
  assert.match(xml, /\$Date &gt;= \$\$Date:"1-Apr-2025"/);
  assert.match(xml, /\$Date &lt;= \$\$Date:"30-Jun-2025"/);
});

test("parses company name from loaded company collection XML", () => {
  const names = parseCompanyNames(`<ENVELOPE><COMPANY NAME="Loaded Company"></COMPANY></ENVELOPE>`);
  assert.deepEqual(names, ["Loaded Company"]);
});

test("normalizes company names without changing the exact XML injection value", () => {
  assert.equal(
    normalizeCompanyName("  NXTMOBILITY   ENERGY PRIVATE LIMITED - (from 1-Apr-2023)  "),
    "NXTMOBILITY ENERGY PRIVATE LIMITED - (FROM 1-APR-2023)"
  );
  const xml = buildLedgerCollectionXML("  NXTMOBILITY   ENERGY PRIVATE LIMITED - (from 1-Apr-2023)  ");
  assert.match(xml, /<SVCURRENTCOMPANY>NXTMOBILITY   ENERGY PRIVATE LIMITED - \(from 1-Apr-2023\)<\/SVCURRENTCOMPANY>/);
});

test("Tally health returns explicit error when company context cannot be detected", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    await readRequestBody(req);
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth(), { companyName: "" });
    assert.equal(health.xmlPostWorking, false);
    assert.equal(health.companyDetected, false);
    assert.equal(health.error, "Tally XML export requires active company context.");
  } finally {
    await mock.close();
  }
});

test("Tally health selects first loaded company when multiple are loaded", async () => {
  const requests = [];
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    const body = await readRequestBody(req);
    requests.push(body);
    if (body.includes("Loaded Companies")) {
      return sendXml(res, `<ENVELOPE><COMPANY NAME="Alpha Traders"></COMPANY><COMPANY NAME="Beta Traders"></COMPANY></ENVELOPE>`);
    }
    assert.match(body, /<SVCURRENTCOMPANY>Alpha Traders<\/SVCURRENTCOMPANY>/);
    sendXml(res, `<ENVELOPE><LEDGER NAME="Demo Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth(), { companyName: "" });
    assert.equal(health.xmlPostWorking, true);
    assert.equal(health.companyName, "Alpha Traders");
    assert.deepEqual(health.companyNames, ["Alpha Traders", "Beta Traders"]);
    assert.equal(health.companyDetectionMethod, "loaded_company_collection");
    assert.equal(requests.some((body) => body.includes("Loaded Companies")), true);
    assert.equal(requests.some((body) => body.includes("Gateway of Tally")), false);
  } finally {
    await mock.close();
  }
});

test("explicit request company override beats TALLY_COMPANY_NAME", async () => {
  const requests = [];
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    const body = await readRequestBody(req);
    requests.push(body);
    sendXml(res, `<ENVELOPE><LEDGER NAME="Demo Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth({ companyName: "Explicit Co" }), { companyName: "Env Co" });
    assert.equal(health.xmlPostWorking, true);
    assert.equal(health.companyName, "Explicit Co");
    assert.equal(health.companyDetectionMethod, "request_override");
    assert.equal(requests.every((body) => body.includes("<SVCURRENTCOMPANY>Explicit Co</SVCURRENTCOMPANY>")), true);
  } finally {
    await mock.close();
  }
});

test("TALLY_COMPANY_NAME env override is injected into health export", async () => {
  const requests = [];
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    const body = await readRequestBody(req);
    requests.push(body);
    sendXml(res, `<ENVELOPE><LEDGER NAME="Demo Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth(), { companyName: "Override Co" });
    assert.equal(health.xmlPostWorking, true);
    assert.equal(health.companyName, "Override Co");
    assert.equal(health.companyDetectionMethod, "env_override");
    assert.equal(requests.every((body) => body.includes("<SVCURRENTCOMPANY>Override Co</SVCURRENTCOMPANY>")), true);
  } finally {
    await mock.close();
  }
});

test("company context diagnostics reports configured suffix company as working", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    const body = await readRequestBody(req);
    assert.match(body, /<SVCURRENTCOMPANY>NXTMOBILITY ENERGY PRIVATE LIMITED - \(from 1-Apr-2023\)<\/SVCURRENTCOMPANY>/);
    sendXml(res, `<ENVELOPE><LEDGER NAME="Demo Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
  });
  try {
    const diagnostics = await runWithTallyPort(
      mock.port,
      () => companyContextStatus(),
      { companyName: "NXTMOBILITY ENERGY PRIVATE LIMITED - (from 1-Apr-2023)" }
    );
    assert.equal(diagnostics.companyContextWorking, true);
    assert.equal(diagnostics.configuredCompany, "NXTMOBILITY ENERGY PRIVATE LIMITED - (from 1-Apr-2023)");
    assert.equal(diagnostics.normalizedCompany, "NXTMOBILITY ENERGY PRIVATE LIMITED - (FROM 1-APR-2023)");
  } finally {
    await mock.close();
  }
});

test("Tally health does not mark XML POST working when LINEERROR exists", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    await readRequestBody(req);
    sendXml(res, "<ENVELOPE><LINEERROR>Could not find Company ''</LINEERROR></ENVELOPE>");
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.xmlPostWorking, false);
    assert.match(health.errors.join(" "), /Could not find Company/);
  } finally {
    await mock.close();
  }
});

test("Tally health retries variants when SVCurrentCompany cannot be set", async () => {
  const attempts = [];
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    const body = await readRequestBody(req);
    attempts.push(body.match(/<SVCURRENTCOMPANY>([^<]+)<\/SVCURRENTCOMPANY>/)?.[1] || "");
    if (attempts.length === 1) {
      return sendXml(res, "<ENVELOPE><LINEERROR>Could not set 'SVCurrentCompany'</LINEERROR></ENVELOPE>");
    }
    sendXml(res, `<ENVELOPE><LEDGER NAME="Demo Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth(), { companyName: " Retry   Company " });
    assert.equal(health.xmlPostWorking, true);
    assert.deepEqual(attempts, ["Retry   Company", "Retry Company"]);
  } finally {
    await mock.close();
  }
});

test("parses multiple TallyPrime process diagnostics", () => {
  const output = [
    "Image Name                     PID Session Name        Session#    Mem Usage",
    "========================= ======== ================ =========== ============",
    "TallyPrime.exe                1112 Console                    1     80,000 K",
    "TallyPrime.exe                2211 Console                    1     82,000 K",
  ].join("\n");
  const processes = parseTallyProcessList(output);
  assert.equal(processes.length, 2);
  assert.deepEqual(processes.map((item) => item.pid), ["1112", "2211"]);
});

test("Tally health accepts TallyPrime server running ping response and lightweight company context export", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end("<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    assert.match(body, /MSME Company Context Probe/);
    assert.doesNotMatch(body, /<TYPE>System<\/TYPE>|<REPORTNAME>List of Accounts<\/REPORTNAME>/);
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(`<ENVELOPE><LEDGER NAME="Demo Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.reachable, true);
    assert.equal(health.portOpen, true);
    assert.equal(health.serverRunning, true);
    assert.equal(health.xmlPostWorking, true);
    assert.equal(health.companyDetected, true);
    assert.equal(health.companyName, "Test Company");
    assert.equal(health.companyDetectionMethod, "env_override");
    assert.match(health.rawPingResponse, /TallyPrime Server is Running/);
  } finally {
    await mock.close();
  }
});

test("Tally health does not send unsupported Current Company system request", async () => {
  const requests = [];
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    const body = await readRequestBody(req);
    requests.push(body);
    sendXml(res, `<ENVELOPE><LEDGER NAME="Demo Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.xmlPostWorking, true);
    assert.equal(requests.some((body) => body.includes("<TYPE>System</TYPE>")), false);
    assert.equal(requests.every((body) => body.includes("MSME Company Context Probe")), true);
    assert.equal(requests.every((body) => body.includes("<SVCURRENTCOMPANY>Test Company</SVCURRENTCOMPANY>")), true);
  } finally {
    await mock.close();
  }
});

test("Tally health reports Unknown Request from standard export as XML failure", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    await readRequestBody(req);
    sendXml(res, "<RESPONSE>Unknown Request, cannot be processed</RESPONSE>");
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.xmlPostWorking, false);
    assert.match(health.errors.join(" "), /Unknown Request/);
  } finally {
    await mock.close();
  }
});

test("Tally health rejects CMPINFO-only empty collection response", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") return sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
    await readRequestBody(req);
    sendXml(res, "<ENVELOPE><BODY><DESC><CMPINFO><LEDGER>0</LEDGER><VOUCHER>0</VOUCHER></CMPINFO></DESC><DATA><COLLECTION></COLLECTION></DATA></BODY></ENVELOPE>");
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.xmlPostWorking, false);
    assert.match(health.errors.join(" "), /only metadata/);
  } finally {
    await mock.close();
  }
});

test("Tally health reports connection refused as port unreachable", async () => {
  const mock = await withMockTally((req, res) => res.end("unused"));
  const port = mock.port;
  await mock.close();
  const health = await runWithTallyPort(port, () => tallyHealth());
  assert.equal(health.reachable, false);
  assert.equal(health.portOpen, false);
  assert.equal(health.serverRunning, false);
  assert.match(health.message, /port 9000 is unreachable/i);
});

test("Tally health reports XML POST failure after successful GET", async () => {
  const mock = await withMockTally((req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end("<RESPONSE>Tally Server is Running</RESPONSE>");
      return;
    }
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("export failed");
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.reachable, true);
    assert.equal(health.portOpen, true);
    assert.equal(health.serverRunning, true);
    assert.equal(health.xmlPostWorking, false);
    assert.equal(health.error, "Tally returned HTTP 500 while processing XML export.");
    assert.doesNotMatch(health.message, /port.*unreachable/i);
  } finally {
    await mock.close();
  }
});

test("Tally health accepts valid XML export response", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end("<RESPONSE>Tally Server is Running</RESPONSE>");
      return;
    }
    await readRequestBody(req);
    res.writeHead(200, { "Content-Type": "application/xml" });
    res.end(`<ENVELOPE><BODY><DATA><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>100.00</CLOSINGBALANCE></LEDGER></DATA></BODY></ENVELOPE>`);
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.xmlPostWorking, true);
    assert.equal(health.companyDetected, true);
    assert.equal(health.companyName, "Test Company");
    assert.equal(health.message, "Tally server is running");
    assert.equal(health.error, null);
  } finally {
    await mock.close();
  }
});

test("Tally health fails when company context probe returns empty collection metadata", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end("<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    await readRequestBody(req);
    res.writeHead(200, { "Content-Type": "application/xml" });
    res.end("<ENVELOPE><BODY><DATA><COLLECTION></COLLECTION></DATA></BODY></ENVELOPE>");
  });
  try {
    const health = await runWithTallyPort(mock.port, () => tallyHealth());
    assert.equal(health.reachable, true);
    assert.equal(health.serverRunning, true);
    assert.equal(health.xmlPostWorking, false);
    assert.equal(health.companyDetected, true);
    assert.equal(health.companyName, "Test Company");
    assert.match(health.error, /returned only metadata/);
  } finally {
    await mock.close();
  }
});

test("Tally import does not fail when health message is Tally server is running", async () => {
  const seen = { creditorsExport: 0 };
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      seen.creditorsExport += 1;
      sendXml(res, `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1000.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("Day Book")) {
      sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", number: "1" })}</ENVELOPE>`);
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );
    assert.equal(result.success, true);
    assert.equal(result.creditors.length, 1);
    assert.equal(result.importRun.status, "completed");
    assert.equal(seen.creditorsExport >= 2, true);
  } finally {
    await mock.close();
  }
});

test("Tally import health success continues to creditor fetch", async () => {
  let listOfAccountsRequests = 0;
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>Tally Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      listOfAccountsRequests += 1;
      sendXml(res, `<ENVELOPE><LEDGER NAME="Next Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>2500.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("Day Book") || body.includes("Ledger Vouchers")) {
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );
    assert.equal(listOfAccountsRequests >= 2, true);
  } finally {
    await mock.close();
  }
});

test("Tally import fails when XML POST health test fails", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    sendXml(res, "export failed", 500);
  });
  try {
    await assert.rejects(
      () => runWithTallyPort(mock.port, () =>
        tallyImportService.importFromTally({
          fiscalYear: "2025-26",
          fromDate: "20250401",
          toDate: "20260331",
          actor: "unit-test",
        })
      ),
      (error) => {
        assert.match(error.message, /Tally server is reachable, but XML export request failed/);
        assert.equal(error.status, 502);
        return true;
      }
    );
  } finally {
    await mock.close();
  }
});

test("Tally import rejects selected financial year date mismatch", async () => {
  await assert.rejects(
    () => tallyImportService.importFromTally({
      fiscalYear: "2026-27",
      fromDate: "20250401",
      toDate: "20260331",
      actor: "unit-test",
    }),
    /Selected financial year 2026-27 requires 20260401 to 20270331/
  );
});

test("Tally import uses creditor export success as company fallback", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Fallback Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>500.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("Day Book")) {
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );
    assert.equal(result.success, true);
    assert.equal(result.importRun.companyName, "Test Company");
    assert.equal(result.creditors.length, 1);
  } finally {
    await mock.close();
  }
});

test("Tally import ignores Group Summary failure when List of Accounts succeeded", async () => {
  let groupSummaryRequests = 0;
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Health Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("Group Summary")) {
      groupSummaryRequests += 1;
      sendXml(res, "<ENVELOPE><LINEERROR>Report export failed</LINEERROR></ENVELOPE>");
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );
    assert.equal(result.success, true);
    assert.equal(result.importRun.status, "completed");
    assert.equal(result.creditors.length, 1);
    assert.equal(groupSummaryRequests, 0);
  } finally {
    await mock.close();
  }
});

test("Tally import persists voucher rows and retrieves them for review", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("MSME Ledger Master Collection")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>100.00 Dr</OPENINGBALANCE><CLOSINGBALANCE>1400.00 Cr</CLOSINGBALANCE><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("Day Book")) {
      const from = body.match(/<SVFROMDATE>([^<]+)<\/SVFROMDATE>/)?.[1] || "";
      sendXml(res, from === "20250401"
        ? `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", date: "20250502", number: "PB-77", amount: "-1400.00", bill: "INV-77" })}</ENVELOPE>`
        : "<ENVELOPE></ENVELOPE>");
      return;
    }
    if (body.includes("MSME Voucher Collection")) {
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );
    assert.equal(result.success, true);
    assert.equal(result.ledgerVoucherSummary.totalRows, 1);
    assert.equal(result.ledgerVoucherSummary.persistedRows, 1);

    const review = tallyImportService.getLedgerVouchers(result.importRun.id, {
      ledgerName: "All ledgers",
      voucherType: "All voucher types",
      limit: 10,
    });
    assert.equal(review.ledgerVouchers.total, 1);
    assert.equal(review.ledgerVouchers.rows.length, 1);
    assert.equal(review.ledgerVouchers.rows[0].importRunId, result.importRun.id);
    assert.equal(review.ledgerVouchers.rows[0].fiscalYear, "2025-26");
    assert.equal(review.ledgerVouchers.rows[0].companyName, "Test Company");
    assert.equal(review.ledgerVouchers.rows[0].vendorName, "Acme Supplier");
    assert.equal(review.ledgerVouchers.rows[0].date, "2025-05-02");
    assert.equal(review.ledgerVouchers.rows[0].voucherNumber, "PB-77");
    assert.equal(review.ledgerVouchers.rows[0].voucherType, "Purchase");
    assert.equal(review.ledgerVouchers.rows[0].credit, 1400);
    assert.equal(review.ledgerVouchers.rows[0].billReference, "INV-77");
    assert.equal(review.ledgerVouchers.rows[0].voucherSource, "Day Book");
    assert.equal(result.importRun.summary.selectedFinancialYear, "2025-26");
    assert.equal(result.importRun.summary.voucherSource, "Day Book");
    assert.equal(result.importRun.summary.fallbackUsed, false);
    assert.equal(result.importRun.summary.creditorsImported, 1);
    assert.equal(result.importRun.summary.vouchersParsed, 1);
    assert.equal(result.importRun.summary.vouchersPersisted, 1);
  } finally {
    await mock.close();
  }
});

test("Tally import falls back to creditor ledger vouchers when full Day Book is blank", async () => {
  const seen = { ledgerFallback: 0 };
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>1400.00 Cr</CLOSINGBALANCE><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("MSME Voucher Collection")) {
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    if (body.includes("Ledger Vouchers")) {
      seen.ledgerFallback += 1;
      sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", date: "20250502", number: "LV-77", amount: "-1400.00", bill: "INV-77" })}</ENVELOPE>`);
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );
    assert.equal(result.success, true);
    assert.equal(seen.ledgerFallback >= 1, true);
    assert.equal(result.ledgerVoucherSummary.totalRows, 1);
    assert.equal(result.ledgerVoucherSummary.persistedRows, 1);
    assert.match(result.importRun.summary.voucherSource, /Ledger Vouchers/);
  } finally {
    await mock.close();
  }
});

test("Tally import rejects out-of-range Day Book rows before creditor ledger fallback", async () => {
  const seen = { dayBook: 0, ledgerFallback: 0 };
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts") || body.includes("MSME Ledger Master Collection")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><CLOSINGBALANCE>700.00 Cr</CLOSINGBALANCE><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("Day Book")) {
      seen.dayBook += 1;
      sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Retail Customer", date: "20260531", number: "WRONG-FY", amount: "-700.00", bill: "WRONG" })}</ENVELOPE>`);
      return;
    }
    if (body.includes("MSME Voucher Collection")) {
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    if (body.includes("Ledger Vouchers")) {
      seen.ledgerFallback += 1;
      sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", date: "20250502", number: "LV-FY25", amount: "-1400.00", bill: "INV-FY25" })}</ENVELOPE>`);
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );
    assert.equal(result.success, true);
    assert.equal(seen.dayBook >= 1, true);
    assert.equal(seen.ledgerFallback >= 1, true);
    assert.equal(result.ledgerVoucherSummary.totalRows, 1);
    const review = tallyImportService.getLedgerVouchers(result.importRun.id, { financialYear: "2025-26", limit: 10 });
    assert.equal(review.ledgerVouchers.total, 1);
    assert.equal(review.ledgerVouchers.rows[0].voucherNumber, "LV-FY25");
    assert.equal(review.ledgerVouchers.rows[0].voucherSource, "Ledger Vouchers");
  } finally {
    await mock.close();
  }
});

test("Tally import fetches complete creditor ledger entries date-wise for review", async () => {
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(
        res,
        `<ENVELOPE>
          <LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER>
          <LEDGER NAME="Beta Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER>
        </ENVELOPE>`
      );
      return;
    }
    if (body.includes("MSME Ledger Master Collection")) {
      sendXml(
        res,
        `<ENVELOPE>
          <LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>50.00 Dr</OPENINGBALANCE><CLOSINGBALANCE>700.00 Cr</CLOSINGBALANCE><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER>
          <LEDGER NAME="Beta Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>25.00 Cr</OPENINGBALANCE><CLOSINGBALANCE>300.00 Cr</CLOSINGBALANCE><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER>
        </ENVELOPE>`
      );
      return;
    }
    if (body.includes("Day Book") || body.includes("MSME Voucher Collection")) {
      const from = body.match(/<SVFROMDATE>([^<]+)<\/SVFROMDATE>/)?.[1] || "";
      if (from === "20250401") {
        sendXml(
          res,
          `<ENVELOPE>
            ${voucherXml({ ledgerName: "Acme Supplier", date: "20250401", number: "ACME-APR", amount: "-100.00", bill: "ACME-B1" })}
            ${voucherXml({ ledgerName: "Acme Supplier", date: "20250510", number: "ACME-MAY", amount: "-200.00", bill: "ACME-B2" })}
            ${voucherXml({ ledgerName: "Beta Supplier", date: "20250615", number: "BETA-JUN", amount: "-300.00", bill: "BETA-B1" })}
            ${voucherXml({ ledgerName: "Retail Customer", date: "20250620", number: "SALE-JUN", amount: "-999.00", bill: "SALE-B1" })}
          </ENVELOPE>`
        );
        return;
      }
      if (from === "20250701") {
        sendXml(
          res,
          `<ENVELOPE>
            ${voucherXml({ ledgerName: "Acme Supplier", date: "20250702", number: "ACME-JUL", amount: "-400.00", bill: "ACME-B3" })}
          </ENVELOPE>`
        );
        return;
      }
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2025-26",
        fromDate: "20250401",
        toDate: "20260331",
        actor: "unit-test",
      })
    );

    assert.equal(result.success, true);
    assert.equal(result.ledgerVoucherSummary.totalRows, 4);
    assert.equal(result.ledgerVoucherSummary.persistedRows, 4);

    const allRows = tallyImportService.getLedgerVouchers(result.importRun.id, { limit: 20 }).ledgerVouchers.rows;
    assert.deepEqual(
      allRows.map((row) => `${row.date}|${row.ledgerName}|${row.voucherNumber}`),
      [
        "2025-04-01|Acme Supplier|ACME-APR",
        "2025-05-10|Acme Supplier|ACME-MAY",
        "2025-06-15|Beta Supplier|BETA-JUN",
        "2025-07-02|Acme Supplier|ACME-JUL",
      ]
    );
    assert.equal(allRows.some((row) => row.ledgerName === "Retail Customer"), false);

    const acmeRows = tallyImportService.getLedgerVouchers(result.importRun.id, {
      ledgerName: "Acme Supplier",
      fromDate: "2025-05-01",
      toDate: "2025-07-31",
      limit: 20,
    }).ledgerVouchers.rows;
    assert.deepEqual(acmeRows.map((row) => row.voucherNumber), ["ACME-MAY", "ACME-JUL"]);
    assert.deepEqual(acmeRows.map((row) => row.billReference), ["ACME-B2", "ACME-B3"]);

    const mayToJuneRows = tallyImportService.getLedgerVouchers(result.importRun.id, {
      fromDate: "2025-05-01",
      toDate: "2025-06-30",
      limit: 20,
    }).ledgerVouchers.rows;
    assert.deepEqual(mayToJuneRows.map((row) => row.voucherNumber), ["ACME-MAY", "BETA-JUN"]);
  } finally {
    await mock.close();
  }
});

test("Tally import persists primary Day Book source without fallback warning", async () => {
  const seen = { dayBook: 0, collection: 0 };
  const mock = await withMockTally(async (req, res) => {
    if (req.method === "GET") {
      sendXml(res, "<RESPONSE>TallyPrime Server is Running</RESPONSE>");
      return;
    }
    const body = await readRequestBody(req);
    if (body.includes("Day Book")) {
      seen.dayBook += 1;
      const from = body.match(/<SVFROMDATE>([^<]+)<\/SVFROMDATE>/)?.[1] || "";
      sendXml(res, from === "20260401"
        ? `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", date: "20260401", number: "COLL-IMPORT-1", amount: "-700.00", bill: "COLL-BILL" })}</ENVELOPE>`
        : "<ENVELOPE></ENVELOPE>");
      return;
    }
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("MSME Ledger Master Collection")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Acme Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>0.00</OPENINGBALANCE><CLOSINGBALANCE>700.00 Cr</CLOSINGBALANCE><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></ENVELOPE>`);
      return;
    }
    if (body.includes("MSME Voucher Collection")) {
      seen.collection += 1;
      sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Retail Customer", date: "20260401", number: "SALE-1", amount: "-700.00", bill: "SALE-BILL" })}</ENVELOPE>`);
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      tallyImportService.importFromTally({
        fiscalYear: "2026-27",
        fromDate: "20260401",
        toDate: "20270331",
        actor: "unit-test",
      })
    );
    assert.equal(result.success, true);
    assert.equal(seen.dayBook >= 1, true);
    assert.equal(result.importRun.summary.selectedFinancialYear, "2026-27");
    assert.equal(result.importRun.summary.voucherSource, "Day Book");
    assert.equal(result.importRun.summary.fallbackUsed, false);
    assert.equal(result.importRun.summary.creditorsImported, 1);
    assert.equal(result.importRun.summary.vouchersParsed, 1);
    assert.equal(result.importRun.summary.vouchersPersisted, 1);
    assert.equal(result.warnings.length, 0);

    const review = tallyImportService.getLedgerVouchers(result.importRun.id, { fiscalYear: "2026-27", limit: 10 });
    assert.equal(review.ledgerVouchers.total, 1);
    assert.equal(review.ledgerVouchers.rows[0].voucherSource, "Day Book");
    assert.equal(review.ledgerVouchers.rows[0].voucherNumber, "COLL-IMPORT-1");
  } finally {
    await mock.close();
  }
});

test("voucher retrieval is scoped to the requested importRunId", () => {
  const firstRunId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "20250401",
    toDate: "20260331",
    asOn: "2026-03-31",
    companyName: "Test Company",
    actor: "unit-test",
  });
  const secondRunId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2027-03-31",
    companyName: "Test Company",
    actor: "unit-test",
  });

  importRepository.completeRun(firstRunId, {
    summary: { fiscalYear: "2025-26", companyName: "Test Company" },
    creditors: [],
    ledgerVouchers: [{
      ledgerName: "First Supplier",
      normalizedLedgerName: "FIRST SUPPLIER",
      date: "2025-05-01",
      particulars: "Purchases",
      voucherType: "Purchase",
      voucherNumber: "FIRST-1",
      credit: 100,
      amount: 100,
      billReference: "FIRST-BILL",
    }],
  });
  importRepository.completeRun(secondRunId, {
    summary: { fiscalYear: "2026-27", companyName: "Test Company" },
    creditors: [],
    ledgerVouchers: [{
      ledgerName: "Second Supplier",
      normalizedLedgerName: "SECOND SUPPLIER",
      date: "2026-05-01",
      particulars: "Purchases",
      voucherType: "Purchase",
      voucherNumber: "SECOND-1",
      credit: 200,
      amount: 200,
      billReference: "SECOND-BILL",
    }],
  });

  const firstRows = tallyImportService.getLedgerVouchers(firstRunId, { limit: 10 }).ledgerVouchers.rows;
  const secondRows = tallyImportService.getLedgerVouchers(secondRunId, { limit: 10 }).ledgerVouchers.rows;
  assert.deepEqual(firstRows.map((row) => row.voucherNumber), ["FIRST-1"]);
  assert.deepEqual(secondRows.map((row) => row.voucherNumber), ["SECOND-1"]);
  assert.equal(firstRows[0].importRunId, firstRunId);
  assert.equal(secondRows[0].importRunId, secondRunId);
  assert.throws(
    () => tallyImportService.getLedgerVouchers(firstRunId, { fiscalYear: "2026-27", limit: 10 }),
    /Import run fiscal year mismatch/
  );
  assert.throws(
    () => createMSMEReport({ importRunId: firstRunId, fiscalYear: "2026-27", actor: "unit-test" }),
    /Import run fiscal year mismatch/
  );
});

test("custom import FY filter returns only selected FY rows and All FY remains grouped", () => {
  const runId = importRepository.createRun({
    fiscalYear: "custom",
    periodType: "custom",
    fromDate: "20250401",
    toDate: "20270331",
    asOn: "2026-05-28",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: {
      fiscalYear: "custom",
      companyName: "Test Company",
      financialYears: ["2025-26", "2026-27"],
      financialYearPeriods: [
        { financialYear: "2025-26", fyStartDate: "20250401", fyEndDate: "20260331", reportFromDate: "20250401", reportToDate: "20260331", asOnDate: "2026-05-28" },
        { financialYear: "2026-27", fyStartDate: "20260401", fyEndDate: "20270331", reportFromDate: "20260401", reportToDate: "20260528", asOnDate: "2026-05-28", cappedByAsOn: true },
      ],
    },
    creditors: [],
    ledgerVouchers: [
      { ledgerName: "Split Supplier", normalizedLedgerName: "SPLIT SUPPLIER", date: "2025-05-01", voucherType: "Purchase", voucherNumber: "FY25", credit: 100, amount: 100, financialYear: "2025-26", reportFromDate: "20250401", reportToDate: "20260331" },
      { ledgerName: "Split Supplier", normalizedLedgerName: "SPLIT SUPPLIER", date: "2026-04-15", voucherType: "Purchase", voucherNumber: "FY26", credit: 200, amount: 200, financialYear: "2026-27", reportFromDate: "20260401", reportToDate: "20260528" },
    ],
  });

  const fy25 = tallyImportService.getLedgerVouchers(runId, { financialYear: "2025-26", limit: 10 }).ledgerVouchers.rows;
  const fy26 = tallyImportService.getLedgerVouchers(runId, { financialYear: "2026-27", limit: 10 }).ledgerVouchers.rows;
  const all = tallyImportService.getLedgerVouchers(runId, { financialYear: "all", limit: 10 }).ledgerVouchers.rows;
  assert.deepEqual(fy25.map((row) => row.voucherNumber), ["FY25"]);
  assert.deepEqual(fy26.map((row) => row.voucherNumber), ["FY26"]);
  assert.deepEqual(all.map((row) => row.financialYear), ["2025-26", "2026-27"]);
});

test("voucher persistence skips duplicate vouchers within an import run", () => {
  const runId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2027-03-31",
    companyName: "Test Company",
    actor: "unit-test",
  });
  const voucher = {
    ledgerName: "Duplicate Supplier",
    normalizedLedgerName: "DUPLICATE SUPPLIER",
    date: "2026-04-01",
    particulars: "Purchases",
    voucherType: "Purchase",
    voucherNumber: "DUP-1",
    credit: 500,
    amount: 500,
    billReference: "DUP-BILL",
    voucherSource: "Voucher Collection",
  };

  importRepository.completeRun(runId, {
    summary: {
      fiscalYear: "2026-27",
      companyName: "Test Company",
      voucherSource: "Voucher Collection",
      fallbackUsed: true,
      vouchersParsed: 2,
    },
    creditors: [],
    ledgerVouchers: [voucher, { ...voucher }],
  });

  const rows = importRepository.getAllLedgerVouchers(runId);
  const run = importRepository.getRun(runId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].voucherSource, "Voucher Collection");
  assert.equal(run.summary.vouchersPersisted, 1);
  assert.equal(run.summary.duplicateVouchersSkipped, 1);
});

test("MSME report uses persisted vouchers for payable aging", () => {
  vendorRepository.upsertVendorStatus(
    {
      vendorName: "Report Aging Supplier",
      isMSME: true,
      verificationStatus: "verified",
      udyamStatus: "verified",
      udyamNumber: "UDYAM-DL-01-1234567",
      enterpriseType: "Small",
      enterpriseName: "Report Aging Supplier",
    },
    "unit-test",
    "unit_test"
  );
  const runId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2026-06-01",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: {
      selectedFinancialYear: "2026-27",
      fiscalYear: "2026-27",
      companyName: "Test Company",
      voucherSource: "Voucher Collection",
      fallbackUsed: true,
      creditorsImported: 1,
      vouchersParsed: 2,
    },
    creditors: [{ party: "Report Aging Supplier", normalizedVendorName: "REPORT AGING SUPPLIER", parent: "Sundry Creditors", groupHierarchy: ["Sundry Creditors"], outstandingAmount: 999 }],
    ledgerVouchers: [
      {
        ledgerName: "Report Aging Supplier",
        normalizedLedgerName: "REPORT AGING SUPPLIER",
        date: "2026-04-01",
        voucherType: "Purchase",
        voucherNumber: "PINV-REPORT",
        credit: 1000,
        amount: 1000,
        billReference: "REPORT-BILL",
        voucherSource: "Voucher Collection",
      },
      {
        ledgerName: "Report Aging Supplier",
        normalizedLedgerName: "REPORT AGING SUPPLIER",
        date: "2026-04-15",
        voucherType: "Payment",
        voucherNumber: "PAY-REPORT",
        debit: 400,
        amount: 400,
        billReference: "REPORT-BILL",
        voucherSource: "Voucher Collection",
      },
    ],
  });

  const report = createMSMEReport({ importRunId: runId, fiscalYear: "2026-27", actor: "unit-test" });
  assert.equal(report.summary.selectedFinancialYear, "2026-27");
  assert.equal(report.summary.applicableAct, "Income Tax Act, 2025");
  assert.equal(report.summary.applicableSection, "Section 37(2)(g)");
  assert.equal(report.summary.actualPaymentRuleId, "ITA-2025-ACTUAL-PAYMENT-037");
  assert.equal(report.summary.bankRatePercent, 5.5);
  assert.equal(report.summary.annualInterestRatePercent, 16.5);
  assert.equal(report.summary.interestRateSource, "official_fetch");
  assert.equal(report.summary.voucherSource, "Voucher Collection");
  assert.equal(report.summary.fallbackUsed, true);
  assert.equal(report.summary.vouchersPersisted, 2);
  assert.equal(report.report.length, 1);
  assert.equal(report.report[0].vendorName, "Report Aging Supplier");
  assert.equal(report.report[0].outstandingAmount, 999);
  assert.equal(report.report[0].daysOutstanding, 61);
  assert.equal(report.report[0].delayDays, 45);
  assert.equal(report.report[0].disallowed, 600);
  assert.equal(report.report[0].appliedRules.includes("ITA-ACTUAL-PAYMENT-037"), false);
  assert.equal(report.report[0].appliedRules.includes("ITA-2025-ACTUAL-PAYMENT-037"), true);
  const bundle = buildEvidenceBundle(report);
  assert.equal(bundle.subarray(0, 4).toString("hex"), "504b0304");
  assert.match(bundle.toString("latin1"), /legal-source-manifest\.json/);
  assert.match(toCsv(report), /Legal Source Files/);
  assert.match(toTallyReconciliationCsv(report), /Report Aging Supplier/);
});

test("report schedules preserve acceptance date, paid-late Clause 26 amount, Section 23, and baseline validation", () => {
  vendorRepository.upsertVendorStatus(
    {
      vendorName: "Strict Schedule Supplier",
      isMSME: true,
      verificationStatus: "verified",
      udyamStatus: "verified",
      udyamNumber: "UDYAM-DL-01-1111111",
      enterpriseType: "Micro",
      agreedPaymentDays: 60,
    },
    "unit-test",
    "unit_test"
  );
  const runId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "20250401",
    toDate: "20260331",
    asOn: "2026-03-31",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { fiscalYear: "2025-26", companyName: "Test Company" },
    creditors: [{
      party: "Strict Schedule Supplier",
      normalizedVendorName: "STRICT SCHEDULE SUPPLIER",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      openingBalance: -250,
      outstandingAmount: 1000,
    }],
    ledgerVouchers: [
      {
        ledgerName: "Strict Schedule Supplier",
        normalizedLedgerName: "STRICT SCHEDULE SUPPLIER",
        date: "2025-04-10",
        voucherType: "Purchase",
        voucherNumber: "ACCEPT-INV",
        credit: 1000,
        amount: 1000,
        billReference: "ACCEPT-INV",
        raw: { acceptanceDate: "2025-04-20", agreedPaymentDays: 60 },
      },
      {
        ledgerName: "Strict Schedule Supplier",
        normalizedLedgerName: "STRICT SCHEDULE SUPPLIER",
        date: "2025-05-01",
        voucherType: "Purchase",
        voucherNumber: "PAID-LATE-500",
        credit: 500,
        amount: 500,
        billReference: "PAID-LATE-500",
        raw: { agreedPaymentDays: 15 },
      },
      {
        ledgerName: "Strict Schedule Supplier",
        normalizedLedgerName: "STRICT SCHEDULE SUPPLIER",
        date: "2025-06-30",
        voucherType: "Payment",
        voucherNumber: "PAY-LATE-500",
        debit: 500,
        amount: 500,
        billReference: "PAID-LATE-500",
      },
    ],
  });
  const report = createMSMEReport({ importRunId: runId, fiscalYear: "2025-26", actor: "unit-test" });
  const accept = report.schedules.invoiceAging.find((row) => row.invoiceNumber === "ACCEPT-INV");
  const paidLate = report.schedules.clause26.find((row) => row.invoiceNumber === "PAID-LATE-500" && row.status === "paid_late");
  assert.equal(accept.acceptanceDate, "2025-04-20");
  assert.equal(accept.appointedDay, "2025-06-04");
  assert.equal(paidLate.paidLateAmount, 500);
  assert.equal(paidLate.principalDisallowance, 500);
  assert.equal(report.report[0].disallowed, 1500);
  assert.ok(report.schedules.msmedSection16Interest.length > 0);
  assert.ok(report.schedules.msmedSection23PermanentDisallowance.length > 0);
  assert.equal(report.schedules.baselineValidation[0].baselineDate, "2025-03-31");
  assert.equal(report.schedules.baselineValidation[0].status, "unavailable");
  assert.match(report.schedules.baselineValidation[0].warning, /snapshot is unavailable/i);
});

test("FY-wise MSME report keeps Tally closing authoritative and exposes voucher-only outstanding separately", () => {
  vendorRepository.upsertVendorStatus(
    {
      vendorName: "Scoped Supplier",
      isMSME: true,
      verificationStatus: "verified",
      udyamStatus: "verified",
      udyamNumber: "UDYAM-DL-01-7654321",
      enterpriseType: "Micro",
      enterpriseName: "Scoped Supplier",
    },
    "unit-test",
    "unit_test"
  );
  const runId = importRepository.createRun({
    fiscalYear: "custom",
    periodType: "custom",
    fromDate: "20250401",
    toDate: "20270331",
    asOn: "2026-05-28",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: {
      fiscalYear: "custom",
      companyName: "Test Company",
      financialYears: ["2025-26", "2026-27"],
      financialYearPeriods: [
        { financialYear: "2025-26", fyStartDate: "20250401", fyEndDate: "20260331", reportFromDate: "20250401", reportToDate: "20260331", asOnDate: "2026-05-28" },
        { financialYear: "2026-27", fyStartDate: "20260401", fyEndDate: "20270331", reportFromDate: "20260401", reportToDate: "20260528", asOnDate: "2026-05-28", cappedByAsOn: true },
      ],
    },
    creditors: [{
      party: "Scoped Supplier",
      normalizedVendorName: "SCOPED SUPPLIER",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 10000,
      closingBalance: -10000,
    }],
    ledgerVouchers: [
      { ledgerName: "Scoped Supplier", normalizedLedgerName: "SCOPED SUPPLIER", date: "2026-04-01", voucherType: "Purchase", voucherNumber: "FY26-P", credit: 300, amount: 300, billReference: "FY26-B", financialYear: "2026-27", reportFromDate: "20260401", reportToDate: "20260528" },
      { ledgerName: "Scoped Supplier", normalizedLedgerName: "SCOPED SUPPLIER", date: "2026-04-20", voucherType: "Payment", voucherNumber: "FY26-PAY", debit: 100, amount: 100, billReference: "FY26-B", financialYear: "2026-27", reportFromDate: "20260401", reportToDate: "20260528" },
    ],
  });

  const report = createMSMEReport({ importRunId: runId, fiscalYear: "2026-27", asOnDate: "2026-05-28", actor: "unit-test" });
  assert.equal(report.summary.selectedFinancialYear, "2026-27");
  assert.equal(report.summary.reportToDate, "20260528");
  assert.equal(report.summary.cappedByAsOn, true);
  assert.equal(report.report.length, 1);
  assert.equal(report.report[0].ledgerOutstandingAmount, 10000);
  assert.equal(report.report[0].voucherOutstandingAmount, 200);
  assert.equal(report.report[0].outstandingAmount, 10000);
  assert.equal(report.report[0].outstandingMismatch, true);
});

test("All FY MSME report exposes year-wise summary groups", () => {
  const latest = importRepository.listRuns().find((run) => run.fiscalYear === "custom");
  const report = createMSMEReport({ importRunId: latest.id, fiscalYear: "all", asOnDate: "2026-05-28", actor: "unit-test" });
  assert.equal(report.summary.selectedFinancialYear, "all");
  assert.ok(report.summary.financialYearSummaries.some((row) => row.financialYear === "2026-27"));
});

test("MSME compliance workbook export includes all statutory verification sheets", () => {
  const latest = reportRepository.listReports()[0];
  const buffer = toWorkbookBuffer(latest);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  assert.deepEqual(workbook.SheetNames, [
    "Executive Summary",
    "Creditor Ledger Summary",
    "MSME Vendor Registry",
    "Ledger-wise MSME Interest",
    "Voucher-wise Delay Evidence",
    "Tax Disallowance Summary",
    "Clause 22 MSME Computation",
    "43B(h) From Clause 22",
    "Clause 26A Carry Forward",
    "Form 3CD Clause 22",
    "Form 3CD Clause 26",
    "Schedule III Disclosure",
    "Verification Required",
    "MCA MSME Form-1 Data",
    "Assumptions & Notes",
    "Form 3CD Disclosure",
    "43B Disclosure",
  ]);
});

test("MSME compliance workbook download displays all FY rows as 2025-26", () => {
  const workbook = XLSX.read(toWorkbookBuffer({
    id: "download-fy-test",
    fiscalYear: "all",
    createdAt: "2026-06-11T00:00:00.000Z",
    summary: {},
    schedules: {
      creditorLedgerSummary: [{
        financialYear: "all",
        creditorLedger: "All FY Supplier",
        ledgerPayableOutstanding: 100,
      }],
    },
  }), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Creditor Ledger Summary"]);
  assert.equal(rows[0].financialYear, "2025-26");
});

test("Clause 22(iii)(b), 43B(h), report summary, and Excel workbook totals reconcile", () => {
  const latest = reportRepository.listReports()[0];
  const clause22Total = latest.schedules.clause22Computation.reduce((sum, row) => sum + Number(row.clause22iiiBOutstandingDisallowance || 0), 0);
  const clause43Total = latest.schedules.clause43BhFromClause22.reduce((sum, row) => sum + Number(row.principalDisallowance || 0), 0);
  assert.equal(Math.round(clause43Total * 100), Math.round(clause22Total * 100));
  assert.equal(Math.round(Number(latest.summary.totalDisallowed || 0) * 100), Math.round(clause22Total * 100));

  const workbook = XLSX.read(toWorkbookBuffer(latest), { type: "buffer" });
  const clause22Rows = XLSX.utils.sheet_to_json(workbook.Sheets["Clause 22 MSME Computation"]);
  const clause43Rows = XLSX.utils.sheet_to_json(workbook.Sheets["43B(h) From Clause 22"]);
  const clause22ExcelTotal = clause22Rows.find((row) => row.financialYear === "Total")?.clause22iiiBOutstandingDisallowance || 0;
  const clause43ExcelTotal = clause43Rows.find((row) => row.financialYear === "Total")?.principalDisallowance || 0;
  assert.equal(Math.round(Number(clause22ExcelTotal) * 100), Math.round(clause22Total * 100));
  assert.equal(Math.round(Number(clause43ExcelTotal) * 100), Math.round(clause43Total * 100));
});

test("latest completed Tally import restore service returns persisted run and creditors", () => {
  const latest = importRepository.getLatestCompletedRun();
  assert.equal(latest.status, "completed");
  const restored = tallyImportService.getLatestCompletedImportRun();
  assert.equal(restored.importRun.id, latest.id);
  assert.ok(Array.isArray(restored.creditors));
  assert.ok(restored.verificationSummary);
});

test("Clause 26(A) carry-forward register deducts prior-year 43B(h) on actual current-year payment", () => {
  const priorRunId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "20250401",
    toDate: "20260331",
    asOn: "2026-03-31",
    companyName: "Carry Forward Test Co",
    actor: "unit-test",
  });
  importRepository.completeRun(priorRunId, {
    summary: { fiscalYear: "2025-26", companyName: "Carry Forward Test Co" },
    creditors: [],
    ledgerVouchers: [],
  });
  const priorReport = reportRepository.createReport({
    importRunId: priorRunId,
    fiscalYear: "2025-26",
    summary: {},
    report: {
      included: [],
      excluded: [],
      schedules: {
        clause43BhFromClause22: [{
          financialYear: "2025-26",
          vendorName: "Carry Supplier",
          supplier: "Carry Supplier",
          panNumber: "ABCDE1234F",
          udyamNumber: "UDYAM-DL-01-1234567",
          invoiceNumber: "CF-INV-1",
          invoiceDate: "2026-03-01",
          principalDisallowance: 1000,
          sourceClause: "Clause 22(iii)(b)",
          allowedInYear: "Year of actual payment",
        }],
      },
    },
    actor: "unit-test",
  });
  const currentRunId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2027-03-31",
    companyName: "Carry Forward Test Co",
    actor: "unit-test",
  });
  importRepository.completeRun(currentRunId, {
    summary: { fiscalYear: "2026-27", companyName: "Carry Forward Test Co" },
    creditors: [],
    ledgerVouchers: [{
      vendorName: "Carry Supplier",
      ledgerName: "Carry Supplier",
      date: "2026-04-15",
      voucherType: "Payment",
      voucherNumber: "PAY-CF-1",
      billReference: "CF-INV-1",
      debit: 600,
      amount: 600,
    }],
  });
  const currentReport = reportRepository.createReport({
    importRunId: currentRunId,
    fiscalYear: "2026-27",
    summary: {},
    report: { included: [], excluded: [], schedules: {} },
    actor: "unit-test",
  });

  const register = carryForwardService.buildRegister(currentReport.id, { priorReportId: priorReport.id });
  assert.equal(register.rows.length, 1);
  assert.equal(register.rows[0].openingDisallowance, 1000);
  assert.equal(register.rows[0].deductibleCurrentYear, 600);
  assert.equal(register.rows[0].closingCarryForward, 400);
  assert.equal(register.summary.deductibleCurrentYear, 600);
});

test("report warns and lists pending vendors when no verified MSME vendors exist", () => {
  const runId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "20250401",
    toDate: "20260331",
    asOn: "2026-03-31",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { fiscalYear: "2025-26", companyName: "Test Company" },
    creditors: [{
      party: "Pending MSME Supplier",
      normalizedVendorName: "PENDING MSME SUPPLIER",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 1000,
    }],
    ledgerVouchers: [],
  });
  const report = createMSMEReport({ importRunId: runId, fiscalYear: "2025-26", actor: "unit-test" });
  assert.equal(report.report.length, 0);
  assert.match(report.summary.noVerifiedMSMEWarning, /No verified MSME vendors/);
  assert.ok(report.excluded.some((row) => row.vendorName === "Pending MSME Supplier"));
});

test("Tally creditor export returns diagnostics for empty creditor dataset", async () => {
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE><LEDGER NAME="Sales Account"><PARENT>Sales Accounts</PARENT><CLOSINGBALANCE>0.00</CLOSINGBALANCE></LEDGER></ENVELOPE>`);
      return;
    }
    assert.equal(body.includes("Group Summary"), false);
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    await assert.rejects(
      () => runWithTallyPort(mock.port, () =>
        fetchCreditors({
          from: "20250401",
          to: "20260331",
        })
      ),
      (error) => {
        assert.match(error.message, /0 creditor ledgers detected/);
        assert.deepEqual(error.diagnostics.creditorDiagnostics.sampleParentNames, ["Sales Accounts"]);
        return true;
      }
    );
  } finally {
    await mock.close();
  }
});

test("Tally creditor export uses ledger master balances and preserves opening debit credit detail", async () => {
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE>
        <LEDGER NAME="Credit Master Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER>
        <LEDGER NAME="Debit Master Supplier"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER>
      </ENVELOPE>`);
      return;
    }
    if (body.includes("MSME Ledger Master Collection")) {
      sendXml(res, `<ENVELOPE>
        <LEDGER NAME="Credit Master Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>150.00 Dr</OPENINGBALANCE><CLOSINGBALANCE>900.00 Cr</CLOSINGBALANCE><GSTIN>27ABCDE1234F1Z5</GSTIN></LEDGER>
        <LEDGER NAME="Debit Master Supplier"><PARENT>Sundry Creditors</PARENT><OPENINGBALANCE>100.00 Cr</OPENINGBALANCE><CLOSINGBALANCE>50.00 Dr</CLOSINGBALANCE></LEDGER>
      </ENVELOPE>`);
      return;
    }
    if (body.includes("Day Book")) {
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchCreditors({
        from: "20250401",
        to: "20260331",
        asOn: "2026-03-31",
      })
    );
    assert.equal(result.creditors.length, 1);
    assert.equal(result.summary.tallySource, "ledger_master_collection");
    assert.equal(result.summary.creditorDiagnostics.filteredNonCreditBalanceCount, 0);
    assert.equal(result.creditors[0].party, "Credit Master Supplier");
    assert.equal(result.creditors[0].outstandingAmount, 900);
    assert.equal(result.creditors[0].openingBalance, 150);
    assert.equal(result.creditors[0].openingBalanceRaw, "150.00 Dr");
    assert.equal(result.creditors[0].openingBalanceType, "debit");
    assert.equal(result.creditors[0].closingBalance, -900);
    assert.equal(result.creditors[0].closingBalanceRaw, "900.00 Cr");
    assert.equal(result.creditors[0].closingBalanceType, "credit");
    assert.equal(result.creditors[0].gstin, "27ABCDE1234F1Z5");
  } finally {
    await mock.close();
  }
});

test("Tally creditor export treats unmarked Sundry Creditor master amounts as creditor polarity", async () => {
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (body.includes("List of Accounts")) {
      sendXml(res, `<ENVELOPE>
        <LEDGER NAME="Hindustan Power Green Vehicles Pvt Ltd"><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER>
      </ENVELOPE>`);
      return;
    }
    if (body.includes("MSME Ledger Master Collection")) {
      sendXml(res, `<ENVELOPE>
        <LEDGER NAME="Hindustan Power Green Vehicles Pvt Ltd">
          <PARENT>Sundry Creditors</PARENT>
          <ISBILLWISEON>Yes</ISBILLWISEON>
          <INCOMETAXNUMBER>abcde1234f</INCOMETAXNUMBER>
          <OPENINGBALANCE>-1390800.00</OPENINGBALANCE>
          <CLOSINGBALANCE>572257.00</CLOSINGBALANCE>
        </LEDGER>
      </ENVELOPE>`);
      return;
    }
    if (body.includes("Day Book")) {
      sendXml(res, "<ENVELOPE></ENVELOPE>");
      return;
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchCreditors({
        from: "20250401",
        to: "20260331",
        asOn: "2026-03-31",
      })
    );
    assert.equal(result.creditors.length, 1);
    assert.equal(result.creditors[0].party, "Hindustan Power Green Vehicles Pvt Ltd");
    assert.equal(result.creditors[0].openingBalance, 1390800);
    assert.equal(result.creditors[0].openingBalanceType, "debit");
    assert.equal(result.creditors[0].closingBalance, -572257);
    assert.equal(result.creditors[0].closingBalanceType, "credit");
    assert.equal(result.creditors[0].outstandingAmount, 572257);
    assert.equal(result.creditors[0].panNumber, "ABCDE1234F");
  } finally {
    await mock.close();
  }
});

test("voucher export handles large batched datasets", async () => {
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (!body.includes("Day Book") && !body.includes("MSME Voucher Collection")) return sendXml(res, "<ENVELOPE></ENVELOPE>");
    const date = body.match(/<SVFROMDATE>(\d+)<\/SVFROMDATE>/)?.[1] || "20250501";
    const vouchers = Array.from({ length: 25 }, (_, index) =>
      voucherXml({ ledgerName: "Acme Supplier", date, number: `L-${date}-${index}`, amount: "-100.00", bill: `B-${index}` })
    ).join("");
    sendXml(res, `<ENVELOPE>${vouchers}</ENVELOPE>`);
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchAllCreditorLedgerVouchers({
        creditors: [{ party: "Acme Supplier" }],
        from: "20250401",
        to: "20260331",
      })
    );
    assert.equal(result.rows.length, 100);
    assert.equal(result.warnings.length, 0);
  } finally {
    await mock.close();
  }
});

test("voucher export tolerates slow Tally responses within 60s timeout", async () => {
  const oldTimeout = process.env.TALLY_VOUCHER_TIMEOUT_MS;
  process.env.TALLY_VOUCHER_TIMEOUT_MS = "1000";
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (!body.includes("Day Book") && !body.includes("MSME Voucher Collection")) return sendXml(res, "<ENVELOPE></ENVELOPE>");
    setTimeout(() => sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", number: "SLOW-1" })}</ENVELOPE>`), 150);
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchAllCreditorLedgerVouchers({
        creditors: [{ party: "Acme Supplier" }],
        from: "20250401",
        to: "20250630",
      })
    );
    assert.equal(result.rows.length, 1);
  } finally {
    if (oldTimeout == null) delete process.env.TALLY_VOUCHER_TIMEOUT_MS;
    else process.env.TALLY_VOUCHER_TIMEOUT_MS = oldTimeout;
    await mock.close();
  }
});

test("voucher export retries timed-out quarter month by month", async () => {
  const oldTimeout = process.env.TALLY_VOUCHER_TIMEOUT_MS;
  process.env.TALLY_VOUCHER_TIMEOUT_MS = "80";
  const seen = { monthly: 0 };
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (!body.includes("MSME Voucher Collection")) return sendXml(res, "<ENVELOPE></ENVELOPE>");
    const from = body.match(/<SVFROMDATE>(\d+)<\/SVFROMDATE>/)?.[1];
    const to = body.match(/<SVTODATE>(\d+)<\/SVTODATE>/)?.[1];
    if (from === "20250401" && to === "20250630") {
      setTimeout(() => sendXml(res, "<ENVELOPE></ENVELOPE>"), 200);
      return;
    }
    seen.monthly += 1;
    sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", date: from, number: `M-${from}` })}</ENVELOPE>`);
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchAllCreditorLedgerVouchers({
        creditors: [{ party: "Acme Supplier" }],
        from: "20250401",
        to: "20250630",
      })
    );
    assert.equal(seen.monthly, 3);
    assert.equal(result.rows.length, 3);
  } finally {
    if (oldTimeout == null) delete process.env.TALLY_VOUCHER_TIMEOUT_MS;
    else process.env.TALLY_VOUCHER_TIMEOUT_MS = oldTimeout;
    await mock.close();
  }
});

test("voucher export merges quarter batches", async () => {
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (!body.includes("MSME Voucher Collection")) return sendXml(res, "<ENVELOPE></ENVELOPE>");
    const from = body.match(/<SVFROMDATE>(\d+)<\/SVFROMDATE>/)?.[1] || "20250401";
    sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", date: from, number: `Q-${from}` })}</ENVELOPE>`);
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchAllCreditorLedgerVouchers({
        creditors: [{ party: "Acme Supplier" }],
        from: "20250401",
        to: "20260331",
      })
    );
    assert.equal(result.rows.length, 4);
    assert.deepEqual(result.rows.map((row) => row.voucherNumber), ["Q-20250401", "Q-20250701", "Q-20251001", "Q-20260101"]);
  } finally {
    await mock.close();
  }
});

test("voucher export falls back to filtered Voucher Collection when Day Book has no creditor rows", async () => {
  const seen = { dayBook: 0, collection: 0 };
  const mock = await withMockTally(async (req, res) => {
    const body = await readRequestBody(req);
    if (body.includes("MSME Voucher Collection")) {
      seen.collection += 1;
      return sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Acme Supplier", date: "20260401", number: "COLL-1", amount: "-700.00", bill: "COLL-BILL" })}</ENVELOPE>`);
    }
    if (body.includes("Day Book")) {
      seen.dayBook += 1;
      return sendXml(res, `<ENVELOPE>${voucherXml({ ledgerName: "Retail Customer", date: "20260401", number: "SALE-1", amount: "-700.00", bill: "SALE-BILL" })}</ENVELOPE>`);
    }
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchAllCreditorLedgerVouchers({
        creditors: [{ party: "Acme Supplier" }],
        from: "20260401",
        to: "20260630",
      })
    );
    assert.equal(seen.dayBook, 1);
    assert.equal(seen.collection, 1);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].voucherNumber, "COLL-1");
    assert.equal(result.rows[0].billReference, "COLL-BILL");
    assert.equal(result.rows[0].voucherSource, "Voucher Collection");
    assert.equal(result.voucherSource, "Voucher Collection");
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.warnings.length, 0);
  } finally {
    await mock.close();
  }
});

test("voucher export accepts empty voucher batches", async () => {
  const mock = await withMockTally(async (req, res) => {
    await readRequestBody(req);
    sendXml(res, "<ENVELOPE></ENVELOPE>");
  });
  try {
    const result = await runWithTallyPort(mock.port, () =>
      fetchAllCreditorLedgerVouchers({
        creditors: [{ party: "Acme Supplier" }],
        from: "20250401",
        to: "20250630",
      })
    );
    assert.equal(result.rows.length, 0);
    assert.equal(result.warnings.length >= 1, true);
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.voucherSource, "Voucher Collection");
  } finally {
    await mock.close();
  }
});

test("payable aging matches invoice and full payment by bill reference", () => {
  const aging = buildPayableAgingFromVouchers([
    {
      ledgerName: "Aging Supplier",
      normalizedLedgerName: "AGING SUPPLIER",
      date: "2026-04-01",
      voucherType: "Purchase",
      voucherNumber: "PINV-1",
      billReference: "BILL-1",
      credit: 1000,
      amount: 1000,
    },
    {
      ledgerName: "Aging Supplier",
      normalizedLedgerName: "AGING SUPPLIER",
      date: "2026-04-20",
      voucherType: "Payment",
      voucherNumber: "PAY-1",
      billReference: "BILL-1",
      debit: 1000,
      amount: 1000,
    },
  ], "2026-06-01");

  assert.equal(aging.length, 1);
  assert.equal(aging[0].outstandingAmount, 0);
  assert.equal(aging[0].pendingInvoiceCount, 0);
  assert.equal(aging[0].invoiceCount, 1);
  assert.equal(aging[0].paymentCount, 1);
  assert.equal(aging[0].exposure43Bh, 0);
  assert.equal(aging[0].allInvoices[0].allocationMethod, "bill_reference");
});

test("payable aging falls back to debit and credit polarity when voucher type is unavailable", () => {
  const aging = buildPayableAgingFromVouchers([
    {
      ledgerName: "Polarity Supplier",
      normalizedLedgerName: "POLARITY SUPPLIER",
      date: "2026-04-01",
      voucherType: "",
      voucherNumber: "CR-ROW",
      credit: 1000,
      amount: 1000,
    },
    {
      ledgerName: "Polarity Supplier",
      normalizedLedgerName: "POLARITY SUPPLIER",
      date: "2026-04-20",
      voucherType: "",
      voucherNumber: "DR-ROW",
      debit: 250,
      amount: 250,
    },
  ], "2026-06-30", { vendorTerms: new Map([["POLARITY SUPPLIER", 45]]) });

  assert.equal(aging.length, 1);
  assert.equal(aging[0].invoiceCount, 1);
  assert.equal(aging[0].paymentCount, 1);
  assert.equal(aging[0].outstandingAmount, 750);
  assert.equal(aging[0].invoices[0].allocationMethod, "fifo");
});

test("payable aging trusts voucher type before debit credit polarity for Tally ledger rows", () => {
  const aging = buildPayableAgingFromVouchers([
    {
      ledgerName: "Typed Supplier",
      normalizedLedgerName: "TYPED SUPPLIER",
      date: "2026-03-31",
      voucherType: "Journal",
      voucherNumber: "INV-TYPED",
      debit: 1000,
      amount: 1000,
    },
    {
      ledgerName: "Typed Supplier",
      normalizedLedgerName: "TYPED SUPPLIER",
      date: "2026-05-20",
      voucherType: "Payment",
      voucherNumber: "PAY-TYPED",
      credit: 250,
      amount: 250,
    },
  ], "2026-06-06", { vendorTerms: new Map([["TYPED SUPPLIER", 45]]) });

  assert.equal(aging.length, 1);
  assert.equal(aging[0].invoiceCount, 1);
  assert.equal(aging[0].paymentCount, 1);
  assert.equal(aging[0].outstandingAmount, 750);
  assert.equal(aging[0].allInvoices[0].delayDays, 21);
  assert.equal(aging[0].allInvoices[0].exposure43Bh, 750);
});

test("payable aging includes paid-late invoices as audit evidence", () => {
  const aging = buildPayableAgingFromVouchers([
    {
      ledgerName: "Paid Late Supplier",
      normalizedLedgerName: "PAID LATE SUPPLIER",
      date: "2025-04-01",
      voucherType: "Purchase",
      voucherNumber: "INV-LATE",
      billReference: "INV-LATE",
      credit: 1000,
      amount: 1000,
      agreedPaymentDays: 15,
    },
    {
      ledgerName: "Paid Late Supplier",
      normalizedLedgerName: "PAID LATE SUPPLIER",
      date: "2025-05-30",
      voucherType: "Payment",
      voucherNumber: "PAY-LATE",
      billReference: "INV-LATE",
      debit: 1000,
      amount: 1000,
    },
  ], "2026-03-31");

  assert.equal(aging[0].outstandingAmount, 0);
  assert.equal(aging[0].paidLateInvoiceCount, 1);
  assert.equal(aging[0].paidLateAmount, 1000);
  assert.equal(aging[0].paidLateInvoices[0].delayDays, 43);
  assert.ok(aging[0].interest > 0);
});

test("payable aging uses 15 days without agreement and acceptance date when available", () => {
  const aging = buildPayableAgingFromVouchers([
    {
      ledgerName: "No Agreement Supplier",
      normalizedLedgerName: "NO AGREEMENT SUPPLIER",
      date: "2026-04-01",
      voucherType: "Purchase",
      voucherNumber: "NOAGR",
      billReference: "NOAGR",
      credit: 1000,
      amount: 1000,
    },
    {
      ledgerName: "Acceptance Supplier",
      normalizedLedgerName: "ACCEPTANCE SUPPLIER",
      date: "2025-04-10",
      acceptanceDate: "2025-04-20",
      agreedPaymentDays: 60,
      voucherType: "Purchase",
      voucherNumber: "ACCEPT",
      billReference: "ACCEPT",
      credit: 1000,
      amount: 1000,
    },
    {
      ledgerName: "Mixed Agreement Supplier",
      normalizedLedgerName: "MIXED AGREEMENT SUPPLIER",
      date: "2025-04-10",
      acceptanceDate: "2025-04-20",
      agreedPaymentDays: 60,
      voucherType: "Purchase",
      voucherNumber: "MIXED-WITH-AGREEMENT",
      billReference: "MIXED-WITH-AGREEMENT",
      credit: 1000,
      amount: 1000,
    },
    {
      ledgerName: "Mixed Agreement Supplier",
      normalizedLedgerName: "MIXED AGREEMENT SUPPLIER",
      date: "2025-05-01",
      voucherType: "Purchase",
      voucherNumber: "MIXED-NO-AGREEMENT",
      billReference: "MIXED-NO-AGREEMENT",
      credit: 500,
      amount: 500,
      raw: { hasWrittenAgreement: false },
    },
  ], "2026-06-30");
  const noAgreement = aging.find((row) => row.vendorName === "No Agreement Supplier").allInvoices[0];
  const acceptance = aging.find((row) => row.vendorName === "Acceptance Supplier").allInvoices[0];
  const mixedNoAgreement = aging
    .find((row) => row.vendorName === "Mixed Agreement Supplier")
    .allInvoices.find((invoice) => invoice.invoiceNumber === "MIXED-NO-AGREEMENT");
  assert.equal(noAgreement.allowedPaymentDays, 15);
  assert.equal(noAgreement.dueDate, "2026-04-16");
  assert.equal(acceptance.allowedPaymentDays, 45);
  assert.equal(acceptance.acceptanceDate, "2025-04-20");
  assert.equal(acceptance.dueDate, "2025-06-04");
  assert.equal(mixedNoAgreement.hasWrittenAgreement, false);
  assert.equal(mixedNoAgreement.allowedPaymentDays, 15);
  assert.equal(mixedNoAgreement.dueDate, "2025-05-16");
});

test("payable aging computes partial payment, pending amount, overdue days, and 43B(h) exposure", () => {
  const aging = buildPayableAgingFromVouchers([
    {
      ledgerName: "Partial Supplier",
      normalizedLedgerName: "PARTIAL SUPPLIER",
      date: "2026-04-01",
      voucherType: "Purchase",
      voucherNumber: "PINV-2",
      billReference: "BILL-2",
      credit: 1000,
      amount: 1000,
    },
    {
      ledgerName: "Partial Supplier",
      normalizedLedgerName: "PARTIAL SUPPLIER",
      date: "2026-04-15",
      voucherType: "Payment",
      voucherNumber: "PAY-2",
      billReference: "BILL-2",
      debit: 400,
      amount: 400,
    },
  ], "2026-06-01");

  assert.equal(aging.length, 1);
  assert.equal(aging[0].outstandingAmount, 600);
  assert.equal(aging[0].daysOutstanding, 61);
  assert.equal(aging[0].bucket, "61-90 days");
  assert.equal(aging[0].delayed, true);
  assert.equal(aging[0].exposure43Bh, 600);
  assert.equal(aging[0].invoices[0].paidAmount, 400);
  assert.equal(aging[0].invoices[0].pendingAmount, 600);
  assert.equal(aging[0].invoices[0].delayDays, 45);
});

test("payable aging keeps ledger outstanding amount and exposes voucher amount separately", () => {
  const creditors = [{
    party: "Ledger Source Supplier",
    normalizedVendorName: "LEDGER SOURCE SUPPLIER",
    outstandingAmount: 1000,
  }];
  const enriched = enrichCreditorsWithVoucherAging(creditors, [
    {
      ledgerName: "Ledger Source Supplier",
      normalizedLedgerName: "LEDGER SOURCE SUPPLIER",
      date: "2026-04-01",
      voucherType: "Purchase",
      voucherNumber: "PINV-LEDGER",
      billReference: "BILL-LEDGER",
      credit: 600,
      amount: 600,
    },
  ], "2026-06-01");

  assert.equal(enriched[0].outstandingAmount, 1000);
  assert.equal(enriched[0].ledgerOutstandingAmount, 1000);
  assert.equal(enriched[0].voucherOutstandingAmount, 600);
  assert.equal(enriched[0].outstandingMismatch, true);
  assert.equal(enriched[0].mismatchReason, "Ledger closing balance differs from voucher-only outstanding");
  assert.equal(enriched[0].payableAging.outstandingAmount, 600);
});

test("payable aging keeps ledger-only balances out of delay and interest when invoice evidence is unavailable", () => {
  const enriched = enrichCreditorsWithVoucherAging([{
    party: "Ledger Only Supplier",
    normalizedVendorName: "LEDGER ONLY SUPPLIER",
    outstandingAmount: 1501162.47,
    reportFromDate: "20260401",
    vendorMaster: { agreedPaymentDays: 45 },
  }], [], "2026-06-05");

  assert.equal(enriched[0].outstandingAmount, 1501162.47);
  assert.equal(enriched[0].voucherOutstandingAmount, 0);
  assert.equal(enriched[0].payableAging.allInvoices[0].allocationMethod, "ledger_estimate");
  assert.equal(enriched[0].payableAging.allInvoices[0].allowedPaymentDays, 45);
  assert.equal(enriched[0].payableAging.allInvoices[0].delayDays, 0);
  assert.equal(enriched[0].payableAging.allInvoices[0].exposure43Bh, 0);
  assert.equal(enriched[0].payableAging.interest, 0);
  assert.equal(enriched[0].payableAging.allInvoices[0].verificationRequired, true);
  assert.ok(enriched[0].payableAging.allInvoices[0].verificationFlags.includes("LEDGER_ONLY_ESTIMATE"));
});

test("MSME report consolidates duplicate and similar vendor names without ledger-only delay estimates", () => {
  vendorRepository.upsertVendorStatus(
    {
      vendorName: "Galvanic Infotech Pvt Ltd",
      isMSME: true,
      verificationStatus: "verified",
      udyamStatus: "verified",
      udyamNumber: "UDYAM-UP-28-0100619",
      enterpriseType: "Small",
      panNumber: "AADCG2211M",
      agreedPaymentDays: 45,
    },
    "unit-test",
    "unit_test"
  );
  const runId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2026-06-06",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { fiscalYear: "2026-27", companyName: "Test Company" },
    creditors: [
      {
        party: "Galvanic Infotech Pvt Ltd",
        normalizedVendorName: "GALVANIC INFOTECH",
        parent: "Sundry Creditors",
        groupHierarchy: ["Sundry Creditors"],
        outstandingAmount: 111156,
      },
      {
        party: "Galvanic Infotech Pvt Ltd",
        normalizedVendorName: "GALVANIC INFOTECH",
        parent: "Sundry Creditors",
        groupHierarchy: ["Sundry Creditors"],
        outstandingAmount: 111156,
      },
      {
        party: "Galvanic Infotech Private Limited",
        normalizedVendorName: "GALVANIC INFOTECH",
        parent: "Sundry Creditors",
        groupHierarchy: ["Sundry Creditors"],
        outstandingAmount: 100,
      },
    ],
    ledgerVouchers: [],
  });

  const report = createMSMEReport({ importRunId: runId, fiscalYear: "2026-27", actor: "unit-test" });
  assert.equal(report.report.length, 1);
  assert.equal(report.report[0].vendorName, "Galvanic Infotech Pvt Ltd");
  assert.equal(report.report[0].ledgerOutstandingAmount, 111256);
  assert.equal(report.report[0].delayDays, 0);
  assert.equal(report.report[0].disallowed, 0);
  assert.equal(report.report[0].interest, 0);
  assert.ok(report.report[0].invoiceAging[0].verificationFlags.includes("LEDGER_ONLY_ESTIMATE"));
});

test("report includes only verified MSME vendors", () => {
  const rows = calculateReportRows([
    {
      party: "Verified MSME",
      normalizedVendorName: "VERIFIED",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 1000,
      ledgerOutstandingAmount: 1000,
      voucherOutstandingAmount: 1600,
      outstandingMismatch: true,
      mismatchReason: "Ledger closing balance differs from voucher-only outstanding",
      panNumber: "ABCDE1234F",
      daysOutstanding: 60,
      bucket: "46-60 days",
      vendorMaster: {
        isMSME: true,
        verificationStatus: "verified",
        udyamStatus: "verified",
        udyamNumber: "UDYAM-DL-01-1234567",
        enterpriseType: "Small",
      },
    },
    {
      party: "Pending Vendor",
      normalizedVendorName: "PENDING",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 2000,
      daysOutstanding: 90,
      bucket: "61-90 days",
      vendorMaster: { isMSME: true, verificationStatus: "manual_fallback_required", udyamStatus: "manual_fallback_required" },
    },
    {
      party: "Non MSME",
      normalizedVendorName: "NON",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 3000,
      daysOutstanding: 90,
      bucket: "61-90 days",
      vendorMaster: { isMSME: false, verificationStatus: "not_msme", udyamStatus: "not_started" },
    },
    {
      party: "Medium Enterprise",
      normalizedVendorName: "MEDIUM",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 4000,
      daysOutstanding: 120,
      bucket: "90+ days",
      vendorMaster: {
        isMSME: true,
        verificationStatus: "verified",
        udyamStatus: "verified",
        udyamNumber: "UDYAM-DL-01-7654321",
        enterpriseType: "Medium",
      },
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].vendorName, "Verified MSME");
  assert.equal(rows[0].panNumber, "ABCDE1234F");
  assert.equal(rows[0].outstandingAmount, 1000);
  assert.equal(rows[0].ledgerOutstandingAmount, 1000);
  assert.equal(rows[0].voucherOutstandingAmount, 1600);
  assert.equal(rows[0].outstandingMismatch, true);
  assert.equal(rows[0].disallowed, 1000);
  assert.equal(rows[0].delayDays, 45);
  assert.equal(rows[0].appliedRules.includes("ITA-ACTUAL-PAYMENT-037"), true);
  assert.equal(rows[0].appliedRules.includes("ITA-2025-ACTUAL-PAYMENT-037"), false);
  assert.equal(rows[0].applicableAct, "Income Tax Act, 1961");
  assert.equal(rows[0].applicableSection, "Section 43B(h)");
  const csv = toCsv({
    id: "report-test",
    fiscalYear: "2025-26",
    createdAt: "2026-03-31T00:00:00.000Z",
    summary: {},
    report: rows,
    excluded: [],
  });
  assert.match(csv, /PAN Number/);
  assert.match(csv, /Ledger Payable Outstanding/);
  assert.match(csv, /Voucher-only Outstanding/);
  assert.match(csv, /ABCDE1234F/);
  assert.match(csv, /1600\.00/);
});

test("compliance command center services consume persisted report data", async () => {
  const runId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2026-06-05",
    companyName: "Command Center Test Co",
    status: "running",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { fiscalYear: "2026-27", companyName: "Command Center Test Co" },
    creditors: [],
    ledgerVouchers: [],
  });
  const saved = reportRepository.createReport({
    importRunId: runId,
    fiscalYear: "2026-27",
    actor: "unit-test",
    summary: {
      reportVendors: 2,
      pendingVerificationVendors: 1,
      totalDisallowed: 1500,
      totalInterest: 55,
      asOnDate: "2026-06-05",
      applicableAct: "Income Tax Act, 2025",
      applicableSection: "Section 37(2)(g)",
    },
    report: {
      included: [
        {
          vendorName: "Command Supplier",
          udyamNumber: "UDYAM-DL-01-1234567",
          enterpriseType: "Micro",
          ledgerOutstandingAmount: 1500,
          outstandingAmount: 1500,
          disallowed: 1500,
          principalDisallowance43Bh: 1500,
          interest: 55,
          delayDays: 20,
        },
      ],
      excluded: [{ vendorName: "Pending Supplier", reason: "evidence_pending" }],
      schedules: {
        invoiceAging: [{
          vendorName: "Command Supplier",
          invoiceNumber: "CMD-1",
          invoiceDate: "2026-04-01",
          dueDate: "2026-05-16",
          appointedDay: "2026-05-16",
          unpaidAmount: 1500,
          pendingAmount: 1500,
          principalAmount: 1500,
          exposure43Bh: 1500,
          delayDays: 20,
          daysDelayed: 20,
          interest: 55,
          interestAmount: 55,
          allowedPaymentDays: 45,
          agreedPaymentDays: 45,
        }],
        verificationRequired: [{ vendorName: "Pending Supplier", issueType: "evidence" }],
        mcaMsmeForm1Data: [{ supplierName: "Command Supplier", validationStatus: "ready" }],
      },
    },
  });

  const risk = complianceRiskScoreService.getRiskScore(saved.id);
  assert.equal(risk.reportId, saved.id);
  assert.equal(risk.score <= 100, true);
  assert.equal(risk.topRisks.length > 0, true);

  const recommendations = paymentRecommendationService.getPaymentRecommendations(saved.id);
  assert.equal(recommendations.recommendations[0].vendorName, "Command Supplier");
  assert.equal(recommendations.recommendations[0].priority, "Immediate");

  const simulation = paymentSimulatorService.runPaymentSimulation({
    reportId: saved.id,
    scenario: "pay_all_overdue",
    simulationDate: "2026-06-05",
  });
  assert.equal(simulation.simulationOnly, true);
  assert.equal(simulation.disallowanceReduction, 1500);
  assert.equal(simulation.outstandingExposureReduction, 1500);

  const explanation = complianceExplanationService.explain({ reportId: saved.id, explanationType: "tax_impact" });
  assert.match(explanation.outputText, /reviewed by a professional/i);
  assert.match(explanation.outputText, /43B/i);
  assert.match(explanation.outputText, /Tax exposure snapshot/i);
  assert.match(explanation.outputText, /MSME Compliance Report covers FY/i);
  assert.doesNotMatch(explanation.outputText, new RegExp(`Report ${saved.id}`));

  const clientExplanation = complianceExplanationService.explain({ reportId: saved.id, explanationType: "client" });
  const auditorExplanation = complianceExplanationService.explain({ reportId: saved.id, explanationType: "auditor" });
  const mcaExplanation = complianceExplanationService.explain({ reportId: saved.id, explanationType: "mca_impact" });
  assert.match(clientExplanation.outputText, /Business summary/i);
  assert.match(auditorExplanation.outputText, /Audit lens/i);
  assert.match(mcaExplanation.outputText, /MSME-1 filing view/i);
  assert.notEqual(clientExplanation.outputText, auditorExplanation.outputText);
  assert.notEqual(clientExplanation.outputText, explanation.outputText);
  assert.notEqual(mcaExplanation.outputText, explanation.outputText);

  const pack = await auditEvidencePackService.buildAuditEvidencePack(saved.id, { includePdf: false });
  assert.equal(pack.subarray(0, 4).toString("hex"), "504b0304");
  assert.match(pack.toString("latin1"), /computed-report-backup\.json/);
});

test("MCA MSME-1 preview maps report rows to utility buckets and validates PAN", () => {
  const runId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "20250401",
    toDate: "20260331",
    asOn: "2026-03-31",
    companyName: "Test Company",
    status: "running",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { fiscalYear: "2025-26", companyName: "Test Company" },
    creditors: [],
    ledgerVouchers: [
      {
        vendorName: "Paid Late Supplier",
        normalizedVendorName: "PAID LATE SUPPLIER",
        ledgerName: "Paid Late Supplier",
        normalizedLedgerName: "PAID LATE SUPPLIER",
        date: "2025-04-01",
        voucherType: "Purchase",
        voucherNumber: "INV-LATE",
        credit: 1000,
        amount: 1000,
        billReference: "INV-LATE",
      },
      {
        vendorName: "Paid Late Supplier",
        normalizedVendorName: "PAID LATE SUPPLIER",
        ledgerName: "Paid Late Supplier",
        normalizedLedgerName: "PAID LATE SUPPLIER",
        date: "2025-06-01",
        voucherType: "Payment",
        voucherNumber: "PAY-LATE",
        debit: 1000,
        amount: 1000,
        billReference: "INV-LATE",
      },
    ],
  });
  const report = reportRepository.createReport({
    importRunId: runId,
    fiscalYear: "2025-26",
    summary: {},
    report: {
      included: [
        {
          vendorName: "Overdue Supplier",
          normalizedVendorName: "OVERDUE SUPPLIER",
          panNumber: "ABCDE1234F",
          udyamNumber: "UDYAM-DL-01-1234567",
          ledgerOutstandingAmount: 5000,
          outstandingAmount: 5000,
          daysOutstanding: 80,
          delayDays: 35,
        },
        {
          vendorName: "Current Supplier",
          normalizedVendorName: "CURRENT SUPPLIER",
          panNumber: "BCDEF1234G",
          udyamNumber: "UDYAM-DL-01-1234568",
          ledgerOutstandingAmount: 2000,
          outstandingAmount: 2000,
          daysOutstanding: 30,
        },
        {
          vendorName: "Paid Late Supplier",
          normalizedVendorName: "PAID LATE SUPPLIER",
          panNumber: "CDEFG1234H",
          udyamNumber: "UDYAM-DL-01-1234569",
          ledgerOutstandingAmount: 0,
          outstandingAmount: 0,
          voucherOutstandingAmount: 0,
          daysOutstanding: 0,
        },
        {
          vendorName: "Missing PAN Supplier",
          normalizedVendorName: "MISSING PAN SUPPLIER",
          panNumber: "",
          udyamNumber: "UDYAM-DL-01-1234570",
          ledgerOutstandingAmount: 1,
          outstandingAmount: 1,
          daysOutstanding: 50,
        },
      ],
      excluded: [],
      schedules: {
        msmedSection16Interest: [{
          vendorName: "Overdue Supplier",
          invoiceNumber: "OD-1",
          principal: 5000,
          daysDelayed: 35,
          interestAmount: 210,
        }],
      },
    },
    actor: "unit-test",
  });

  const preview = mcaMsme1Service.buildPreview({ reportId: report.id, halfYear: "apr-sep" });
  const overdue = preview.rows.find((row) => row.vendorName === "Overdue Supplier");
  const current = preview.rows.find((row) => row.vendorName === "Current Supplier");
  const paidLate = preview.rows.find((row) => row.vendorName === "Paid Late Supplier");

  assert.equal(overdue.outstandingMoreThan45Count, 1);
  assert.equal(overdue.outstandingMoreThan45Amount, 5000);
  assert.equal(overdue.principalOutstanding, 5000);
  assert.equal(overdue.delayDays, 35);
  assert.equal(overdue.section16Interest, 210);
  assert.equal(current.outstanding45OrLessCount, 1);
  assert.equal(current.outstanding45OrLessAmount, 2000);
  assert.equal(paidLate.paidAfter45Count, 1);
  assert.equal(paidLate.paidAfter45Amount, 1000);
  assert.equal(preview.validation.valid, false);
  assert.equal(preview.validation.errors.some((error) => error.code === "missing_pan"), true);
});

test("MCA MSME-1 generation preserves xlsm workbook structure and VBA", () => {
  const runId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "20250401",
    toDate: "20260331",
    asOn: "2026-03-31",
    companyName: "Test Company",
    status: "running",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { fiscalYear: "2025-26", companyName: "Test Company" },
    creditors: [],
    ledgerVouchers: [],
  });
  const report = reportRepository.createReport({
    importRunId: runId,
    fiscalYear: "2025-26",
    summary: {},
    report: {
      included: [
        {
          vendorName: "Workbook Supplier",
          normalizedVendorName: "WORKBOOK SUPPLIER",
          panNumber: "ABCDE1234F",
          udyamNumber: "UDYAM-DL-01-1234567",
          ledgerOutstandingAmount: 572257,
          voucherOutstandingAmount: 1963057,
          outstandingMismatch: true,
          outstandingAmount: 572257,
          daysOutstanding: 364,
          delayDays: 319,
        },
      ],
      excluded: [],
      schedules: {
        msmedSection16Interest: [{
          vendorName: "Workbook Supplier",
          invoiceNumber: "WB-1",
          principal: 572257,
          daysDelayed: 319,
          interestAmount: 12345,
        }],
      },
    },
    actor: "unit-test",
  });

  const result = mcaMsme1Service.generate({ reportId: report.id, halfYear: "oct-mar", actor: "unit-test" });
  assert.equal(result.success, true);
  assert.equal(result.preview.rows[0].outstandingMoreThan45Amount, 572257);
  assert.equal(result.preview.validation.warnings.some((warning) => warning.code === "ledger_voucher_mismatch"), true);
  const workbook = XLSX.readFile(result.filing.generatedFilePath, { bookVBA: true });
  assert.deepEqual(workbook.SheetNames, ["MetaInfo", "MSME", "Instructions"]);
  assert.equal(Boolean(workbook.vbaraw), true);
  assert.equal(workbook.Sheets.MSME.A5.v, 1);
  assert.equal(workbook.Sheets.MSME.B5.v, "Workbook Supplier");
  assert.equal(workbook.Sheets.MSME.C5.v, "ABCDE1234F");
  assert.equal(workbook.Sheets.MSME.M5.v, 572257);
  assert.equal(workbook.Sheets.MSME.O5.v, 12345);
  assert.equal(workbook.Sheets.MSME.P5.v, 572257);
  assert.equal(workbook.Sheets.MSME.Q5.v, 319);
});

test("MCA MSME-1 Excel upload parser and XML generator validate supplier rows", () => {
  const latestReport = reportRepository.listReports()[0];
  assert.ok(latestReport, "A report fixture must exist before MCA XML test");
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([{
    "Supplier Name": "XML Supplier",
    "PAN": "ABCDE1234F",
    "Udyam Number": "UDYAM-DL-01-1234567",
    "Paid >45 Amount": 1000,
    "Outstanding >45 Amount": 500,
    "Principal Outstanding": 500,
    "Delay Days": 60,
    "Section 16 Interest": 75,
    "Reason For Delay": "Pending reconciliation with supplier",
  }]);
  XLSX.utils.book_append_sheet(workbook, sheet, "MSME");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const uploaded = mcaMsme1Service.uploadExcel({
    reportId: latestReport.id,
    fileName: "mca-upload.xlsx",
    contentBase64: buffer.toString("base64"),
    companyDetails: { cin: "U12345DL2020PLC123456", pan: "ABCDE1234F", companyName: "Test Company" },
    fiscalYear: latestReport.fiscalYear,
    halfYear: "oct-mar",
    actor: "unit-test",
  });
  assert.equal(uploaded.validation.valid, true);
  assert.equal(uploaded.rows[0].supplierName, "XML Supplier");
  const xml = mcaMsme1Service.generateXml({
    filingId: uploaded.filing.id,
    companyDetails: { cin: "U12345DL2020PLC123456", pan: "ABCDE1234F", companyName: "Test Company" },
    actor: "unit-test",
  });
  assert.equal(xml.generated, true);
  const xmlPath = mcaMsme1Service.xmlDownloadPath(xml.generationId);
  const xmlText = fs.readFileSync(xmlPath, "utf8");
  assert.match(xmlText, /<MCA_MSME_FORM_1>/);
  assert.match(xmlText, /<PAN>ABCDE1234F<\/PAN>/);
  assert.match(xmlText, /<PrincipalOutstanding>500\.00<\/PrincipalOutstanding>/);
  assert.match(xmlText, /<DelayDays>60<\/DelayDays>/);
  assert.match(xmlText, /<Section16Interest>75\.00<\/Section16Interest>/);
  fs.unlinkSync(xmlPath);

  const invalid = mcaMsme1Service.validateMcaSupplierRows(
    [{ supplierName: "Invalid Supplier", amountPaidAfter45: 100 }],
    { cin: "U12345DL2020PLC123456", pan: "ABCDE1234F", companyName: "Test Company" },
    { fiscalYear: "2025-26", halfYear: "oct-mar" }
  );
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some((error) => error.field === "panNumber"));
  assert.ok(invalid.errors.some((error) => error.field === "reasonForDelay"));
});

test("MCA MSME-1 assisted filing automation validates readiness and captures manual SRN without secrets", async () => {
  const runId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "20250401",
    toDate: "20260331",
    asOn: "2026-03-31",
    companyName: "Test Company",
    status: "running",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { fiscalYear: "2025-26", companyName: "Test Company" },
    creditors: [],
    ledgerVouchers: [],
  });
  const report = reportRepository.createReport({
    importRunId: runId,
    fiscalYear: "2025-26",
    summary: {},
    report: {
      included: [{
        vendorName: "Automation Supplier",
        normalizedVendorName: "AUTOMATION SUPPLIER",
        panNumber: "ABCDE1234F",
        udyamNumber: "UDYAM-DL-01-1234567",
        ledgerOutstandingAmount: 1000,
        outstandingAmount: 1000,
        daysOutstanding: 90,
        delayDays: 45,
      }],
      excluded: [],
      schedules: {},
    },
    actor: "unit-test",
  });
  const generated = mcaMsme1Service.generate({ reportId: report.id, halfYear: "oct-mar", actor: "unit-test" });
  assert.throws(
    () => mcaFilingAutomationService.validateReadiness(generated.filing.id, {
      mcaUserId: "user",
      mcaPassword: "secret",
      companyDetails: { cin: "", pan: "ABCDE1234F", companyName: "Test Company" },
      signatoryId: "ABCDE1234F",
    }),
    /Company CIN, PAN and company name/
  );
  const ready = mcaFilingAutomationService.validateReadiness(generated.filing.id, {
    mcaUserId: "user",
    mcaPassword: "secret",
    companyDetails: { cin: "U12345DL2020PLC123456", pan: "ABCDE1234F", companyName: "Test Company" },
    signatoryId: "ABCDE1234F",
  });
  assert.equal(ready.id, generated.filing.id);
  assert.deepEqual(mcaFilingAutomationService.halfYearDates("2025-26", "oct-mar"), { start: "01/10/2025", end: "31/03/2026" });
  assert.equal(mcaFilingAutomationService.extractSrn("Payment successful. SRN: F12345678"), "F12345678");

  const run = mcaFilingAutomationService._private.createRun(generated.filing);
  const captured = await mcaFilingAutomationService.captureSrn(run.id, "F12345678");
  assert.equal(captured.run.status, "completed");
  assert.equal(captured.run.srn, "F12345678");
  const saved = mcaMsme1Service.getFiling(generated.filing.id);
  assert.equal(saved.srn, "F12345678");
  const persisted = db.prepare("SELECT * FROM mca_filing_automation_runs WHERE id = ?").get(run.id);
  assert.equal(JSON.stringify(persisted).includes("secret"), false);
  assert.equal(JSON.stringify(mcaFilingAutomationService.getStatus(run.id).events).includes("secret"), false);
});

test("rule engine applies MSME 15-day no-agreement and actual payment rules", () => {
  const result = evaluateVendor({
    party: "Rule Vendor",
    outstandingAmount: 10000,
    daysOutstanding: 75,
    vendorMaster: { isMSME: true, udyamStatus: "verified" },
  });
  assert.equal(result.eligible, true);
  assert.equal(result.allowedPaymentDays, 15);
  assert.equal(result.delayDays, 60);
  assert.equal(result.disallowed, 10000);
  assert.equal(result.appliedRules.includes("MSME-PAYMENT-DUE-015"), true);
  assert.equal(result.appliedRules.includes("ITA-ACTUAL-PAYMENT-037"), true);
  assert.equal(result.appliedRules.includes("ITA-2025-ACTUAL-PAYMENT-037"), false);
  assert.equal(result.bankRatePercent, 5.5);
  assert.equal(result.annualInterestRatePercent, 16.5);
  assert.equal(result.applicableAct, "Income Tax Act, 1961");
  assert.equal(result.applicableSection, "Section 43B(h)");
  assert.ok(result.interest > 0);
});

test("rule engine switches actual-payment rule for FY 2026-27 onwards", () => {
  const result = evaluateVendor(
    {
      party: "FY Rule Vendor",
      outstandingAmount: 10000,
      daysOutstanding: 75,
      vendorMaster: { isMSME: true, udyamStatus: "verified" },
    },
    { fiscalYear: "2026-27" }
  );
  assert.equal(result.appliedRules.includes("ITA-ACTUAL-PAYMENT-037"), false);
  assert.equal(result.appliedRules.includes("ITA-2025-ACTUAL-PAYMENT-037"), true);
  assert.equal(result.actualPaymentRuleId, "ITA-2025-ACTUAL-PAYMENT-037");
  assert.equal(result.applicableAct, "Income Tax Act, 2025");
  assert.equal(result.applicableSection, "Section 37(2)(g)");
});

test("imported payment terms drive MSME allowed payment days", async () => {
  await vendorRepository.importUdyamRowsWithVerification(
    [
      { vendorName: "Terms Fifteen Supplier", udyamNumber: "UDYAM-KA-29-1234567", paymentTerms: "15 days" },
      { vendorName: "Terms Fortyfive Supplier", udyamNumber: "UDYAM-KA-29-1234568", paymentTerms: "45" },
    ],
    "unit-test",
    {
      verifyUdyamNumber: async (udyamNumber) => ({
        udyamNumber,
        verified: true,
        verificationStatus: "verified",
        enterpriseType: "Micro",
      }),
    }
  );
  const fifteen = evaluateVendor({
    party: "Terms Fifteen Supplier",
    outstandingAmount: 1000,
    daysOutstanding: 20,
    vendorMaster: vendorRepository.findByNormalizedName("TERMS FIFTEEN SUPPLIER"),
  });
  const fortyfive = evaluateVendor({
    party: "Terms Fortyfive Supplier",
    outstandingAmount: 1000,
    daysOutstanding: 20,
    vendorMaster: vendorRepository.findByNormalizedName("TERMS FORTYFIVE SUPPLIER"),
  });

  assert.equal(fifteen.allowedPaymentDays, 15);
  assert.equal(fifteen.delayDays, 5);
  assert.equal(fortyfive.allowedPaymentDays, 45);
  assert.equal(fortyfive.delayDays, 0);
});

test("MSME interest calculator returns zero interest when there is no delay", () => {
  const result = calculateMSMEInterest({
    principal: 10000,
    invoiceDate: "2026-04-01",
    asOnDate: "2026-04-10",
  });
  assert.equal(result.daysOutstanding, 9);
  assert.equal(result.allowedPaymentDays, 15);
  assert.equal(result.delayDays, 0);
  assert.equal(result.interest, 0);
  assert.equal(result.totalPayable, 10000);
  assert.equal(result.isDelayed, false);
});

test("RBI Bank Rate parser reads only Bank Rate history rows", () => {
  const html = `
    <h5>Bank Rate</h5>
    From To Bank Rate Penal Interest Rate Total
    05 Dec, 2025 Till Date 5.50% 8% 13.50%
    06 Jun, 2025 04 Dec, 2025 5.75% 8% 13.75%
    Policy Repo Rate : 9.99%
    Reverse Repo Rate : 7.77%
    Standing Deposit Facility Rate : 8.88%
    Marginal Standing Facility Rate : 6.66%
  `;
  const rows = rbiBankRateService.parseBankRateRows(html, "https://www.dicgc.org.in/bank-rate", "2026-06-08T00:00:00.000Z");
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.bankRate), [5.5, 5.75]);
  assert.equal(rows[0].effectiveFromDate, "2025-12-05");
  assert.equal(rows[0].effectiveToDate, null);
});

test("RBI Bank Rate parser requires labelled Bank Rate history columns", () => {
  const html = `
    Policy Repo Rate 01 Jan, 2025 31 Jan, 2025 9.99% 8% 17.99%
    Penal Interest Rate 01 Feb, 2025 28 Feb, 2025 10.25% 8% 18.25%
  `;
  assert.deepEqual(rbiBankRateService.parseBankRateRows(html), []);
});

test("RBI Bank Rate source allowlist rejects non-DICGC history URLs", () => {
  assert.doesNotThrow(() => rbiBankRateService.assertAllowedSource("https://www.dicgc.org.in/bank-rate?page=2"));
  assert.throws(
    () => rbiBankRateService.assertAllowedSource("https://example.com/bank-rate"),
    /Only DICGC Bank Rate history URLs/
  );
  assert.throws(
    () => rbiBankRateService.assertAllowedSource("http://www.dicgc.org.in/bank-rate"),
    /Only HTTPS/
  );
});

test("RBI Bank Rate lookup includes closed-period boundaries without overlap", () => {
  rbiBankRateService.createManualOverride({
    effectiveFromDate: "2025-06-06",
    effectiveToDate: "2025-12-04",
    bankRate: 5.75,
    reason: "Boundary test old slab",
  }, "unit-test");
  rbiBankRateService.createManualOverride({
    effectiveFromDate: "2025-12-05",
    bankRate: 5.5,
    reason: "Boundary test current slab",
  }, "unit-test");
  assert.equal(rbiBankRateService.getRateForDate("2025-06-06").bankRate, 5.75);
  assert.equal(rbiBankRateService.getRateForDate("2025-12-04").bankRate, 5.75);
  assert.equal(rbiBankRateService.getRateForDate("2025-12-05").bankRate, 5.5);
});

test("RBI current-rate cross-check logs mismatch but does not source history", async () => {
  const oldUrls = env.rbiCurrentRateUrls;
  env.rbiCurrentRateUrls = ["https://www.rbi.org.in/current-rates"];
  try {
    const htmlByUrl = {
      "https://www.dicgc.org.in/bank-rate": `
        From To Bank Rate Penal Interest Rate Total
        01 Jan, 2026 Till Date 5.50% 8% 13.50%
      `,
      "https://www.dicgc.org.in/bank-rate?page=2": "",
      "https://www.rbi.org.in/current-rates": "Policy Repo Rate 9.99% SDF Rate 8.88% MSF Rate 7.77% Bank Rate: 6.00%",
    };
    const update = await rbiBankRateService.updateFromOfficialSource({
      actor: "unit-test",
      fetcher: async (url) => htmlByUrl[url] || "",
    });
    assert.equal(update.latest.bankRate, 5.5);
    assert.ok(rbiBankRateService.listAuditLog().some((row) => row.action === "rbi_bank_rate_mismatch"));
  } finally {
    env.rbiCurrentRateUrls = oldUrls;
  }
});

test("RBI Bank Rate official update stores history and manual override audit log", async () => {
  const html = `
    From To Bank Rate Penal Interest Rate Total
    01 Jan, 2024 31 Jan, 2024 6.00% 8% 14.00%
  `;
  const update = await rbiBankRateService.updateFromOfficialSource({
    actor: "unit-test",
    fetcher: async (url) => (url.includes("page=2") ? "" : html),
  });
  assert.equal(update.parsed, 1);
  assert.ok(rbiBankRateService.listRates().some((row) => row.effectiveFromDate === "2024-01-01" && row.bankRate === 6));
  const override = rbiBankRateService.createManualOverride({
    effectiveFromDate: "2024-02-01",
    effectiveToDate: "2024-02-29",
    bankRate: 6.25,
    reason: "RBI circular verified manually for unit test",
  }, "unit-test");
  assert.equal(override.isManualOverride, true);
  assert.equal(rbiBankRateService.getRateForDate("2024-02-15").bankRate, 6.25);
  assert.ok(rbiBankRateService.listAuditLog().some((row) => row.action === "rbi_bank_rate_manual_override" && /unit test/i.test(row.reason)));
});

test("RBI Bank Rate manual override requires a non-empty reason", () => {
  assert.throws(
    () => rbiBankRateService.createManualOverride({
      effectiveFromDate: "2024-03-01",
      bankRate: 6,
      reason: " ",
    }, "unit-test"),
    /reason is required/i
  );
});

test("RBI Bank Rate update returns failure guidance when official fetch fails", async () => {
  await assert.rejects(
    () => rbiBankRateService.updateFromOfficialSource({
      actor: "unit-test",
      fetcher: async () => {
        throw new Error("network unavailable");
      },
    }),
    /RBI rate update failed.*use last verified rate or manual override/
  );
  assert.ok(rbiBankRateService.listAuditLog().some((row) => row.action === "rbi_bank_rate_update_failed"));
});

test("MSME interest uses date-wise Bank Rate periods when delay crosses rate changes", () => {
  rbiBankRateService.createManualOverride({
    effectiveFromDate: "2025-01-01",
    effectiveToDate: "2025-01-31",
    bankRate: 6,
    reason: "January test rate",
  }, "unit-test");
  rbiBankRateService.createManualOverride({
    effectiveFromDate: "2025-02-01",
    effectiveToDate: "2025-02-28",
    bankRate: 5,
    reason: "February test rate",
  }, "unit-test");
  const result = calculateMSMEInterest({
    principal: 10000,
    invoiceDate: "2025-01-01",
    asOnDate: "2025-02-20",
  });
  assert.equal(result.delayDays, 34);
  assert.equal(result.interestRateSource, "manual_override");
  assert.equal(result.ratePeriods.length, 2);
  assert.deepEqual(result.ratePeriods.map((period) => period.bankRatePercent), [6, 5]);
  assert.deepEqual(result.ratePeriods.map((period) => period.toDate), ["2025-01-31", "2025-02-19"]);
  assert.ok(result.interest > 0);
});

test("MSME interest fails clearly when stored Bank Rate history has no matching calculation date", () => {
  db.prepare("DELETE FROM rbi_bank_rates").run();
  seedTestBankRate({ id: "unit-test-closed-rbi-rate", from: "2024-01-01", to: "2024-12-31", rate: 5.5 });
  assert.throws(
    () => calculateMSMEInterest({
      principal: 10000,
      invoiceDate: "2022-12-01",
      asOnDate: "2023-02-01",
    }),
    /No RBI Bank Rate exists for the calculation date/
  );
});

test("MSME interest calculator compounds interest with monthly rests after 45 days", () => {
  db.prepare("DELETE FROM rbi_bank_rates").run();
  seedTestBankRate({ id: "unit-test-default-rbi-rate-after-gap" });
  const result = calculateMSMEInterest({
    principal: 10000,
    invoiceDate: "2026-04-01",
    asOnDate: "2026-06-15",
  });
  assert.equal(result.daysOutstanding, 75);
  assert.equal(result.allowedPaymentDays, 15);
  assert.equal(result.delayDays, 59);
  assert.equal(result.bankRatePercent, 5.5);
  assert.equal(result.annualInterestRate, 0.165);
  assert.equal(result.annualInterestRatePercent, 16.5);
  assert.equal(result.interest, 272.21);
  assert.equal(result.totalPayable, 10272.21);
  assert.equal(result.isDelayed, true);
});

test("MSME interest calculator honors explicit manual annual rate without replacing stored history", () => {
  const result = calculateMSMEInterest({
    principal: 10000,
    invoiceDate: "2026-04-01",
    asOnDate: "2026-06-15",
    annualInterestRate: 0.195,
  });
  assert.equal(result.annualInterestRate, 0.195);
  assert.equal(result.annualInterestRatePercent, 19.5);
  assert.equal(result.interestRateSource, "manual_input");
  assert.equal(result.interest, 322.09);
});

test("MSME interest calculator caps agreed payment days at 45", () => {
  const result = calculateMSMEInterest({
    principal: 5000,
    invoiceDate: "2026-04-01",
    asOnDate: "2026-06-15",
    agreedPaymentDays: 90,
  });
  assert.equal(result.allowedPaymentDays, 45);
  assert.equal(result.delayDays, 29);
});

test("MSME interest calculator validates principal and dates", () => {
  assert.throws(
    () => calculateMSMEInterest({ principal: 0, invoiceDate: "2026-04-01", asOnDate: "2026-06-15" }),
    /principal must be greater than 0/
  );
  assert.throws(
    () => calculateMSMEInterest({ principal: 100, invoiceDate: "", asOnDate: "2026-06-15" }),
    /invoiceDate must be a valid date/
  );
});

test("rule pack exposes local legal sources", () => {
  const pack = loadRulePack();
  assert.equal(pack.rules.some((rule) => rule.id === "MSME-INTEREST-016"), true);
  assert.equal(pack.sources.some((source) => source.id === "ITA_1961"), true);
  assert.equal(pack.sources.some((source) => source.id === "ITA_2025"), true);
  assert.equal(pack.sources.some((source) => source.id === "IT_RULES_2026"), true);
});

test("approved proof vendor is included and rejected proof vendor is excluded", () => {
  const creditors = [
    {
      party: "Approved Vendor",
      normalizedVendorName: "APPROVED",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 500,
      daysOutstanding: 50,
      bucket: "46-60 days",
      vendorMaster: { isMSME: true, udyamStatus: "approved", udyamNumber: "UDYAM-DL-01-1234567", enterpriseType: "Micro" },
    },
    {
      party: "Rejected Vendor",
      normalizedVendorName: "REJECTED",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 700,
      daysOutstanding: 50,
      bucket: "46-60 days",
      vendorMaster: { isMSME: true, udyamStatus: "rejected", udyamNumber: "UDYAM-DL-01-7654321" },
    },
  ];
  const rows = calculateReportRows(creditors);
  const excluded = calculateExcludedRows(creditors);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].vendorName, "Approved Vendor");
  assert.equal(excluded.length, 1);
  assert.equal(excluded[0].reason, "manual_rejected");
});

test("dummy Udyam number is excluded from MSME report", () => {
  const creditors = [
    {
      party: "Dummy Udyam Vendor",
      normalizedVendorName: "DUMMY UDYAM VENDOR",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 1000,
      daysOutstanding: 70,
      bucket: "61-90 days",
      vendorMaster: {
        isMSME: true,
        udyamStatus: "verified",
        verificationStatus: "verified",
        udyamNumber: "UDYAM-XX-00-0000000",
        enterpriseType: "Micro",
      },
    },
  ];
  const rows = calculateReportRows(creditors);
  const excluded = calculateExcludedRows(creditors);
  assert.equal(rows.length, 0);
  assert.equal(excluded.length, 1);
  assert.equal(excluded[0].reason, "invalid_udyam");
});

test("manual fallback vendor is excluded with explicit reason", () => {
  const excluded = calculateExcludedRows([
    {
      party: "Fallback Vendor",
      normalizedVendorName: "FALLBACK",
      parent: "Sundry Creditors",
      groupHierarchy: ["Sundry Creditors"],
      outstandingAmount: 1000,
      daysOutstanding: 80,
      vendorMaster: { isMSME: true, udyamStatus: "manual_fallback_required" },
    },
  ]);
  assert.equal(excluded.length, 1);
  assert.equal(excluded[0].reason, "manual_review_required");
});

test("vendor master seeding preserves verified status and marks zero outstanding as not required", () => {
  vendorRepository.upsertVendorStatus(
    {
      vendorName: "Seed Preserved Supplier",
      isMSME: true,
      verificationStatus: "verified",
      udyamStatus: "verified",
      udyamNumber: "UDYAM-DL-01-1234567",
      enterpriseType: "Small",
    },
    "unit-test",
    "unit_test"
  );
  const runId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2026-06-01",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { selectedFinancialYear: "2026-27", fiscalYear: "2026-27", companyName: "Test Company", creditorsImported: 3 },
    creditors: [
      { party: "Seed Preserved Supplier", normalizedVendorName: "SEED PRESERVED SUPPLIER", parent: "Sundry Creditors", groupHierarchy: ["Sundry Creditors"], outstandingAmount: 100, voucherCount: 1 },
      { party: "Zero Seed Supplier", normalizedVendorName: "ZERO SEED SUPPLIER", parent: "Sundry Creditors", groupHierarchy: ["Sundry Creditors"], outstandingAmount: 0, voucherCount: 0 },
      { party: "Active Seed Supplier", normalizedVendorName: "ACTIVE SEED SUPPLIER", parent: "Sundry Creditors", groupHierarchy: ["Sundry Creditors"], outstandingAmount: 50, voucherCount: 1 },
    ],
    ledgerVouchers: [
      {
        ledgerName: "Active Seed Supplier",
        normalizedLedgerName: "ACTIVE SEED SUPPLIER",
        date: "2026-04-01",
        voucherType: "Purchase",
        voucherNumber: "SEED-1",
        credit: 50,
        amount: 50,
      },
    ],
  });
  const seed = vendorRepository.seedFromImport(runId, importRepository.getCreditors(runId), "unit-test");
  assert.equal(seed.total, 3);
  assert.equal(vendorRepository.findByNormalizedName("SEED PRESERVED SUPPLIER").udyamStatus, "verified");

  const marked = vendorRepository.markZeroOutstandingNotRequired({ importRunId: runId, actor: "unit-test" });
  assert.equal(marked.marked, 1);
  assert.equal(vendorRepository.findByNormalizedName("ZERO SEED SUPPLIER").actionStatus, "not_required_zero_outstanding");
  assert.equal(vendorRepository.findByNormalizedName("ACTIVE SEED SUPPLIER").actionStatus, "pending_action");
});

test("import repository and seeding hide historical non-Sundry creditor rows", () => {
  const runId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2026-06-01",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { selectedFinancialYear: "2026-27", fiscalYear: "2026-27", companyName: "Test Company", creditorsImported: 2 },
    creditors: [
      {
        party: "Good Sundry Supplier",
        normalizedVendorName: "GOOD SUNDRY SUPPLIER",
        parent: "Sundry Creditors",
        groupHierarchy: ["Sundry Creditors"],
        detectionReasons: ["creditor_parent_or_ancestor"],
        outstandingAmount: 100,
        voucherCount: 1,
      },
      {
        party: "Purchase",
        normalizedVendorName: "PURCHASE",
        parent: "Purchase Accounts",
        groupHierarchy: ["Purchase Accounts"],
        detectionReasons: ["bill_wise_enabled", "payable_balance"],
        outstandingAmount: 999,
        voucherCount: 1,
      },
    ],
    ledgerVouchers: [
      { ledgerName: "Good Sundry Supplier", normalizedLedgerName: "GOOD SUNDRY SUPPLIER", date: "2026-04-01", voucherType: "Purchase", voucherNumber: "GOOD-1", credit: 100, amount: 100 },
      { ledgerName: "Purchase", normalizedLedgerName: "PURCHASE", date: "2026-04-01", voucherType: "Purchase", voucherNumber: "BAD-1", credit: 999, amount: 999 },
    ],
  });

  const creditors = importRepository.getCreditors(runId);
  assert.deepEqual(creditors.map((creditor) => creditor.party), ["Good Sundry Supplier"]);
  assert.deepEqual(importRepository.getAllLedgerVouchers(runId).map((row) => row.ledgerName), ["Good Sundry Supplier"]);
  assert.deepEqual(importRepository.getIgnoredNonSundryCreditors(runId).map((row) => row.party), ["Purchase"]);
  const seed = vendorRepository.seedFromImport(runId, creditors, "unit-test");
  assert.equal(seed.total, 1);
  assert.equal(vendorRepository.findByNormalizedName("GOOD SUNDRY SUPPLIER").actionStatus, "pending_action");
  assert.equal(vendorRepository.findByNormalizedName("PURCHASE"), null);
});

test("import repository excludes historical rows with missing lineage", () => {
  const runId = importRepository.createRun({
    fiscalYear: "2026-27",
    fromDate: "20260401",
    toDate: "20270331",
    asOn: "2026-06-01",
    companyName: "Test Company",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, {
    summary: { selectedFinancialYear: "2026-27", fiscalYear: "2026-27", companyName: "Test Company", creditorsImported: 1 },
    creditors: [
      {
        party: "Legacy Missing Parent",
        normalizedVendorName: "LEGACY MISSING PARENT",
        outstandingAmount: 999,
        voucherCount: 1,
      },
    ],
    ledgerVouchers: [
      { ledgerName: "Legacy Missing Parent", normalizedLedgerName: "LEGACY MISSING PARENT", date: "2026-04-01", voucherType: "Purchase", voucherNumber: "LEG-1", credit: 999, amount: 999 },
    ],
  });

  assert.equal(importRepository.getCreditors(runId).length, 0);
  assert.equal(importRepository.getAllLedgerVouchers(runId).length, 0);
  assert.deepEqual(importRepository.getIgnoredNonSundryCreditors(runId).map((row) => row.party), ["Legacy Missing Parent"]);
});

test("CSV Udyam import creates manual-review queue rows", () => {
  vendorRepository.upsertVendorStatus(
    { vendorName: "CSV Matched Supplier", isMSME: false, verificationStatus: "pending", udyamStatus: "not_started" },
    "unit-test",
    "unit_test"
  );
  const summary = vendorRepository.importUdyamRows(
    [
      {
        vendorName: "CSV Matched Supplier",
        udyamNumber: "UDYAM-DL-01-7654321",
        paymentTerms: "15 days",
        enterpriseType: "Micro",
        evidenceUrl: "https://example.test/proof",
        notes: "Proof received",
      },
      {
        vendorName: "CSV Unmatched Supplier",
        udyamNumber: "UDYAM-DL-01-7654322",
        paymentTerms: "45",
        enterpriseType: "Small",
      },
    ],
    "unit-test"
  );
  assert.equal(summary.matched, 1);
  assert.equal(summary.unmatched, 1);
  const matched = vendorRepository.findByNormalizedName("CSV MATCHED SUPPLIER");
  assert.equal(matched.actionStatus, "manual_review");
  assert.equal(matched.evidenceUrl, "https://example.test/proof");
  assert.equal(matched.agreedPaymentDays, 15);
  assert.equal(vendorRepository.getVerificationQueue().some((vendor) => vendor.vendorName === "CSV Matched Supplier"), true);
});

test("Excel Udyam import auto-verifies valid rows and updates vendor master", async () => {
  vendorRepository.upsertVendorStatus(
    { vendorName: "Excel Verified Supplier", isMSME: false, verificationStatus: "pending", udyamStatus: "not_started" },
    "unit-test",
    "unit_test"
  );
  const summary = await vendorRepository.importUdyamRowsWithVerification(
    [{ vendorName: "Excel Verified Supplier", udyamNumber: "UDYAM-DL-01-7654321", paymentTerms: "15 days" }],
    "unit-test",
    {
      sourceFileName: "udyam.xlsx",
      verifyUdyamNumber: async (udyamNumber) => ({
        udyamNumber,
        verified: true,
        verificationStatus: "verified",
        enterpriseName: "Excel Verified Enterprise",
        enterpriseType: "Small",
        registrationValidity: "Active",
        registrationDate: "2024-04-01",
        verifiedAt: "2026-05-21T00:00:00.000Z",
      }),
    }
  );

  assert.equal(summary.imported, 1);
  assert.equal(summary.verified, 1);
  assert.equal(summary.failed, 0);
  const vendor = vendorRepository.findByNormalizedName("EXCEL VERIFIED SUPPLIER");
  assert.equal(vendor.udyamStatus, "verified");
  assert.equal(vendor.actionStatus, "verified_msme");
  assert.equal(vendor.udyamNumber, "UDYAM-DL-01-7654321");
  assert.equal(vendor.enterpriseName, "Excel Verified Enterprise");
  assert.equal(vendor.enterpriseType, "Small");
  assert.equal(vendor.agreedPaymentDays, 15);
});

test("Excel Udyam import accepts three-column template headers and Udhyam alias", async () => {
  const summary = await vendorRepository.importUdyamRowsWithVerification(
    [{ "Vendor Name": "Three Column Supplier", "Udhyam Number": "UDYAM-GJ-24-1234567", "Payment Terms": "45 days" }],
    "unit-test",
    {
      sourceFileName: "three-column-template.xlsx",
      verifyUdyamNumber: async (udyamNumber) => ({
        udyamNumber,
        verified: true,
        verificationStatus: "verified",
        enterpriseName: "Three Column Supplier",
        enterpriseType: "Micro",
      }),
    }
  );

  assert.equal(summary.imported, 1);
  assert.equal(summary.verified, 1);
  assert.equal(summary.failed, 0);
  const vendor = vendorRepository.findByNormalizedName("THREE COLUMN SUPPLIER");
  assert.equal(vendor.udyamNumber, "UDYAM-GJ-24-1234567");
  assert.equal(vendor.udyamStatus, "verified");
  assert.equal(vendor.agreedPaymentDays, 45);
});

test("Excel Udyam import rejects missing mandatory values and invalid optional terms", async () => {
  const summary = await vendorRepository.importUdyamRowsWithVerification(
    [
      { vendorName: "", udyamNumber: "UDYAM-DL-01-7654321" },
      { vendorName: "Invalid Excel Supplier", udyamNumber: "ABC", paymentTerms: "45" },
      { vendorName: "Missing Udyam Supplier", udyamNumber: "", paymentTerms: "15" },
      { vendorName: "Invalid Terms Supplier", udyamNumber: "UDYAM-DL-01-7654323", paymentTerms: "30" },
    ],
    "unit-test",
    {
      verifyUdyamNumber: async () => {
        throw new Error("Verifier should not run for invalid rows");
      },
    }
  );

  assert.equal(summary.imported, 4);
  assert.equal(summary.failed, 4);
  assert.equal(summary.verified, 0);
  assert.equal(summary.results[0].reason, "vendorName is required");
  assert.equal(summary.results[1].reason, "invalid_udyam_format");
  assert.equal(summary.results[2].reason, "udyamNumber is required");
  assert.equal(summary.results[3].reason, "paymentTerms must be 15 or 45 days when provided");
  const invalid = vendorRepository.findByNormalizedName("INVALID EXCEL SUPPLIER");
  assert.equal(invalid.udyamStatus, "invalid_format");
  assert.equal(invalid.actionStatus, "failed");
});

test("Excel Udyam import defaults missing payment terms to 45 days", async () => {
  const summary = await vendorRepository.importUdyamRowsWithVerification(
    [{ "Vendor Name": "Two Column Supplier", "Udyam Number": "UDYAM-DL-07-1234567" }],
    "unit-test",
    {
      sourceFileName: "two-column-template.xlsx",
      verifyUdyamNumber: async (udyamNumber) => ({
        udyamNumber,
        verified: true,
        verificationStatus: "verified",
        enterpriseName: "Two Column Supplier",
        enterpriseType: "Micro",
      }),
    }
  );

  assert.equal(summary.imported, 1);
  assert.equal(summary.verified, 1);
  assert.equal(summary.failed, 0);
  const vendor = vendorRepository.findByNormalizedName("TWO COLUMN SUPPLIER");
  assert.equal(vendor.udyamStatus, "verified");
  assert.equal(vendor.agreedPaymentDays, 45);
});

test("Excel Udyam import preserves valid number when portal needs manual review", async () => {
  const summary = await vendorRepository.importUdyamRowsWithVerification(
    [{ vendorName: "Captcha Excel Supplier", udyamNumber: "UDYAM-MH-27-1234567", paymentTerms: "45", notes: "Imported by CA" }],
    "unit-test",
    {
      sourceFileName: "captcha.xlsx",
      verifyUdyamNumber: async (udyamNumber) => ({
        udyamNumber,
        verified: false,
        verificationStatus: "manual_fallback_required",
        error: "Udyam portal requires captcha/manual verification.",
      }),
    }
  );

  assert.equal(summary.imported, 1);
  assert.equal(summary.manualReview, 1);
  assert.equal(summary.unmatched, 1);
  const vendor = vendorRepository.findByNormalizedName("CAPTCHA EXCEL SUPPLIER");
  assert.equal(vendor.udyamNumber, "UDYAM-MH-27-1234567");
  assert.equal(vendor.udyamStatus, "manual_fallback_required");
  assert.equal(vendor.actionStatus, "manual_review");
  assert.equal(vendor.agreedPaymentDays, 45);
  assert.match(vendor.udyamRemarks, /captcha/i);
});

test("Excel Udyam import verifies through fallback by PAN when live portal fails", async () => {
  const oldFallbackPath = env.udyamFallbackDataPath;
  const fallbackDir = path.join(__dirname, "..", "data", "test-fallback-pan");
  fs.mkdirSync(fallbackDir, { recursive: true });
  const workbookPath = path.join(fallbackDir, "Udyam_no.xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Vendor Name", "Udyam Number", "Payment Terms", "PAN no", "Enterprise Type"],
      ["Registered PAN Supplier", "UDYAM-DL-01-1111111", "45 days", "ABCDE1234F", "Small"],
    ]),
    "Udyam Import"
  );
  XLSX.writeFile(workbook, workbookPath);

  env.udyamFallbackDataPath = fallbackDir;
  udyamFallbackService.loadFallbackData(true);
  try {
    const summary = await vendorRepository.importUdyamRowsWithVerification(
      [{ vendorName: "Ledger Alias Supplier", udyamNumber: "UDYAM-DL-01-2222222", paymentTerms: "45", panNumber: "ABCDE1234F" }],
      "unit-test",
      {
        verifyUdyamNumber: async (udyamNumber) => ({
          udyamNumber,
          verified: false,
          verificationStatus: "manual_fallback_required",
          error: "Portal unavailable",
        }),
      }
    );

    assert.equal(summary.verified, 1);
    assert.equal(summary.fallbackVerified, 1);
    const vendor = vendorRepository.findByNormalizedName("LEDGER ALIAS SUPPLIER");
    assert.equal(vendor.isMSME, true);
    assert.equal(vendor.udyamStatus, "verified");
    assert.equal(vendor.verificationSource, "fallback_upload");
    assert.equal(vendor.udyamNumber, "UDYAM-DL-01-1111111");
    assert.equal(vendor.enterpriseType, "Small");
  } finally {
    env.udyamFallbackDataPath = oldFallbackPath;
    udyamFallbackService.loadFallbackData(true);
  }
});

test("Udyam fallback matches evidence-only PDF filenames by compact vendor name", () => {
  const oldFallbackPath = env.udyamFallbackDataPath;
  const fallbackDir = path.join(__dirname, "..", "data", "test-fallback-pdf");
  fs.mkdirSync(fallbackDir, { recursive: true });
  fs.writeFileSync(path.join(fallbackDir, "hlsl.pdf"), "%PDF-1.4\n");

  env.udyamFallbackDataPath = fallbackDir;
  udyamFallbackService.loadFallbackData(true);
  try {
    const match = udyamFallbackService.findFallback({
      vendorName: "H L S L Services Private Limited",
      udyamNumber: "UDYAM-DL-01-3333333",
    });
    assert.equal(match.matchedBy, "vendor_name");
    assert.match(match.evidencePath, /hlsl\.pdf$/i);
    assert.equal(match.enterpriseType, "Micro");
  } finally {
    env.udyamFallbackDataPath = oldFallbackPath;
    udyamFallbackService.loadFallbackData(true);
  }
});

test("Excel Udyam import keeps failed live verification out of verified MSME report path", async () => {
  const oldFallbackPath = env.udyamFallbackDataPath;
  const emptyFallbackDir = path.join(__dirname, "..", "data", "test-fallback-empty");
  fs.mkdirSync(emptyFallbackDir, { recursive: true });
  env.udyamFallbackDataPath = emptyFallbackDir;
  udyamFallbackService.loadFallbackData(true);
  try {
    const summary = await vendorRepository.importUdyamRowsWithVerification(
      [{ vendorName: "No Fallback Supplier", udyamNumber: "UDYAM-MH-27-7654321", paymentTerms: "45" }],
      "unit-test",
      {
        verifyUdyamNumber: async (udyamNumber) => ({
          udyamNumber,
          verified: false,
          verificationStatus: "manual_fallback_required",
          error: "Portal unavailable",
        }),
      }
    );

    assert.equal(summary.verified, 0);
    assert.equal(summary.manualReview, 1);
    const vendor = vendorRepository.findByNormalizedName("NO FALLBACK SUPPLIER");
    assert.equal(vendor.isMSME, false);
    assert.equal(vendor.udyamStatus, "manual_fallback_required");
    assert.equal(vendor.actionStatus, "manual_review");
  } finally {
    env.udyamFallbackDataPath = oldFallbackPath;
    udyamFallbackService.loadFallbackData(true);
  }
});

test("Udyam import verification emits live activity events", async () => {
  const events = [];
  const summary = await vendorRepository.importUdyamRowsWithVerification(
    [{ vendorName: "Live Log Supplier", udyamNumber: "UDYAM-TN-33-1234567", paymentTerms: "15" }],
    "unit-test",
    {
      onEvent: (event) => events.push(event),
      verifyUdyamNumber: async (udyamNumber) => ({
        udyamNumber,
        verified: true,
        verificationStatus: "verified",
        enterpriseType: "Small",
      }),
    }
  );

  assert.equal(summary.verified, 1);
  assert.equal(events.some((event) => event.type === "import_started"), true);
  assert.equal(events.some((event) => event.type === "row_started"), true);
  assert.equal(events.some((event) => event.type === "portal_result_verified"), true);
  assert.equal(events.some((event) => event.type === "import_completed"), true);
});

test("vendor repository writes audit log on status save", () => {
  const vendor = vendorRepository.upsertVendorStatus(
    { vendorName: "Audit Vendor", isMSME: false, verificationStatus: "not_msme" },
    "tester@example.com",
    "unit_test"
  );
  const audit = vendorRepository.getAuditTrail();
  assert.equal(vendor.verificationStatus, "not_msme");
  assert.equal(audit.some((entry) => entry.vendorId === vendor.id && entry.changedBy === "tester@example.com"), true);
});

test("purchase invoice repository stores invoice intake records", () => {
  const vendor = vendorRepository.upsertVendorStatus(
    { vendorName: "Invoice Vendor", isMSME: false, verificationStatus: "pending", udyamStatus: "not_started" },
    "tester@example.com",
    "unit_test"
  );
  const invoice = purchaseInvoiceRepository.createInvoice(
    {
      vendorId: vendor.id,
      vendorName: "Invoice Vendor Pvt Ltd",
      invoiceNumber: "PI-001",
      invoiceDate: "2026-04-01",
      invoiceAmount: 1200,
      outstandingAmount: 900,
      source: "manual",
      udyamNumber: "UDYAM-DL-01-1234567",
      udyamStatus: "not_started",
    },
    "tester@example.com"
  );
  assert.equal(invoice.normalizedVendorName, "INVOICE VENDOR");
  assert.equal(invoice.outstandingAmount, 900);
  assert.equal(purchaseInvoiceRepository.listInvoices({ query: "PI-001" }).length, 1);
});

test("tax audit schema loader exposes official 3CA and 3CB roots", () => {
  const threeCa = taxAuditSchemaService.metadata("3CA");
  const threeCb = taxAuditSchemaService.metadata("3CB");
  assert.equal(threeCa.rootKey, "FORM3CA");
  assert.equal(threeCb.rootKey, "FORM3CB");
  assert.ok(threeCa.allowedFields.reportBody.includes("PartA"));
  assert.ok(threeCb.allowedFields.reportBody.includes("Form3cdUnpaidStrySec43b"));
});

test("tax audit report builds schema-aligned 3CB JSON and MSME clause totals", () => {
  const runId = importRepository.createRun({
    fiscalYear: "2025-26",
    fromDate: "2025-04-01",
    toDate: "2026-03-31",
    asOn: "2026-03-31",
    companyName: "Tax Audit Test Co",
    actor: "unit-test",
  });
  importRepository.completeRun(runId, { summary: { fiscalYear: "2025-26", companyName: "Tax Audit Test Co" }, creditors: [], ledgerVouchers: [] });
  const msmeReport = reportRepository.createReport({
    importRunId: runId,
    fiscalYear: "2025-26",
    summary: { selectedFinancialYear: "2025-26", totalDisallowed: 1000 },
    report: {
      included: [],
      excluded: [],
      schedules: {
        clause22Computation: [{
          supplier: "MSME Vendor",
          totalPurchasesFromMicroSmall: 2500,
          amountPaidDuringYear: 1500,
          clause22iiiBOutstandingDisallowance: 1000,
          interestUnderSection16: 120,
        }],
        clause43BhFromClause22: [{
          supplier: "MSME Vendor",
          vendorName: "MSME Vendor",
          principalDisallowance: 1000,
          sourceClause: "Clause 22(iii)(b)",
          allowedInYear: "Year of actual payment",
        }],
      },
    },
    actor: "unit-test",
  });
  let taxReport = taxAuditReportService.createReport({ msmeReportId: msmeReport.id, formType: "3CB", actor: "unit-test" });
  taxReport = taxAuditReportService.updateDetails(taxReport.id, "assessee", {
    name: "Tax Audit Test Co",
    pan: "ABCDE1234F",
    address: "1 Test Street",
    city: "Mumbai",
    stateCode: 27,
    pinCode: 400001,
    status: "Company",
    statusCode: 5,
  }, "unit-test");
  taxReport = taxAuditReportService.updateDetails(taxReport.id, "auditor", {
    caName: "Audit User",
    firmName: "Audit Firm",
    membershipNumber: "123456",
    frn: "123456W",
    address: "2 Audit Street",
    city: "Mumbai",
    stateCode: 27,
    pinCode: 400002,
    place: "Mumbai",
    date: "2026-03-31",
  }, "unit-test");
  const payload = taxAuditReportService.buildOfficialJson(taxReport.id);
  assert.ok(payload.FORM3CB.F3CB);
  assert.equal(payload.FORM3CB.F3CB.Form3cdUnpaidStrySec43b[0].Amount, 1000);
  const refreshed = taxAuditReportService.getReport(taxReport.id);
  assert.equal(refreshed.clauses.find((clause) => clause.clauseNo === "22").amount, 1000);
  assert.equal(refreshed.clauses.find((clause) => clause.clauseNo === "26").amount, 1000);
  assert.equal(refreshed.annexures.find((item) => item.annexureType === "clause26").sourceSchedule, "schedules.clause43BhFromClause22");
  assert.equal(refreshed.validation.filter((item) => item.severity === "error").length, 0);
});

test("tax audit clause edit creates audit trail and rejects unknown schema fields", () => {
  const invalid = taxAuditSchemaService.validateJson("3CA", { FORM3CA: { F3CA: { UnknownField: true } } });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some((error) => error.code === "SCHEMA_UNKNOWN_FIELD" || error.code === "SCHEMA_REQUIRED"));
  const report = taxAuditReportService.listReports()[0];
  const updated = taxAuditReportService.updateClause(report.id, "10", { remarks: "Reviewed nature of business", reviewStatus: "reviewed" }, "unit-test", "unit test edit");
  assert.ok(updated.editLog.some((entry) => entry.fieldName === "remarks" && entry.comment === "unit test edit"));
});

test.after(() => {
  db.close();
  const file = path.resolve(process.cwd(), process.env.DATABASE_PATH);
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.unlinkSync(`${file}${suffix}`);
    } catch {
      // ignored
    }
  }
});

