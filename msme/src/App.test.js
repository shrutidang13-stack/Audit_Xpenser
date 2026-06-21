test("frontend test harness is available", () => {
  expect(true).toBe(true);
});

test("report warning helper surfaces no-verified and pending Udyam messages", async () => {
  const { reportWarningMessages } = await import("./TallyImport");
  const messages = reportWarningMessages({
    noVerifiedMSMEWarning: "No verified MSME vendors are available for the selected period.",
    pendingVerificationVendors: 3,
  });
  expect(messages.join(" ")).toMatch(/No verified MSME vendors/);
  expect(messages.join(" ")).toMatch(/3 vendors need Udyam/);
});

test("report xlsx download URL is supported", async () => {
  const { reportDownloadUrl } = await import("./services/api");
  expect(reportDownloadUrl("abc", "xlsx")).toContain("/api/reports/abc/download.xlsx");
});

test("tax audit download URLs are supported", async () => {
  const { taxAuditDownloadUrl } = await import("./services/api");
  expect(taxAuditDownloadUrl("abc", "json")).toContain("/api/tax-audit/reports/abc/download.json");
  expect(taxAuditDownloadUrl("abc", "pdf")).toContain("/api/tax-audit/reports/abc/preview.pdf");
  expect(taxAuditDownloadUrl("abc", "zip")).toContain("/api/tax-audit/reports/abc/export.zip");
});
