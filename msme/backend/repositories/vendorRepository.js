const crypto = require("crypto");
const db = require("../config/database");
const { normalizeVendorName } = require("../utils/normalizeVendorName");
const { validateUdyamNumber, verifyUdyamNumber } = require("../services/udyamVerifier.service");
const udyamFallbackService = require("../services/udyamFallback.service");
const { isSundryCreditorRow } = require("../utils/sundryCreditor");

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapVendor(row) {
  if (!row) return null;
  const udyamStatus = row.udyam_status || "not_started";
  const verificationStatus = row.verification_status || "pending";
  return {
    id: row.id,
    vendorName: row.vendor_name,
    normalizedVendorName: row.normalized_vendor_name,
    isMSME: Boolean(row.is_msme),
    udyamNumber: row.udyam_number || "",
    enterpriseType: row.enterprise_type || "",
    panNumber: row.pan_number || "",
    agreedPaymentDays: Number(row.agreed_payment_days || 0),
    verificationStatus,
    enterpriseName: row.enterprise_name || "",
    registrationValidity: row.registration_validity || "",
    registrationDate: row.registration_date || "",
    verifiedAt: row.verified_at || "",
    lastVerifiedAt: row.last_verified_at || "",
    udyamStatus,
    udyamProofFileUrl: row.udyam_proof_file_url || "",
    udyamProofUploadedAt: row.udyam_proof_uploaded_at || "",
    udyamVerifiedBy: row.udyam_verified_by || "",
    udyamVerifiedAt: row.udyam_verified_at || "",
    udyamRemarks: row.udyam_remarks || "",
    actionStatus: row.action_status || deriveActionStatus({ ...row, udyam_status: udyamStatus, verification_status: verificationStatus }),
    excludedReason: row.excluded_reason || "",
    evidenceUrl: row.evidence_url || "",
    verificationSource: row.verification_source || "manual",
    evidenceLink: row.evidence_link || row.evidence_url || row.udyam_proof_file_url || "",
    evidenceDocumentType: row.evidence_document_type || "",
    approvedBy: row.approved_by || row.reviewed_by || row.udyam_verified_by || "",
    approvedAt: row.approved_at || row.reviewed_at || row.udyam_verified_at || "",
    writtenAgreementDefault: Boolean(row.written_agreement_default),
    agreementCreditDays: Number(row.agreement_credit_days || row.agreed_payment_days || 0),
    agreementEvidenceLink: row.agreement_evidence_link || "",
    proofNotes: row.proof_notes || "",
    reviewStatus: row.review_status || "queued",
    reviewedBy: row.reviewed_by || "",
    reviewedAt: row.reviewed_at || "",
    reviewComment: row.review_comment || "",
    sourceImportRunId: row.source_import_run_id || "",
    lastImportRunId: row.last_import_run_id || "",
    createdBy: row.created_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deriveActionStatus(row) {
  if (row.action_status) return row.action_status;
  if (["verified", "approved"].includes(row.udyam_status)) return "verified_msme";
  if (row.verification_status === "not_msme") return "non_msme";
  if (row.verification_status === "not_required_zero_outstanding" || row.udyam_status === "not_required") return "not_required_zero_outstanding";
  if (["pending_manual_review", "manual_fallback_required"].includes(row.udyam_status)) return "manual_review";
  if (["failed", "rejected", "invalid_format"].includes(row.udyam_status) || ["failed", "rejected"].includes(row.verification_status)) return "failed";
  return "pending_action";
}

function writeAudit({ vendorId, action, oldValue, newValue, actor, source, timestamp = nowIso() }) {
  db.prepare(`
    INSERT INTO vendor_audit_log (
      id, vendor_id, action, old_value, new_value, changed_by, changed_at, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    vendorId,
    action,
    oldValue ? JSON.stringify(oldValue) : "",
    JSON.stringify(newValue || {}),
    actor || "unknown",
    timestamp,
    source || "manual"
  );
}

function getRawByNormalized(normalizedVendorName) {
  return db.prepare("SELECT * FROM vendor_master WHERE normalized_vendor_name = ?").get(normalizedVendorName);
}

function getRawById(id) {
  return db.prepare("SELECT * FROM vendor_master WHERE id = ?").get(id);
}

function findByNormalizedName(normalizedVendorName) {
  return mapVendor(getRawByNormalized(normalizedVendorName));
}

function findManyByNames(vendorNames) {
  const normalized = [...new Set(vendorNames.map(normalizeVendorName).filter(Boolean))];
  if (!normalized.length) return [];
  const placeholders = normalized.map(() => "?").join(",");
  return db
    .prepare(`SELECT * FROM vendor_master WHERE normalized_vendor_name IN (${placeholders})`)
    .all(...normalized)
    .map(mapVendor);
}

function getAllVendors() {
  return db.prepare("SELECT * FROM vendor_master ORDER BY vendor_name COLLATE NOCASE").all().map(mapVendor);
}

function findById(id) {
  return mapVendor(getRawById(id));
}

function getUnverified(vendorNames = []) {
  const existing = findManyByNames(vendorNames);
  const byNormalized = new Map(existing.map((vendor) => [vendor.normalizedVendorName, vendor]));
  return [...new Set(vendorNames.map(normalizeVendorName).filter(Boolean))]
    .map((normalized) => byNormalized.get(normalized))
    .filter((vendor) => !vendor || ["pending", "failed", "manual_fallback_required"].includes(vendor.verificationStatus));
}

function upsertVendorStatus(input, actor = "unknown", source = "manual") {
  const timestamp = nowIso();
  const normalizedVendorName = normalizeVendorName(input.vendorName);
  if (!normalizedVendorName) throw new Error("vendorName is required");

  const oldRow = getRawByNormalized(normalizedVendorName);
  const oldVendor = mapVendor(oldRow);
  const id = oldVendor?.id || crypto.randomUUID();
  const isMSME = Boolean(input.isMSME);
  const verificationStatus = input.verificationStatus || (isMSME ? "verified" : "not_msme");
  const udyamStatus = input.udyamStatus || (
    verificationStatus === "verified" ? "verified" :
    verificationStatus === "manual_fallback_required" ? "manual_fallback_required" :
    oldVendor?.udyamStatus || "not_started"
  );
  const vendor = {
    id,
    vendor_name: input.vendorName.trim(),
    normalized_vendor_name: normalizedVendorName,
    is_msme: isMSME ? 1 : 0,
    udyam_number: input.udyamNumber || "",
    enterprise_type: isMSME ? input.enterpriseType || "" : "",
    pan_number: input.panNumber ?? oldVendor?.panNumber ?? "",
    agreed_payment_days: Number(input.agreedPaymentDays ?? oldVendor?.agreedPaymentDays ?? 0) || 0,
    verification_status: verificationStatus,
    enterprise_name: input.enterpriseName || "",
    registration_validity: input.registrationValidity || "",
    registration_date: input.registrationDate || "",
    verified_at: input.verifiedAt || oldVendor?.verifiedAt || (verificationStatus === "verified" ? timestamp : ""),
    last_verified_at: input.lastVerifiedAt || timestamp,
    udyam_status: udyamStatus,
    udyam_proof_file_url: input.udyamProofFileUrl ?? oldVendor?.udyamProofFileUrl ?? "",
    udyam_proof_uploaded_at: input.udyamProofUploadedAt ?? oldVendor?.udyamProofUploadedAt ?? "",
    udyam_verified_by: input.udyamVerifiedBy ?? oldVendor?.udyamVerifiedBy ?? "",
    udyam_verified_at: input.udyamVerifiedAt ?? oldVendor?.udyamVerifiedAt ?? "",
    udyam_remarks: input.udyamRemarks ?? oldVendor?.udyamRemarks ?? "",
    action_status: input.actionStatus || deriveActionStatus({
      udyam_status: udyamStatus,
      verification_status: verificationStatus,
      action_status: oldVendor?.actionStatus,
    }),
    excluded_reason: input.excludedReason ?? oldVendor?.excludedReason ?? "",
    evidence_url: input.evidenceUrl ?? oldVendor?.evidenceUrl ?? input.udyamProofFileUrl ?? oldVendor?.udyamProofFileUrl ?? "",
    verification_source: input.verificationSource ?? oldVendor?.verificationSource ?? source ?? "manual",
    evidence_link: input.evidenceLink ?? oldVendor?.evidenceLink ?? input.evidenceUrl ?? oldVendor?.evidenceUrl ?? input.udyamProofFileUrl ?? oldVendor?.udyamProofFileUrl ?? "",
    evidence_document_type: input.evidenceDocumentType ?? oldVendor?.evidenceDocumentType ?? "",
    approved_by: input.approvedBy ?? oldVendor?.approvedBy ?? input.reviewedBy ?? oldVendor?.reviewedBy ?? "",
    approved_at: input.approvedAt ?? oldVendor?.approvedAt ?? input.reviewedAt ?? oldVendor?.reviewedAt ?? "",
    written_agreement_default: input.writtenAgreementDefault ?? oldVendor?.writtenAgreementDefault ? 1 : 0,
    agreement_credit_days: Number(input.agreementCreditDays ?? input.agreedPaymentDays ?? oldVendor?.agreementCreditDays ?? 0) || 0,
    agreement_evidence_link: input.agreementEvidenceLink ?? oldVendor?.agreementEvidenceLink ?? "",
    proof_notes: input.proofNotes ?? oldVendor?.proofNotes ?? "",
    review_status: input.reviewStatus ?? oldVendor?.reviewStatus ?? "queued",
    reviewed_by: input.reviewedBy ?? oldVendor?.reviewedBy ?? "",
    reviewed_at: input.reviewedAt ?? oldVendor?.reviewedAt ?? "",
    review_comment: input.reviewComment ?? oldVendor?.reviewComment ?? "",
    source_import_run_id: input.sourceImportRunId ?? oldVendor?.sourceImportRunId ?? "",
    last_import_run_id: input.lastImportRunId ?? oldVendor?.lastImportRunId ?? "",
    created_by: oldVendor?.createdBy || actor,
    created_at: oldVendor?.createdAt || timestamp,
    updated_at: timestamp,
  };

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO vendor_master (
        id, vendor_name, normalized_vendor_name, is_msme, udyam_number, enterprise_type, pan_number, agreed_payment_days,
        verification_status, enterprise_name, registration_validity, registration_date,
        verified_at, last_verified_at, udyam_status, udyam_proof_file_url, udyam_proof_uploaded_at,
        udyam_verified_by, udyam_verified_at, udyam_remarks,
        action_status, excluded_reason, evidence_url, proof_notes, review_status,
        reviewed_by, reviewed_at, review_comment, source_import_run_id, last_import_run_id,
        verification_source, evidence_link, evidence_document_type, approved_by, approved_at,
        written_agreement_default, agreement_credit_days, agreement_evidence_link,
        created_by, created_at, updated_at
      ) VALUES (
        @id, @vendor_name, @normalized_vendor_name, @is_msme, @udyam_number, @enterprise_type, @pan_number, @agreed_payment_days,
        @verification_status, @enterprise_name, @registration_validity, @registration_date,
        @verified_at, @last_verified_at, @udyam_status, @udyam_proof_file_url, @udyam_proof_uploaded_at,
        @udyam_verified_by, @udyam_verified_at, @udyam_remarks,
        @action_status, @excluded_reason, @evidence_url, @proof_notes, @review_status,
        @reviewed_by, @reviewed_at, @review_comment, @source_import_run_id, @last_import_run_id,
        @verification_source, @evidence_link, @evidence_document_type, @approved_by, @approved_at,
        @written_agreement_default, @agreement_credit_days, @agreement_evidence_link,
        @created_by, @created_at, @updated_at
      )
      ON CONFLICT(normalized_vendor_name) DO UPDATE SET
        vendor_name = excluded.vendor_name,
        is_msme = excluded.is_msme,
        udyam_number = excluded.udyam_number,
        enterprise_type = excluded.enterprise_type,
        pan_number = COALESCE(NULLIF(excluded.pan_number, ''), vendor_master.pan_number),
        agreed_payment_days = COALESCE(NULLIF(excluded.agreed_payment_days, 0), vendor_master.agreed_payment_days),
        verification_status = excluded.verification_status,
        enterprise_name = excluded.enterprise_name,
        registration_validity = excluded.registration_validity,
        registration_date = excluded.registration_date,
        verified_at = excluded.verified_at,
        last_verified_at = excluded.last_verified_at,
        udyam_status = excluded.udyam_status,
        udyam_proof_file_url = excluded.udyam_proof_file_url,
        udyam_proof_uploaded_at = excluded.udyam_proof_uploaded_at,
        udyam_verified_by = excluded.udyam_verified_by,
        udyam_verified_at = excluded.udyam_verified_at,
        udyam_remarks = excluded.udyam_remarks,
        action_status = excluded.action_status,
        excluded_reason = excluded.excluded_reason,
        evidence_url = excluded.evidence_url,
        proof_notes = excluded.proof_notes,
        review_status = excluded.review_status,
        reviewed_by = excluded.reviewed_by,
        reviewed_at = excluded.reviewed_at,
        review_comment = excluded.review_comment,
        verification_source = excluded.verification_source,
        evidence_link = excluded.evidence_link,
        evidence_document_type = excluded.evidence_document_type,
        approved_by = excluded.approved_by,
        approved_at = excluded.approved_at,
        written_agreement_default = excluded.written_agreement_default,
        agreement_credit_days = excluded.agreement_credit_days,
        agreement_evidence_link = excluded.agreement_evidence_link,
        source_import_run_id = COALESCE(NULLIF(vendor_master.source_import_run_id, ''), excluded.source_import_run_id),
        last_import_run_id = excluded.last_import_run_id,
        updated_at = excluded.updated_at
    `).run(vendor);

    const nextVendor = mapVendor(getRawById(id));
    writeAudit({
      id,
      vendorId: id,
      action: oldVendor ? "vendor_status_updated" : "vendor_status_created",
      oldValue: oldVendor,
      newValue: nextVendor,
      actor,
      timestamp,
      source,
    });
  });

  tx();
  return mapVendor(getRawById(id));
}

function updateVendorById(id, patch, actor = "unknown", source = "manual") {
  const oldVendor = findById(id);
  if (!oldVendor) throw new Error("Vendor not found");
  return upsertVendorStatus(
    {
      vendorName: patch.vendorName || oldVendor.vendorName,
      isMSME: patch.isMSME ?? oldVendor.isMSME,
      udyamNumber: patch.udyamNumber ?? oldVendor.udyamNumber,
      enterpriseName: patch.enterpriseName ?? oldVendor.enterpriseName,
      enterpriseType: patch.enterpriseType ?? oldVendor.enterpriseType,
      panNumber: patch.panNumber ?? oldVendor.panNumber,
      agreedPaymentDays: patch.agreedPaymentDays ?? oldVendor.agreedPaymentDays,
      verificationStatus: patch.verificationStatus ?? oldVendor.verificationStatus,
      registrationValidity: patch.registrationValidity ?? oldVendor.registrationValidity,
      registrationDate: patch.registrationDate ?? oldVendor.registrationDate,
      verifiedAt: patch.verifiedAt ?? oldVendor.verifiedAt,
      lastVerifiedAt: patch.lastVerifiedAt ?? oldVendor.lastVerifiedAt,
      udyamStatus: patch.udyamStatus ?? oldVendor.udyamStatus,
      udyamProofFileUrl: patch.udyamProofFileUrl ?? oldVendor.udyamProofFileUrl,
      udyamProofUploadedAt: patch.udyamProofUploadedAt ?? oldVendor.udyamProofUploadedAt,
      udyamVerifiedBy: patch.udyamVerifiedBy ?? oldVendor.udyamVerifiedBy,
      udyamVerifiedAt: patch.udyamVerifiedAt ?? oldVendor.udyamVerifiedAt,
      udyamRemarks: patch.udyamRemarks ?? oldVendor.udyamRemarks,
      actionStatus: patch.actionStatus ?? oldVendor.actionStatus,
      excludedReason: patch.excludedReason ?? oldVendor.excludedReason,
      evidenceUrl: patch.evidenceUrl ?? oldVendor.evidenceUrl,
      verificationSource: patch.verificationSource ?? oldVendor.verificationSource,
      evidenceLink: patch.evidenceLink ?? oldVendor.evidenceLink,
      evidenceDocumentType: patch.evidenceDocumentType ?? oldVendor.evidenceDocumentType,
      approvedBy: patch.approvedBy ?? oldVendor.approvedBy,
      approvedAt: patch.approvedAt ?? oldVendor.approvedAt,
      writtenAgreementDefault: patch.writtenAgreementDefault ?? oldVendor.writtenAgreementDefault,
      agreementCreditDays: patch.agreementCreditDays ?? oldVendor.agreementCreditDays,
      agreementEvidenceLink: patch.agreementEvidenceLink ?? oldVendor.agreementEvidenceLink,
      proofNotes: patch.proofNotes ?? oldVendor.proofNotes,
      reviewStatus: patch.reviewStatus ?? oldVendor.reviewStatus,
      reviewedBy: patch.reviewedBy ?? oldVendor.reviewedBy,
      reviewedAt: patch.reviewedAt ?? oldVendor.reviewedAt,
      reviewComment: patch.reviewComment ?? oldVendor.reviewComment,
      sourceImportRunId: patch.sourceImportRunId ?? oldVendor.sourceImportRunId,
      lastImportRunId: patch.lastImportRunId ?? oldVendor.lastImportRunId,
    },
    actor,
    source
  );
}

function isProtectedVendor(vendor) {
  if (!vendor) return false;
  return (
    ["verified", "approved"].includes(vendor.udyamStatus) ||
    ["not_msme", "not_required_zero_outstanding", "rejected"].includes(vendor.verificationStatus) ||
    ["verified_msme", "non_msme", "not_required_zero_outstanding", "failed"].includes(vendor.actionStatus)
  );
}

function seedFromImport(importRunId, creditors, actor = "unknown") {
  const timestamp = nowIso();
  let created = 0;
  let updated = 0;
  let preserved = 0;
  const importCreditors = (creditors || []).filter(isSundryCreditorRow);
  const tx = db.transaction(() => {
    for (const creditor of importCreditors) {
      const vendorName = creditor.party || creditor.vendorName;
      const normalizedVendorName = creditor.normalizedVendorName || normalizeVendorName(vendorName);
      if (!vendorName || !normalizedVendorName) continue;
      const oldVendor = findByNormalizedName(normalizedVendorName);
      if (!oldVendor) {
        const id = crypto.randomUUID();
        const detectedUdyamNumber = String(creditor.detectedUdyamNumber || creditor.raw?.udyamNumber || "").trim().toUpperCase();
        const panNumber = String(creditor.panNumber || creditor.raw?.panNumber || "").trim().toUpperCase();
        const hasDetectedUdyam = validateUdyamNumber(detectedUdyamNumber);
        db.prepare(`
          INSERT INTO vendor_master (
            id, vendor_name, normalized_vendor_name, is_msme, udyam_number, enterprise_type, pan_number,
            verification_status, enterprise_name, registration_validity, registration_date,
            verified_at, last_verified_at, udyam_status, action_status, excluded_reason,
            review_status, source_import_run_id, last_import_run_id, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '', '', ?,
            ?, '', ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          vendorName,
          normalizedVendorName,
          hasDetectedUdyam ? 1 : 0,
          hasDetectedUdyam ? detectedUdyamNumber : "",
          hasDetectedUdyam ? "Micro" : "",
          panNumber,
          hasDetectedUdyam ? "pending_manual_review" : "pending",
          hasDetectedUdyam ? "pending_manual_review" : "not_started",
          hasDetectedUdyam ? "manual_review" : "pending_action",
          hasDetectedUdyam ? "manual_review" : "queued",
          importRunId,
          importRunId,
          actor,
          timestamp,
          timestamp
        );
        const nextVendor = mapVendor(getRawById(id));
        writeAudit({
          vendorId: id,
          action: "vendor_master_seeded",
          newValue: nextVendor,
          actor,
          source: "tally_import_seed",
          timestamp,
        });
        created += 1;
        continue;
      }
      const oldRaw = oldVendor;
      const active = Number(creditor.voucherCount || 0) > 0 || Math.abs(Number(creditor.outstandingAmount || 0)) > 0;
      const detectedUdyamNumber = String(creditor.detectedUdyamNumber || creditor.raw?.udyamNumber || "").trim().toUpperCase();
      const panNumber = String(creditor.panNumber || creditor.raw?.panNumber || "").trim().toUpperCase();
      const shouldPrefillUdyam = validateUdyamNumber(detectedUdyamNumber) && !oldVendor.udyamNumber && !isProtectedVendor(oldVendor);
      const nextActionStatus = isProtectedVendor(oldVendor) ? oldVendor.actionStatus : (active ? "pending_action" : oldVendor.actionStatus || "pending_action");
      db.prepare(`
        UPDATE vendor_master
        SET vendor_name = ?,
            pan_number = COALESCE(NULLIF(?, ''), pan_number),
            is_msme = CASE WHEN ? THEN 1 ELSE is_msme END,
            udyam_number = CASE WHEN ? THEN ? ELSE udyam_number END,
            enterprise_type = CASE WHEN ? THEN 'Micro' ELSE enterprise_type END,
            verification_status = CASE WHEN ? THEN 'pending_manual_review' ELSE verification_status END,
            udyam_status = CASE WHEN ? THEN 'pending_manual_review' ELSE udyam_status END,
            action_status = CASE WHEN ? THEN 'manual_review' ELSE ? END,
            review_status = CASE WHEN ? THEN 'manual_review' ELSE review_status END,
            last_import_run_id = ?,
            source_import_run_id = COALESCE(NULLIF(source_import_run_id, ''), ?),
            updated_at = ?
        WHERE normalized_vendor_name = ?
      `).run(
        vendorName,
        panNumber,
        shouldPrefillUdyam ? 1 : 0,
        shouldPrefillUdyam ? 1 : 0,
        detectedUdyamNumber,
        shouldPrefillUdyam ? 1 : 0,
        shouldPrefillUdyam ? 1 : 0,
        shouldPrefillUdyam ? 1 : 0,
        shouldPrefillUdyam ? 1 : 0,
        nextActionStatus,
        shouldPrefillUdyam ? 1 : 0,
        importRunId,
        importRunId,
        timestamp,
        normalizedVendorName
      );
      const nextVendor = findByNormalizedName(normalizedVendorName);
      if (isProtectedVendor(oldRaw)) preserved += 1;
      else updated += 1;
      writeAudit({
        vendorId: oldVendor.id,
        action: "vendor_master_seeded",
        oldValue: oldRaw,
        newValue: nextVendor,
        actor,
        source: "tally_import_seed",
        timestamp,
      });
    }
  });
  tx();
  return { importRunId, created, updated, preserved, skippedNonSundry: (creditors || []).length - importCreditors.length, total: created + updated + preserved };
}

function markZeroOutstandingNotRequired({ importRunId, actor = "unknown", reason = "Zero outstanding/current activity in selected import" }) {
  const timestamp = nowIso();
  const rows = db.prepare(`
    SELECT vm.*
    FROM vendor_master vm
    JOIN tally_import_creditors tic ON tic.normalized_vendor_name = vm.normalized_vendor_name
    WHERE tic.import_run_id = ?
      AND ABS(COALESCE(tic.outstanding_amount, 0)) = 0
      AND COALESCE(tic.voucher_count, 0) = 0
      AND COALESCE(vm.verification_status, 'pending') NOT IN ('verified', 'not_msme', 'rejected')
      AND COALESCE(vm.udyam_status, 'not_started') NOT IN ('verified', 'approved', 'pending_manual_review')
  `).all(importRunId);
  const tx = db.transaction(() => {
    for (const row of rows) {
      const oldVendor = mapVendor(row);
      db.prepare(`
        UPDATE vendor_master
        SET is_msme = 0,
            verification_status = 'not_required_zero_outstanding',
            udyam_status = 'not_required',
            action_status = 'not_required_zero_outstanding',
            excluded_reason = ?,
            review_status = 'not_required',
            reviewed_by = ?,
            reviewed_at = ?,
            review_comment = ?,
            last_import_run_id = ?,
            updated_at = ?
        WHERE id = ?
      `).run(reason, actor, timestamp, reason, importRunId, timestamp, row.id);
      writeAudit({
        vendorId: row.id,
        action: "vendor_marked_not_required",
        oldValue: oldVendor,
        newValue: findById(row.id),
        actor,
        source: "zero_outstanding_bulk_action",
        timestamp,
      });
    }
  });
  tx();
  return { importRunId, marked: rows.length, reason };
}

function importUdyamRows(rows, actor = "unknown") {
  const results = [];
  for (const row of rows || []) {
    const vendorName = row.vendorName || row.vendor || row.name;
    const normalizedVendorName = normalizeVendorName(vendorName);
    if (!normalizedVendorName) {
      results.push({ status: "failed", reason: "vendorName is required", row });
      continue;
    }
    const existing = findByNormalizedName(normalizedVendorName);
    const agreedPaymentDays = importedPaymentTerms(row);
    if (!agreedPaymentDays) {
      results.push({ status: "failed", reason: "paymentTerms must be 15 or 45 days", row });
      continue;
    }
    const payload = {
      vendorName,
      isMSME: true,
      udyamNumber: String(row.udyamNumber || "").trim().toUpperCase(),
      agreedPaymentDays,
      enterpriseType: row.enterpriseType || "Micro",
      enterpriseName: row.enterpriseName || "",
      verificationStatus: existing ? "pending_manual_review" : "manual_fallback_required",
      udyamStatus: "pending_manual_review",
      actionStatus: "manual_review",
      evidenceUrl: row.evidenceUrl || row.proofUrl || "",
      udyamProofFileUrl: row.evidenceUrl || row.proofUrl || "",
      udyamProofUploadedAt: (row.evidenceUrl || row.proofUrl) ? nowIso() : "",
      proofNotes: row.notes || "",
      udyamRemarks: row.notes || "",
      reviewStatus: existing ? "manual_review" : "manual_review",
      reviewComment: existing ? "" : "Imported Udyam row did not match an existing Tally creditor exactly.",
    };
    const vendor = upsertVendorStatus(payload, actor, "udyam_csv_import");
    results.push({
      status: existing ? "matched" : "unmatched_manual_review",
      vendor,
      row,
    });
  }
  return {
    imported: results.length,
    matched: results.filter((row) => row.status === "matched").length,
    unmatched: results.filter((row) => row.status === "unmatched_manual_review").length,
    failed: results.filter((row) => row.status === "failed").length,
    results,
  };
}

function importedField(row, aliases) {
  const normalizedAliases = new Set(aliases.map((alias) => String(alias).trim().toLowerCase().replace(/[\s_-]+/g, "")));
  for (const [key, value] of Object.entries(row || {})) {
    const normalizedKey = String(key).trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (normalizedAliases.has(normalizedKey)) return value;
  }
  return "";
}

function importedUdyamNumber(row) {
  return String(importedField(row, [
    "udyamNumber",
    "udyam",
    "udyamNo",
    "udyamRegistrationNumber",
    "Udyam Number",
    "Udhyam Number",
    "Udhyam No",
  ])).trim().toUpperCase();
}

function importedVendorName(row) {
  return importedField(row, ["vendorName", "Vendor Name", "vendor", "name", "party", "supplierName", "Supplier Name"]);
}

function importedPanNumber(row) {
  return String(importedField(row, [
    "panNumber",
    "PAN",
    "PAN no",
    "PAN no ",
    "pan",
    "panNo",
    "panNumber",
  ])).trim().toUpperCase();
}

function importedPaymentTerms(row) {
  const value = String(importedField(row, [
    "paymentTerms",
    "Payment Terms",
    "paymentTerm",
    "Payment Term",
    "agreedPaymentDays",
    "Agreed Payment Days",
    "allowedPaymentDays",
    "Allowed Payment Days",
  ])).trim().toLowerCase();
  if (!value) return 45;
  const match = value.match(/^(\d+)(?:\s*days?)?$/);
  const days = match ? Number(match[1]) : 0;
  return days === 15 || days === 45 ? days : 0;
}

function withImportNote(row, message, sourceFileName) {
  return [row.notes, sourceFileName ? `Source file: ${sourceFileName}` : "", message].filter(Boolean).join("\n");
}

async function importUdyamRowsWithVerification(rows, actor = "unknown", options = {}) {
  const verifier = options.verifyUdyamNumber || verifyUdyamNumber;
  const sourceFileName = options.sourceFileName || "";
  const onEvent = typeof options.onEvent === "function" ? options.onEvent : () => {};
  const results = [];

  onEvent({ type: "import_started", message: `Starting Udyam verification for ${(rows || []).length} rows.`, total: (rows || []).length });

  for (const [index, row] of (rows || []).entries()) {
    const rowNumber = index + 1;
    const vendorName = importedVendorName(row);
    const normalizedVendorName = normalizeVendorName(vendorName);
    const udyamNumber = importedUdyamNumber(row);
    const agreedPaymentDays = importedPaymentTerms(row);
    onEvent({ type: "row_started", rowNumber, vendorName, udyamNumber, message: `Checking row ${rowNumber}${vendorName ? ` for ${vendorName}` : ""}.` });
    if (!normalizedVendorName) {
      const failed = { status: "failed", reason: "vendorName is required", row };
      results.push(failed);
      onEvent({ type: "row_failed", rowNumber, vendorName, status: "failed", reason: failed.reason, message: failed.reason });
      continue;
    }
    if (!udyamNumber) {
      const failed = { status: "failed", reason: "udyamNumber is required", row };
      results.push(failed);
      onEvent({ type: "row_failed", rowNumber, vendorName, status: "failed", reason: failed.reason, message: failed.reason });
      continue;
    }
    const hasPaymentTermsInput = Boolean(importedField(row, [
      "paymentTerms",
      "Payment Terms",
      "paymentTerm",
      "Payment Term",
      "agreedPaymentDays",
      "Agreed Payment Days",
      "allowedPaymentDays",
      "Allowed Payment Days",
    ]));
    if (!agreedPaymentDays && hasPaymentTermsInput) {
      const failed = { status: "failed", reason: "paymentTerms must be 15 or 45 days when provided", row };
      results.push(failed);
      onEvent({ type: "row_failed", rowNumber, vendorName, status: "failed", reason: failed.reason, message: failed.reason });
      continue;
    }

    const existing = findByNormalizedName(normalizedVendorName);
    if (!validateUdyamNumber(udyamNumber)) {
      onEvent({ type: "format_validated", rowNumber, vendorName, udyamNumber, status: "invalid_format", message: "Udyam number format is invalid." });
      const vendor = upsertVendorStatus(
        {
          vendorName,
          isMSME: false,
          udyamNumber,
          agreedPaymentDays,
          enterpriseType: row.enterpriseType || "",
          enterpriseName: row.enterpriseName || "",
          verificationStatus: "invalid_format",
          udyamStatus: "invalid_format",
          actionStatus: "failed",
          reviewStatus: "manual_review",
          evidenceUrl: row.evidenceUrl || row.proofUrl || "",
          udyamProofFileUrl: row.evidenceUrl || row.proofUrl || "",
          udyamProofUploadedAt: (row.evidenceUrl || row.proofUrl) ? nowIso() : "",
          proofNotes: withImportNote(row, "Invalid Udyam number format.", sourceFileName),
          udyamRemarks: withImportNote(row, "Invalid Udyam number format.", sourceFileName),
          reviewComment: "Imported Udyam row has invalid number format.",
        },
        actor,
        "udyam_excel_import"
      );
      const failed = { status: "failed", reason: "invalid_udyam_format", vendor, row };
      results.push(failed);
      onEvent({ type: "row_failed", rowNumber, vendorName, status: "failed", reason: failed.reason, message: "Invalid Udyam format; row moved to failed/manual review state." });
      continue;
    }

    onEvent({ type: "format_validated", rowNumber, vendorName, udyamNumber, paymentTerms: agreedPaymentDays, message: `Format valid. Payment terms: ${agreedPaymentDays} days.` });
    onEvent({ type: "portal_fetch_started", rowNumber, vendorName, udyamNumber, source: "live_portal", message: "Fetching MSME details from live Udyam portal." });
    onEvent({ type: "portal_opening", rowNumber, vendorName, udyamNumber, source: "live_portal", message: "Opening Udyam verification portal." });
    onEvent({ type: "udyam_submitted", rowNumber, vendorName, udyamNumber, source: "live_portal", message: "Submitting Udyam number for live portal verification." });
    let verification = await verifier(udyamNumber, { retries: options.retries ?? 1 });
    let verified = Boolean(verification.verified);
    let verificationSource = verified ? "live_portal" : "manual_review";
    let resultSourceLabel = verified ? "Live portal verified" : "Manual review required";
    let fallbackMatch = null;
    let reviewMessage = verification.error || "Udyam verification requires manual review.";
    onEvent({
      type: verified ? "live_portal_verified" : "live_portal_unavailable",
      rowNumber,
      vendorName,
      udyamNumber,
      source: "live_portal",
      status: verification.verificationStatus || (verified ? "verified" : "manual_fallback_required"),
      message: verified ? "Data fetched and verified from live Udyam portal." : `Live portal did not verify this row: ${reviewMessage}`,
    });
    if (verified) {
      onEvent({
        type: "portal_result_verified",
        rowNumber,
        vendorName,
        udyamNumber,
        source: "live_portal",
        status: "verified",
        message: "Data fetched and verified from live Udyam portal.",
      });
    }

    if (!verified) {
      const fallbackStats = udyamFallbackService.stats();
      onEvent({
        type: "fallback_lookup_started",
        rowNumber,
        vendorName,
        udyamNumber,
        source: "fallback_upload",
        message: `Live portal failed; checking fallback data at ${fallbackStats.rootDir}.`,
      });
      fallbackMatch = udyamFallbackService.findFallback({
        vendorName,
        udyamNumber,
        panNumber: importedPanNumber(row),
      });
      if (fallbackMatch) {
        verified = true;
        verificationSource = "fallback_upload";
        resultSourceLabel = "Fallback data used";
        reviewMessage = `Live portal failed (${reviewMessage}); matched fallback by ${fallbackMatch.matchedBy}.`;
        verification = {
          ...verification,
          verified: true,
          verificationStatus: "verified",
          udyamNumber: fallbackMatch.udyamNumber || udyamNumber,
          enterpriseName: fallbackMatch.enterpriseName || fallbackMatch.vendorName || vendorName,
          enterpriseType: fallbackMatch.enterpriseType || row.enterpriseType || "Micro",
          registrationValidity: fallbackMatch.registrationValidity,
          registrationDate: fallbackMatch.registrationDate,
          verifiedAt: nowIso(),
          fallbackMatched: true,
          fallbackMatchedBy: fallbackMatch.matchedBy,
          fallbackSourceWorkbook: fallbackMatch.sourceWorkbook,
          fallbackSourceSheet: fallbackMatch.sourceSheet,
          fallbackEvidencePath: fallbackMatch.evidencePath,
          fallbackRootDir: fallbackMatch.fallbackRootDir,
          error: "",
        };
        onEvent({
          type: "fallback_matched",
          rowNumber,
          vendorName,
          udyamNumber: verification.udyamNumber,
          source: "fallback_upload",
          status: "verified",
          message: `Fallback data matched by ${fallbackMatch.matchedBy}; vendor marked verified from backend fallback data.`,
        });
      } else {
        onEvent({
          type: "fallback_not_found",
          rowNumber,
          vendorName,
          udyamNumber,
          source: "manual_review",
          status: "manual_fallback_required",
          message: "No fallback MSME record found; row needs manual review.",
        });
      }
    }

    const vendor = upsertVendorStatus(
      {
        vendorName,
        isMSME: verified,
        udyamNumber: verification.udyamNumber || udyamNumber,
        agreedPaymentDays: fallbackMatch?.agreedPaymentDays || agreedPaymentDays,
        panNumber: fallbackMatch?.panNumber || importedPanNumber(row),
        enterpriseType: verification.enterpriseType || row.enterpriseType || "Micro",
        enterpriseName: verification.enterpriseName || row.enterpriseName || "",
        verificationStatus: verified ? "verified" : verification.verificationStatus || "manual_fallback_required",
        udyamStatus: verified ? "verified" : verification.verificationStatus || "manual_fallback_required",
        actionStatus: verified ? "verified_msme" : "manual_review",
        reviewStatus: verified ? "approved" : "manual_review",
        evidenceUrl: row.evidenceUrl || row.proofUrl || verification.fallbackEvidencePath || verification.screenshotPath || "",
        udyamProofFileUrl: row.evidenceUrl || row.proofUrl || verification.fallbackEvidencePath || verification.screenshotPath || "",
        udyamProofUploadedAt: (row.evidenceUrl || row.proofUrl || verification.fallbackEvidencePath || verification.screenshotPath) ? nowIso() : "",
        proofNotes: withImportNote(row, verified ? resultSourceLabel : reviewMessage, sourceFileName),
        udyamRemarks: verified ? resultSourceLabel : withImportNote(row, reviewMessage, sourceFileName),
        registrationValidity: verification.registrationValidity || "",
        registrationDate: verification.registrationDate || "",
        verifiedAt: verification.verifiedAt || (verified ? nowIso() : ""),
        lastVerifiedAt: nowIso(),
        udyamVerifiedBy: verified ? actor : "",
        udyamVerifiedAt: verified ? nowIso() : "",
        verificationSource,
        evidenceLink: verification.fallbackEvidencePath || row.evidenceUrl || row.proofUrl || verification.screenshotPath || "",
        evidenceDocumentType: verification.fallbackEvidencePath ? "fallback_msme_evidence" : "",
        reviewComment: existing ? "" : "Imported Udyam row did not match an existing Tally creditor exactly.",
      },
      actor,
      verificationSource
    );
    recordVerificationAttempt({
      vendorId: vendor.id,
      vendorName,
      udyamNumber: verification.udyamNumber || udyamNumber,
      status: verification.verificationStatus || (verified ? "verified" : "manual_fallback_required"),
      response: verification,
      screenshotPath: verification.screenshotPath,
      actor,
    });
    results.push({
      status: verified ? (existing ? "verified" : "verified_unmatched") : (existing ? "manual_review" : "unmatched_manual_review"),
      vendor,
      verification,
      verificationSource,
      row,
    });
    onEvent({
      type: "row_completed",
      rowNumber,
      vendorName,
      status: verified ? "verified" : "manual_review",
      source: verificationSource,
      message: verified ? `Row ${rowNumber} completed: ${resultSourceLabel}.` : `Row ${rowNumber} completed: manual review required.`,
    });
  }

  const summary = {
    imported: results.length,
    matched: results.filter((row) => ["verified", "manual_review"].includes(row.status)).length,
    unmatched: results.filter((row) => ["verified_unmatched", "unmatched_manual_review"].includes(row.status)).length,
    verified: results.filter((row) => ["verified", "verified_unmatched"].includes(row.status)).length,
    livePortalVerified: results.filter((row) => row.verificationSource === "live_portal").length,
    fallbackVerified: results.filter((row) => row.verificationSource === "fallback_upload").length,
    manualReview: results.filter((row) => ["manual_review", "unmatched_manual_review"].includes(row.status)).length,
    failed: results.filter((row) => row.status === "failed").length,
    results,
  };
  onEvent({ type: "import_completed", summary, message: `Udyam import complete: ${summary.verified} verified, ${summary.manualReview} manual review, ${summary.failed} failed.` });
  return summary;
}

function getVerificationQueue() {
  return db.prepare(`
    SELECT * FROM vendor_master
    WHERE action_status IN ('pending_action', 'manual_review', 'failed')
       OR udyam_status IN ('not_started', 'manual_fallback_required', 'pending_manual_review', 'rejected', 'failed')
    ORDER BY updated_at DESC
  `).all().map(mapVendor);
}

function getManualReviewVendors() {
  return db
    .prepare("SELECT * FROM vendor_master WHERE udyam_status IN ('manual_fallback_required', 'pending_manual_review') ORDER BY updated_at DESC")
    .all()
    .map(mapVendor);
}

function recordVerificationAttempt({ vendorId, vendorName, udyamNumber, status, response, screenshotPath, actor }) {
  db.prepare(`
    INSERT INTO udyam_verification_attempts (
      id, vendor_id, vendor_name, udyam_number, status, response_json, screenshot_path, attempted_by, attempted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    vendorId || null,
    vendorName,
    udyamNumber,
    status,
    JSON.stringify(response || {}),
    screenshotPath || "",
    actor || "unknown",
    nowIso()
  );
}

function getAuditTrail() {
  return db.prepare("SELECT * FROM vendor_audit_log ORDER BY changed_at DESC").all().map((row) => ({
    id: row.id,
    vendorId: row.vendor_id,
    action: row.action,
    oldValue: parseJson(row.old_value),
    newValue: parseJson(row.new_value, {}),
    changedBy: row.changed_by,
    changedAt: row.changed_at,
    source: row.source,
  }));
}

function toAuditCsv(rows = getAuditTrail()) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = ["Action,Vendor,Status,Changed By,Changed At,Source,Remarks"];
  for (const row of rows) {
    lines.push([
      row.action,
      row.newValue?.vendorName || row.oldValue?.vendorName || "",
      row.newValue?.udyamStatus || row.newValue?.verificationStatus || "",
      row.changedBy,
      row.changedAt,
      row.source,
      row.newValue?.udyamRemarks || row.newValue?.reviewComment || row.newValue?.excludedReason || "",
    ].map(escape).join(","));
  }
  return lines.join("\n");
}

module.exports = {
  normalizeVendorName,
  findById,
  findByNormalizedName,
  findManyByNames,
  getAllVendors,
  getUnverified,
  upsertVendorStatus,
  updateVendorById,
  getManualReviewVendors,
  recordVerificationAttempt,
  getAuditTrail,
  toAuditCsv,
  seedFromImport,
  markZeroOutstandingNotRequired,
  importUdyamRows,
  importUdyamRowsWithVerification,
  getVerificationQueue,
  deriveActionStatus,
};
