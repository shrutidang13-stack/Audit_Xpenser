const { normalizeVendorName } = require("../utils/normalizeVendorName");
const { isSundryCreditorGroupName } = require("../utils/sundryCreditor");

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeGroupName(name) {
  return String(name || "").trim().toUpperCase().replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ");
}

function ledgerKey(name) {
  return normalizeVendorName(name || "");
}

function ledgerMapFromMetadata(ledgerMetadata = []) {
  return new Map((ledgerMetadata || []).filter((ledger) => ledger.name).map((ledger) => [ledgerKey(ledger.name), ledger]));
}

function attachLedgerMetadata(vouchers = [], ledgerMetadata = []) {
  const ledgers = ledgerMapFromMetadata(ledgerMetadata);
  return vouchers.map((row) => {
    const ledger = ledgers.get(ledgerKey(row.ledgerName)) || {};
    return {
      ...row,
      ledgerParent: ledger.parent || row.ledgerParent || "",
      groupHierarchy: ledger.groupHierarchy || row.groupHierarchy || [],
      ledgerOpeningBalance: Number(ledger.openingBalance || 0),
      ledgerClosingBalance: Number(ledger.closingBalance || 0),
      ledgerOpeningBalanceRaw: ledger.openingBalanceRaw || "",
      ledgerClosingBalanceRaw: ledger.closingBalanceRaw || "",
      panNumber: ledger.panNumber || row.panNumber || "",
      gstin: ledger.gstin || row.gstin || "",
      isSundryCreditor: Boolean(ledger.isSundryCreditor || row.isSundryCreditor),
    };
  });
}

function buildLedgerMovements(vouchers = [], ledgerMetadata = []) {
  const ledgers = ledgerMapFromMetadata(ledgerMetadata);
  const byLedger = new Map();
  for (const ledger of ledgerMetadata || []) {
    if (!ledger.name) continue;
    const key = ledgerKey(ledger.name);
    byLedger.set(key, {
      ledgerName: ledger.name,
      normalizedLedgerName: key,
      parent: ledger.parent || "",
      groupHierarchy: ledger.groupHierarchy || [],
      openingBalance: Number(ledger.openingBalance || 0),
      closingBalance: Number(ledger.closingBalance || 0),
      debit: 0,
      credit: 0,
      voucherCount: 0,
      panNumber: ledger.panNumber || "",
      gstin: ledger.gstin || "",
      guid: ledger.guid || "",
      udyamNumber: ledger.udyamNumber || "",
      ledgerOpeningBalanceRaw: ledger.openingBalanceRaw || "",
      ledgerClosingBalanceRaw: ledger.closingBalanceRaw || "",
      isSundryCreditor: Boolean(ledger.isSundryCreditor),
    });
  }

  for (const row of vouchers || []) {
    const key = ledgerKey(row.ledgerName);
    if (!key) continue;
    const ledger = ledgers.get(key) || {};
    if (!byLedger.has(key)) {
      byLedger.set(key, {
        ledgerName: row.ledgerName,
        normalizedLedgerName: key,
        parent: ledger.parent || row.ledgerParent || "",
        groupHierarchy: ledger.groupHierarchy || row.groupHierarchy || [],
        openingBalance: Number(ledger.openingBalance || row.ledgerOpeningBalance || 0),
        closingBalance: Number(ledger.closingBalance || row.ledgerClosingBalance || 0),
        debit: 0,
        credit: 0,
        voucherCount: 0,
        panNumber: ledger.panNumber || row.panNumber || "",
        gstin: ledger.gstin || row.gstin || "",
        guid: ledger.guid || "",
        udyamNumber: ledger.udyamNumber || "",
        ledgerOpeningBalanceRaw: ledger.openingBalanceRaw || row.ledgerOpeningBalanceRaw || "",
        ledgerClosingBalanceRaw: ledger.closingBalanceRaw || row.ledgerClosingBalanceRaw || "",
        isSundryCreditor: Boolean(ledger.isSundryCreditor || row.isSundryCreditor),
      });
    }
    const item = byLedger.get(key);
    item.debit = roundMoney(item.debit + Number(row.debit || 0));
    item.credit = roundMoney(item.credit + Number(row.credit || 0));
    item.voucherCount += 1;
  }

  return [...byLedger.values()].map((row) => ({
    ...row,
    derivedClosingBalance: roundMoney(row.openingBalance + row.debit - row.credit),
  })).sort((a, b) => a.ledgerName.localeCompare(b.ledgerName));
}

function groupType(row) {
  const names = [row.parent, ...(row.groupHierarchy || [])].map(normalizeGroupName).join(" | ");
  if (/SALES|DIRECT INCOME|INDIRECT INCOME|INCOME/.test(names)) return "profit_loss";
  if (/PURCHASE|DIRECT EXPENSE|INDIRECT EXPENSE|EXPENSE|COST OF SALES/.test(names)) return "profit_loss";
  if (/CAPITAL|LOAN|LIABILIT|ASSET|DUTIES AND TAXES|SUNDRY CREDITORS|SUNDRY DEBTORS|BANK|CASH|DEPOSIT|STOCK/.test(names)) return "balance_sheet";
  return "balance_sheet";
}

function rollupByParent(rows = [], wantedType) {
  const groups = new Map();
  for (const row of rows) {
    if (groupType(row) !== wantedType) continue;
    const groupName = row.parent || row.groupHierarchy?.[0] || "Ungrouped";
    if (!groups.has(groupName)) {
      groups.set(groupName, { groupName, debit: 0, credit: 0, closingBalance: 0, ledgers: [] });
    }
    const group = groups.get(groupName);
    group.debit = roundMoney(group.debit + row.debit);
    group.credit = roundMoney(group.credit + row.credit);
    group.closingBalance = roundMoney(group.closingBalance + row.derivedClosingBalance);
    group.ledgers.push(row);
  }
  return [...groups.values()].sort((a, b) => a.groupName.localeCompare(b.groupName));
}

function buildTrialBalance(vouchers = [], ledgerMetadata = []) {
  const rows = buildLedgerMovements(vouchers, ledgerMetadata);
  return {
    rows,
    summary: {
      ledgerCount: rows.length,
      totalDebit: roundMoney(rows.reduce((sum, row) => sum + row.debit, 0)),
      totalCredit: roundMoney(rows.reduce((sum, row) => sum + row.credit, 0)),
    },
  };
}

function buildBalanceSheet(vouchers = [], ledgerMetadata = []) {
  const trialRows = buildLedgerMovements(vouchers, ledgerMetadata);
  const groups = rollupByParent(trialRows, "balance_sheet");
  return {
    groups,
    summary: {
      groupCount: groups.length,
      ledgerCount: groups.reduce((sum, group) => sum + group.ledgers.length, 0),
      closingBalance: roundMoney(groups.reduce((sum, group) => sum + group.closingBalance, 0)),
    },
  };
}

function buildProfitLoss(vouchers = [], ledgerMetadata = []) {
  const trialRows = buildLedgerMovements(vouchers, ledgerMetadata);
  const groups = rollupByParent(trialRows, "profit_loss");
  return {
    groups,
    summary: {
      groupCount: groups.length,
      ledgerCount: groups.reduce((sum, group) => sum + group.ledgers.length, 0),
      netAmount: roundMoney(groups.reduce((sum, group) => sum + group.credit - group.debit, 0)),
    },
  };
}

function deriveSundryCreditors(ledgerMetadata = [], vouchers = []) {
  const movements = buildLedgerMovements(vouchers, ledgerMetadata);
  return movements
    .filter((row) => row.isSundryCreditor || [row.parent, ...(row.groupHierarchy || [])].some(isSundryCreditorGroupName))
    .map((row) => ({
      ...row,
      outstandingAmount: row.closingBalance < 0 ? Math.abs(row.closingBalance) : Math.max(row.credit - row.debit - Math.max(row.openingBalance, 0), 0),
      hasCurrentActivity: row.voucherCount > 0,
      reviewReason: row.closingBalance >= 0 && row.voucherCount > 0 ? "current_activity_without_credit_closing" : "",
    }));
}

function buildStatementBundle(vouchers = [], ledgerMetadata = []) {
  const trialBalance = buildTrialBalance(vouchers, ledgerMetadata);
  const balanceSheet = buildBalanceSheet(vouchers, ledgerMetadata);
  const profitLoss = buildProfitLoss(vouchers, ledgerMetadata);
  const sundryCreditors = deriveSundryCreditors(ledgerMetadata, vouchers);
  return {
    trialBalance,
    balanceSheet,
    profitLoss,
    sundryCreditors,
    summary: {
      trialLedgerCount: trialBalance.summary.ledgerCount,
      balanceSheetGroupCount: balanceSheet.summary.groupCount,
      profitLossGroupCount: profitLoss.summary.groupCount,
      sundryCreditorCount: sundryCreditors.length,
      zeroDebitCreditorsWithActivity: sundryCreditors.filter((row) => row.reviewReason).length,
    },
  };
}

module.exports = {
  attachLedgerMetadata,
  buildTrialBalance,
  buildBalanceSheet,
  buildProfitLoss,
  deriveSundryCreditors,
  buildStatementBundle,
};
