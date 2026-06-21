const crypto = require("crypto");
const db = require("../config/database");
const { normalizeVendorName } = require("../utils/normalizeVendorName");

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function mapInvoice(row) {
  return {
    id: row.id,
    vendorId: row.vendor_id || "",
    vendorName: row.vendor_name,
    normalizedVendorName: row.normalized_vendor_name,
    invoiceNumber: row.invoice_number || "",
    invoiceDate: row.invoice_date || "",
    dueDate: row.due_date || "",
    invoiceAmount: Number(row.invoice_amount || 0),
    outstandingAmount: Number(row.outstanding_amount || 0),
    paymentStatus: row.payment_status || "unpaid",
    source: row.source || "manual",
    sourceFileName: row.source_file_name || "",
    udyamNumber: row.udyam_number || "",
    udyamStatus: row.udyam_status || "not_started",
    notes: row.notes || "",
    raw: parseJson(row.raw_json, {}),
    createdBy: row.created_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createInvoice(input, actor = "system") {
  const now = new Date().toISOString();
  const normalizedVendorName = normalizeVendorName(input.vendorName);
  const invoice = {
    id: input.id || crypto.randomUUID(),
    vendor_id: input.vendorId || null,
    vendor_name: String(input.vendorName || "").trim(),
    normalized_vendor_name: normalizedVendorName,
    invoice_number: String(input.invoiceNumber || "").trim(),
    invoice_date: input.invoiceDate || "",
    due_date: input.dueDate || "",
    invoice_amount: Number(input.invoiceAmount || 0),
    outstanding_amount: Number(input.outstandingAmount ?? input.invoiceAmount ?? 0),
    payment_status: input.paymentStatus || "unpaid",
    source: input.source || "manual",
    source_file_name: input.sourceFileName || "",
    udyam_number: String(input.udyamNumber || "").trim().toUpperCase(),
    udyam_status: input.udyamStatus || "not_started",
    notes: input.notes || "",
    raw_json: JSON.stringify(input.raw || {}),
    created_by: actor,
    created_at: now,
    updated_at: now,
  };
  if (!invoice.vendor_name) throw new Error("vendorName is required");
  db.prepare(`
    INSERT INTO purchase_invoices (
      id, vendor_id, vendor_name, normalized_vendor_name, invoice_number, invoice_date, due_date,
      invoice_amount, outstanding_amount, payment_status, source, source_file_name, udyam_number,
      udyam_status, notes, raw_json, created_by, created_at, updated_at
    ) VALUES (
      @id, @vendor_id, @vendor_name, @normalized_vendor_name, @invoice_number, @invoice_date, @due_date,
      @invoice_amount, @outstanding_amount, @payment_status, @source, @source_file_name, @udyam_number,
      @udyam_status, @notes, @raw_json, @created_by, @created_at, @updated_at
    )
  `).run(invoice);
  return findById(invoice.id);
}

function updateInvoice(id, patch) {
  const old = findById(id);
  if (!old) throw new Error("Purchase invoice not found");
  const next = {
    vendor_id: patch.vendorId ?? old.vendorId ?? null,
    udyam_number: patch.udyamNumber ?? old.udyamNumber,
    udyam_status: patch.udyamStatus ?? old.udyamStatus,
    notes: patch.notes ?? old.notes,
    updated_at: new Date().toISOString(),
    id,
  };
  db.prepare(`
    UPDATE purchase_invoices
    SET vendor_id = @vendor_id,
        udyam_number = @udyam_number,
        udyam_status = @udyam_status,
        notes = @notes,
        updated_at = @updated_at
    WHERE id = @id
  `).run(next);
  return findById(id);
}

function findById(id) {
  const row = db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").get(id);
  return row ? mapInvoice(row) : null;
}

function listInvoices({ query = "", status = "", source = "" } = {}) {
  const rows = db.prepare("SELECT * FROM purchase_invoices ORDER BY created_at DESC").all().map(mapInvoice);
  const needle = query.trim().toUpperCase();
  return rows.filter((row) => {
    const matchesQuery = !needle || [row.vendorName, row.invoiceNumber, row.udyamNumber].some((value) => String(value || "").toUpperCase().includes(needle));
    const matchesStatus = !status || row.udyamStatus === status;
    const matchesSource = !source || row.source === source;
    return matchesQuery && matchesStatus && matchesSource;
  });
}

module.exports = { createInvoice, updateInvoice, findById, listInvoices };
