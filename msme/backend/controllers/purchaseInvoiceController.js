const purchaseRepository = require("../repositories/purchaseInvoiceRepository");
const vendorRepository = require("../repositories/vendorRepository");
const tallyImportService = require("../services/tallyImport.service");
const { verifyUdyamNumber, validateUdyamNumber } = require("../services/udyamVerifier.service");
const { actorFromUser } = require("../middleware/auth");

function actorFromRequest(req) {
  return actorFromUser(req);
}

function extractUdyamNumber(input) {
  const text = String(input || "").toUpperCase();
  const match = text.match(/UDYAM-[A-Z]{2}-\d{2}-\d{7}/);
  return match ? match[0] : "";
}

async function ensureVendor({ vendorName, udyamNumber, actor }) {
  const existing = vendorRepository.findManyByNames([vendorName])[0];
  if (existing) return existing;
  return vendorRepository.upsertVendorStatus(
    {
      vendorName,
      isMSME: false,
      udyamNumber: udyamNumber || "",
      verificationStatus: "pending",
      udyamStatus: "not_started",
    },
    actor,
    "purchase_invoice_vendor_created"
  );
}

async function verifyAndPersist({ vendor, vendorName, udyamNumber, actor }) {
  if (!udyamNumber) return { vendor, status: "not_started", verification: null };
  if (!validateUdyamNumber(udyamNumber)) return { vendor, status: "invalid_format", verification: null };

  const verification = await verifyUdyamNumber(udyamNumber, { retries: 1 });
  const updated = vendorRepository.upsertVendorStatus(
    {
      vendorName,
      isMSME: verification.verified,
      udyamNumber: verification.udyamNumber,
      enterpriseName: verification.enterpriseName,
      enterpriseType: verification.enterpriseType,
      verificationStatus: verification.verified ? "verified" : verification.verificationStatus,
      udyamStatus: verification.verified ? "verified" : "manual_fallback_required",
      registrationValidity: verification.registrationValidity,
      registrationDate: verification.registrationDate,
      verifiedAt: verification.verifiedAt,
      lastVerifiedAt: new Date().toISOString(),
      udyamRemarks: verification.verified ? "" : verification.error || "Udyam automation did not produce a certain result.",
    },
    actor,
    "purchase_invoice_udyam_auto_verify"
  );
  vendorRepository.recordVerificationAttempt({
    vendorId: updated.id,
    vendorName,
    udyamNumber: verification.udyamNumber,
    status: verification.verificationStatus,
    response: verification,
    screenshotPath: verification.screenshotPath,
    actor,
  });
  return { vendor: updated, status: updated.udyamStatus, verification };
}

async function createOne(payload, actor) {
  const detectedUdyam = payload.udyamNumber || extractUdyamNumber(`${payload.notes || ""} ${payload.rawText || ""}`);
  let vendor = await ensureVendor({ vendorName: payload.vendorName, udyamNumber: detectedUdyam, actor });
  let udyamStatus = vendor.udyamStatus || "not_started";
  let verification = null;

  if (payload.autoVerify !== false && detectedUdyam && !["verified", "approved"].includes(vendor.udyamStatus)) {
    const result = await verifyAndPersist({ vendor, vendorName: payload.vendorName, udyamNumber: detectedUdyam, actor });
    vendor = result.vendor;
    udyamStatus = result.status;
    verification = result.verification;
  }

  const invoice = purchaseRepository.createInvoice(
    {
      ...payload,
      vendorId: vendor.id,
      udyamNumber: detectedUdyam,
      udyamStatus,
      raw: {
        ...(payload.raw || {}),
        verificationStatusAtCreate: udyamStatus,
      },
    },
    actor
  );
  return { invoice, vendor, verification };
}

async function list(req, res, next) {
  try {
    res.json({ success: true, invoices: purchaseRepository.listInvoices(req.query || {}) });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const payload = req.body || {};
    if (!payload.vendorName) return res.status(400).json({ success: false, error: "vendorName is required" });
    const result = await createOne({ ...payload, source: payload.source || "manual" }, actorFromRequest(req));
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function bulkCreate(req, res, next) {
  try {
    const rows = Array.isArray(req.body?.invoices) ? req.body.invoices : [];
    if (!rows.length) return res.status(400).json({ success: false, error: "invoices array is required" });
    const actor = actorFromRequest(req);
    const results = [];
    for (const row of rows) {
      if (!row.vendorName) continue;
      results.push(await createOne({ ...row, source: row.source || req.body.source || "csv" }, actor));
    }
    res.json({ success: true, imported: results.length, invoices: results.map((result) => result.invoice) });
  } catch (error) {
    next(error);
  }
}

async function verifyInvoiceUdyam(req, res, next) {
  try {
    const invoice = purchaseRepository.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: "Purchase invoice not found" });
    const udyamNumber = req.body?.udyamNumber || invoice.udyamNumber;
    if (!udyamNumber) return res.status(400).json({ success: false, error: "udyamNumber is required" });
    const actor = actorFromRequest(req);
    const vendor = await ensureVendor({ vendorName: invoice.vendorName, udyamNumber, actor });
    const result = await verifyAndPersist({ vendor, vendorName: invoice.vendorName, udyamNumber, actor });
    const updatedInvoice = purchaseRepository.updateInvoice(invoice.id, {
      vendorId: result.vendor.id,
      udyamNumber,
      udyamStatus: result.status,
    });
    res.json({ success: true, invoice: updatedInvoice, vendor: result.vendor, verification: result.verification });
  } catch (error) {
    next(error);
  }
}

async function importFromTally(req, res, next) {
  try {
    const actor = actorFromRequest(req);
    const {
      fiscalYear = "2025-26",
      fromDate = "20250401",
      toDate = "20260331",
      asOn,
    } = req.body || {};
    const importResult = await tallyImportService.importFromTally({ fiscalYear, fromDate, toDate, asOn, actor });
    const invoices = [];
    let index = 1;
    for (const creditor of importResult.creditors) {
      const result = await createOne(
        {
          vendorName: creditor.party,
          invoiceNumber: `TALLY-${importResult.importRun.id}-${index}`,
          invoiceDate: creditor.oldestInvoiceDate || "",
          invoiceAmount: creditor.outstandingAmount || 0,
          outstandingAmount: creditor.outstandingAmount || 0,
          paymentStatus: "unpaid",
          source: "tally",
          notes: `Imported from Tally creditor summary. Bucket: ${creditor.bucket || "Unknown"}`,
          autoVerify: false,
          raw: creditor,
        },
        actor
      );
      invoices.push(result.invoice);
      index += 1;
    }
    res.json({ success: true, importRun: importResult.importRun, imported: invoices.length, invoices });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, bulkCreate, verifyInvoiceUdyam, importFromTally };
