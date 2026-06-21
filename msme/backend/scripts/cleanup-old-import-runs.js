const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const RETAIN_IMPORT_RUNS = 20;
const projectRoot = path.resolve(__dirname, "..", "..");
const dbPath = path.join(projectRoot, "backend", "data", "msme-guard.sqlite");
const backupDirArgIndex = process.argv.indexOf("--backup-dir");
const backupDir = backupDirArgIndex >= 0 && process.argv[backupDirArgIndex + 1]
  ? path.resolve(process.argv[backupDirArgIndex + 1])
  : path.join(projectRoot, "backend", "data", "backups");
const execute = process.argv.includes("--execute");

const safeImportCleanupTables = [
  {
    table: "mca_filing_automation_events",
    reason: "Child event log rows for MCA MSME-1 automation runs created from generated import-based filings.",
    deleteSql: `
      DELETE FROM mca_filing_automation_events
      WHERE run_id IN (
        SELECT far.id
        FROM mca_filing_automation_runs far
        JOIN mca_msme1_filings mf ON mf.id = far.filing_id
        WHERE mf.import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "mca_filing_automation_runs",
    reason: "Automation run logs tied to generated MCA MSME-1 filings for old import runs.",
    deleteSql: `
      DELETE FROM mca_filing_automation_runs
      WHERE filing_id IN (
        SELECT id FROM mca_msme1_filings WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "mca_msme1_xml_generations",
    reason: "Generated XML metadata tied to MCA MSME-1 filings for old import runs.",
    deleteSql: `
      DELETE FROM mca_msme1_xml_generations
      WHERE filing_id IN (
        SELECT id FROM mca_msme1_filings WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "mca_msme1_supplier_rows",
    reason: "Generated supplier rows tied to MCA MSME-1 filings for old import runs.",
    deleteSql: `
      DELETE FROM mca_msme1_supplier_rows
      WHERE filing_id IN (
        SELECT id FROM mca_msme1_filings WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "mca_msme1_filings",
    reason: "Generated MCA MSME-1 filing records tied directly to old import runs.",
    deleteSql: `DELETE FROM mca_msme1_filings WHERE import_run_id IN (${oldRunPlaceholder()})`,
  },
  {
    table: "assessee_details",
    reason: "Tax audit details keyed by tax-audit report rows created from old import runs.",
    deleteSql: `
      DELETE FROM assessee_details
      WHERE report_id IN (
        SELECT id FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "auditor_details",
    reason: "Tax audit details keyed by tax-audit report rows created from old import runs.",
    deleteSql: `
      DELETE FROM auditor_details
      WHERE report_id IN (
        SELECT id FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "tax_audit_edit_log",
    reason: "Edit log rows keyed by tax-audit report rows created from old import runs.",
    deleteSql: `
      DELETE FROM tax_audit_edit_log
      WHERE report_id IN (
        SELECT id FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "tax_audit_validation_errors",
    reason: "Validation rows keyed by tax-audit report rows created from old import runs.",
    deleteSql: `
      DELETE FROM tax_audit_validation_errors
      WHERE report_id IN (
        SELECT id FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "tax_audit_annexures",
    reason: "Annexure rows keyed by tax-audit report rows created from old import runs.",
    deleteSql: `
      DELETE FROM tax_audit_annexures
      WHERE report_id IN (
        SELECT id FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "tax_audit_clauses",
    reason: "Clause rows keyed by tax-audit report rows created from old import runs.",
    deleteSql: `
      DELETE FROM tax_audit_clauses
      WHERE report_id IN (
        SELECT id FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "tax_audit_report_versions",
    reason: "Version snapshots keyed by tax-audit report rows created from old import runs.",
    deleteSql: `
      DELETE FROM tax_audit_report_versions
      WHERE report_id IN (
        SELECT id FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "tax_audit_reports",
    reason: "Generated tax-audit report rows tied directly to old import runs.",
    deleteSql: `DELETE FROM tax_audit_reports WHERE import_run_id IN (${oldRunPlaceholder()})`,
  },
  {
    table: "msme_interest_movements",
    reason: "Generated interest schedules keyed by compliance reports created from old import runs.",
    deleteSql: `
      DELETE FROM msme_interest_movements
      WHERE report_id IN (
        SELECT id FROM compliance_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "msme_carry_forward_register",
    reason: "Generated carry-forward schedules keyed by compliance reports created from old import runs.",
    deleteSql: `
      DELETE FROM msme_carry_forward_register
      WHERE report_id IN (
        SELECT id FROM compliance_reports WHERE import_run_id IN (${oldRunPlaceholder()})
      )
    `,
  },
  {
    table: "compliance_reports",
    reason: "Generated MSME compliance reports tied directly to old import runs.",
    deleteSql: `DELETE FROM compliance_reports WHERE import_run_id IN (${oldRunPlaceholder()})`,
  },
  {
    table: "msme_baseline_snapshots",
    reason: "Imported baseline snapshot rows tied directly to old import runs.",
    deleteSql: `DELETE FROM msme_baseline_snapshots WHERE import_run_id IN (${oldRunPlaceholder()})`,
  },
  {
    table: "tally_import_creditors",
    reason: "Imported creditor rows and raw creditor JSON tied directly to old import runs.",
    deleteSql: `DELETE FROM tally_import_creditors WHERE import_run_id IN (${oldRunPlaceholder()})`,
  },
  {
    table: "tally_ledger_vouchers",
    reason: "Imported voucher rows and raw voucher JSON tied directly to old import runs.",
    deleteSql: `DELETE FROM tally_ledger_vouchers WHERE import_run_id IN (${oldRunPlaceholder()})`,
  },
  {
    table: "tally_import_runs",
    reason: "Import history rows older than the newest 20 Tally import runs.",
    deleteSql: `DELETE FROM tally_import_runs WHERE id IN (${oldRunPlaceholder()})`,
  },
];

function oldRunPlaceholder() {
  return "__OLD_RUN_IDS__";
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes || 0);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function fileSize(filePath) {
  return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
}

function tableExists(db, table) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}

function countRows(db, table) {
  return db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
}

function prepareDeleteSql(sql, oldRunIds) {
  return sql.replace(oldRunPlaceholder(), oldRunIds.map(() => "?").join(", "));
}

async function main() {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found: ${dbPath}`);
  }

  const beforeMainSize = fileSize(dbPath);
  const beforeWalSize = fileSize(`${dbPath}-wal`);
  const beforeShmSize = fileSize(`${dbPath}-shm`);
  const db = new Database(dbPath);

  try {
    db.pragma("foreign_keys = ON");
    const journalMode = db.pragma("journal_mode", { simple: true });

    const missingTables = safeImportCleanupTables.filter(({ table }) => !tableExists(db, table)).map(({ table }) => table);
    if (missingTables.length) {
      throw new Error(`Refusing cleanup because expected import-related tables are missing: ${missingTables.join(", ")}`);
    }

    const unexpectedImportRunReferences = db.prepare(`
      SELECT m.name AS table_name, p."from" AS column_name
      FROM sqlite_master m
      JOIN pragma_foreign_key_list(m.name) p
      WHERE m.type = 'table'
        AND p."table" = 'tally_import_runs'
        AND m.name NOT IN (${safeImportCleanupTables.map(() => "?").join(", ")})
      ORDER BY m.name
    `).all(...safeImportCleanupTables.map(({ table }) => table));
    if (unexpectedImportRunReferences.length) {
      throw new Error(`Refusing cleanup because unknown tables reference tally_import_runs: ${JSON.stringify(unexpectedImportRunReferences)}`);
    }

    const allRuns = db.prepare(`
      SELECT id, status, created_at
      FROM tally_import_runs
      ORDER BY datetime(created_at) DESC, created_at DESC, id DESC
    `).all();
    const keepRunIds = allRuns.slice(0, RETAIN_IMPORT_RUNS).map((row) => row.id);
    const oldRunIds = allRuns.slice(RETAIN_IMPORT_RUNS).map((row) => row.id);
    const importRunsBefore = allRuns.length;
    const vouchersBefore = countRows(db, "tally_ledger_vouchers");
    const tableCountsBefore = Object.fromEntries(safeImportCleanupTables.map(({ table }) => [table, countRows(db, table)]));

    console.log("SQLite import cleanup plan");
    console.log(`Database: ${dbPath}`);
    console.log(`Journal mode: ${journalMode}`);
    console.log(`Mode: ${execute ? "EXECUTE" : "DRY RUN"}`);
    console.log(`Retention: newest ${RETAIN_IMPORT_RUNS} import runs`);
    console.log(`Database size before: ${formatBytes(beforeMainSize)} main + ${formatBytes(beforeWalSize)} WAL + ${formatBytes(beforeShmSize)} SHM`);
    console.log(`Import runs before cleanup: ${importRunsBefore}`);
    console.log(`Import runs to keep: ${keepRunIds.length}`);
    console.log(`Import runs to delete: ${oldRunIds.length}`);
    console.log("");
    console.log("Identified safe import-related tables:");
    for (const item of safeImportCleanupTables) {
      console.log(`- ${item.table}: ${item.reason}`);
    }

    if (oldRunIds.length === 0) {
      console.log("");
      console.log("No old import runs to delete. Nothing to clean.");
      return;
    }

    const estimatedDeletes = {};
    for (const item of safeImportCleanupTables) {
      const selectSql = prepareDeleteSql(item.deleteSql.replace(/^(\s*)DELETE FROM\s+([^\s]+)\s+/i, "$1SELECT COUNT(*) AS total FROM $2 "), oldRunIds);
      estimatedDeletes[item.table] = db.prepare(selectSql).get(...oldRunIds).total;
    }
    console.log("");
    console.log("Rows expected to be deleted:");
    for (const item of safeImportCleanupTables) {
      console.log(`- ${item.table}: ${estimatedDeletes[item.table]}`);
    }

    if (!execute) {
      console.log("");
      console.log("Dry run only. Re-run with --execute to create a backup and perform cleanup.");
      return;
    }

    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `msme-guard-${timestamp}-before-import-cleanup.sqlite`);
    console.log("");
    console.log(`Creating backup: ${backupPath}`);
    await db.backup(backupPath);

    const deleteCounts = {};
    const cleanupTx = db.transaction(() => {
      for (const item of safeImportCleanupTables) {
        const deleteSql = prepareDeleteSql(item.deleteSql, oldRunIds);
        const result = db.prepare(deleteSql).run(...oldRunIds);
        deleteCounts[item.table] = result.changes;
      }
    });

    cleanupTx();
    const fkProblems = db.pragma("foreign_key_check");
    if (fkProblems.length) {
      throw new Error(`Foreign key check failed after cleanup: ${JSON.stringify(fkProblems)}`);
    }

    console.log("");
    console.log("Delete transaction committed.");
    console.log("Running VACUUM...");
    db.exec("VACUUM;");
    console.log("Running ANALYZE...");
    db.exec("ANALYZE;");
    db.pragma("wal_checkpoint(TRUNCATE)");

    const tableCountsAfter = Object.fromEntries(safeImportCleanupTables.map(({ table }) => [table, countRows(db, table)]));
    const importRunsAfter = countRows(db, "tally_import_runs");
    const vouchersAfter = countRows(db, "tally_ledger_vouchers");
    const afterMainSize = fileSize(dbPath);
    const afterWalSize = fileSize(`${dbPath}-wal`);
    const afterShmSize = fileSize(`${dbPath}-shm`);
    const report = {
      generatedAt: new Date().toISOString(),
      databasePath: dbPath,
      backupPath,
      retentionImportRuns: RETAIN_IMPORT_RUNS,
      databaseSizeBeforeBytes: beforeMainSize + beforeWalSize + beforeShmSize,
      databaseSizeAfterBytes: afterMainSize + afterWalSize + afterShmSize,
      databaseSizeBefore: `${formatBytes(beforeMainSize)} main + ${formatBytes(beforeWalSize)} WAL + ${formatBytes(beforeShmSize)} SHM`,
      databaseSizeAfter: `${formatBytes(afterMainSize)} main + ${formatBytes(afterWalSize)} WAL + ${formatBytes(afterShmSize)} SHM`,
      importRunsBefore,
      importRunsAfter,
      importRunsDeleted: oldRunIds.length,
      vouchersBefore,
      vouchersAfter,
      vouchersDeleted: vouchersBefore - vouchersAfter,
      modifiedTables: safeImportCleanupTables.map(({ table, reason }) => ({
        table,
        reason,
        rowsBefore: tableCountsBefore[table],
        rowsDeleted: deleteCounts[table] || 0,
        rowsAfter: tableCountsAfter[table],
      })),
      preservedTables: "All tables outside the identified import-generated dependency chain were not modified by this script.",
    };
    const reportPath = path.join(backupDir, `msme-guard-${timestamp}-import-cleanup-report.json`);
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

    console.log("");
    console.log("Cleanup report");
    console.log(`Report path: ${reportPath}`);
    console.log(`Database size before: ${report.databaseSizeBefore}`);
    console.log(`Database size after: ${report.databaseSizeAfter}`);
    console.log(`Import runs before: ${importRunsBefore}`);
    console.log(`Import runs after: ${importRunsAfter}`);
    console.log(`Vouchers deleted: ${report.vouchersDeleted}`);
    console.log("Only the listed import-related tables were modified.");
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
