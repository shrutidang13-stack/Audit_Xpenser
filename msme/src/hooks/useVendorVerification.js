import { useMemo, useState } from "react";
import { saveVendorStatus, verifyUdyam } from "../services/api";

const emptyDraft = {
  isMSME: "",
  udyamNumber: "",
  enterpriseType: "",
  verificationStatus: "pending",
};

function normalizeName(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\bPRIVATE\s+LIMITED\b/g, " ")
    .replace(/\bPVT\.?\s*LTD\.?\b/g, " ")
    .replace(/\bLIMITED\b/g, " ")
    .replace(/\bLTD\.?\b/g, " ")
    .replace(/\bLLP\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGroupName(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function isSundryCreditorVendor(creditor) {
  const name = normalizeGroupName(creditor.party || creditor.name);
  if (/^(PURCHASE|PURCHASE IMPORT|PREPAID EXPENDITURE|INPUT IGST|INPUT CGST|INPUT SGST|INPUT GST)$/.test(name) || /\bSALARY\b/.test(name)) return false;
  const raw = creditor.raw || {};
  const parent = creditor.parent || raw.parent || raw.PARENT || "";
  const hierarchy = creditor.groupHierarchy || raw.groupHierarchy || [];
  const lineage = [parent, ...(Array.isArray(hierarchy) ? hierarchy : [])].filter(Boolean);
  if (!lineage.length) return Boolean(creditor.isSundryCreditor);
  const normalizedLineage = lineage.map(normalizeGroupName);
  if (normalizedLineage.some((group) => /\bPURCHASE\s+ACCOUNTS?\b|\bCURRENT\s+ASSETS?\b|\bDUTIES\s+AND\s+TAXES\b|\bEXPENSES?\b|\bSALARY\b/.test(group))) return false;
  return normalizedLineage.some((group) => /\bSUNDRY\s+CREDITORS?\b/.test(group));
}

export function useVendorVerification() {
  const [drafts, setDrafts] = useState({});
  const [verifyingRows, setVerifyingRows] = useState({});

  const updateDraft = (vendorName, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [vendorName]: { ...(prev[vendorName] || emptyDraft), ...patch },
    }));
  };

  const mergeMasterIntoVendors = (creditors) =>
    creditors.filter(isSundryCreditorVendor).map((creditor) => {
      const master = creditor.vendorMaster;
      return {
        name: creditor.party,
        normalizedVendorName: creditor.normalizedVendorName || normalizeName(creditor.party),
        outstandingAmount: creditor.outstandingAmount,
        daysOutstanding: creditor.daysOutstanding,
        bucket: creditor.bucket,
        delayed: creditor.delayed,
        interestLiability: creditor.interestLiability,
        disallowanceAmount: creditor.disallowanceAmount,
        oldestInvoiceDate: creditor.oldestInvoiceDate,
        panNumber: creditor.panNumber || creditor.vendorMaster?.panNumber || creditor.raw?.panNumber || "",
        agreedPaymentDays: creditor.agreedPaymentDays || creditor.vendorMaster?.agreedPaymentDays || creditor.raw?.agreedPaymentDays || 0,
        openingBalance: creditor.openingBalance || 0,
        closingBalance: creditor.closingBalance || 0,
        openingBalanceRaw: creditor.openingBalanceRaw || "",
        closingBalanceRaw: creditor.closingBalanceRaw || "",
        openingBalanceType: creditor.openingBalanceType || creditor.raw?.openingBalanceType || "",
        closingBalanceType: creditor.closingBalanceType || creditor.raw?.closingBalanceType || "",
        ledgerOutstandingAmount: creditor.ledgerOutstandingAmount ?? creditor.outstandingAmount ?? 0,
        voucherOutstandingAmount: creditor.voucherOutstandingAmount ?? creditor.raw?.voucherOutstandingAmount ?? 0,
        outstandingMismatch: Boolean(creditor.outstandingMismatch || creditor.raw?.outstandingMismatch),
        voucherCount: creditor.voucherCount || 0,
        parent: creditor.parent || creditor.raw?.parent || "",
        groupHierarchy: creditor.groupHierarchy || creditor.raw?.groupHierarchy || [],
        isSundryCreditor: true,
        vendorMaster: master,
      };
    });

  const saveManualStatus = async (vendor, draft) => {
    if (draft.isMSME === "yes") {
      throw new Error("For MSME vendors, enter the Udyam number and use Verify. Manual save is allowed only for Non-MSME confirmation.");
    }
    if (draft.isMSME !== "no") {
      throw new Error("Select No before saving a vendor as Non-MSME.");
    }
    const response = await saveVendorStatus(
      {
        vendorName: vendor.name,
        isMSME: false,
        udyamNumber: draft.udyamNumber || "",
        enterpriseType: "",
        verificationStatus: "not_msme",
      },
    );
    return response.vendor;
  };

  const verifyVendor = async (vendor, draft) => {
    if (!draft.udyamNumber?.trim()) throw new Error("Enter Udyam number before verification.");
    setVerifyingRows((prev) => ({ ...prev, [vendor.name]: true }));
    try {
      const response = await verifyUdyam(
        { vendorName: vendor.name, udyamNumber: draft.udyamNumber, panNumber: vendor.panNumber || "" },
      );
      return response.vendor;
    } finally {
      setVerifyingRows((prev) => ({ ...prev, [vendor.name]: false }));
    }
  };

  const bulkVerify = async (vendors, onVerified) => {
    let verifiedCount = 0;
    for (const vendor of vendors) {
      const draft = drafts[vendor.name] || emptyDraft;
      const effectiveDraft = {
        ...draft,
        isMSME: draft.isMSME || (draft.udyamNumber || vendor.vendorMaster?.udyamNumber ? "yes" : vendor.vendorMaster?.isMSME ? "yes" : ""),
        udyamNumber: draft.udyamNumber || vendor.vendorMaster?.udyamNumber || "",
        enterpriseType: draft.enterpriseType || vendor.vendorMaster?.enterpriseType || (draft.udyamNumber || vendor.vendorMaster?.udyamNumber ? "Micro" : ""),
      };
      if (!effectiveDraft.udyamNumber?.trim() || effectiveDraft.isMSME === "no") continue;
      const updated = await verifyVendor(vendor, effectiveDraft);
      onVerified(vendor.name, updated);
      verifiedCount += 1;
    }
    return verifiedCount;
  };

  const statsFor = useMemo(
    () => (vendors) => {
      const total = vendors.length;
      const verifiedMSME = vendors.filter((v) =>
        v.vendorMaster?.isMSME &&
        ["verified", "approved"].includes(v.vendorMaster?.udyamStatus)
      ).length;
      const nonMSME = vendors.filter((v) => v.vendorMaster?.verificationStatus === "not_msme").length;
      const notRequired = vendors.filter((v) => v.vendorMaster?.actionStatus === "not_required_zero_outstanding").length;
      const failedVerification = vendors.filter((v) =>
        ["failed", "manual_fallback_required", "pending_manual_review", "rejected", "invalid_format", "not_verified"].includes(v.vendorMaster?.udyamStatus || v.vendorMaster?.verificationStatus)
      ).length;
      const pendingVerification = total - verifiedMSME - nonMSME - notRequired - failedVerification;
      return { total, verifiedMSME, pendingVerification, nonMSME, notRequired, failedVerification };
    },
    []
  );

  return {
    drafts,
    updateDraft,
    verifyingRows,
    mergeMasterIntoVendors,
    saveManualStatus,
    verifyVendor,
    bulkVerify,
    statsFor,
  };
}
