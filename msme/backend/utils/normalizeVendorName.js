const LEGAL_SUFFIXES = [
  /\bPRIVATE\s+LIMITED\b/g,
  /\bPVT\.?\s*LTD\.?\b/g,
  /\bP\s*LTD\.?\b/g,
  /\bLIMITED\b/g,
  /\bLTD\.?\b/g,
  /\bLLP\b/g,
  /\bL\.?\s*L\.?\s*P\.?\b/g,
  /\bINC\b/g,
  /\bCO\.?\b/g,
  /\bCOMPANY\b/g,
  /\bENTERPRISES?\b/g,
];

function normalizeVendorName(name) {
  let normalized = String(name || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ");

  for (const suffix of LEGAL_SUFFIXES) {
    normalized = normalized.replace(suffix, " ");
  }

  return normalized.replace(/\s+/g, " ").trim();
}

module.exports = { normalizeVendorName };
