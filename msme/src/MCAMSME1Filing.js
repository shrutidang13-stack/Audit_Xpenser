import { useCallback, useEffect, useMemo, useState } from "react";
import {
  abortMcaMsme1Automation,
  captureMcaMsme1AutomationSrn,
  continueMcaMsme1Automation,
  createMSMEReport,
  downloadUrl,
  fetchMcaMsme1AutomationStatus,
  fetchMcaMsme1Filings,
  fetchImports,
  fetchReports,
  generateMcaMsme1,
  mcaMsme1DownloadUrl,
  previewMcaMsme1,
  startMcaMsme1AssistedFiling,
} from "./services/api";

const HALF_YEARS = [
  ["apr-sep", "April-September"],
  ["oct-mar", "October-March"],
];

const TARGET_FISCAL_YEAR = "2025-26";
const DEFAULT_HALF_YEAR = "oct-mar";
const DISPLAY_FISCAL_YEARS = ["2025-26", "2026-27"];
const MCA_PORTAL_URL = "https://www.mca.gov.in/content/mca/global/en/home.html";
const COMPANY_DEFAULTS = {
  cin: "U34100UP2021PTC156494",
  pan: "AAHCN9637N",
  companyName: "NXTMOBILITY ENERGY PRIVATE LIMITED",
};

const AUTOMATION_TERMINAL_STATUSES = new Set(["completed", "aborted", "validation_failed", "error"]);
const MANUAL_AUTOMATION_STATUSES = new Set(["waiting_for_captcha", "waiting_for_otp", "manual_action_required", "waiting_for_dsc", "waiting_for_final_submission", "srn_capture_pending"]);

function isValidFiscalYear(value) {
  return /^\d{4}-\d{2}$/.test(String(value || ""));
}

function preferredReportId(reports = []) {
  const preferred = reports.find((report) => report.fiscalYear === TARGET_FISCAL_YEAR);
  const valid = reports.find((report) => isValidFiscalYear(report.fiscalYear));
  return (preferred || valid)?.id || "";
}

function halfYearLabel(value) {
  return HALF_YEARS.find(([halfYear]) => halfYear === value)?.[1] || value;
}

function halfYearDueDate(fiscalYear, halfYear) {
  if (!isValidFiscalYear(fiscalYear)) return "";
  const startYear = Number(String(fiscalYear).slice(0, 4));
  if (halfYear === "apr-sep") return `31-Oct-${startYear}`;
  return `30-Apr-${startYear + 1}`;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "";
}

function importHasFiscalYear(importRun, fiscalYear) {
  const years = importRun?.summary?.financialYears || [];
  return years.includes(fiscalYear) || importRun?.fiscalYear === fiscalYear || importRun?.fiscalYear === "custom";
}

function findImportForFiscalYear(imports = [], fiscalYear) {
  return imports.find((importRun) => importRun.status === "completed" && importHasFiscalYear(importRun, fiscalYear));
}

function findLatestGeneratedFiling(filings = [], reportId, halfYear) {
  if (!reportId) return null;
  return filings.find((filing) =>
    filing.reportId === reportId &&
    filing.halfYear === halfYear &&
    filing.downloadUrl &&
    filing.status !== "validation_failed"
  ) || null;
}

export default function MCAMSME1Filing({ displayResetVersion = 0 }) {
  const [reports, setReports] = useState([]);
  const [reportId, setReportId] = useState("");
  const [halfYear, setHalfYear] = useState(DEFAULT_HALF_YEAR);
  const [preview, setPreview] = useState(null);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(COMPANY_DEFAULTS);
  const [uploadedRows, setUploadedRows] = useState([]);
  const [automationForm, setAutomationForm] = useState({
    mcaUserId: "",
  });
  const [automationRun, setAutomationRun] = useState(null);
  const [automationEvents, setAutomationEvents] = useState([]);
  const [loading, setLoading] = useState("");
  const [autoGeneratingReports, setAutoGeneratingReports] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedReport = useMemo(() => reports.find((report) => report.id === reportId), [reports, reportId]);
  const reportsByFiscalYear = useMemo(() => {
    const byYear = {};
    for (const fiscalYear of DISPLAY_FISCAL_YEARS) {
      byYear[fiscalYear] = reports.find((report) => report.fiscalYear === fiscalYear) || null;
    }
    return byYear;
  }, [reports]);
  const dueDate = halfYearDueDate(selectedReport?.fiscalYear, halfYear);
  const blockingErrors = preview?.validation?.errors || [];
  const warnings = preview?.validation?.warnings || [];
  const canGenerate = reportId && !loading && !autoGeneratingReports;
  const automationStatus = automationRun?.status || "";
  const canContinueAutomation = automationRun?.id && MANUAL_AUTOMATION_STATUSES.has(automationStatus) && automationStatus !== "srn_capture_pending";
  const canAbortAutomation = automationRun?.id && !AUTOMATION_TERMINAL_STATUSES.has(automationStatus);
  const canCaptureSrn = automationRun?.id && ["waiting_for_final_submission", "srn_capture_pending", "completed"].includes(automationStatus);

  const ensureDisplayReports = useCallback(async (currentReports = []) => {
    const existingYears = new Set(currentReports.map((report) => report.fiscalYear));
    const missingYears = DISPLAY_FISCAL_YEARS.filter((fiscalYear) => !existingYears.has(fiscalYear));
    if (!missingYears.length) return currentReports;
    const importData = await fetchImports();
    const createdYears = [];
    const skippedYears = [];
    for (const fiscalYear of missingYears) {
      const importRun = findImportForFiscalYear(importData.imports || [], fiscalYear);
      if (!importRun?.id) {
        skippedYears.push(fiscalYear);
        continue;
      }
      await createMSMEReport(importRun.id, fiscalYear, importRun.asOn || "");
      createdYears.push(fiscalYear);
    }
    if (createdYears.length) {
      setMessage(`Generated MSME report for FY ${createdYears.join(" and FY ")}.`);
      return (await fetchReports()).reports || [];
    }
    if (skippedYears.length) {
      setMessage(`No completed Tally import found for FY ${skippedYears.join(" and FY ")}. Import Tally data first.`);
    }
    return currentReports;
  }, []);

  const loadBase = useCallback(async ({ ensureReports = true } = {}) => {
    const [reportData, filingData] = await Promise.all([fetchReports(), fetchMcaMsme1Filings()]);
    const nextReports = ensureReports ? await ensureDisplayReports(reportData.reports || []) : (reportData.reports || []);
    setReports(nextReports);
    const nextReportId = preferredReportId(nextReports);
    const activeReportId = isValidFiscalYear(nextReports.find((report) => report.id === reportId)?.fiscalYear) ? reportId : nextReportId;
    setReportId(activeReportId);
    const latestFiling = findLatestGeneratedFiling(filingData.filings || [], activeReportId, halfYear);
    setSelectedFiling(latestFiling || null);
    if (!nextReportId && !nextReports.length) {
      setMessage("Generate an MSME compliance report first, then MCA MSME-1 actions will be available.");
    }
  }, [ensureDisplayReports, halfYear, reportId]);

  useEffect(() => {
    if (displayResetVersion > 0) return;
    setAutoGeneratingReports(true);
    loadBase()
      .catch((err) => setError(err.message))
      .finally(() => setAutoGeneratingReports(false));
  }, [displayResetVersion, loadBase]);

  useEffect(() => {
    if (displayResetVersion === 0) return;
    setReports([]);
    setReportId("");
    setPreview(null);
    setSelectedFiling(null);
    setUploadedRows([]);
    setAutomationRun(null);
    setAutomationEvents([]);
    setAutoGeneratingReports(false);
    setLoading("");
    setMessage("Display cleared. Generate or upload MCA MSME-1 data again when ready.");
    setError("");
  }, [displayResetVersion]);

  useEffect(() => {
    if (!automationRun?.id || AUTOMATION_TERMINAL_STATUSES.has(automationRun.status)) return undefined;
    const timer = setInterval(async () => {
      try {
        const response = await fetchMcaMsme1AutomationStatus(automationRun.id);
        setAutomationRun(response.run);
        setAutomationEvents(response.events || []);
      } catch (err) {
        setError(err.message);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [automationRun?.id, automationRun?.status]);

  const runPreview = async () => {
    if (!reportId) return;
    if (!isValidFiscalYear(selectedReport?.fiscalYear)) {
      setPreview(null);
      setError(`MCA MSME-1 requires a financial-year-specific completed report. Please select or generate FY ${TARGET_FISCAL_YEAR} report.`);
      return;
    }
    setLoading("preview");
    setError("");
    setMessage("");
    try {
      const response = await previewMcaMsme1({ reportId, halfYear });
      setPreview(response.preview);
      setMessage(`Preview ready: ${response.preview.eligibleRowCount} MCA supplier rows.`);
    } catch (err) {
      setPreview(null);
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const generateUtility = async () => {
    if (!reportId) return;
    if (!isValidFiscalYear(selectedReport?.fiscalYear)) {
      setError(`MCA MSME-1 requires a financial-year-specific completed report. Please select or generate FY ${TARGET_FISCAL_YEAR} report.`);
      return;
    }
    setLoading("generate");
    setError("");
    setMessage("");
    try {
      const response = await generateMcaMsme1({ reportId, halfYear });
      setPreview(response.preview);
      setSelectedFiling(response.filing);
      await loadBase();
      if (response.generated) {
        setMessage("MCA MSME-1 utility generated. Download the .xlsm and upload it on MCA V3.");
      } else {
        setMessage("Generation blocked. Fix validation errors, especially missing PAN, then generate again.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const downloadFiling = async (filing) => {
    if (!filing?.id) return;
    setError("");
    try {
      await downloadUrl(mcaMsme1DownloadUrl(filing.id), `MCA_MSME1_${filing.fiscalYear}_${filing.halfYear}.xlsm`);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateAutomationForm = (field, value) => {
    setAutomationForm((prev) => ({ ...prev, [field]: value }));
  };

  const changeReport = (nextReportId) => {
    setReportId(nextReportId);
    setPreview(null);
    setSelectedFiling(null);
    setUploadedRows([]);
    setAutomationRun(null);
    setAutomationEvents([]);
    setMessage("");
    setError("");
  };

  const changeFiscalYear = (fiscalYear) => {
    changeReport(reportsByFiscalYear[fiscalYear]?.id || "");
  };

  const changeHalfYear = (nextHalfYear) => {
    setHalfYear(nextHalfYear);
    setPreview(null);
    setSelectedFiling(null);
    setUploadedRows([]);
    setAutomationRun(null);
    setAutomationEvents([]);
    setMessage("");
    setError("");
  };

  const resolveSelectedFiling = async () => {
    if (selectedFiling?.id) return selectedFiling;
    const filingData = await fetchMcaMsme1Filings();
    const latestFiling = findLatestGeneratedFiling(filingData.filings || [], reportId, halfYear);
    setSelectedFiling(latestFiling || null);
    return latestFiling;
  };

  const fileMsme1 = async () => {
    setLoading("file-msme1");
    setError("");
    setMessage("");
    let filing = null;
    try {
      filing = await resolveSelectedFiling();
    } catch (err) {
      setLoading("");
      setError(err.message);
      return;
    }
    if (!filing?.id) {
      setLoading("");
      setError("Generate MCA MSME-1 .xlsm before starting assisted filing automation.");
      return;
    }
    try {
      const response = await startMcaMsme1AssistedFiling(filing.id, {
        mcaUserId: automationForm.mcaUserId,
        companyDetails,
      });
      setAutomationRun(response.run);
      setAutomationEvents(response.events || []);
      setMessage("MCA portal opened in Chrome. The automation will select Login/Register, then pause for manual login.");
    } catch (err) {
      const opened = window.open(MCA_PORTAL_URL, "_blank", "noopener,noreferrer");
      if (!opened) window.location.assign(MCA_PORTAL_URL);
      setError(err.message);
      setMessage("Opened MCA home page directly. Select Login/Register on MCA and continue manually.");
    } finally {
      setLoading("");
    }
  };

  const continueAutomation = async () => {
    if (!automationRun?.id) return;
    setLoading("automation-continue");
    setError("");
    try {
      const response = await continueMcaMsme1Automation(automationRun.id);
      setAutomationRun(response.run);
      setAutomationEvents(response.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const abortAutomation = async () => {
    if (!automationRun?.id) return;
    setLoading("automation-abort");
    setError("");
    try {
      const response = await abortMcaMsme1Automation(automationRun.id);
      setAutomationRun(response.run);
      setAutomationEvents(response.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const captureAutomationSrn = async () => {
    if (!automationRun?.id) return;
    setLoading("automation-srn");
    setError("");
    try {
      const response = await captureMcaMsme1AutomationSrn(automationRun.id);
      setAutomationRun(response.run);
      setAutomationEvents(response.events || []);
      if (response.run?.srn) {
        setSelectedFiling((prev) => (prev ? { ...prev, srn: response.run.srn, status: "submitted" } : prev));
        setMessage(`SRN ${response.run.srn} captured and saved.`);
      } else {
        setMessage("SRN was not detected. Check the MCA acknowledgement screen and click Capture SRN again.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white drop-shadow-sm">MCA MSME-1 Filing</h2>
        <p className="text-sm text-teal-50 mt-1 font-medium drop-shadow-sm">Generate the MCA V3 MSME-1 macro utility from verified MSME report rows and corrected ledger outstanding.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm font-semibold">{error}</div>}
      {message && <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-4 text-sm font-semibold">{message}</div>}
      {autoGeneratingReports && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 mb-4 text-sm font-semibold">Generating missing FY 2025-26 / FY 2026-27 MSME reports...</div>}
      <div className="grid gap-5">
        <section className="bg-white rounded-lg p-5 shadow">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 mb-1">Financial Year</span>
              <select value={selectedReport?.fiscalYear || ""} onChange={(event) => changeFiscalYear(event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select financial year</option>
                {DISPLAY_FISCAL_YEARS.map((fiscalYear) => (
                  <option key={fiscalYear} value={fiscalYear}>
                    FY {fiscalYear}{reportsByFiscalYear[fiscalYear] ? "" : " (report not generated)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 mb-1">Half-Year</span>
              <select value={halfYear} onChange={(event) => changeHalfYear(event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {HALF_YEARS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 mb-1">Company CIN</span>
              <input value={companyDetails.cin} onChange={(event) => setCompanyDetails((prev) => ({ ...prev, cin: event.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Required for XML" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 mb-1">Company PAN</span>
              <input value={companyDetails.pan} onChange={(event) => setCompanyDetails((prev) => ({ ...prev, pan: event.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="Required for XML" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 mb-1">Company Name</span>
              <input value={companyDetails.companyName} onChange={(event) => setCompanyDetails((prev) => ({ ...prev, companyName: event.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Required for XML" />
            </label>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 mt-4 text-sm">
            <p className="font-semibold">MSME-1 filing: FY {selectedReport?.fiscalYear || TARGET_FISCAL_YEAR} | {halfYearLabel(halfYear)}{dueDate ? ` | Due date ${dueDate}` : ""}</p>
            {selectedReport?.fiscalYear === "2026-27" && halfYear === "apr-sep" && (
              <p className="text-xs mt-1 font-semibold text-red-700">April-September 2026 belongs to FY 2026-27 and is not the default filing period here. Use FY 2025-26 for current display/working.</p>
            )}
            <p className="text-xs mt-1">Report only outstanding dues to Micro and Small suppliers exceeding 45 days. Nil MSME-1 return is not required where no such outstanding dues exist.</p>
          </div>

          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mt-4 text-sm">
            <p className="font-bold">Assisted Filing Automation</p>
            <p className="text-xs mt-1">MCA credentials are used only for this session and are not stored. OTP, CAPTCHA, DSC and final submission must be completed manually on MCA portal.</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={runPreview} disabled={!reportId || Boolean(loading) || autoGeneratingReports} className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {loading === "preview" ? "Preparing..." : "Preview MCA Rows"}
            </button>
            <button onClick={generateUtility} disabled={!canGenerate} className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {loading === "generate" ? "Generating..." : "Generate .xlsm"}
            </button>
            {selectedFiling?.downloadUrl && (
              <button onClick={() => downloadFiling(selectedFiling)} className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-semibold">Download .xlsm</button>
            )}
          </div>

          <section className="mt-5 border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex flex-wrap justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Assisted MCA Portal Filing</h3>
                <p className="text-xs text-slate-500">Launches visible Chrome and automates only safe MCA steps. Final filing remains manual.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={fileMsme1} disabled={!reportId || loading === "file-msme1" || canAbortAutomation} className="bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {loading === "file-msme1" ? "Starting..." : "File MSME-1"}
                </button>
                <button onClick={continueAutomation} disabled={!canContinueAutomation || Boolean(loading)} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  Continue
                </button>
                <button onClick={abortAutomation} disabled={!canAbortAutomation || Boolean(loading)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  Abort
                </button>
                <button onClick={captureAutomationSrn} disabled={!canCaptureSrn || Boolean(loading)} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  Capture SRN
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-gray-700 mb-1">MCA User ID</span>
                <input value={automationForm.mcaUserId} onChange={(event) => updateAutomationForm("mcaUserId", event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" autoComplete="off" />
              </label>
            </div>

            <AutomationStatusPanel run={automationRun} events={automationEvents} />
          </section>

          {uploadedRows.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">{uploadedRows.length.toLocaleString("en-IN")} supplier rows uploaded from MCA Excel.</p>
          )}

          {selectedReport && (
            <div className="grid md:grid-cols-3 gap-3 mt-5">
              <Metric label="Fiscal Year" value={selectedReport.fiscalYear} />
              <Metric label="Import Run" value={selectedReport.importRunId} />
              <Metric label="Created" value={shortDate(selectedReport.createdAt)} />
            </div>
          )}
        </section>
      </div>

      {preview && (
        <section className="bg-white rounded-lg p-5 shadow mt-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">MCA Row Preview</h3>
              <p className="text-sm text-gray-500">{preview.halfYearLabel} | {preview.period.from} to {preview.period.to}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <SmallMetric label="Rows" value={preview.eligibleRowCount} />
              <SmallMetric label="Errors" value={blockingErrors.length} tone={blockingErrors.length ? "red" : "green"} />
              <SmallMetric label="Warnings" value={warnings.length} tone={warnings.length ? "yellow" : "gray"} />
              <SmallMetric label="Outstanding >45" value={`Rs ${formatMoney(preview.totals.outstandingMoreThan45Amount)}`} />
              <SmallMetric label="Section 16 Interest" value={`Rs ${formatMoney(preview.totals.section16Interest)}`} tone="yellow" />
            </div>
          </div>

          {blockingErrors.length > 0 && (
            <IssueList title="Blocking Validation Errors" tone="red" issues={blockingErrors} />
          )}
          {warnings.length > 0 && (
            <IssueList title="Warnings" tone="yellow" issues={warnings} />
          )}

          <div className="overflow-auto max-h-[30rem] border border-gray-100 rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {["#", "Supplier", "PAN", "Paid <=45 Other", "Paid >45", "Outstanding <=45", "Outstanding >45", "Sec. 16 Interest", "Reason"].map((label) => (
                    <th key={label} className="text-left p-2 text-xs text-gray-600 whitespace-nowrap">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={`${row.serialNumber}-${row.vendorName}`} className="border-t align-top">
                    <td className="p-2 text-xs">{row.serialNumber}</td>
                    <td className="p-2 text-xs font-semibold text-gray-800 min-w-56">{row.vendorName}</td>
                    <td className="p-2 text-xs font-mono">{row.panNumber || <span className="text-red-600 font-sans">Missing</span>}</td>
                    <td className="p-2 text-xs text-right">{row.paidWithin45OtherCount} / {formatMoney(row.paidWithin45OtherAmount)}</td>
                    <td className="p-2 text-xs text-right">{row.paidAfter45Count} / {formatMoney(row.paidAfter45Amount)}</td>
                    <td className="p-2 text-xs text-right">{row.outstanding45OrLessCount} / {formatMoney(row.outstanding45OrLessAmount)}</td>
                    <td className="p-2 text-xs text-right font-semibold">{row.outstandingMoreThan45Count} / {formatMoney(row.outstandingMoreThan45Amount)}</td>
                    <td className="p-2 text-xs text-right font-semibold">{formatMoney(row.section16Interest)}</td>
                    <td className="p-2 text-xs min-w-64">{row.reason}</td>
                  </tr>
                ))}
                {!preview.rows.length && (
                  <tr><td colSpan="9" className="p-4 text-sm text-gray-500">No MCA-eligible verified MSME rows found for this report.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}

function AutomationStatusPanel({ run, events = [] }) {
  if (!run) {
    return (
      <div className="mt-4 bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-500">
        No assisted filing run started yet. Generate the `.xlsm`, complete the session fields, then click File MSME-1.
      </div>
    );
  }
  const manualAction = MANUAL_AUTOMATION_STATUSES.has(run.status)
    ? run.message
    : "";
  return (
    <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4">
      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <StatusItem label="Current automation step" value={run.currentStep || run.status} />
        <StatusItem label="Action being performed" value={run.message || "-"} />
        <StatusItem label="Manual action required" value={manualAction || "No"} tone={manualAction ? "yellow" : "green"} />
        <StatusItem label="File uploaded" value={run.selectedFilePath ? `${run.fileTypeUsed || "xlsm"} selected` : "Not yet"} />
        <StatusItem label="MCA validation error" value={run.errorMessage || "None"} tone={run.errorMessage ? "red" : "green"} />
        <StatusItem label="SRN captured" value={run.srn || "Pending"} tone={run.srn ? "green" : "gray"} />
      </div>
      {run.screenshotPath && (
        <p className="text-xs text-red-700 mt-3 break-all">Screenshot saved: {run.screenshotPath}</p>
      )}
      {events.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold text-slate-600 mb-2">Automation Events</p>
          <div className="max-h-36 overflow-auto space-y-1">
            {events.slice(-8).map((event) => (
              <p key={event.id} className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{event.stepName || event.eventType}</span>: {event.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusItem({ label, value, tone = "gray" }) {
  const tones = {
    gray: "bg-slate-50 text-slate-800",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-800",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`${tones[tone] || tones.gray} rounded-lg p-3 min-h-20`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="text-sm font-bold mt-1 break-words">{value}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SmallMetric({ label, value, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-50 text-gray-800",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };
  return (
    <div className={`${tones[tone] || tones.gray} rounded-lg px-3 py-2`}>
      <p className="text-sm font-bold whitespace-nowrap">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function IssueList({ title, tone, issues }) {
  const classes = tone === "red"
    ? "bg-red-50 border-red-200 text-red-700"
    : "bg-yellow-50 border-yellow-200 text-yellow-800";
  return (
    <div className={`${classes} border rounded-lg p-3 mb-4`}>
      <p className="text-sm font-bold mb-2">{title}</p>
      <ul className="list-disc pl-5 text-xs space-y-1">
        {issues.slice(0, 8).map((issue, index) => (
          <li key={`${issue.code}-${index}`}>{issue.vendorName ? `${issue.vendorName}: ` : ""}{issue.message}</li>
        ))}
      </ul>
      {issues.length > 8 && <p className="text-xs mt-2">{issues.length - 8} more issues hidden in this view.</p>}
    </div>
  );
}
