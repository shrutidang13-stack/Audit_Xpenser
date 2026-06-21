const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const puppeteer = require("puppeteer");
const taxAuditRepository = require("../repositories/taxAuditRepository");
const importRepository = require("../repositories/importRepository");
const reportService = require("./report.service");
const schemaService = require("./taxAuditSchema.service");
const clauseRegistry = require("./taxAuditClauseRegistry.service");

const OUTPUT_DIR = path.resolve(process.cwd(), "backend/storage/tax-audit");

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseFy(fy = "") {
  const match = String(fy).match(/^(\d{4})-(\d{2})$/);
  if (!match) return {};
  const startYear = Number(match[1]);
  return {
    startDate: `${startYear}-04-01`,
    endDate: `${startYear + 1}-03-31`,
    assessmentYear: `${startYear + 1}-${String((startYear + 2) % 100).padStart(2, "0")}`,
    aySchemaValue: String(startYear + 1),
  };
}

function splitName(name = "") {
  const clean = String(name || "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return { FirstName: "", MiddleName: "", LastName: "" };
  if (parts.length === 1) return { FirstName: "", MiddleName: "", LastName: parts[0] };
  if (parts.length === 2) return { FirstName: parts[0], MiddleName: "", LastName: parts[1] };
  return { FirstName: parts[0], MiddleName: parts.slice(1, -1).join(" "), LastName: parts.at(-1) };
}

function defaultAddress(address = {}) {
  const state = String(address.stateCode || "27").padStart(2, "0");
  return {
    AddrDetail1: address.line1 || address.addressLine1 || address.address || "Address requires CA review",
    AddrDetail2: address.line2 || "",
    CityOrTownOrDistrict: address.city || "City",
    StateCode: state,
    CountryCode: String(address.countryCode || 91),
    PinCode: String(address.pinCode || address.pincode || 400001),
  };
}

function defaultAssessee(msmeReport, run) {
  const fy = parseFy(msmeReport.fiscalYear);
  return {
    name: run?.companyName || "",
    pan: "",
    address: "",
    city: "",
    stateCode: "",
    countryCode: 91,
    pinCode: "",
    gstin: "",
    indirectTaxFlag: "N",
    status: "",
    statusCode: "",
    previousYear: msmeReport.fiscalYear,
    previousYearStart: fy.startDate || "",
    previousYearEnd: fy.endDate || "",
    assessmentYear: fy.assessmentYear || "",
    natureOfBusiness: "",
    booksOfAccount: "Books of account as maintained in Tally",
    placeOfBusiness: "",
    tallyCompanyMapping: run?.companyName || "",
  };
}

function defaultAuditor() {
  return {
    caName: "",
    firmName: "",
    membershipNumber: "",
    frn: "",
    address: "",
    city: "",
    stateCode: "",
    countryCode: 91,
    pinCode: "",
    place: "",
    date: todayIso(),
    udin: "",
    observations: "",
  };
}

function buildClausesFromMsme(msmeReport) {
  const schedules = msmeReport.schedules || {};
  const clause22Rows = schedules.clause22Computation || schedules.clause22 || [];
  const clause26Rows = schedules.clause43BhFromClause22 || schedules.clause26 || [];
  const clause22Amount = roundMoney(clause22Rows.reduce((sum, row) => sum + Number(row.clause22iiiBOutstandingDisallowance || row.amountInadmissible || row.interestPayable || 0), 0));
  const clause26Amount = roundMoney(clause26Rows.reduce((sum, row) => sum + Number(row.principalDisallowance || row.disallowanceAmount || 0), 0));
  return clauseRegistry.listClauses().map((clause) => {
    if (clause.clauseNo === "22") {
      return {
        ...clause,
        amount: clause22Amount,
        status: clause22Rows.length ? "yes" : "no",
        remarks: clause22Rows.length ? "Auto-filled from Clause 22 MSME computation; 43B(h) uses Clause 22(iii)(b) as source of truth." : "No Clause 22 MSME computation rows identified.",
        annexureRef: "CLAUSE_22_MSME_COMPUTATION",
        evidenceRef: "Voucher-wise Delay Evidence",
        payload: { rows: clause22Rows, total: clause22Amount },
      };
    }
    if (clause.clauseNo === "26") {
      return {
        ...clause,
        amount: clause26Amount,
        status: clause26Rows.length ? "yes" : "no",
        remarks: clause26Rows.length ? "Auto-filled from Clause 22(iii)(b) derived 43B(h) disallowance." : "No Clause 22(iii)(b) outstanding MSME principal rows identified.",
        annexureRef: "CLAUSE_26_43BH",
        evidenceRef: "Voucher-wise Delay Evidence",
        payload: { rows: clause26Rows, total: clause26Amount },
      };
    }
    return clause;
  });
}

function hydrate(report) {
  if (!report) return null;
  return {
    ...report,
    assessee: taxAuditRepository.getDetails("assessee_details", report.id),
    auditor: taxAuditRepository.getDetails("auditor_details", report.id),
    clauses: taxAuditRepository.listClauses(report.id),
    annexures: taxAuditRepository.listAnnexures(report.id),
    validation: taxAuditRepository.listValidation(report.id),
    editLog: taxAuditRepository.listEditLog(report.id),
    schema: schemaService.metadata(report.formType),
  };
}

function createReport({ msmeReportId, formType, assessmentYear, actor }) {
  const normalizedFormType = schemaService.normalizeFormType(formType);
  const msmeReport = reportService.getReport(msmeReportId);
  if (!msmeReport) throw new Error("MSME report not found");
  const run = importRepository.getRun(msmeReport.importRunId);
  const fy = parseFy(msmeReport.fiscalYear);
  const report = taxAuditRepository.createReport({
    sourceMsmeReportId: msmeReport.id,
    importRunId: msmeReport.importRunId,
    companyName: run?.companyName || "",
    financialYear: msmeReport.fiscalYear,
    assessmentYear: assessmentYear || fy.assessmentYear || "",
    formType: normalizedFormType,
    actor,
  });
  const assessee = defaultAssessee(msmeReport, run);
  assessee.assessmentYear = assessmentYear || assessee.assessmentYear;
  taxAuditRepository.saveDetails("assessee_details", report.id, assessee, actor);
  taxAuditRepository.saveDetails("auditor_details", report.id, defaultAuditor(), actor);
  taxAuditRepository.replaceClauses(report.id, buildClausesFromMsme(msmeReport), actor);
  taxAuditRepository.replaceAnnexures(report.id, [
    { annexureType: "clause22", title: "Clause 22 MSME Computation Annexure", sourceSchedule: "schedules.clause22Computation", payload: msmeReport.schedules?.clause22Computation || msmeReport.schedules?.clause22 || [] },
    { annexureType: "clause26", title: "Clause 26 MSME 43B(h) Annexure", sourceSchedule: "schedules.clause43BhFromClause22", payload: msmeReport.schedules?.clause43BhFromClause22 || msmeReport.schedules?.clause26 || [] },
    { annexureType: "clause26A", title: "Clause 26(A) Carry-Forward Register", sourceSchedule: "schedules.clause26CarryForwardRegister", payload: msmeReport.schedules?.clause26CarryForwardRegister || [] },
    { annexureType: "workingPapers", title: "MSME Working Papers", sourceSchedule: "schedules", payload: msmeReport.schedules || {} },
  ]);
  taxAuditRepository.createVersion(report.id, hydrate(report), actor);
  return validateReport(report.id, { actor });
}

function listReports() {
  return taxAuditRepository.listReports().map((report) => ({
    ...report,
    validation: taxAuditRepository.listValidation(report.id),
  }));
}

function getReport(id) {
  return hydrate(taxAuditRepository.getReport(id));
}

function updateDetails(reportId, type, payload, actor = "unknown", comment = "") {
  const table = type === "auditor" ? "auditor_details" : "assessee_details";
  const before = taxAuditRepository.getDetails(table, reportId);
  taxAuditRepository.saveDetails(table, reportId, { ...before, ...(payload || {}) }, actor);
  const after = taxAuditRepository.getDetails(table, reportId);
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      taxAuditRepository.logEdit(reportId, type, reportId, key, before[key], after[key], actor, comment);
    }
  }
  return validateReport(reportId, { actor });
}

function updateClause(reportId, clauseNo, patch, actor = "unknown", comment = "") {
  taxAuditRepository.updateClause(reportId, clauseNo, patch || {}, actor, comment);
  return validateReport(reportId, { actor });
}

function auditorNameParts(auditor) {
  return splitName(auditor.caName || auditor.firmName || "Auditor");
}

function assesseeNameObject(assessee) {
  return splitName(assessee.name || "Assessee");
}

function buildOfficialJson(reportId) {
  const report = getReport(reportId);
  if (!report) throw new Error("Tax audit report not found");
  const meta = schemaService.metadata(report.formType);
  const assessee = report.assessee || {};
  const auditor = report.auditor || {};
  const fy = parseFy(report.financialYear);
  const rootKey = meta.rootKey;
  const bodyKey = meta.bodyKey;
  const address = defaultAddress({
    address: assessee.address,
    city: assessee.city,
    stateCode: assessee.stateCode,
    countryCode: assessee.countryCode,
    pinCode: assessee.pinCode,
  });
  const auditAddress = defaultAddress({
    address: auditor.address,
    city: auditor.city,
    stateCode: auditor.stateCode,
    countryCode: auditor.countryCode,
    pinCode: auditor.pinCode,
  });
  const clause22 = report.clauses.find((clause) => clause.clauseNo === "22");
  const clause26 = report.clauses.find((clause) => clause.clauseNo === "26");
  const base = {
    CreationInfo: {
      SWVersionNo: "0.1.0",
      SWCreatedBy: "MSME Guard",
      JSONCreatedBy: "MSME Guard",
      JSONCreationDate: todayIso(),
      IntermediaryCity: auditor.place || auditor.city || "City",
    },
    Form_Details: {
      FormName: report.formType === "3CA" ? "FORM3CA" : "FORM3CB",
      Description: `${report.formType}-3CD draft generated for CA review`,
      AssessmentYear: fy.aySchemaValue || String(report.assessmentYear || "").slice(0, 4),
      SchemaVer: "Ver2.5",
      FormVer: "1.0",
    },
    Declaration: buildDeclaration(report, assessee, auditor, address),
    PartA: {
      AssesseeName: assesseeNameObject(assessee),
      AddressDetail: address,
      PAN: assessee.pan || "",
      IndirectTaxFlag: assessee.gstin ? "Y" : (assessee.indirectTaxFlag || "N"),
      Status: Number(assessee.statusCode || 0),
      PartAStartDate: assessee.previousYearStart || fy.startDate || "",
      PartAEndDate: assessee.previousYearEnd || fy.endDate || "",
      AssessmentYear: report.assessmentYear,
      ...(assessee.gstin ? { Form3cdIndirectTax: [{ IndirectTaxType: "GST", RegistrationNumber: assessee.gstin }] } : {}),
    },
    Form3cdFlags: {
      ChngMethodOfAcc: "N",
      ChngShareSec79: "X",
      IncomeCluaseixofsubsection2: "N",
      IncomeCluasexofsubsection2: "N",
      FurnishStatement: "N",
      SubSec2Sec286: "N",
      SubClauseeofClause22: Number(clause22?.amount || 0) > 0 ? "Y" : "N",
    },
    OtherInformation1: {
      ...auditorNameParts(auditor),
      AddrDetail1: auditAddress.AddrDetail1,
      AddrDetail2: auditAddress.AddrDetail2,
      CityOrTownOrDistrict: auditAddress.CityOrTownOrDistrict,
      StateCode: auditAddress.StateCode,
      CountryCode: auditAddress.CountryCode,
      PinCode: auditAddress.PinCode,
      Place: auditor.place || auditor.city || "City",
      Date: auditor.date || todayIso(),
      MembershipNo: auditor.membershipNumber || "",
      FirmRegNum: auditor.frn || "",
    },
  };
  if (Number(clause26?.amount || 0) > 0) {
    base.Form3cdUnpaidStrySec43b = [{
      LiabilityType: "MSME",
      Section: "43Bh",
      Description: "MSME principal unpaid beyond appointed day - draft for CA review",
      Amount: roundMoney(clause26.amount),
    }];
  }
  return { [rootKey]: { [bodyKey]: base } };
}

function buildDeclaration(report, assessee, auditor, address) {
  const fy = parseFy(report.financialYear);
  const commonPoint3 = {
    My_Our1: "My",
    My_Our2: "My",
    Me_Us: "Me",
    ...(auditor.observations ? { Observations: [{ ObservationsCode: "99", Others: auditor.observations }] } : {}),
  };
  if (report.formType === "3CA") {
    return {
      Point1: {
        I_We1: "I",
        AssesseeName: assesseeNameObject(assessee),
        AddressDetail: address,
        PAN: assessee.pan || "",
        Me_Us_Ms: "me",
        CA_FirmName: auditor.firmName || auditor.caName || "",
        Act: "Other law",
        I_We2: "I",
        My_Our_Their: "my",
        AuditDated: auditor.date || todayIso(),
        DateofsigningTaxAuditReport: auditor.date || todayIso(),
        PointA: "audit report is attached as reviewed by the Chartered Accountant",
        AuditYearDate: fy.endDate || "",
        PointC: "Form 3CD particulars are prepared as a draft for CA review",
      },
      Point3: commonPoint3,
    };
  }
  return {
    Point1: {
      I_We: "I",
      DateofsigningTaxAuditReport: auditor.date || todayIso(),
      Year: Number(String(report.financialYear || "").slice(0, 4)) || new Date().getFullYear(),
      TypeOfAccount: "business",
      StartDate: fy.startDate || "",
      EndDate: fy.endDate || "",
      AssesseeName: assesseeNameObject(assessee),
      AddressDetail: address,
      PAN: assessee.pan || "",
    },
    Point2: {
      I_We: "I",
      TypeOfAccount: "business",
      HeadOfficeLocation: assessee.placeOfBusiness || assessee.city || "Head office",
      NumberOfBrances: 0,
    },
    Point3: {
      PointA: { I_We: "I" },
      PointB_A: { I_We: "I", My_Our: "My" },
      PointB_B: { My_Our1: "My", My_Our2: "My" },
      PointB_C: {
        My_Our1: "My",
        My_Our2: "My",
        Me_Us: "Me",
        PointFirst: String(new Date().getFullYear()),
        PointSecond: { typeOfAccount: "Profit and loss account", PLSD: "Profit" },
      },
    },
    Point5: commonPoint3,
  };
}

function customValidation(report, officialJson) {
  const errors = [];
  const assessee = report.assessee || {};
  const auditor = report.auditor || {};
  const clauses = report.clauses || [];
  const clause22 = clauses.find((clause) => clause.clauseNo === "22");
  const clause26 = clauses.find((clause) => clause.clauseNo === "26");
  const clause22Total = roundMoney((clause22?.payload?.rows || []).reduce((sum, row) => sum + Number(row.clause22iiiBOutstandingDisallowance || row.amountInadmissible || row.interestPayable || 0), 0));
  const clause26Total = roundMoney((clause26?.payload?.rows || []).reduce((sum, row) => sum + Number(row.principalDisallowance || row.disallowanceAmount || 0), 0));

  const block = (code, message, extra = {}) => errors.push({ severity: "error", code, message, ...extra });
  const warn = (code, message, extra = {}) => errors.push({ severity: "warning", code, message, ...extra });
  if (!assessee.pan) block("MISSING_PAN", "Assessee PAN is required.");
  if (!report.assessmentYear) block("MISSING_ASSESSMENT_YEAR", "Assessment year is required.");
  if (!assessee.name) block("MISSING_ASSESSEE_NAME", "Assessee name is required.");
  if (!assessee.address || !assessee.city || !assessee.pinCode || !assessee.stateCode) block("MISSING_ASSESSEE_ADDRESS", "Complete assessee address is required.");
  if (!assessee.statusCode) block("MISSING_ASSESSEE_STATUS", "Assessee status code is required.");
  if (!auditor.caName && !auditor.firmName) block("MISSING_AUDITOR_NAME", "Auditor or firm name is required.");
  if (!auditor.membershipNumber) block("MISSING_MEMBERSHIP_NUMBER", "CA membership number is required.");
  if (!auditor.place) block("MISSING_AUDITOR_PLACE", "Auditor signing place is required.");
  if (!auditor.udin) warn("MISSING_UDIN", "UDIN is blank. Final filing should be updated/verified through the portal workflow.");
  if (roundMoney(clause22?.amount || 0) !== clause22Total) block("CLAUSE22_TOTAL_MISMATCH", "Clause 22 total does not match MSME computation annexure.", { clauseNo: "22" });
  if (roundMoney(clause26?.amount || 0) !== clause26Total) block("CLAUSE26_TOTAL_MISMATCH", "Clause 26 total does not match MSME 43B(h) annexure.", { clauseNo: "26" });
  const manualPending = clauses.filter((clause) => clause.reviewStatus === "requires_review");
  if (manualPending.length) warn("CLAUSES_REQUIRE_CA_REVIEW", `${manualPending.length} Form 3CD clauses require CA review.`);
  if (!officialJson) block("JSON_NOT_GENERATED", "Official schema JSON could not be generated.");
  return errors;
}

function validateReport(reportId, options = {}) {
  const report = getReport(reportId);
  if (!report) throw new Error("Tax audit report not found");
  const officialJson = buildOfficialJson(reportId);
  const schemaResult = schemaService.validateJson(report.formType, officialJson);
  const schemaErrors = schemaResult.errors.map((error) => ({
    severity: "error",
    code: error.code || "SCHEMA_VALIDATION",
    message: error.message,
    schemaPath: error.path,
  }));
  const validation = [...customValidation(report, officialJson), ...schemaErrors];
  const hasErrors = validation.some((item) => item.severity === "error");
  const hasWarnings = validation.some((item) => item.severity === "warning");
  const validationStatus = hasErrors ? "failed" : hasWarnings ? "warnings" : "passed";
  const status = hasErrors ? "needs_review" : report.status === "exported" ? "exported" : "ready_for_utility_export";
  taxAuditRepository.replaceValidation(reportId, validation);
  const updated = taxAuditRepository.updateReport(reportId, {
    status,
    validationStatus,
    generatedJsonSnapshot: officialJson,
  });
  taxAuditRepository.createVersion(reportId, { report: updated, officialJson, validation }, options.actor || "system");
  return getReport(reportId);
}

function assertExportable(report) {
  if (!report) throw new Error("Tax audit report not found");
  const blocking = (report.validation || []).filter((item) => item.severity === "error");
  if (blocking.length) throw new Error(`Tax audit report has ${blocking.length} blocking validation error(s).`);
}

function getJsonExport(reportId) {
  const report = validateReport(reportId);
  assertExportable(report);
  return JSON.stringify(report.generatedJsonSnapshot, null, 2);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

function tableRows(rows = [], columns = []) {
  const safeRows = rows.slice(0, 200);
  if (!safeRows.length) return `<tr><td colspan="${columns.length}">No records</td></tr>`;
  return safeRows.map((row) => `<tr>${columns.map(([key]) => `<td>${escapeHtml(row[key])}</td>`).join("")}</tr>`).join("");
}

function buildPdfHtml(report) {
  const clause22 = report.annexures.find((item) => item.annexureType === "clause22")?.payload || [];
  const clause26 = report.annexures.find((item) => item.annexureType === "clause26")?.payload || [];
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #111827; font-size: 11px; line-height: 1.45; }
    h1, h2, h3 { margin: 0 0 8px; }
    h1 { font-size: 22px; text-align: center; }
    h2 { font-size: 16px; border-bottom: 1px solid #9ca3af; padding-bottom: 4px; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 8px; page-break-inside: auto; }
    th, td { border: 1px solid #d1d5db; padding: 5px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    .cover { min-height: 820px; display: flex; flex-direction: column; justify-content: center; text-align: center; }
    .muted { color: #6b7280; }
    .warning { border: 1px solid #f59e0b; background: #fffbeb; padding: 10px; margin: 12px 0; font-weight: bold; }
    .footer-note { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; color: #6b7280; font-size: 9px; }
  </style>
</head>
<body>
  <div class="footer-note">Draft for CA review. Final filing must be validated through official Income Tax utility/portal.</div>
  <section class="cover">
    <h1>${escapeHtml(report.formType)} + Form 3CD Tax Audit Draft</h1>
    <p>${escapeHtml(report.assessee.name || report.companyName)}</p>
    <p>Financial Year ${escapeHtml(report.financialYear)} | Assessment Year ${escapeHtml(report.assessmentYear)}</p>
    <div class="warning">Draft for CA review only. This is not final filing proof.</div>
  </section>
  <h2>Form ${escapeHtml(report.formType)} Report Section</h2>
  <p>Auditor: ${escapeHtml(report.auditor.caName || report.auditor.firmName)} | Membership No: ${escapeHtml(report.auditor.membershipNumber)} | FRN: ${escapeHtml(report.auditor.frn)}</p>
  <p>Place: ${escapeHtml(report.auditor.place)} | Date: ${escapeHtml(report.auditor.date)} | UDIN: ${escapeHtml(report.auditor.udin || "To be updated/verified")}</p>
  <h2>Form 3CD Part A</h2>
  <table><tbody>
    <tr><th>Name</th><td>${escapeHtml(report.assessee.name)}</td><th>PAN</th><td>${escapeHtml(report.assessee.pan)}</td></tr>
    <tr><th>Address</th><td>${escapeHtml(report.assessee.address)}</td><th>GSTIN</th><td>${escapeHtml(report.assessee.gstin)}</td></tr>
    <tr><th>Status</th><td>${escapeHtml(report.assessee.status)}</td><th>Nature of business</th><td>${escapeHtml(report.assessee.natureOfBusiness)}</td></tr>
  </tbody></table>
  <h2>Form 3CD Clause Review</h2>
  <table>
    <thead><tr><th>Clause</th><th>Title</th><th>Source</th><th>Status</th><th>Amount</th><th>Review</th><th>Remarks</th></tr></thead>
    <tbody>${report.clauses.map((clause) => `<tr><td>${escapeHtml(clause.clauseNo)}</td><td>${escapeHtml(clause.title)}</td><td>${escapeHtml(clause.sourceType)}</td><td>${escapeHtml(clause.status)}</td><td>${escapeHtml(clause.amount)}</td><td>${escapeHtml(clause.reviewStatus)}</td><td>${escapeHtml(clause.remarks)}</td></tr>`).join("")}</tbody>
  </table>
  <h2>Clause 22 MSME Computation Annexure</h2>
  <table><thead><tr><th>Supplier</th><th>Purchases</th><th>Paid During Year</th><th>Clause 22(iii)(b)</th><th>Section 16 Interest</th><th>Remarks</th></tr></thead><tbody>${tableRows(clause22, [["supplier"], ["totalPurchasesFromMicroSmall"], ["amountPaidDuringYear"], ["clause22iiiBOutstandingDisallowance"], ["interestUnderSection16"], ["remarks"]])}</tbody></table>
  <h2>Clause 26 43B(h) Annexure</h2>
  <table><thead><tr><th>Supplier</th><th>Principal Disallowance</th><th>Source Clause</th><th>Allowed In Year</th><th>Remarks</th></tr></thead><tbody>${tableRows(clause26, [["supplier"], ["principalDisallowance"], ["sourceClause"], ["allowedInYear"], ["remarks"]])}</tbody></table>
  <h2>Validation Checklist</h2>
  <table><thead><tr><th>Severity</th><th>Code</th><th>Clause</th><th>Message</th></tr></thead><tbody>${tableRows(report.validation, [["severity"], ["code"], ["clauseNo"], ["message"]])}</tbody></table>
  <h2>Signature Block</h2>
  <p>For ${escapeHtml(report.auditor.firmName || "CA Firm")}</p>
  <p style="margin-top:48px;">Chartered Accountant<br/>Membership No: ${escapeHtml(report.auditor.membershipNumber)}<br/>FRN: ${escapeHtml(report.auditor.frn)}<br/>Place: ${escapeHtml(report.auditor.place)} | Date: ${escapeHtml(report.auditor.date)}</p>
</body>
</html>`;
}

async function generatePdf(reportId) {
  const report = validateReport(reportId);
  ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `tax-audit-${report.id}.pdf`);
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setContent(buildPdfHtml(report), { waitUntil: "networkidle0" });
    await page.pdf({ path: outputPath, format: "A4", printBackground: true, margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" } });
  } finally {
    await browser.close();
  }
  taxAuditRepository.updateReport(reportId, { generatedPdfPath: outputPath });
  return { path: outputPath, buffer: fs.readFileSync(outputPath) };
}

function workbookBuffer(name, rows, headers) {
  const workbook = XLSX.utils.book_new();
  const sheetRows = Array.isArray(rows) && rows.length ? rows : [Object.fromEntries(headers.map((header) => [header, ""]))];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetRows), name.slice(0, 31));
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

function workingPaperChecklist(report) {
  const rows = [
    { area: "Assessee details", status: report.assessee.pan ? "Available" : "Missing", action: "Confirm name, PAN, address, status and AY." },
    { area: "Auditor details", status: report.auditor.membershipNumber ? "Available" : "Missing", action: "Confirm CA membership, FRN, place/date and UDIN." },
    { area: "Clause 22", status: "Auto-filled", action: "Review MSME interest and Section 23 disallowance annexure." },
    { area: "Clause 26", status: "Auto-filled", action: "Review 43B(h) unpaid/paid-late MSME principal annexure." },
    { area: "Manual clauses", status: "Requires CA review", action: "Complete all legal-judgement clauses before utility export." },
  ];
  return workbookBuffer("Checklist", rows, ["area", "status", "action"]);
}

function msmeAnnexureWorkbook(report) {
  const workbook = XLSX.utils.book_new();
  for (const annexure of report.annexures.filter((item) => ["clause22", "clause26"].includes(item.annexureType))) {
    const rows = Array.isArray(annexure.payload) && annexure.payload.length ? annexure.payload : [{ note: "No records" }];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), annexure.title.slice(0, 31));
  }
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

async function exportPackage(reportId) {
  const report = validateReport(reportId);
  assertExportable(report);
  const pdf = await generatePdf(reportId);
  taxAuditRepository.updateReport(reportId, { status: "exported" });
  const files = [
    { name: "tax-audit.json", content: JSON.stringify(report.generatedJsonSnapshot, null, 2) },
    { name: "tax-audit-preview.pdf", content: pdf.buffer },
    { name: "validation-report.json", content: JSON.stringify(report.validation, null, 2) },
    { name: "working-paper-checklist.xlsx", content: workingPaperChecklist(report) },
    { name: "msme-annexures.xlsx", content: msmeAnnexureWorkbook(report) },
    { name: "README.txt", content: "Draft for CA review. Final filing/upload/DSC must happen through the official Income Tax utility/portal." },
  ];
  return reportService.buildSimpleZip(files);
}

module.exports = {
  createReport,
  listReports,
  getReport,
  updateDetails,
  updateClause,
  validateReport,
  buildOfficialJson,
  getJsonExport,
  generatePdf,
  exportPackage,
};
