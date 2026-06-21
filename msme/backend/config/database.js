const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const env = require("./env");

const dbPath = path.resolve(process.cwd(), env.databasePath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendor_master (
      id TEXT PRIMARY KEY,
      vendor_name TEXT NOT NULL,
      normalized_vendor_name TEXT NOT NULL UNIQUE,
      is_msme INTEGER NOT NULL DEFAULT 0,
      udyam_number TEXT,
      enterprise_type TEXT,
      pan_number TEXT,
      agreed_payment_days INTEGER,
      verification_status TEXT NOT NULL DEFAULT 'pending',
      enterprise_name TEXT,
      registration_validity TEXT,
      registration_date TEXT,
      verified_at TEXT,
      last_verified_at TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vendor_master_normalized_name
      ON vendor_master(normalized_vendor_name);

    CREATE TABLE IF NOT EXISTS vendor_audit_log (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      changed_by TEXT,
      changed_at TEXT NOT NULL,
      source TEXT,
      FOREIGN KEY(vendor_id) REFERENCES vendor_master(id)
    );

    CREATE TABLE IF NOT EXISTS tally_import_runs (
      id TEXT PRIMARY KEY,
      fiscal_year TEXT NOT NULL,
      period_type TEXT NOT NULL DEFAULT 'financial_year',
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      as_on TEXT NOT NULL,
      company_name TEXT,
      status TEXT NOT NULL,
      error TEXT,
      summary_json TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tally_import_creditors (
      id TEXT PRIMARY KEY,
      import_run_id TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      normalized_vendor_name TEXT NOT NULL,
      outstanding_amount REAL NOT NULL DEFAULT 0,
      days_outstanding INTEGER,
      bucket TEXT,
      delayed INTEGER NOT NULL DEFAULT 0,
      interest_liability REAL NOT NULL DEFAULT 0,
      disallowance_amount REAL NOT NULL DEFAULT 0,
      oldest_invoice_date TEXT,
      pan_number TEXT,
      agreed_payment_days INTEGER,
      opening_balance REAL NOT NULL DEFAULT 0,
      closing_balance REAL NOT NULL DEFAULT 0,
      opening_balance_raw TEXT,
      closing_balance_raw TEXT,
      voucher_count INTEGER NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL,
      FOREIGN KEY(import_run_id) REFERENCES tally_import_runs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_import_creditors_run
      ON tally_import_creditors(import_run_id);

    CREATE TABLE IF NOT EXISTS tally_ledger_vouchers (
      id TEXT PRIMARY KEY,
      import_run_id TEXT NOT NULL,
      fiscal_year TEXT NOT NULL DEFAULT '',
      company_name TEXT NOT NULL DEFAULT '',
      vendor_name TEXT NOT NULL DEFAULT '',
      normalized_vendor_name TEXT NOT NULL DEFAULT '',
      ledger_name TEXT NOT NULL,
      normalized_ledger_name TEXT NOT NULL,
      voucher_date TEXT,
      particulars TEXT,
      voucher_type TEXT,
      voucher_number TEXT,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      bill_reference TEXT,
      pending_amount REAL NOT NULL DEFAULT 0,
      party_ledger_name TEXT NOT NULL DEFAULT '',
      ledger_parent TEXT NOT NULL DEFAULT '',
      group_hierarchy_json TEXT NOT NULL DEFAULT '[]',
      voucher_source TEXT NOT NULL DEFAULT 'Day Book',
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY(import_run_id) REFERENCES tally_import_runs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tally_ledger_vouchers_run
      ON tally_ledger_vouchers(import_run_id);

    CREATE INDEX IF NOT EXISTS idx_tally_ledger_vouchers_ledger
      ON tally_ledger_vouchers(import_run_id, normalized_ledger_name);

    CREATE TABLE IF NOT EXISTS udyam_verification_attempts (
      id TEXT PRIMARY KEY,
      vendor_id TEXT,
      vendor_name TEXT NOT NULL,
      udyam_number TEXT NOT NULL,
      status TEXT NOT NULL,
      response_json TEXT NOT NULL,
      screenshot_path TEXT,
      attempted_by TEXT,
      attempted_at TEXT NOT NULL,
      FOREIGN KEY(vendor_id) REFERENCES vendor_master(id)
    );

    CREATE TABLE IF NOT EXISTS compliance_reports (
      id TEXT PRIMARY KEY,
      import_run_id TEXT NOT NULL,
      fiscal_year TEXT NOT NULL,
      status TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      report_json TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(import_run_id) REFERENCES tally_import_runs(id)
    );

    CREATE TABLE IF NOT EXISTS mca_msme1_filings (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      import_run_id TEXT NOT NULL,
      fiscal_year TEXT NOT NULL,
      half_year TEXT NOT NULL,
      status TEXT NOT NULL,
      template_path TEXT NOT NULL DEFAULT '',
      generated_file_path TEXT NOT NULL DEFAULT '',
      row_count INTEGER NOT NULL DEFAULT 0,
      validation_json TEXT NOT NULL DEFAULT '{}',
      mca_user_id TEXT NOT NULL DEFAULT '',
      srn TEXT NOT NULL DEFAULT '',
      uploaded_at TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES compliance_reports(id),
      FOREIGN KEY(import_run_id) REFERENCES tally_import_runs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_mca_msme1_filings_report
      ON mca_msme1_filings(report_id);

    CREATE TABLE IF NOT EXISTS msme_baseline_snapshots (
      id TEXT PRIMARY KEY,
      import_run_id TEXT NOT NULL,
      baseline_date TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      normalized_vendor_name TEXT NOT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      closing_balance REAL NOT NULL DEFAULT 0,
      ledger_payable_outstanding REAL NOT NULL DEFAULT 0,
      pan_number TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY(import_run_id) REFERENCES tally_import_runs(id)
    );

    CREATE TABLE IF NOT EXISTS msme_interest_movements (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      invoice_number TEXT,
      opening_interest REAL NOT NULL DEFAULT 0,
      interest_accrued REAL NOT NULL DEFAULT 0,
      interest_paid REAL NOT NULL DEFAULT 0,
      interest_waived REAL NOT NULL DEFAULT 0,
      closing_interest_payable REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'computed',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY(report_id) REFERENCES compliance_reports(id)
    );

    CREATE TABLE IF NOT EXISTS msme_carry_forward_register (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      prior_report_id TEXT NOT NULL DEFAULT '',
      financial_year TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      normalized_vendor_name TEXT NOT NULL DEFAULT '',
      pan_number TEXT NOT NULL DEFAULT '',
      udyam_number TEXT NOT NULL DEFAULT '',
      invoice_number TEXT NOT NULL DEFAULT '',
      invoice_date TEXT NOT NULL DEFAULT '',
      opening_disallowance REAL NOT NULL DEFAULT 0,
      paid_during_year REAL NOT NULL DEFAULT 0,
      deductible_current_year REAL NOT NULL DEFAULT 0,
      closing_carry_forward REAL NOT NULL DEFAULT 0,
      settlement_source TEXT NOT NULL DEFAULT '',
      evidence_reference TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'computed',
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES compliance_reports(id)
    );

    CREATE TABLE IF NOT EXISTS mca_msme1_supplier_rows (
      id TEXT PRIMARY KEY,
      filing_id TEXT NOT NULL,
      serial_number INTEGER,
      supplier_name TEXT NOT NULL,
      pan_number TEXT,
      udyam_number TEXT,
      amount_paid_within_45 REAL NOT NULL DEFAULT 0,
      amount_paid_after_45 REAL NOT NULL DEFAULT 0,
      outstanding_45_or_less REAL NOT NULL DEFAULT 0,
      outstanding_more_than_45 REAL NOT NULL DEFAULT 0,
      reason_for_delay TEXT,
      validation_status TEXT NOT NULL DEFAULT 'pending',
      validation_errors_json TEXT NOT NULL DEFAULT '[]',
      raw_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY(filing_id) REFERENCES mca_msme1_filings(id)
    );

    CREATE TABLE IF NOT EXISTS mca_msme1_xml_generations (
      id TEXT PRIMARY KEY,
      filing_id TEXT NOT NULL,
      status TEXT NOT NULL,
      xml_file_path TEXT NOT NULL DEFAULT '',
      validation_json TEXT NOT NULL DEFAULT '{}',
      generated_by TEXT,
      generated_at TEXT NOT NULL,
      FOREIGN KEY(filing_id) REFERENCES mca_msme1_filings(id)
    );

    CREATE TABLE IF NOT EXISTS mca_filing_automation_runs (
      id TEXT PRIMARY KEY,
      filing_id TEXT NOT NULL,
      status TEXT NOT NULL,
      current_step TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      selected_file_path TEXT NOT NULL DEFAULT '',
      file_type_used TEXT NOT NULL DEFAULT '',
      srn TEXT NOT NULL DEFAULT '',
      error_message TEXT NOT NULL DEFAULT '',
      screenshot_path TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY(filing_id) REFERENCES mca_msme1_filings(id)
    );

    CREATE TABLE IF NOT EXISTS mca_filing_automation_events (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      step_name TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(run_id) REFERENCES mca_filing_automation_runs(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id TEXT PRIMARY KEY,
      vendor_id TEXT,
      vendor_name TEXT NOT NULL,
      normalized_vendor_name TEXT NOT NULL,
      invoice_number TEXT,
      invoice_date TEXT,
      due_date TEXT,
      invoice_amount REAL NOT NULL DEFAULT 0,
      outstanding_amount REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      source TEXT NOT NULL DEFAULT 'manual',
      source_file_name TEXT,
      udyam_number TEXT,
      udyam_status TEXT NOT NULL DEFAULT 'not_started',
      notes TEXT,
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(vendor_id) REFERENCES vendor_master(id)
    );

    CREATE INDEX IF NOT EXISTS idx_purchase_invoices_vendor
      ON purchase_invoices(normalized_vendor_name);

    CREATE INDEX IF NOT EXISTS idx_purchase_invoices_source
      ON purchase_invoices(source, created_at);

    CREATE TABLE IF NOT EXISTS tax_audit_reports (
      id TEXT PRIMARY KEY,
      source_msme_report_id TEXT NOT NULL,
      import_run_id TEXT NOT NULL,
      company_name TEXT NOT NULL DEFAULT '',
      financial_year TEXT NOT NULL,
      assessment_year TEXT NOT NULL,
      form_type TEXT NOT NULL CHECK (form_type IN ('3CA', '3CB')),
      status TEXT NOT NULL DEFAULT 'draft',
      validation_status TEXT NOT NULL DEFAULT 'not_run',
      generated_json_snapshot TEXT NOT NULL DEFAULT '{}',
      generated_pdf_path TEXT NOT NULL DEFAULT '',
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(source_msme_report_id) REFERENCES compliance_reports(id),
      FOREIGN KEY(import_run_id) REFERENCES tally_import_runs(id)
    );

    CREATE TABLE IF NOT EXISTS tax_audit_report_versions (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      version_no INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES tax_audit_reports(id)
    );

    CREATE TABLE IF NOT EXISTS tax_audit_clauses (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      clause_no TEXT NOT NULL,
      clause_title TEXT NOT NULL DEFAULT '',
      schema_key TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'na',
      amount REAL NOT NULL DEFAULT 0,
      remarks TEXT NOT NULL DEFAULT '',
      annexure_ref TEXT NOT NULL DEFAULT '',
      evidence_ref TEXT NOT NULL DEFAULT '',
      review_status TEXT NOT NULL DEFAULT 'requires_review',
      payload_json TEXT NOT NULL DEFAULT '{}',
      updated_by TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES tax_audit_reports(id)
    );

    CREATE TABLE IF NOT EXISTS tax_audit_annexures (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      annexure_type TEXT NOT NULL,
      title TEXT NOT NULL,
      source_schedule TEXT NOT NULL DEFAULT '',
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES tax_audit_reports(id)
    );

    CREATE TABLE IF NOT EXISTS tax_audit_validation_errors (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      code TEXT NOT NULL,
      message TEXT NOT NULL,
      schema_path TEXT NOT NULL DEFAULT '',
      clause_no TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES tax_audit_reports(id)
    );

    CREATE TABLE IF NOT EXISTS assessee_details (
      report_id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL DEFAULT '{}',
      updated_by TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES tax_audit_reports(id)
    );

    CREATE TABLE IF NOT EXISTS rbi_bank_rates (
      id TEXT PRIMARY KEY,
      effective_from_date TEXT NOT NULL,
      effective_to_date TEXT,
      bank_rate REAL NOT NULL,
      source_url TEXT NOT NULL,
      downloaded_pdf_path TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT 'official_fetch',
      is_manual_override INTEGER NOT NULL DEFAULT 0,
      override_reason TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      fetched_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_rbi_bank_rates_unique_source
      ON rbi_bank_rates(effective_from_date, COALESCE(effective_to_date, ''), bank_rate, source_url, is_manual_override);

    CREATE INDEX IF NOT EXISTS idx_rbi_bank_rates_period
      ON rbi_bank_rates(effective_from_date, effective_to_date);

    CREATE TABLE IF NOT EXISTS rbi_bank_rate_audit_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      old_value_json TEXT NOT NULL DEFAULT '{}',
      new_value_json TEXT NOT NULL DEFAULT '{}',
      changed_by TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      changed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auditor_details (
      report_id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL DEFAULT '{}',
      updated_by TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(report_id) REFERENCES tax_audit_reports(id)
    );

    CREATE TABLE IF NOT EXISTS tax_audit_edit_log (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL DEFAULT '',
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT,
      changed_at TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      FOREIGN KEY(report_id) REFERENCES tax_audit_reports(id)
    );
  `);

  const tableColumns = (tableName) => db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
  const addMissingColumns = (tableName, columns) => {
    const existingColumns = tableColumns(tableName);
    for (const [name, ddl] of columns) {
      if (!existingColumns.includes(name)) db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`);
    }
  };

  addMissingColumns("vendor_master", [
    ["udyam_status", "udyam_status TEXT NOT NULL DEFAULT 'not_started'"],
    ["udyam_proof_file_url", "udyam_proof_file_url TEXT"],
    ["udyam_proof_uploaded_at", "udyam_proof_uploaded_at TEXT"],
    ["udyam_verified_by", "udyam_verified_by TEXT"],
    ["udyam_verified_at", "udyam_verified_at TEXT"],
    ["udyam_remarks", "udyam_remarks TEXT"],
    ["action_status", "action_status TEXT NOT NULL DEFAULT 'pending_action'"],
    ["excluded_reason", "excluded_reason TEXT"],
    ["evidence_url", "evidence_url TEXT"],
    ["proof_notes", "proof_notes TEXT"],
    ["review_status", "review_status TEXT NOT NULL DEFAULT 'queued'"],
    ["reviewed_by", "reviewed_by TEXT"],
    ["reviewed_at", "reviewed_at TEXT"],
    ["review_comment", "review_comment TEXT"],
    ["source_import_run_id", "source_import_run_id TEXT"],
    ["last_import_run_id", "last_import_run_id TEXT"],
    ["pan_number", "pan_number TEXT"],
    ["agreed_payment_days", "agreed_payment_days INTEGER"],
    ["verification_source", "verification_source TEXT NOT NULL DEFAULT 'manual'"],
    ["evidence_link", "evidence_link TEXT"],
    ["evidence_document_type", "evidence_document_type TEXT"],
    ["approved_by", "approved_by TEXT"],
    ["approved_at", "approved_at TEXT"],
    ["written_agreement_default", "written_agreement_default INTEGER NOT NULL DEFAULT 0"],
    ["agreement_credit_days", "agreement_credit_days INTEGER"],
    ["agreement_evidence_link", "agreement_evidence_link TEXT"],
  ]);

  addMissingColumns("tally_ledger_vouchers", [
    ["fiscal_year", "fiscal_year TEXT NOT NULL DEFAULT ''"],
    ["financial_year", "financial_year TEXT NOT NULL DEFAULT ''"],
    ["fy_start_date", "fy_start_date TEXT NOT NULL DEFAULT ''"],
    ["fy_end_date", "fy_end_date TEXT NOT NULL DEFAULT ''"],
    ["report_from_date", "report_from_date TEXT NOT NULL DEFAULT ''"],
    ["report_to_date", "report_to_date TEXT NOT NULL DEFAULT ''"],
    ["as_on_date", "as_on_date TEXT NOT NULL DEFAULT ''"],
    ["company_name", "company_name TEXT NOT NULL DEFAULT ''"],
    ["vendor_name", "vendor_name TEXT NOT NULL DEFAULT ''"],
    ["normalized_vendor_name", "normalized_vendor_name TEXT NOT NULL DEFAULT ''"],
    ["bill_reference", "bill_reference TEXT"],
    ["pending_amount", "pending_amount REAL NOT NULL DEFAULT 0"],
    ["party_ledger_name", "party_ledger_name TEXT NOT NULL DEFAULT ''"],
    ["ledger_parent", "ledger_parent TEXT NOT NULL DEFAULT ''"],
    ["group_hierarchy_json", "group_hierarchy_json TEXT NOT NULL DEFAULT '[]'"],
    ["voucher_source", "voucher_source TEXT NOT NULL DEFAULT 'Day Book'"],
    ["invoice_date", "invoice_date TEXT"],
    ["acceptance_date", "acceptance_date TEXT"],
    ["deemed_acceptance_date", "deemed_acceptance_date TEXT"],
    ["has_written_agreement", "has_written_agreement INTEGER"],
    ["agreement_credit_days", "agreement_credit_days INTEGER"],
    ["agreement_evidence_link", "agreement_evidence_link TEXT"],
    ["appointed_day", "appointed_day TEXT"],
    ["payment_date", "payment_date TEXT"],
    ["evidence_status", "evidence_status TEXT NOT NULL DEFAULT 'pending_review'"],
    ["verification_required", "verification_required INTEGER NOT NULL DEFAULT 0"],
    ["verification_flags_json", "verification_flags_json TEXT NOT NULL DEFAULT '[]'"],
  ]);

  addMissingColumns("tally_import_runs", [
    ["period_type", "period_type TEXT NOT NULL DEFAULT 'financial_year'"],
  ]);

  addMissingColumns("tally_import_creditors", [
    ["opening_balance", "opening_balance REAL NOT NULL DEFAULT 0"],
    ["closing_balance", "closing_balance REAL NOT NULL DEFAULT 0"],
    ["opening_balance_raw", "opening_balance_raw TEXT"],
    ["closing_balance_raw", "closing_balance_raw TEXT"],
    ["voucher_count", "voucher_count INTEGER NOT NULL DEFAULT 0"],
    ["pan_number", "pan_number TEXT"],
    ["agreed_payment_days", "agreed_payment_days INTEGER"],
  ]);

  addMissingColumns("mca_msme1_filings", [
    ["mca_user_id", "mca_user_id TEXT NOT NULL DEFAULT ''"],
    ["srn", "srn TEXT NOT NULL DEFAULT ''"],
    ["uploaded_at", "uploaded_at TEXT"],
  ]);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tally_ledger_vouchers_vendor
      ON tally_ledger_vouchers(import_run_id, normalized_vendor_name);
    CREATE INDEX IF NOT EXISTS idx_tally_ledger_vouchers_fy
      ON tally_ledger_vouchers(import_run_id, financial_year, voucher_date);
    CREATE INDEX IF NOT EXISTS idx_msme_baseline_snapshots_run
      ON msme_baseline_snapshots(import_run_id, baseline_date, normalized_vendor_name);
    CREATE INDEX IF NOT EXISTS idx_msme_carry_forward_report
      ON msme_carry_forward_register(report_id, normalized_vendor_name);
    CREATE INDEX IF NOT EXISTS idx_mca_msme1_supplier_rows_filing
      ON mca_msme1_supplier_rows(filing_id);
    CREATE INDEX IF NOT EXISTS idx_mca_msme1_xml_generations_filing
      ON mca_msme1_xml_generations(filing_id);
    CREATE INDEX IF NOT EXISTS idx_mca_filing_automation_runs_filing
      ON mca_filing_automation_runs(filing_id, updated_at);
    CREATE INDEX IF NOT EXISTS idx_mca_filing_automation_events_run
      ON mca_filing_automation_events(run_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tax_audit_reports_msme
      ON tax_audit_reports(source_msme_report_id);
    CREATE INDEX IF NOT EXISTS idx_tax_audit_reports_import
      ON tax_audit_reports(import_run_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_audit_clauses_report_clause
      ON tax_audit_clauses(report_id, clause_no);
    CREATE INDEX IF NOT EXISTS idx_tax_audit_validation_report
      ON tax_audit_validation_errors(report_id, severity);
  `);
}

migrate();

module.exports = db;
