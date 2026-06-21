const vendorRepository = require("../repositories/vendorRepository");
const tallyImportService = require("../services/tallyImport.service");
const { verifyUdyamNumber } = require("../services/udyamVerifier.service");
const udyamFallbackService = require("../services/udyamFallback.service");
const { actorFromUser } = require("../middleware/auth");

function actorFromRequest(req) {
  return actorFromUser(req);
}

async function master(req, res, next) {
  try {
    res.json({ success: true, vendors: await vendorRepository.getAllVendors() });
  } catch (error) {
    next(error);
  }
}

async function unverified(req, res, next) {
  try {
    const names = String(req.query.names || "")
      .split("|")
      .map((name) => name.trim())
      .filter(Boolean);
    res.json({ success: true, vendors: await vendorRepository.getUnverified(names) });
  } catch (error) {
    next(error);
  }
}

async function saveStatus(req, res, next) {
  try {
    const payload = req.body || {};
    if (!payload.vendorName) return res.status(400).json({ success: false, error: "vendorName is required" });
    if (payload.isMSME) {
      return res.status(400).json({
        success: false,
        error: "MSME vendors must be verified through /api/vendors/verify-udyam before they can enter reports.",
      });
    }
    if (payload.verificationStatus === "not_msme") {
      payload.actionStatus = "non_msme";
      payload.reviewStatus = "approved";
      payload.excludedReason = "non_msme";
    }
    const vendor = await vendorRepository.upsertVendorStatus(payload, actorFromRequest(req));
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}

async function seedFromImport(req, res, next) {
  try {
    const { importRunId } = req.body || {};
    if (!importRunId) return res.status(400).json({ success: false, error: "importRunId is required" });
    const summary = tallyImportService.seedVendorMasterFromImport(importRunId, actorFromRequest(req));
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
}

async function markNotRequired(req, res, next) {
  try {
    const { importRunId, reason } = req.body || {};
    if (!importRunId) return res.status(400).json({ success: false, error: "importRunId is required" });
    const summary = vendorRepository.markZeroOutstandingNotRequired({
      importRunId,
      reason: reason || "Zero outstanding/current activity in selected import",
      actor: actorFromRequest(req),
    });
    const refreshed = tallyImportService.getImportRun(importRunId);
    res.json({ success: true, summary, creditors: refreshed?.creditors || [] });
  } catch (error) {
    next(error);
  }
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function canonicalUdyamImportHeader(header) {
  const normalized = String(header || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const aliases = {
    vendorname: "vendorName",
    vendor: "vendorName",
    name: "vendorName",
    party: "vendorName",
    suppliername: "vendorName",
    udyamnumber: "udyamNumber",
    udhyamnumber: "udyamNumber",
    udyam: "udyamNumber",
    udhyam: "udyamNumber",
    udyamno: "udyamNumber",
    udhyamno: "udyamNumber",
    udyamregistrationnumber: "udyamNumber",
    udhyamregistrationnumber: "udyamNumber",
    paymentterms: "paymentTerms",
    paymentterm: "paymentTerms",
    agreedpaymentdays: "paymentTerms",
    allowedpaymentdays: "paymentTerms",
  };
  return aliases[normalized] || String(header || "").trim();
}

function parseCsvText(csvText) {
  const lines = String(csvText || "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(canonicalUdyamImportHeader);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function writeSse(res, event) {
  res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n\n`);
}

async function importUdyam(req, res, next) {
  try {
    const payload = req.body || {};
    const rows = Array.isArray(payload.rows) ? payload.rows : parseCsvText(payload.csvText);
    if (!rows.length) return res.status(400).json({ success: false, error: "rows or csvText is required" });
    const summary = payload.autoVerify
      ? await vendorRepository.importUdyamRowsWithVerification(rows, actorFromRequest(req), {
        sourceFileName: payload.sourceFileName || "",
        retries: payload.retries ?? 1,
      })
      : vendorRepository.importUdyamRows(rows, actorFromRequest(req));
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
}

async function importUdyamLive(req, res, next) {
  try {
    const payload = req.body || {};
    const rows = Array.isArray(payload.rows) ? payload.rows : parseCsvText(payload.csvText);
    if (!rows.length) return res.status(400).json({ success: false, error: "rows or csvText is required" });
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (res.flushHeaders) res.flushHeaders();
    const summary = await vendorRepository.importUdyamRowsWithVerification(rows, actorFromRequest(req), {
      sourceFileName: payload.sourceFileName || "",
      retries: payload.retries ?? 1,
      onEvent: (event) => writeSse(res, event),
    });
    writeSse(res, { type: "stream_closed", summary, message: "Live verification stream closed." });
    res.end();
  } catch (error) {
    if (res.headersSent) {
      writeSse(res, { type: "stream_error", status: "failed", message: error.message });
      res.end();
      return;
    }
    next(error);
  }
}

async function verificationQueue(req, res, next) {
  try {
    res.json({ success: true, vendors: vendorRepository.getVerificationQueue() });
  } catch (error) {
    next(error);
  }
}

async function verifyUdyam(req, res, next) {
  try {
    const { vendorName, udyamNumber, panNumber } = req.body || {};
    if (!vendorName) return res.status(400).json({ success: false, error: "vendorName is required" });
    if (!udyamNumber) return res.status(400).json({ success: false, error: "udyamNumber is required" });

    let verification = await verifyUdyamNumber(udyamNumber);
    let verificationSource = verification.verified ? "live_portal" : "manual_review";
    let fallbackMatch = null;
    if (!verification.verified) {
      fallbackMatch = udyamFallbackService.findFallback({ vendorName, udyamNumber, panNumber });
      if (fallbackMatch) {
        verification = {
          ...verification,
          verified: true,
          verificationStatus: "verified",
          udyamNumber: fallbackMatch.udyamNumber || String(udyamNumber).trim().toUpperCase(),
          enterpriseName: fallbackMatch.enterpriseName || fallbackMatch.vendorName || vendorName,
          enterpriseType: fallbackMatch.enterpriseType || "Micro",
          registrationValidity: fallbackMatch.registrationValidity,
          registrationDate: fallbackMatch.registrationDate,
          verifiedAt: new Date().toISOString(),
          fallbackMatched: true,
          fallbackMatchedBy: fallbackMatch.matchedBy,
          fallbackSourceWorkbook: fallbackMatch.sourceWorkbook,
          fallbackSourceSheet: fallbackMatch.sourceSheet,
          fallbackEvidencePath: fallbackMatch.evidencePath,
          fallbackRootDir: fallbackMatch.fallbackRootDir,
          error: "",
        };
        verificationSource = "fallback_upload";
      }
    }
    const vendor = await vendorRepository.upsertVendorStatus(
      {
        vendorName,
        isMSME: verification.verified,
        udyamNumber: verification.udyamNumber,
        enterpriseName: verification.enterpriseName,
        enterpriseType: verification.enterpriseType,
        panNumber: fallbackMatch?.panNumber || panNumber || "",
        verificationStatus: verification.verified ? "verified" : verification.verificationStatus,
        udyamStatus: verification.verified ? "verified" : verification.verificationStatus || "manual_fallback_required",
        actionStatus: verification.verified ? "verified_msme" : (verification.verificationStatus === "invalid_format" ? "failed" : "manual_review"),
        reviewStatus: verification.verified ? "approved" : "manual_review",
        udyamRemarks: verification.verified
          ? (verificationSource === "fallback_upload" ? "Fallback data used" : "Live portal verified")
          : verification.error || "Udyam portal automation did not produce a certain verified result.",
        registrationValidity: verification.registrationValidity,
        registrationDate: verification.registrationDate,
        verifiedAt: verification.verifiedAt,
        lastVerifiedAt: new Date().toISOString(),
        verificationSource,
        evidenceLink: verification.fallbackEvidencePath || verification.screenshotPath || "",
        evidenceUrl: verification.fallbackEvidencePath || verification.screenshotPath || "",
        udyamProofFileUrl: verification.fallbackEvidencePath || verification.screenshotPath || "",
        evidenceDocumentType: verification.fallbackEvidencePath ? "fallback_msme_evidence" : "",
      },
      actorFromRequest(req),
      verificationSource
    );
    vendorRepository.recordVerificationAttempt({
      vendorId: vendor.id,
      vendorName,
      udyamNumber: verification.udyamNumber,
      status: verification.verificationStatus,
      response: verification,
      screenshotPath: verification.screenshotPath,
      actor: actorFromRequest(req),
    });

    res.json({ success: true, verification, vendor });
  } catch (error) {
    next(error);
  }
}

async function uploadUdyamProof(req, res, next) {
  try {
    const { proofFileUrl, proofUrl, proofMetadata, remarks } = req.body || {};
    const proof = proofFileUrl || proofUrl || proofMetadata;
    if (!proof) return res.status(400).json({ success: false, error: "proofFileUrl, proofUrl, or proofMetadata is required" });
    const vendor = vendorRepository.updateVendorById(
      req.params.id,
      {
        udyamStatus: "pending_manual_review",
        actionStatus: "manual_review",
        reviewStatus: "manual_review",
        udyamProofFileUrl: typeof proof === "string" ? proof : JSON.stringify(proof),
        evidenceUrl: typeof proof === "string" ? proof : JSON.stringify(proof),
        udyamProofUploadedAt: new Date().toISOString(),
        proofNotes: remarks || "",
        udyamRemarks: remarks || "",
      },
      actorFromRequest(req),
      "udyam_proof_uploaded"
    );
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}

async function approveUdyamProof(req, res, next) {
  try {
    const { remarks } = req.body || {};
    const actor = actorFromRequest(req);
    const vendor = vendorRepository.updateVendorById(
      req.params.id,
      {
        isMSME: true,
        verificationStatus: "verified",
        udyamStatus: "approved",
        actionStatus: "verified_msme",
        reviewStatus: "approved",
        udyamVerifiedBy: actor,
        udyamVerifiedAt: new Date().toISOString(),
        reviewedBy: actor,
        reviewedAt: new Date().toISOString(),
        reviewComment: remarks || "Udyam proof approved by CA/admin.",
        verifiedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        udyamRemarks: remarks || "Udyam proof approved by CA/admin.",
      },
      actor,
      "udyam_proof_approved"
    );
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}

async function rejectUdyamProof(req, res, next) {
  try {
    const { remarks } = req.body || {};
    const vendor = vendorRepository.updateVendorById(
      req.params.id,
      {
        isMSME: false,
        verificationStatus: "rejected",
        udyamStatus: "rejected",
        actionStatus: "failed",
        excludedReason: "manual_rejected",
        reviewStatus: "rejected",
        reviewedBy: actorFromRequest(req),
        reviewedAt: new Date().toISOString(),
        reviewComment: remarks || "Udyam proof rejected.",
        udyamRemarks: remarks || "Udyam proof rejected.",
      },
      actorFromRequest(req),
      "udyam_proof_rejected"
    );
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}

async function proofReview(req, res, next) {
  try {
    const { decision, remarks } = req.body || {};
    if (decision === "approve") return approveUdyamProof(req, res, next);
    if (decision === "reject") return rejectUdyamProof(req, res, next);
    return res.status(400).json({ success: false, error: "decision must be approve or reject" });
  } catch (error) {
    next(error);
  }
}

async function manualReview(req, res, next) {
  try {
    res.json({ success: true, vendors: vendorRepository.getManualReviewVendors() });
  } catch (error) {
    next(error);
  }
}

async function auditTrail(req, res, next) {
  try {
    res.json({ success: true, auditTrail: await vendorRepository.getAuditTrail() });
  } catch (error) {
    next(error);
  }
}

async function auditTrailDownload(req, res, next) {
  try {
    const format = String(req.query.format || "csv").toLowerCase();
    const rows = await vendorRepository.getAuditTrail();
    if (format === "json") {
      res.type("application/json");
      res.setHeader("Content-Disposition", "attachment; filename=MSME_Audit_Trail.json");
      res.send(JSON.stringify(rows, null, 2));
      return;
    }
    res.type("text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=MSME_Audit_Trail.csv");
    res.send(vendorRepository.toAuditCsv(rows));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  master,
  unverified,
  saveStatus,
  seedFromImport,
  markNotRequired,
  importUdyam,
  importUdyamLive,
  verificationQueue,
  verifyUdyam,
  uploadUdyamProof,
  approveUdyamProof,
  rejectUdyamProof,
  proofReview,
  manualReview,
  auditTrail,
  auditTrailDownload,
};
