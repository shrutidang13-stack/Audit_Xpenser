const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const env = require("../config/env");
const { normalizeVendorName } = require("../utils/normalizeVendorName");
const { validateUdyamNumber } = require("./udyamVerifier.service");

let cached = null;

function normalizeHeader(header) {
  return String(header || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function field(row, aliases) {
  const normalizedAliases = new Set(aliases.map(normalizeHeader));
  for (const [key, value] of Object.entries(row || {})) {
    if (normalizedAliases.has(normalizeHeader(key))) return value;
  }
  return "";
}

function cleanUdyam(value) {
  return String(value || "").trim().toUpperCase();
}

function compact(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizedTokens(value) {
  return normalizeVendorName(value).split(" ").filter((token) => token.length >= 3);
}

function cleanEnterpriseType(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/\b(micro|small|medium)\b/i);
  return match ? match[1][0].toUpperCase() + match[1].slice(1).toLowerCase() : raw;
}

function parsePaymentDays(value) {
  const match = String(value || "").trim().match(/(\d+)/);
  const days = match ? Number(match[1]) : 0;
  return days === 15 || days === 45 ? days : 0;
}

function listFilesSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function collectFiles(rootDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of listFilesSafe(dir)) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else files.push(fullPath);
    }
  };
  walk(rootDir);
  return files;
}

function findEvidenceFile(files, vendorName, udyamNumber) {
  const normalizedVendor = normalizeVendorName(vendorName);
  const vendorTokens = normalizedTokens(normalizedVendor);
  const normalizedUdyam = compact(cleanUdyam(udyamNumber));
  return files.find((file) => {
    const base = normalizeVendorName(path.basename(file));
    const compactBase = compact(path.basename(file));
    if (normalizedUdyam && compactBase.includes(normalizedUdyam)) return true;
    return vendorTokens.length > 0 && vendorTokens.some((token) => base.includes(token));
  }) || "";
}

function evidenceRecord(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const vendorName = baseName.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return {
    vendorName,
    normalizedVendorName: normalizeVendorName(vendorName),
    udyamNumber: "",
    panNumber: "",
    agreedPaymentDays: 0,
    enterpriseType: "Micro",
    enterpriseName: vendorName,
    registrationValidity: "Verified from uploaded MSME fallback evidence",
    registrationDate: "",
    sourceWorkbook: "",
    sourceSheet: "",
    evidencePath: filePath,
    evidenceOnly: true,
  };
}

function parseWorkbook(filePath, evidenceFiles) {
  const workbook = XLSX.readFile(filePath);
  const records = [];
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
    for (const row of rows) {
      const vendorName = String(field(row, ["vendorName", "Vendor Name", "vendor", "name", "party", "supplierName"]) || "").trim();
      const udyamNumber = cleanUdyam(field(row, ["udyamNumber", "Udyam Number", "udyam", "udyamNo", "udyamRegistrationNumber"]));
      if (!vendorName && !udyamNumber) continue;
      const enterpriseType = cleanEnterpriseType(
        field(row, ["enterpriseType", "Enterprise Type", "type", "classification", "__EMPTY"]) || row.__EMPTY
      ) || "Micro";
      const record = {
        vendorName,
        normalizedVendorName: normalizeVendorName(vendorName),
        udyamNumber,
        panNumber: String(field(row, ["panNumber", "PAN", "PAN no", "PAN no "]) || "").trim().toUpperCase(),
        agreedPaymentDays: parsePaymentDays(field(row, ["paymentTerms", "Payment Terms", "agreedPaymentDays", "allowedPaymentDays"])),
        enterpriseType,
        enterpriseName: vendorName,
        registrationValidity: "Verified from uploaded MSME fallback data",
        registrationDate: "",
        sourceWorkbook: filePath,
        sourceSheet: sheetName,
      };
      record.evidencePath = findEvidenceFile(evidenceFiles, vendorName, udyamNumber);
      records.push(record);
    }
  }
  return records;
}

function loadFallbackData(force = false) {
  if (cached && !force) return cached;
  const rootDir = path.resolve(env.udyamFallbackDataPath);
  const files = collectFiles(rootDir);
  const workbookFiles = files.filter((file) => /\.(xlsx|xls|csv)$/i.test(file));
  const evidenceFiles = files.filter((file) => /\.(pdf|png|jpg|jpeg|webp)$/i.test(file));
  const records = [];
  for (const file of workbookFiles) {
    try {
      if (/\.csv$/i.test(file)) {
        const workbook = XLSX.readFile(file, { type: "file" });
        for (const sheetName of workbook.SheetNames) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
          records.push(...parseWorkbookRows(rows, file, sheetName, evidenceFiles));
        }
      } else {
        records.push(...parseWorkbook(file, evidenceFiles));
      }
    } catch {
      // Skip unreadable fallback files; diagnostics are exposed through source counts.
    }
  }
  const existingEvidencePaths = new Set(records.map((record) => record.evidencePath).filter(Boolean));
  const existingNames = new Set(records.map((record) => record.normalizedVendorName).filter(Boolean));
  for (const file of evidenceFiles) {
    const record = evidenceRecord(file);
    if (existingEvidencePaths.has(file) || existingNames.has(record.normalizedVendorName)) continue;
    records.push(record);
  }
  cached = {
    rootDir,
    workbookFiles,
    evidenceFiles,
    records,
    loadedAt: new Date().toISOString(),
  };
  return cached;
}

function parseWorkbookRows(rows, filePath, sheetName, evidenceFiles) {
  return rows.map((row) => {
    const vendorName = String(field(row, ["vendorName", "Vendor Name", "vendor", "name", "party", "supplierName"]) || "").trim();
    const udyamNumber = cleanUdyam(field(row, ["udyamNumber", "Udyam Number", "udyam", "udyamNo", "udyamRegistrationNumber"]));
    const enterpriseType = cleanEnterpriseType(field(row, ["enterpriseType", "Enterprise Type", "type", "classification", "__EMPTY"]) || row.__EMPTY) || "Micro";
    return {
      vendorName,
      normalizedVendorName: normalizeVendorName(vendorName),
      udyamNumber,
      panNumber: String(field(row, ["panNumber", "PAN", "PAN no", "PAN no "]) || "").trim().toUpperCase(),
      agreedPaymentDays: parsePaymentDays(field(row, ["paymentTerms", "Payment Terms", "agreedPaymentDays", "allowedPaymentDays"])),
      enterpriseType,
      enterpriseName: vendorName,
      registrationValidity: "Verified from uploaded MSME fallback data",
      registrationDate: "",
      sourceWorkbook: filePath,
      sourceSheet: sheetName,
      evidencePath: findEvidenceFile(evidenceFiles, vendorName, udyamNumber),
    };
  }).filter((record) => record.vendorName || record.udyamNumber);
}

function findFallback({ vendorName, udyamNumber, panNumber } = {}) {
  const data = loadFallbackData();
  const normalizedVendor = normalizeVendorName(vendorName);
  const vendorCompact = compact(normalizedVendor);
  const vendorTokens = normalizedTokens(vendorName);
  const cleanedUdyam = cleanUdyam(udyamNumber);
  const cleanedPan = String(panNumber || "").trim().toUpperCase();
  const byUdyam = cleanedUdyam && validateUdyamNumber(cleanedUdyam)
    ? data.records.find((record) => record.udyamNumber === cleanedUdyam)
    : null;
  const byPan = !byUdyam && cleanedPan
    ? data.records.find((record) => record.panNumber && record.panNumber === cleanedPan)
    : null;
  const byName = !byUdyam && !byPan && normalizedVendor
    ? data.records.find((record) => record.normalizedVendorName === normalizedVendor)
    : null;
  const byCompactName = !byUdyam && !byPan && !byName && vendorCompact
    ? data.records.find((record) => {
      const recordCompact = compact(record.normalizedVendorName);
      return recordCompact === vendorCompact ||
        (recordCompact.length >= 3 && vendorCompact.includes(recordCompact)) ||
        (vendorCompact.length >= 3 && recordCompact.includes(vendorCompact));
    })
    : null;
  const byTokenName = !byUdyam && !byPan && !byName && !byCompactName && vendorTokens.length
    ? data.records.find((record) => {
      const recordTokens = normalizedTokens(record.normalizedVendorName);
      if (!recordTokens.length) return false;
      const shared = vendorTokens.filter((token) => recordTokens.includes(token));
      return shared.length >= Math.min(2, vendorTokens.length, recordTokens.length);
    })
    : null;
  const match = byUdyam || byPan || byName || byCompactName || byTokenName;
  if (!match) return null;
  return {
    ...match,
    matchedBy: byUdyam ? "udyam_number" : byPan ? "pan_number" : "vendor_name",
    fallbackRootDir: data.rootDir,
    fallbackLoadedAt: data.loadedAt,
  };
}

function stats() {
  const data = loadFallbackData();
  return {
    rootDir: data.rootDir,
    records: data.records.length,
    workbookFiles: data.workbookFiles.length,
    evidenceFiles: data.evidenceFiles.length,
    loadedAt: data.loadedAt,
  };
}

module.exports = {
  findFallback,
  loadFallbackData,
  stats,
};
