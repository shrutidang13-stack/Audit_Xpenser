function normalizeGroupName(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function isSundryCreditorGroupName(name) {
  const normalized = normalizeGroupName(name);
  return (
    /\bSUNDRY\s+CREDITORS?\b/.test(normalized) ||
    /\bTRADE\s+PAYABLES?\b/.test(normalized) ||
    /^(CREDITORS?|SUPPLIERS?)$/.test(normalized)
  );
}

function isBlockedNonCreditorName(name) {
  const normalized = normalizeGroupName(name);
  return (
    /^(PURCHASE|PURCHASE IMPORT|PREPAID EXPENDITURE|INPUT IGST|INPUT CGST|INPUT SGST|INPUT GST)$/.test(normalized) ||
    /\bSALARY\b/.test(normalized)
  );
}

function isBlockedNonCreditorGroupName(name) {
  const normalized = normalizeGroupName(name);
  return (
    /\bPURCHASE\s+ACCOUNTS?\b/.test(normalized) ||
    /\bCURRENT\s+ASSETS?\b/.test(normalized) ||
    /\bDUTIES\s+AND\s+TAXES\b/.test(normalized) ||
    /\bEXPENSES?\b/.test(normalized) ||
    /\bSALARY\b/.test(normalized)
  );
}

function creditorLineage(row = {}) {
  const raw = row.raw || row;
  const parent = row.parent || raw.parent || raw.PARENT || "";
  const hierarchy = row.groupHierarchy || raw.groupHierarchy || [];
  return [parent, ...(Array.isArray(hierarchy) ? hierarchy : [])].filter(Boolean);
}

function hasCreditorLineageMetadata(row = {}) {
  return creditorLineage(row).length > 0;
}

function isSundryCreditorRow(row = {}) {
  const raw = row.raw || row;
  const name = row.party || row.vendorName || row.name || raw.party || raw.vendorName || raw.name || "";
  if (isBlockedNonCreditorName(name)) return false;
  const lineage = creditorLineage(row);
  if (!lineage.length) return false;
  if (lineage.some(isBlockedNonCreditorGroupName)) return false;
  return lineage.some(isSundryCreditorGroupName);
}

module.exports = {
  normalizeGroupName,
  isSundryCreditorGroupName,
  isBlockedNonCreditorName,
  isBlockedNonCreditorGroupName,
  hasCreditorLineageMetadata,
  isSundryCreditorRow,
};
