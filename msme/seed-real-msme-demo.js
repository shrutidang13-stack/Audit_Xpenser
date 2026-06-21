const importRepository = require('./backend/repositories/importRepository');
const vendorRepository = require('./backend/repositories/vendorRepository');
const { normalizeVendorName } = require('./backend/utils/normalizeVendorName');

const actor = 'codex-demo';
const fiscalYear = '2025-26';
const fromDate = '20250401';
const toDate = '20260331';
const asOn = '2026-03-31';
const companyName = 'Nxtmobility Energy Private Limited';
const vendors = [
  ['Alpha Micro Components', 'UDYAM-DL-01-1234567', 'Micro', 'ABCDE1234F', 125000, 86, '2025-12-01', -125000],
  ['Beta Small Services', 'UDYAM-MH-02-7654321', 'Small', 'PQRST6789L', 78000, 41, '2026-02-20', -78000],
  ['Gamma Micro Logistics', 'UDYAM-KA-03-2345678', 'Micro', 'LMNOP2345Q', 56000, 67, '2026-01-10', -56000],
].map(([vendorName, udyamNumber, enterpriseType, panNumber, outstandingAmount, daysOutstanding, oldestInvoiceDate, closingBalance]) => ({ vendorName, udyamNumber, enterpriseName: vendorName, enterpriseType, panNumber, outstandingAmount, daysOutstanding, oldestInvoiceDate, closingBalance }));
for (const vendor of vendors) {
  vendorRepository.upsertVendorStatus({ vendorName: vendor.vendorName, isMSME: true, udyamNumber: vendor.udyamNumber, enterpriseName: vendor.enterpriseName, enterpriseType: vendor.enterpriseType, panNumber: vendor.panNumber, agreedPaymentDays: 45, verificationStatus: 'verified', udyamStatus: 'verified', registrationValidity: 'Active', registrationDate: '2021-06-15', verifiedAt: new Date().toISOString(), lastVerifiedAt: new Date().toISOString(), verificationSource: 'codex_seeded_demo', evidenceUrl: 'https://udyamregistration.gov.in/', reviewStatus: 'approved', approvedBy: actor, approvedAt: new Date().toISOString() }, actor, 'codex_seeded_demo');
}
const importRunId = importRepository.createRun({ fiscalYear, periodType: 'financial_year', fromDate, toDate, asOn, companyName, status: 'running', actor });
const creditors = vendors.map((vendor) => ({ party: vendor.vendorName, normalizedVendorName: normalizeVendorName(vendor.vendorName), outstandingAmount: vendor.outstandingAmount, ledgerOutstandingAmount: vendor.outstandingAmount, voucherOutstandingAmount: vendor.outstandingAmount, openingBalance: 0, closingBalance: vendor.closingBalance, closingBalanceRaw: `Cr ${vendor.outstandingAmount}`, payableBalance: true, panNumber: vendor.panNumber, udyamNumber: vendor.udyamNumber, agreedPaymentDays: 45, daysOutstanding: vendor.daysOutstanding, bucket: vendor.daysOutstanding > 45 ? 'Over 45 days' : '31-45 days', delayed: vendor.daysOutstanding > 45, interestLiability: 0, disallowanceAmount: vendor.daysOutstanding > 45 ? vendor.outstandingAmount : 0, oldestInvoiceDate: vendor.oldestInvoiceDate, parent: 'Sundry Creditors', groupHierarchy: ['Sundry Creditors'], detectionReasons: ['creditor_parent_or_ancestor', 'current_period_activity'], raw: { parent: 'Sundry Creditors', groupHierarchy: ['Sundry Creditors'] } }));
function voucher(vendorName, opts) { return { vendorName, ledgerName: vendorName, normalizedVendorName: normalizeVendorName(vendorName), normalizedLedgerName: normalizeVendorName(vendorName), partyLedgerName: vendorName, date: opts.date, invoiceDate: opts.invoiceDate || opts.date, acceptanceDate: opts.acceptanceDate || opts.invoiceDate || opts.date, voucherType: opts.voucherType || 'Purchase', voucherNumber: opts.voucherNumber, billReference: opts.billReference || opts.voucherNumber, particulars: opts.particulars || 'Purchase', debit: opts.debit || 0, credit: opts.credit || 0, amount: opts.amount, pendingAmount: opts.pendingAmount ?? opts.amount, ledgerParent: opts.ledgerParent || 'Sundry Creditors', groupHierarchy: opts.groupHierarchy || ['Sundry Creditors'], voucherSource: 'Seeded Day Book', asOnDate: asOn, reportFromDate: fromDate, reportToDate: toDate, financialYear: fiscalYear, fyStartDate: fromDate, fyEndDate: toDate }; }
const ledgerVouchers = [
  voucher('Alpha Micro Components', { date: '2025-12-01', voucherNumber: 'AMC-001', particulars: 'Raw material purchase', credit: 125000, amount: 125000 }),
  voucher('Beta Small Services', { date: '2026-02-20', voucherNumber: 'BSS-009', particulars: 'Job work service', credit: 78000, amount: 78000 }),
  voucher('Beta Small Services', { date: '2026-03-10', voucherType: 'Payment', voucherNumber: 'PAY-BSS-001', billReference: 'BSS-009', particulars: 'Partial payment', debit: 22000, amount: 22000, pendingAmount: 78000 }),
  voucher('Gamma Micro Logistics', { date: '2026-01-10', voucherNumber: 'GML-014', particulars: 'Freight and logistics expense', credit: 56000, amount: 56000, ledgerParent: 'Indirect Expenses', groupHierarchy: ['Indirect Expenses'] }),
];
importRepository.completeRun(importRunId, { summary: { fiscalYear, selectedFinancialYear: fiscalYear, periodType: 'financial_year', fromDate, toDate, asOn, companyName, creditorsImported: creditors.length, vouchersParsed: ledgerVouchers.length, ledgerVouchersFetched: ledgerVouchers.length, voucherSource: 'Seeded Day Book', financialYears: [fiscalYear], financialYearPeriods: [{ financialYear: fiscalYear, fyStartDate: fromDate, fyEndDate: toDate, reportFromDate: fromDate, reportToDate: toDate, asOnDate: asOn, cappedByAsOn: false }], statementSummary: { sundryCreditors: creditors.length } }, creditors, ledgerVouchers });
vendorRepository.seedFromImport(importRunId, importRepository.getCreditors(importRunId), actor);
console.log(JSON.stringify({ importRunId, creditors: creditors.length, vouchers: ledgerVouchers.length }, null, 2));
