const CLAUSE_TITLES = {
  1: "Name of the assessee",
  2: "Address",
  3: "Permanent Account Number",
  4: "Indirect tax registration details",
  5: "Status",
  6: "Previous year",
  7: "Assessment year",
  8: "Relevant clause of section 44AB",
  9: "Firm/AOP partner or member details",
  10: "Nature of business or profession",
  11: "Books of account and locations",
  12: "Presumptive taxation",
  13: "Method of accounting",
  14: "Method of valuation of closing stock",
  15: "Capital asset converted into stock-in-trade",
  16: "Amounts not credited to profit and loss account",
  17: "Land or building transfer reporting",
  18: "Depreciation allowance",
  19: "Amounts admissible under specified sections",
  20: "Employee contributions and bonus/commission",
  21: "Amounts debited to profit and loss account",
  22: "Interest inadmissible under MSMED Act",
  23: "Payments to persons specified under section 40A(2)(b)",
  24: "Deemed profits and gains",
  25: "Amounts chargeable under section 41",
  26: "Statutory liabilities covered by actual payment rule",
  27: "CENVAT/Input tax credit and prior period items",
  28: "Shares received without/inadequate consideration",
  29: "Income from issue of shares over fair market value",
  30: "Hundi borrowing or repayment",
  31: "Loans, deposits, specified sums and cash receipts/payments",
  32: "Brought forward loss or depreciation",
  33: "Deductions under Chapter VIA/Chapter III",
  34: "TDS/TCS compliance",
  35: "Quantitative details",
  36: "Dividend distribution tax",
  "36A": "Deemed dividend reporting",
  37: "Cost audit",
  38: "Audit under Central Excise Act",
  39: "Service tax audit",
  40: "Accounting ratios",
  41: "Demand or refund under tax laws",
  42: "Statements in Form 61/61A/61B",
  43: "Country-by-country reporting",
  44: "GST expenditure breakup",
};

const SCHEMA_KEYS = {
  4: "Form3cdIndirectTax",
  9: "Form3cdFirmAopDetailNew",
  10: "Form3CDNatureOfBus",
  11: "Form3cdBooksOfAccLst",
  12: "Form3cdProfGainsPresum",
  13: "Form3cdChngMethAccVal",
  14: "MethodValCS",
  15: "Form3cdCapAsstSit",
  16: "Form3cdAmtNotCredit",
  17: "Form3cdLandBuildProperty",
  18: "Form3cdDeprAllw",
  19: "Form3cdDebitPlTotAllw",
  20: "Form3cdEmpBonusComm",
  21: "Form3cdDebPLExpnditure",
  22: "Form3cdFlags.SubClauseeofClause22",
  23: "Form3cdPymtSec40a2bDetail",
  24: "Form3cdAmtDeemdProfGains",
  25: "Form3cdProfGainsTaxSec41",
  26: "Form3cdUnpaidStrySec43b",
  27: "Form3cdModvat",
  28: "Form3cdSec562viia",
  29: "Form3cdSec562viib",
  30: "Form3cdSec69d",
  31: "Form3cdSec269SSDtls",
  32: "Form3cdBflDa",
  33: "Form3cdChapVIaChapIII",
  34: "Form3cdChapXVII",
  35: "Form3cdTradeRawProdDet",
  36: "Form3cdDistribtedProf115O",
  "36A": "Form3cd36BRecievedAmt",
  37: "CostAudit",
  38: "AuditExcise",
  39: "AuditSec72",
  40: "Form3cdAccountingRatioCalculations",
  41: "Form3cdRefundDmdPrevYr",
  42: "Form3cdFurnishStatemnt",
  43: "Form3cdFurnishAltReportSec286",
  44: "Form3cdBreakUpGST",
};

function sourceTypeFor(clauseNo) {
  if (["1", "2", "3", "5", "6", "7", "8"].includes(String(clauseNo))) return "hybrid";
  if (String(clauseNo) === "22" || String(clauseNo) === "26") return "auto";
  if (["4", "10", "11", "40", "44"].includes(String(clauseNo))) return "hybrid";
  return "manual";
}

function initialReviewStatus(sourceType) {
  return sourceType === "auto" ? "auto_filled" : "requires_review";
}

function listClauses() {
  return Object.entries(CLAUSE_TITLES).map(([clauseNo, title]) => {
    const sourceType = sourceTypeFor(clauseNo);
    return {
      clauseNo: String(clauseNo),
      title,
      schemaKey: SCHEMA_KEYS[clauseNo] || "",
      sourceType,
      status: sourceType === "manual" ? "na" : "yes",
      amount: 0,
      remarks: sourceType === "manual" ? "Requires CA review." : "",
      annexureRef: "",
      evidenceRef: "",
      reviewStatus: initialReviewStatus(sourceType),
      payload: {},
    };
  });
}

function getClause(clauseNo) {
  return listClauses().find((clause) => clause.clauseNo === String(clauseNo)) || null;
}

module.exports = { listClauses, getClause };
