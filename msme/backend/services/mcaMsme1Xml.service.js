function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validateMcaXmlPayload(payload = {}) {
  const errors = [];
  const company = payload.companyDetails || {};
  if (!company.cin) errors.push({ field: "cin", message: "CIN is required for MCA MSME Form-1 XML." });
  if (!company.pan) errors.push({ field: "pan", message: "Company PAN is required for MCA MSME Form-1 XML." });
  if (!company.companyName) errors.push({ field: "companyName", message: "Company name is required." });
  if (!payload.fiscalYear) errors.push({ field: "fiscalYear", message: "Fiscal year is required." });
  if (!["apr-sep", "oct-mar"].includes(payload.halfYear)) errors.push({ field: "halfYear", message: "Half-year must be apr-sep or oct-mar." });
  for (const [index, row] of (payload.supplierRows || []).entries()) {
    if (!row.supplierName) errors.push({ row: index + 1, field: "supplierName", message: "Supplier name is required." });
    if (!row.panNumber) errors.push({ row: index + 1, field: "panNumber", message: "PAN is required." });
    const delayedAmount = Number(row.amountPaidAfter45 || 0) + Number(row.outstandingMoreThan45 || 0);
    if (delayedAmount > 0 && !row.reasonForDelay) errors.push({ row: index + 1, field: "reasonForDelay", message: "Reason for delay is required for delayed rows." });
  }
  return { valid: errors.length === 0, errors };
}

function buildMcaMsme1Xml(payload = {}) {
  const validation = validateMcaXmlPayload(payload);
  if (!validation.valid) {
    const error = new Error("MCA MSME Form-1 XML validation failed");
    error.validation = validation;
    throw error;
  }
  const rows = payload.supplierRows || [];
  const totals = rows.reduce((acc, row) => {
    acc.amountPaidWithin45 += Number(row.amountPaidWithin45 || 0);
    acc.amountPaidAfter45 += Number(row.amountPaidAfter45 || 0);
    acc.outstanding45OrLess += Number(row.outstanding45OrLess || 0);
    acc.outstandingMoreThan45 += Number(row.outstandingMoreThan45 || 0);
    acc.section16Interest += Number(row.section16Interest || 0);
    acc.principalOutstanding += Number(row.principalOutstanding || 0);
    return acc;
  }, { amountPaidWithin45: 0, amountPaidAfter45: 0, outstanding45OrLess: 0, outstandingMoreThan45: 0, section16Interest: 0, principalOutstanding: 0 });
  const company = payload.companyDetails || {};
  return `<?xml version="1.0" encoding="UTF-8"?>
<MCA_MSME_FORM_1>
  <Company>
    <CIN>${escapeXml(company.cin)}</CIN>
    <PAN>${escapeXml(company.pan)}</PAN>
    <Name>${escapeXml(company.companyName)}</Name>
  </Company>
  <Period>
    <FiscalYear>${escapeXml(payload.fiscalYear)}</FiscalYear>
    <HalfYear>${escapeXml(payload.halfYear)}</HalfYear>
    <Label>${escapeXml(payload.periodLabel || "")}</Label>
  </Period>
  <Suppliers>
${rows.map((row, index) => `    <Supplier serial="${index + 1}">
      <Name>${escapeXml(row.supplierName)}</Name>
      <PAN>${escapeXml(row.panNumber)}</PAN>
      <UdyamNumber>${escapeXml(row.udyamNumber || "")}</UdyamNumber>
      <PaidWithin45>${Number(row.amountPaidWithin45 || 0).toFixed(2)}</PaidWithin45>
      <PaidAfter45>${Number(row.amountPaidAfter45 || 0).toFixed(2)}</PaidAfter45>
      <Outstanding45OrLess>${Number(row.outstanding45OrLess || 0).toFixed(2)}</Outstanding45OrLess>
      <OutstandingMoreThan45>${Number(row.outstandingMoreThan45 || 0).toFixed(2)}</OutstandingMoreThan45>
      <PrincipalOutstanding>${Number(row.principalOutstanding || 0).toFixed(2)}</PrincipalOutstanding>
      <DelayDays>${Number(row.delayDays || 0)}</DelayDays>
      <Section16Interest>${Number(row.section16Interest || 0).toFixed(2)}</Section16Interest>
      <ReasonForDelay>${escapeXml(row.reasonForDelay || "")}</ReasonForDelay>
    </Supplier>`).join("\n")}
  </Suppliers>
  <Totals>
    <PaidWithin45>${totals.amountPaidWithin45.toFixed(2)}</PaidWithin45>
    <PaidAfter45>${totals.amountPaidAfter45.toFixed(2)}</PaidAfter45>
    <Outstanding45OrLess>${totals.outstanding45OrLess.toFixed(2)}</Outstanding45OrLess>
    <OutstandingMoreThan45>${totals.outstandingMoreThan45.toFixed(2)}</OutstandingMoreThan45>
    <PrincipalOutstanding>${totals.principalOutstanding.toFixed(2)}</PrincipalOutstanding>
    <Section16Interest>${totals.section16Interest.toFixed(2)}</Section16Interest>
  </Totals>
</MCA_MSME_FORM_1>`;
}

module.exports = { buildMcaMsme1Xml, validateMcaXmlPayload };
