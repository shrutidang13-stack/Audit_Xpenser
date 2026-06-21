import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import TallyImport from "./TallyImport";
import MCAMSME1Filing from "./MCAMSME1Filing";
import TaxAuditReportGenerator from "./TaxAuditReportGenerator";
import AuditEvidencePackButton from "./components/AuditEvidencePackButton";
import ComplianceExplanationPanel from "./components/ComplianceExplanationPanel";
import ComplianceRiskScore from "./components/ComplianceRiskScore";
import PaymentRecommendationPanel from "./components/PaymentRecommendationPanel";
import PaymentWhatIfSimulator from "./components/PaymentWhatIfSimulator";
import {
  askComplianceAssistant,
  createMSMEReport,
  downloadReportFile,
  downloadUrl,
  createRbiBankRateOverride,
  fetchHealth,
  fetchImports,
  fetchLegalRules,
  fetchMcaMsme1Filings,
  fetchCarryForwardRegister,
  fetchRbiBankRateAuditLog,
  fetchRbiBankRates,
  fetchReport,
  fetchReports,
  fetchVendorMaster,
  reportEvidenceBundleUrl,
  reportTallyReconciliationUrl,
  updateRbiBankRates,
} from "./services/api";

const NAV = [
  ["dashboard", "Dashboard"],
  ["tally", "MSME Compliance"],
  ["mca-msme1", "MCA MSME-1 Filing"],
  ["tax-audit", "Tax Audit"],
  ["rules", "Rules"],
  ["settings", "Settings"],
  ["ai", "AI Assistant"],
];

const POWERBI_EMBED_URL = process.env.REACT_APP_POWERBI_EMBED_URL || "";

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [displayResetVersion, setDisplayResetVersion] = useState(0);
  const handleLogout = async () => { await signOut(auth); };
  const clearDisplayData = () => setDisplayResetVersion((version) => version + 1);

  return (
    <div className="min-h-screen app-shell-bg">
      <nav className="bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900">MSME Guard</h1>
          <p className="text-xs text-slate-500">Tally import to statutory MSME compliance working papers</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">{user?.email}</span>
          <button onClick={handleLogout} className="bg-slate-900 text-white px-3 py-2 rounded-md text-sm font-semibold">Logout</button>
        </div>
      </nav>
      <div className="bg-white border-b border-slate-200 flex gap-1 px-4 pt-3 overflow-x-auto sticky top-[65px] z-10">
        {NAV.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-3 font-semibold text-sm whitespace-nowrap border-b-2 ${activeTab === key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"}`}>
            {label}
          </button>
        ))}
      </div>
      <main className="p-4 md:p-6 max-w-[1500px] mx-auto">
        {activeTab === "dashboard" && <Home setActiveTab={setActiveTab} displayResetVersion={displayResetVersion} />}
        <section hidden={activeTab !== "tally"}>
          <TallyImport onClearDisplay={clearDisplayData} displayResetVersion={displayResetVersion} />
        </section>
        {activeTab === "compliance" && <ComplianceReportSection />}
        {activeTab === "clause22" && <Clause22Section />}
        {activeTab === "clause26" && <Clause26Section />}
        {activeTab === "mca-msme1" && <MCAMSME1Filing displayResetVersion={displayResetVersion} />}
        {activeTab === "tax-audit" && <TaxAuditReportGenerator displayResetVersion={displayResetVersion} />}
        {activeTab === "rules" && <Rules />}
        {activeTab === "settings" && <Settings />}
        {activeTab === "ai" && <AIAssistant />}
      </main>
    </div>
  );
}

function Home({ setActiveTab, displayResetVersion = 0 }) {
  const data = useDashboardData(displayResetVersion);
  const latestReport = data.reports[0];
  const latestImport = data.imports.find((row) => row.status === "completed") || data.imports[0];
  const vendorStats = vendorSummary(data.vendors);
  const reportStats = latestReport?.summary || {};
  const pipeline = [
    { label: "Tally imports", value: data.imports.length, tone: "blue" },
    { label: "Verified MSME", value: vendorStats.verifiedMSME, tone: "green" },
    { label: "Pending verification", value: vendorStats.pending, tone: "yellow" },
    { label: "Reports generated", value: data.reports.length, tone: "slate" },
    { label: "43B(h) disallowance", value: money(reportStats.totalDisallowed), tone: "red" },
    { label: "MSMED interest", value: money(reportStats.totalInterest), tone: "orange" },
  ];

  return (
    <div className="space-y-5">
      <HeaderBlock
        title="Compliance Dashboard"
        subtitle="A Power-BI-style view over persisted Tally imports, Udyam verification, Clause 22, 43B(h), Clause 26(A), and MCA MSME-1 readiness."
        action={<button onClick={() => setActiveTab("tally")} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold">Open Tally Import</button>}
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-3">
        {pipeline.map((metric) => <Metric key={metric.label} {...metric} />)}
      </div>
      {latestReport && (
        <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-5">
          <ComplianceRiskScore reportId={latestReport.id} />
          <PaymentRecommendationPanel reportId={latestReport.id} compact />
        </div>
      )}
      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-5">
        <Panel title="Power BI Data Board" subtitle={POWERBI_EMBED_URL ? "Live embedded Power BI report." : "Configured from local Tally/report data. Set REACT_APP_POWERBI_EMBED_URL to embed Power BI."}>
          {POWERBI_EMBED_URL ? (
            <iframe title="Power BI Dashboard" src={POWERBI_EMBED_URL} className="w-full min-h-[32rem] rounded-md border border-slate-200" />
          ) : (
            <PowerBiLikeBoard data={data} />
          )}
        </Panel>
        <Panel title="Current Working File" subtitle="Latest persisted run and report snapshot. Refreshing the browser will reload this from the backend.">
          <KeyValue label="Latest import" value={latestImport ? `${latestImport.fiscalYear} | ${latestImport.companyName || "Company unavailable"}` : "No import yet"} />
          <KeyValue label="Import status" value={latestImport?.status || "Not started"} />
          <KeyValue label="Latest report" value={latestReport ? `${latestReport.fiscalYear} | ${shortDate(latestReport.createdAt)}` : "No report yet"} />
          <KeyValue label="Report period" value={latestReport?.summary?.reportPeriodLabel || "-"} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => setActiveTab("mca-msme1")} className="bg-slate-100 text-slate-800 px-3 py-2 rounded-md text-sm font-semibold">MCA MSME-1</button>
          </div>
        </Panel>
      </div>
      <Panel title="Recent Tally Imports" subtitle="Persisted import runs from Tally.">
        <SimpleTable rows={data.imports.slice(0, 8)} columns={[
          ["createdAt", "Created", shortDate],
          ["fiscalYear", "FY"],
          ["status", "Status"],
          ["companyName", "Company"],
          ["summary.vouchersPersisted", "Vouchers", number],
          ["summary.importedCreditors", "Creditors", number],
        ]} />
      </Panel>
    </div>
  );
}

function ComplianceReportSection() {
  const [imports, setImports] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedImportId, setSelectedImportId] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [fiscalYear, setFiscalYear] = useState("all");
  const [asOnDate, setAsOnDate] = useState("");
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [downloadingReport, setDownloadingReport] = useState("");

  const selectedImport = imports.find((item) => item.id === selectedImportId);
  const availableYears = selectedImport?.summary?.financialYears || (selectedImport?.fiscalYear ? [selectedImport.fiscalYear] : []);

  const loadBase = async () => {
    const [importData, reportData] = await Promise.all([fetchImports(), fetchReports()]);
    const completed = (importData.imports || []).filter((item) => item.status === "completed");
    setImports(completed);
    setReports(reportData.reports || []);
    setSelectedImportId((current) => current || completed[0]?.id || "");
    setSelectedReportId((current) => current || reportData.reports?.[0]?.id || "");
  };

  useEffect(() => {
    loadBase().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedImport) return;
    setAsOnDate((current) => current || toDateInput(selectedImport.asOn));
    setFiscalYear((current) => current || "all");
  }, [selectedImport]);

  const generate = async () => {
    if (!selectedImportId) return;
    setLoading("generate");
    setError("");
    setMessage("");
    try {
      const response = await createMSMEReport(selectedImportId, fiscalYear || "all", asOnDate);
      setReport(response.report);
      setSelectedReportId(response.report.id);
      await loadBase();
      setMessage("MSME compliance report generated with Clause 22, 43B(h), Clause 26(A), interest, and Excel working papers.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const openReport = async (id = selectedReportId) => {
    if (!id) return;
    setLoading("load");
    setError("");
    setMessage("");
    try {
      const response = await fetchReport(id);
      setReport(response.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  const handleReportDownload = async (label, action) => {
    if (!report?.id) return;
    setDownloadingReport(label);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(`${label} download started.`);
    } catch (err) {
      setError(`${label} download failed: ${err.message}`);
    } finally {
      setDownloadingReport("");
    }
  };

  const rows = report?.report || [];
  const schedules = report?.schedules || {};
  const warnings = reportWarningMessages(report?.summary || {});

  return (
    <div className="space-y-5">
      <HeaderBlock title="MSME Compliance Report" subtitle="Generates statutory working papers directly from the selected Tally import and Udyam/MSME verification data." />
      {error && <Alert tone="red" text={error} />}
      {message && <Alert tone="green" text={message} />}
      <Panel title="Generate From Tally Import" subtitle="This replaces the old standalone interest calculator. Interest and disallowance are computed invoice-wise from imported Tally vouchers.">
        <div className="grid md:grid-cols-[1.3fr_0.6fr_0.6fr_auto] gap-3 items-end">
          <label className="block text-sm font-semibold text-slate-700">
            Completed Tally import
            <select value={selectedImportId} onChange={(event) => setSelectedImportId(event.target.value)} className="field">
              <option value="">Select import</option>
              {imports.map((item) => (
                <option key={item.id} value={item.id}>{item.fiscalYear} | {shortDate(item.createdAt)} | {item.companyName || "Company unavailable"}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Report FY
            <select value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)} className="field">
              <option value="all">All FY</option>
              {availableYears.map((fy) => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            As-on date
            <input type="date" value={asOnDate} onChange={(event) => setAsOnDate(event.target.value)} className="field" />
          </label>
          <button onClick={generate} disabled={!selectedImportId || Boolean(loading)} className="bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
            {loading === "generate" ? "Generating..." : "Generate"}
          </button>
        </div>
      </Panel>
      <Panel title="Open Existing Report" subtitle="Reports remain available after browser refresh because they are loaded from backend storage.">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <select value={selectedReportId} onChange={(event) => setSelectedReportId(event.target.value)} className="field">
            <option value="">Select report</option>
            {reports.map((item) => <option key={item.id} value={item.id}>{item.fiscalYear} | {shortDate(item.createdAt)} | import {item.importRunId}</option>)}
          </select>
          <button onClick={() => openReport()} disabled={!selectedReportId || Boolean(loading)} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
            {loading === "load" ? "Loading..." : "Load Report"}
          </button>
        </div>
      </Panel>
      {report && (
        <Panel title="Report Snapshot" subtitle="MSME Compliance Report">
          {warnings.map((warning) => <Alert key={warning} tone="yellow" text={warning} />)}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            <Metric label="Report vendors" value={number(report.summary?.reportVendors)} tone="green" />
            <Metric label="43B(h) disallowance" value={money(report.summary?.totalDisallowed)} tone="red" />
            <Metric label="Tax impact" value={money(report.summary?.totalTaxImpact)} tone="orange" />
            <Metric label="Section 16 interest" value={money(report.summary?.totalInterest)} tone="blue" />
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <button disabled={Boolean(downloadingReport)} onClick={() => handleReportDownload("Excel Workbook", () => downloadReportFile(report.id, "xlsx"))} className="bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{downloadingReport === "Excel Workbook" ? "Starting..." : "Download Excel Workbook"}</button>
            <button disabled={Boolean(downloadingReport)} onClick={() => handleReportDownload("PDF", () => downloadReportFile(report.id, "pdf"))} className="bg-red-700 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{downloadingReport === "PDF" ? "Starting..." : "Download PDF"}</button>
            <button disabled={Boolean(downloadingReport)} onClick={() => handleReportDownload("CSV", () => downloadReportFile(report.id, "csv"))} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{downloadingReport === "CSV" ? "Starting..." : "Download CSV"}</button>
            <button disabled={Boolean(downloadingReport)} onClick={() => handleReportDownload("XML", () => downloadReportFile(report.id, "xml"))} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{downloadingReport === "XML" ? "Starting..." : "Download XML"}</button>
            <button disabled={Boolean(downloadingReport)} onClick={() => handleReportDownload("Evidence Bundle", () => downloadUrl(reportEvidenceBundleUrl(report.id), `MSME_Evidence_Bundle_${report.id}.zip`))} className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{downloadingReport === "Evidence Bundle" ? "Starting..." : "Evidence Bundle"}</button>
            <AuditEvidencePackButton reportId={report.id} />
            <button disabled={Boolean(downloadingReport)} onClick={() => handleReportDownload("Reconciliation", () => downloadUrl(reportTallyReconciliationUrl(report.id), `MSME_Tally_Reconciliation_${report.id}.csv`))} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{downloadingReport === "Reconciliation" ? "Starting..." : "Reconciliation"}</button>
            <button onClick={() => exportVendorWise(rows, `MSME_Vendor_Wise_${report.fiscalYear}.xlsx`)} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold">Vendor-wise Excel</button>
          </div>
          <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-4 mb-5">
            <ComplianceRiskScore reportId={report.id} />
            <PaymentRecommendationPanel reportId={report.id} compact />
          </div>
          <div className="grid xl:grid-cols-2 gap-4 mb-5">
            <PaymentWhatIfSimulator report={report} />
            <ComplianceExplanationPanel reportId={report.id} />
          </div>
          <SchedulePreview schedules={schedules} />
          <h3 className="text-sm font-bold text-slate-700 mt-5 mb-2">Included verified MSME vendors</h3>
          <SimpleTable rows={rows} columns={[
            ["vendorName", "Vendor"],
            ["panNumber", "PAN"],
            ["udyamNumber", "Udyam"],
            ["enterpriseType", "Type"],
            ["ledgerOutstandingAmount", "Outstanding", money],
            ["allowedPaymentDays", "Allowed days"],
            ["delayDays", "Delay days"],
            ["disallowed", "Disallowance", money],
            ["interest", "Interest", money],
          ]} />
        </Panel>
      )}
    </div>
  );
}

function Clause22Section() {
  const { reports, report, reportId, setReportId, loadReport, error, loading } = useReportPicker();
  const clause22 = report?.schedules?.clause22Computation || [];
  const interestClause22 = report?.schedules?.clause22 || [];
  const disallowance43Bh = report?.schedules?.clause43BhFromClause22 || report?.schedules?.disallowance43Bh || [];
  const clause26BSource = report?.schedules?.clause26 || [];
  const totalClause22 = interestClause22.reduce((sum, row) => sum + Number(row.amountInadmissible || row.interestPayable || 0), 0);
  const total43Bh = disallowance43Bh.reduce((sum, row) => sum + Number(row.principalDisallowance || 0), 0);

  return (
    <div className="space-y-5">
      <HeaderBlock title="Clause 22 & 43B(h)" subtitle="Clause 22 interest disclosure and 43B(h) principal disallowance use the same report snapshot so figures reconcile." />
      {error && <Alert tone="red" text={error} />}
      <ReportPicker reports={reports} reportId={reportId} setReportId={setReportId} loadReport={loadReport} loading={loading} />
      {report && (
        <Panel title="Clause 22 / 43B(h) Working" subtitle={`FY ${report.fiscalYear} | ${report.summary?.reportPeriodLabel || ""}`}>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            <Metric label="Clause 22(iii)(b)" value={money(total43Bh)} tone="red" />
            <Metric label="43B(h) disallowance" value={money(total43Bh)} tone="red" />
            <Metric label="Clause 22 interest" value={money(totalClause22)} tone="orange" />
            <Metric label="Source Clause 26 rows" value={number(clause26BSource.length)} tone="slate" />
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => downloadReportFile(report.id, "xlsx")} className="bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-semibold">Download Working Papers</button>
            <button onClick={() => exportVendorWise(disallowance43Bh, `Clause_43B_h_Vendor_Wise_${report.fiscalYear}.xlsx`)} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold">Vendor-wise Excel</button>
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-2">Clause 22 MSME computation</h3>
          <SimpleTable rows={clause22} columns={[
            ["financialYear", "FY"],
            ["supplier", "Supplier"],
            ["udyamNumber", "Udyam"],
            ["totalPurchasesFromMicroSmall", "Total purchases", money],
            ["amountPaidDuringYear", "Paid during year", money],
            ["postMarchPaymentsWithin45Days", "Post-March <=45 days", money],
            ["clause22iiiBOutstandingDisallowance", "Clause 22(iii)(b)", money],
            ["remarks", "Remarks"],
          ]} />
          <h3 className="text-sm font-bold text-slate-700 mt-5 mb-2">Clause 22 interest disclosure</h3>
          <SimpleTable rows={interestClause22} columns={[
            ["financialYear", "FY"],
            ["supplier", "Supplier"],
            ["invoiceNumber", "Invoice"],
            ["interestPayable", "Interest payable", money],
            ["amountInadmissible", "Inadmissible", money],
          ]} />
          <h3 className="text-sm font-bold text-slate-700 mt-5 mb-2">43B(h) principal disallowance</h3>
          <SimpleTable rows={disallowance43Bh} columns={[
            ["financialYear", "FY"],
            ["vendorName", "Vendor"],
            ["invoiceNumber", "Invoice"],
            ["principalAmount", "Principal", money],
            ["principalDisallowance", "Disallowance", money],
            ["allowedInYear", "Allowed in"],
            ["remarks", "Remarks"],
          ]} />
        </Panel>
      )}
    </div>
  );
}

function Clause26Section() {
  const { reports, report, reportId, setReportId, loadReport, error, loading } = useReportPicker();
  const [register, setRegister] = useState({ rows: [], summary: {} });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const loadRegister = async (refresh = false) => {
    if (!report?.id) return;
    setRegisterLoading(true);
    setRegisterError("");
    try {
      const response = await fetchCarryForwardRegister(report.id, refresh ? { refresh: "1" } : {});
      setRegister({ rows: response.rows || [], summary: response.summary || {} });
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  useEffect(() => {
    setRegister({ rows: report?.schedules?.clause26CarryForwardRegister || [], summary: report?.schedules?.clause26CarryForwardSummary || {} });
    if (report?.id) loadRegister(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id]);

  const registerRows = register.rows || [];
  const unpaid = register.summary?.openingDisallowance ?? registerRows.reduce((sum, row) => sum + Number(row.openingDisallowance || 0), 0);
  const deductible = register.summary?.deductibleCurrentYear ?? registerRows.reduce((sum, row) => sum + Number(row.deductibleCurrentYear || 0), 0);
  const closingCarry = register.summary?.closingCarryForward ?? registerRows.reduce((sum, row) => sum + Number(row.closingCarryForward || 0), 0);

  return (
    <div className="space-y-5">
      <HeaderBlock title="Clause 26(A) Register" subtitle="Carry-forward view for MSME actual-payment disallowance, with paid-late and unpaid delayed invoices separated vendor-wise." />
      {error && <Alert tone="red" text={error} />}
      {registerError && <Alert tone="red" text={registerError} />}
      <ReportPicker reports={reports} reportId={reportId} setReportId={setReportId} loadReport={loadReport} loading={loading} />
      {report && (
        <Panel title="Carry-Forward Register" subtitle="Use this as the continuity register for prior/current year MSME disallowance and deduction on actual payment.">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            <Metric label="Opening disallowance" value={money(unpaid)} tone="red" />
            <Metric label="Deductible this year" value={money(deductible)} tone="green" />
            <Metric label="Closing carry-forward" value={money(closingCarry)} tone="orange" />
            <Metric label="Register rows" value={number(registerRows.length)} tone="slate" />
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => downloadReportFile(report.id, "xlsx")} className="bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-semibold">Download Excel Workbook</button>
            <button onClick={() => exportVendorWise(registerRows, `Clause_26A_Carry_Forward_${report.fiscalYear}.xlsx`)} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold">Vendor-wise Excel</button>
            <button onClick={() => loadRegister(true)} disabled={registerLoading} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">{registerLoading ? "Refreshing..." : "Refresh Register"}</button>
          </div>
          <SimpleTable rows={registerRows} columns={[
            ["financialYear", "FY"],
            ["vendorName", "Supplier"],
            ["invoiceNumber", "Invoice"],
            ["invoiceDate", "Invoice date"],
            ["openingDisallowance", "Opening disallowance", money],
            ["paidDuringYear", "Paid during year", money],
            ["deductibleCurrentYear", "Deductible current year", money],
            ["closingCarryForward", "Closing carry-forward", money],
            ["settlementSource", "Settlement source"],
            ["evidenceReference", "Evidence"],
            ["status", "Status"],
          ]} />
        </Panel>
      )}
    </div>
  );
}

function Rules() {
  const [rulePack, setRulePack] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchLegalRules().then((data) => setRulePack(data.rulePack)).catch((err) => setError(err.message));
  }, []);
  return (
    <Panel title="Rules" subtitle="Rule pack used by backend MSME reports and the AI assistant.">
      {error && <Alert tone="red" text={error} />}
      {!rulePack && <p className="text-sm text-slate-500">No rules loaded.</p>}
      {rulePack && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Metric label="Rule version" value={rulePack.version} tone="blue" />
            <Metric label="Rules" value={rulePack.rules.length} tone="green" />
            <Metric label="Sources" value={rulePack.sources.length} tone="slate" />
          </div>
          <SimpleTable rows={rulePack.rules} columns={[
            ["id", "Rule ID"],
            ["name", "Name"],
            ["condition", "Condition"],
            ["effect", "Effect"],
          ]} />
        </div>
      )}
    </Panel>
  );
}

function Settings() {
  const data = useDashboardData();
  const [health, setHealth] = useState(null);
  const [rulePack, setRulePack] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchHealth(), fetchLegalRules()])
      .then(([healthData, rules]) => {
        setHealth(healthData);
        setRulePack(rules.rulePack);
      })
      .catch((err) => setError(err.message));
  }, []);

  const vendorStats = vendorSummary(data.vendors);
  const settings = {
    api: health,
    powerBiEmbedConfigured: Boolean(POWERBI_EMBED_URL),
    importsPersisted: data.imports.length,
    reportsPersisted: data.reports.length,
    mcaFilingsPersisted: data.filings.length,
    vendors: vendorStats,
    rulePack: rulePack ? { version: rulePack.version, rules: rulePack.rules?.length || 0, sources: rulePack.sources?.length || 0 } : null,
  };

  return (
    <Panel title="Settings" subtitle="Runtime, persistence, rule, dashboard, and filing settings in one place.">
      {error && <Alert tone="red" text={error} />}
      <div className="grid md:grid-cols-4 gap-3 mb-5">
        <Metric label="Backend" value={health?.success === false ? "Issue" : "Online"} tone={health?.success === false ? "red" : "green"} />
        <Metric label="Persisted imports" value={number(data.imports.length)} tone="blue" />
        <Metric label="Reports" value={number(data.reports.length)} tone="slate" />
        <Metric label="MCA filings" value={number(data.filings.length)} tone="orange" />
      </div>
      <pre className="bg-slate-950 text-emerald-100 rounded-md p-4 text-xs overflow-auto">{JSON.stringify(settings, null, 2)}</pre>
      <div className="mt-5">
        <RbiBankRateAdmin />
      </div>
    </Panel>
  );
}

function RbiBankRateAdmin() {
  const [state, setState] = useState({ rates: [], latest: null, auditLog: [], message: "", error: "" });
  const [loading, setLoading] = useState("");
  const [override, setOverride] = useState({ effectiveFromDate: "", effectiveToDate: "", bankRate: "", reason: "" });

  const load = async () => {
    const [ratesData, auditData] = await Promise.all([fetchRbiBankRates(), fetchRbiBankRateAuditLog()]);
    setState((prev) => ({
      ...prev,
      rates: ratesData.rates || [],
      latest: ratesData.latest || null,
      auditLog: auditData.auditLog || [],
      error: "",
    }));
  };

  useEffect(() => {
    load().catch((err) => setState((prev) => ({ ...prev, error: err.message })));
  }, []);

  const updateOfficial = async () => {
    setLoading("update");
    setState((prev) => ({ ...prev, message: "", error: "" }));
    try {
      const response = await updateRbiBankRates();
      await load();
      setState((prev) => ({ ...prev, message: `Official Bank Rate update complete. Parsed ${response.parsed || 0}, inserted ${response.inserted || 0}.` }));
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message || "RBI rate update failed — use last verified rate or manual override." }));
    } finally {
      setLoading("");
    }
  };

  const saveOverride = async () => {
    setLoading("override");
    setState((prev) => ({ ...prev, message: "", error: "" }));
    try {
      await createRbiBankRateOverride(override);
      setOverride({ effectiveFromDate: "", effectiveToDate: "", bankRate: "", reason: "" });
      await load();
      setState((prev) => ({ ...prev, message: "Manual Bank Rate override saved and audit logged." }));
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }));
    } finally {
      setLoading("");
    }
  };

  const latest = state.latest;
  return (
    <div className="border border-slate-200 rounded-md p-4 bg-white">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">RBI Bank Rate Source</h3>
          <p className="text-xs text-slate-500">Official DICGC/RBI Bank Rate history for MSMED Section 16 interest. Repo, reverse repo, SDF, and MSF rates are ignored.</p>
        </div>
        <button onClick={updateOfficial} disabled={Boolean(loading)} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
          {loading === "update" ? "Updating..." : "Update RBI Bank Rate"}
        </button>
      </div>
      {state.error && <Alert tone="red" text={state.error} />}
      {state.message && <Alert tone="green" text={state.message} />}
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <Metric label="Latest Bank Rate" value={latest ? `${latest.bankRate}%` : "Not stored"} tone={latest?.isManualOverride ? "yellow" : "blue"} />
        <Metric label="Effective From" value={latest?.effectiveFromDate || "-"} tone="slate" />
        <Metric label="Effective To" value={latest?.effectiveToDate || "Till Date"} tone="slate" />
        <Metric label="Source" value={latest?.sourceType || "-"} tone={latest?.sourceType === "official_fetch" ? "green" : "orange"} />
      </div>
      {latest?.sourceUrl && latest.sourceUrl !== "manual_override" && (
        <a href={latest.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">Open official source</a>
      )}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-4 mt-5">
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-2">Manual Override</h4>
          <div className="grid sm:grid-cols-2 gap-2">
            <input type="date" value={override.effectiveFromDate} onChange={(event) => setOverride((prev) => ({ ...prev, effectiveFromDate: event.target.value }))} className="field" />
            <input type="date" value={override.effectiveToDate} onChange={(event) => setOverride((prev) => ({ ...prev, effectiveToDate: event.target.value }))} className="field" />
            <input type="number" step="0.01" placeholder="Bank Rate %" value={override.bankRate} onChange={(event) => setOverride((prev) => ({ ...prev, bankRate: event.target.value }))} className="field" />
            <input placeholder="Mandatory reason" value={override.reason} onChange={(event) => setOverride((prev) => ({ ...prev, reason: event.target.value }))} className="field" />
          </div>
          <button onClick={saveOverride} disabled={Boolean(loading) || !override.effectiveFromDate || !override.bankRate || !override.reason.trim()} className="mt-3 bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
            {loading === "override" ? "Saving..." : "Save Override"}
          </button>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-2">Recent Audit Log</h4>
          <SimpleTable rows={state.auditLog.slice(0, 5)} columns={[
            ["changedAt", "Changed", shortDate],
            ["action", "Action"],
            ["changedBy", "User"],
            ["reason", "Reason"],
          ]} />
        </div>
      </div>
      <h4 className="text-sm font-bold text-slate-700 mt-5 mb-2">Stored Rate History</h4>
      <SimpleTable rows={state.rates.slice(0, 8)} columns={[
        ["effectiveFromDate", "From"],
        ["effectiveToDate", "To"],
        ["bankRate", "Bank Rate", (value) => `${value}%`],
        ["sourceType", "Source"],
        ["fetchedAt", "Fetched", shortDate],
      ]} />
    </div>
  );
}

function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([
    { role: "ai", text: "Ask MSME compliance questions here. I answer from the active Rules module and will not guess vendor MSME status without Udyam verification data." },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (q) => {
    const userQ = q || question;
    if (!userQ.trim()) return;
    const nextChat = [...chat, { role: "user", text: userQ }];
    setChat(nextChat);
    setQuestion("");
    setLoading(true);
    try {
      const data = await askComplianceAssistant(userQ);
      setChat([...nextChat, { role: "ai", text: data.reply || "No response returned." }]);
    } catch (err) {
      setChat([...nextChat, { role: "ai", text: err.message || "Assistant is unavailable." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="AI Compliance Assistant" subtitle="Connected to the active MSME Rules module; vendor classification still comes from Udyam verification and stored master data.">
      <div className="bg-slate-50 rounded-md p-4 h-80 overflow-y-auto mb-4 border border-slate-100">
        {chat.map((msg, index) => (
          <div key={index} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-md text-sm max-w-2xl whitespace-pre-wrap ${msg.role === "user" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">Thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border border-slate-200 p-3 rounded-md" placeholder="Ask about Clause 22, 43B(h), MSMED interest, MCA MSME-1, or Udyam verification" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleSend()} />
        <button onClick={() => handleSend()} disabled={loading} className="bg-slate-900 text-white px-6 py-3 rounded-md font-semibold disabled:opacity-50">Send</button>
      </div>
    </Panel>
  );
}

function useDashboardData(displayResetVersion = 0) {
  const [state, setState] = useState({ vendors: [], reports: [], imports: [], filings: [], error: "" });
  useEffect(() => {
    if (displayResetVersion > 0) {
      setState({ vendors: [], reports: [], imports: [], filings: [], error: "" });
      return undefined;
    }
    let alive = true;
    Promise.all([fetchVendorMaster(), fetchReports(), fetchImports(), fetchMcaMsme1Filings().catch(() => ({ filings: [] }))])
      .then(([vendors, reports, imports, filings]) => {
        if (!alive) return;
        setState({
          vendors: vendors.vendors || [],
          reports: reports.reports || [],
          imports: imports.imports || [],
          filings: filings.filings || [],
          error: "",
        });
      })
      .catch((err) => alive && setState((prev) => ({ ...prev, error: err.message })));
    return () => { alive = false; };
  }, [displayResetVersion]);
  return state;
}

function useReportPicker() {
  const [reports, setReports] = useState([]);
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports()
      .then((data) => {
        setReports(data.reports || []);
        const firstId = data.reports?.[0]?.id || "";
        setReportId(firstId);
        if (firstId) return fetchReport(firstId).then((response) => setReport(response.report));
        return null;
      })
      .catch((err) => setError(err.message));
  }, []);

  const loadReport = async () => {
    if (!reportId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetchReport(reportId);
      setReport(response.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { reports, report, reportId, setReportId, loadReport, error, loading };
}

function ReportPicker({ reports, reportId, setReportId, loadReport, loading }) {
  return (
    <Panel title="Report Source" subtitle="Choose a persisted compliance report snapshot.">
      <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
        <select value={reportId} onChange={(event) => setReportId(event.target.value)} className="field">
          <option value="">Select report</option>
          {reports.map((item) => <option key={item.id} value={item.id}>{item.fiscalYear} | {shortDate(item.createdAt)} | import {item.importRunId}</option>)}
        </select>
        <button onClick={loadReport} disabled={!reportId || loading} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
          {loading ? "Loading..." : "Load"}
        </button>
      </div>
    </Panel>
  );
}

function PowerBiLikeBoard({ data }) {
  const latestReport = data.reports[0];
  const summary = latestReport?.summary || {};
  const rows = [
    ["Imported creditors", summary.importedCreditors],
    ["Reportable MSME", summary.reportableMSME],
    ["Excluded vendors", summary.excludedFromReport],
    ["Pending verification", summary.pendingVerificationVendors],
    ["Disallowance", summary.totalDisallowed],
    ["Interest", summary.totalInterest],
  ];
  const max = Math.max(...rows.map(([, value]) => Number(value || 0)), 1);
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <Metric label="Latest report FY" value={latestReport?.fiscalYear || "-"} tone="slate" />
        <Metric label="Report period" value={summary.reportPeriodLabel || "-"} tone="blue" />
        <Metric label="As-on date" value={shortDate(summary.asOnDate)} tone="green" />
      </div>
      <div className="border border-slate-100 rounded-md p-4">
        {rows.map(([label, value]) => (
          <div key={label} className="mb-3">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>{label}</span>
              <span>{typeof value === "number" ? number(value) : value || 0}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-sm overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${Math.max((Number(value || 0) / max) * 100, value ? 4 : 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <SimpleTable rows={data.reports.slice(0, 5)} columns={[
        ["createdAt", "Created", shortDate],
        ["fiscalYear", "FY"],
        ["summary.totalDisallowed", "43B(h)", money],
        ["summary.totalInterest", "Interest", money],
        ["summary.pendingVerificationVendors", "Pending", number],
      ]} />
    </div>
  );
}

function SchedulePreview({ schedules }) {
  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <CompactTable title="Clause 22 Interest" rows={schedules.clause22 || []} columns={[
        ["supplier", "Supplier"],
        ["interestPayable", "Interest", money],
        ["amountInadmissible", "Inadmissible", money],
      ]} />
      <CompactTable title="Clause 22 MSME Computation" rows={schedules.clause22Computation || []} columns={[
        ["supplier", "Supplier"],
        ["totalPurchasesFromMicroSmall", "Purchases", money],
        ["clause22iiiBOutstandingDisallowance", "Clause 22(iii)(b)", money],
      ]} />
      <CompactTable title="43B(h) From Clause 22" rows={schedules.clause43BhFromClause22 || schedules.disallowance43Bh || []} columns={[
        ["vendorName", "Vendor"],
        ["sourceClause", "Source"],
        ["principalDisallowance", "Disallowance", money],
      ]} />
      <CompactTable title="Clause 26(A)" rows={schedules.clause26 || []} columns={[
        ["supplier", "Supplier"],
        ["invoiceNumber", "Invoice"],
        ["disallowanceAmount", "Disallowance", money],
        ["status", "Status"],
      ]} />
    </div>
  );
}

function CompactTable({ title, rows, columns }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-2">{title}</h3>
      <SimpleTable rows={(rows || []).slice(0, 8)} columns={columns} />
      {rows?.length > 8 && <p className="text-xs text-slate-500 mt-1">Showing 8 of {rows.length}. Download Excel for all rows.</p>}
    </div>
  );
}

function HeaderBlock({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 className="text-2xl font-bold text-white drop-shadow-sm">{title}</h2>
        <p className="text-sm text-teal-50 mt-1 max-w-4xl font-medium drop-shadow-sm">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="bg-white rounded-md p-5 shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
      {children}
    </section>
  );
}

function Metric({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-800",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <div className={`${tones[tone] || tones.slate} p-4 rounded-md min-h-24 flex flex-col justify-between`}>
      <p className="text-xl font-bold break-words">{value ?? 0}</p>
      <p className="text-xs mt-2 font-semibold">{label}</p>
    </div>
  );
}

function Alert({ text, tone }) {
  const styles = tone === "red"
    ? "bg-red-50 border-red-200 text-red-700"
    : tone === "green"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-amber-50 border-amber-200 text-amber-800";
  return <div className={`${styles} border rounded-md p-3 mb-3 text-sm font-semibold`}>{text}</div>;
}

function KeyValue({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value}</p>
    </div>
  );
}

function SimpleTable({ rows = [], columns, actions }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No records yet.</p>;
  return (
    <div className="overflow-auto max-h-[34rem] border border-slate-100 rounded-md">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50">
          <tr>{columns.map(([, label]) => <th key={label} className="text-left p-2 text-slate-600 whitespace-nowrap">{label}</th>)}{actions && <th className="text-left p-2 text-slate-600">Action</th>}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || `${row.vendorName || row.supplier || "row"}-${index}`} className="border-t border-slate-100 align-top">
              {columns.map(([key, , formatter]) => <td key={key} className="p-2 text-xs min-w-24">{formatCell(row, key, formatter)}</td>)}
              {actions && <td className="p-2 text-xs">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(row, key, formatter) {
  const value = getPath(row, key);
  if (formatter) return formatter(value, row);
  if (typeof value === "boolean") return value ? "YES" : "NO";
  return String(value ?? "");
}

function getPath(row, path) {
  return String(path).split(".").reduce((value, key) => value?.[key], row);
}

function vendorSummary(vendors = []) {
  const verifiedMSME = vendors.filter((vendor) => vendor.isMSME && ["verified", "approved"].includes(vendor.udyamStatus || vendor.verificationStatus)).length;
  const pending = vendors.filter((vendor) => ["pending", "failed", "manual_fallback_required", "pending_manual_review", "not_started"].includes(vendor.udyamStatus || vendor.verificationStatus)).length;
  return { total: vendors.length, verifiedMSME, pending };
}

function exportVendorWise(rows = [], fileName = "MSME_Vendor_Wise.xlsx") {
  const workbook = XLSX.utils.book_new();
  const rowsByVendor = rows.reduce((map, row) => {
    const vendor = row.vendorName || row.supplier || "Unassigned";
    if (!map.has(vendor)) map.set(vendor, []);
    map.get(vendor).push(row);
    return map;
  }, new Map());
  if (!rowsByVendor.size) rowsByVendor.set("No records", [{ note: "No records" }]);
  for (const [vendor, vendorRows] of rowsByVendor.entries()) {
    const sheet = XLSX.utils.json_to_sheet(vendorRows);
    XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName(vendor));
  }
  XLSX.writeFile(workbook, fileName);
}

function safeSheetName(value) {
  return String(value || "Sheet").replace(/[\\/?*:[\]]/g, " ").slice(0, 31) || "Sheet";
}

function reportWarningMessages(summary = {}) {
  return [
    summary.capWarning,
    summary.noVerifiedMSMEWarning,
  ].filter(Boolean);
}

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function number(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function shortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN");
}

function toDateInput(value) {
  const text = String(value || "");
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return "";
}
