import { AlertTriangle, CheckCircle2, CircleSlash, RefreshCcw, ShieldCheck, Terminal, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { caDashboardApi } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const palette = ["#0f8b8d", "#d85c4a", "#d79a2b", "#275c53", "#6b7280"];

export function CompleteCADashboard() {
  const { clientId } = useParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fetchLogs, setFetchLogs] = useState([]);
  const requestRef = useRef(0);

  const load = async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const startedAt = Date.now();
    setFetchLogs([
      makeLog("info", "Starting Complete CA Dashboard refresh"),
      makeLog("api", "Requesting latest MSME report through the MSME API connector"),
    ]);
    setBusy(true);
    setError("");
    const waitingLog = window.setInterval(() => {
      if (requestRef.current !== requestId) return;
      const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      appendLog(setFetchLogs, "wait", `Waiting for MSME API response... ${elapsed}s`);
    }, 2000);
    try {
      const response = await caDashboardApi.dashboard(clientId);
      if (requestRef.current !== requestId) return;
      setData(response.data);
      const msmeResult = response.data?.msme_guard || {};
      const creditors = getRows(msmeResult.sundry_creditors).length;
      const vouchers = getRows(msmeResult.voucher_evidence || msmeResult.payments).length;
      appendLog(setFetchLogs, "ok", `Dashboard API responded in ${Date.now() - startedAt}ms`);
      appendLog(setFetchLogs, msmeResult.status === "available" ? "ok" : "warn", `MSME connector status: ${statusLabel(msmeResult.status)}`);
      if (msmeResult.import_run_id) appendLog(setFetchLogs, "data", `Import run received: ${msmeResult.import_run_id}`);
      if (msmeResult.report_id) appendLog(setFetchLogs, "data", `Generated report received: ${msmeResult.report_id}`);
      appendLog(setFetchLogs, "data", `Fetched ${creditors} creditor row${creditors === 1 ? "" : "s"} and ${vouchers} voucher row${vouchers === 1 ? "" : "s"}`);
      appendLog(setFetchLogs, "done", "MSME fetch completed; dashboard data is live");
    } catch (err) {
      if (requestRef.current !== requestId) return;
      const errorMessage = apiErrorMessage(err, "Could not load Complete CA Dashboard");
      setError(errorMessage);
      appendLog(setFetchLogs, "error", `Fetch failed: ${errorMessage}`);
    } finally {
      window.clearInterval(waitingLog);
      if (requestRef.current === requestId) setBusy(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const analytics = data?.analytics || {};
  const audit = data?.auditxpenser || {};
  const msme = data?.msme_guard || {};
  const expenseSummary = audit.expense_audit?.summary || {};
  const dashboardSummary = audit.dashboard_summary || {};
  const sundryCreditors = getRows(msme.sundry_creditors);
  const voucherEvidence = getRows(msme.voucher_evidence || msme.payments);
  const compliance = msme.msme_compliance || {};
  const importSummary = compliance.import_summary || {};
  const verificationSummary = compliance.verification_summary || {};
  const msmeRisk = compliance.risk_score || {};
  const expenseRisk = Math.max(Number(analytics.total_expense_risk || 0), 30);
  const overallRisk = Math.max(Number(analytics.risk_score || 0), expenseRisk);
  const riskData = useMemo(() => [
    { name: "Expense", value: expenseRisk },
    { name: "MSME", value: analytics.total_msme_risk },
    { name: "Overall", value: overallRisk },
  ].filter((item) => item.value != null), [analytics, expenseRisk, overallRisk]);
  const statutoryData = useMemo(() => [
    { name: "TDS", value: audit.gst_tds?.tds_alerts || 0 },
    { name: "GST", value: audit.gst_tds?.gst_alerts || 0 },
    { name: "RCM", value: audit.gst_tds?.rcm_alerts || 0 },
  ], [audit]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Complete CA Dashboard" subtitle="AuditXpenser expense audit with optional MSME Guard compliance data." />
        <button onClick={load} disabled={busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white disabled:opacity-60">
          <RefreshCcw className={busy ? "animate-spin" : ""} size={16} /> Refresh
        </button>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <div className={`grid gap-5 ${data ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
        {data ? <MSMEStatus status={msme.status} message={msme.message} importRunId={msme.import_run_id} reportId={msme.report_id} /> : (
          <div className="rounded border border-teal/20 bg-white px-4 py-3 text-sm font-semibold text-ink/65">
            Loading combined audit and MSME compliance view.
          </div>
        )}
        <LiveFetchLog logs={fetchLogs} busy={busy} />
      </div>

      {data && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Metric label="Overall Risk" value={formatRisk(overallRisk)} detail="Highest available domain" />
            <Metric label="Expense Risk" value={formatRisk(expenseRisk)} />
            <Metric label="MSME Risk" value={formatRisk(analytics.total_msme_risk)} detail={analytics.msme_risk_available ? "Connected" : "MSME Guard unavailable"} />
            <Metric label="Tax Impact" value={formatInr(analytics.total_tax_impact)} />
            <Metric label="Critical Issues" value={analytics.critical_issues_count || 0} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Risk Analytics">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f8b8d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="GST / TDS / RCM Issues">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statutoryData} dataKey="value" nameKey="name" outerRadius={86} label>
                    {statutoryData.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Expense Audit">
              <Fact label="Ledgers audited" value={expenseSummary.total_ledgers_audited || 0} />
              <Fact label="Amount audited" value={formatInr(expenseSummary.total_amount_audited)} />
              <Fact label="GL differences" value={expenseSummary.gl_differences || 0} />
              <Fact label="40A(3) review items" value={expenseSummary.payment_40a3_review_items || 0} />
              <Fact label="CA review required" value={expenseSummary.ca_review_required_count || 0} />
              <Fact label="Missing bills" value={dashboardSummary.missing_bills || 0} />
              <Fact label="Files uploaded" value={dashboardSummary.files_uploaded || 0} />
            </Panel>
            <Panel title="MSME Compliance">
              <Fact label="Sundry creditors" value={sundryCreditors.length} />
              <Fact label="Vouchers imported" value={importSummary.vouchersParsed || importSummary.vouchersPersisted || 0} />
              <Fact label="Verified MSMEs" value={verificationSummary.verifiedMSME || 0} />
              <Fact label="Pending verification" value={verificationSummary.pending || verificationSummary.pendingVerification || 0} />
              <Fact label="Compliance score" value={msmeRisk.score != null ? `${msmeRisk.score} / 100` : "Not available"} />
              <Fact label="Status" value={statusLabel(msme.status)} />
              <Fact label="Import run" value={msme.import_run_id || "Not available"} />
              <Fact label="Report" value={msme.report_id || "Not available"} />
            </Panel>
            <Panel title="Form 3CD Impact">
              <Fact label="Audit clauses" value={(audit.form3cd?.clauses || audit.form3cd?.rows || []).length || 0} />
              <Fact label="MSME Clause 22" value={(msme.form3cd?.clause22 || []).length || 0} />
              <Fact label="MSME Clause 26" value={(msme.form3cd?.clause26 || []).length || 0} />
              <Fact label="Client queries" value={(audit.client_queries || []).length} />
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <TablePanel
              title="Payment / Voucher Evidence"
              rows={voucherEvidence.slice(0, 8)}
              columns={[
                ["vendorName", "Vendor"],
                ["invoiceNumber", "Invoice"],
                ["paymentDate", "Payment Date"],
                ["principalAmount", "Principal", formatInr],
                ["interestAmount", "Interest", formatInr],
              ]}
              empty="No payment or voucher evidence is available from MSME Guard."
            />
            <TablePanel
              title="Client Queries"
              rows={(audit.client_queries || []).slice(0, 8)}
              columns={[
                ["query_number", "Query"],
                ["ledger", "Ledger"],
                ["priority", "Priority"],
                ["status", "Status"],
                ["amount", "Amount", formatInr],
              ]}
              empty="No client queries are currently open."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <TablePanel
              title="Sundry Creditors"
              rows={sundryCreditors.slice(0, 8)}
              columns={[
                ["party", "Creditor"],
                ["outstandingAmount", "Outstanding", formatInr],
                ["bucket", "Bucket"],
                ["daysOutstanding", "Days"],
              ]}
              empty="No MSME creditor data available."
            />
            <TablePanel
              title="43B(h) / Tax Disallowance"
              rows={(msme.tax_disallowance_43bh?.taxDisallowanceSummary || []).slice(0, 8)}
              columns={[
                ["vendorName", "Vendor"],
                ["section", "Section"],
                ["principalDisallowance", "Principal", formatInr],
                ["interestPermanentDisallowance", "Interest", formatInr],
              ]}
              empty="No MSME tax disallowance rows available."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <TablePanel
              title="MSME Interest"
              rows={getRows(msme.interest?.section23).slice(0, 8)}
              columns={[
                ["financialYear", "FY"],
                ["vendorName", "Vendor"],
                ["invoiceNumber", "Invoice"],
                ["interestPayable", "Interest Payable", formatInr],
                ["permanentlyDisallowedAmount", "Disallowed", formatInr],
              ]}
              empty="No MSME interest rows available."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <TablePanel
              title="Form 3CD — MSME Clause 22"
              rows={getRows(msme.form3cd?.clause22).slice(0, 8)}
              columns={[
                ["supplier", "Supplier"],
                ["amountInadmissible", "Inadmissible", formatInr],
                ["interestPayable", "Interest", formatInr],
                ["remarks", "Remarks"],
              ]}
              empty="No MSME Clause 22 rows are available."
            />
            <TablePanel
              title="Form 3CD — Section 43B(h) / Clause 26"
              rows={getRows(msme.form3cd?.clause26).slice(0, 8)}
              columns={[
                ["supplier", "Supplier"],
                ["invoiceNumber", "Invoice"],
                ["disallowanceAmount", "Disallowance", formatInr],
                ["status", "Status"],
              ]}
              empty="No MSME Clause 26 rows are available."
            />
          </div>
        </>
      )}
    </section>
  );
}

function MSMEStatus({ status, message, importRunId, reportId }) {
  const available = status === "available";
  const Icon = available ? CheckCircle2 : status === "not_configured" ? CircleSlash : AlertTriangle;
  const cls = available ? "border-teal/25 bg-teal/10 text-teal" : "border-amber/30 bg-amber/10 text-ink";
  return (
    <div className={`rounded border px-4 py-3 ${cls}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5" size={20} />
          <div>
            <div className="font-black">MSME Guard: {statusLabel(status)}</div>
            <div className="mt-1 text-sm font-semibold text-ink/65">{message || "MSME Guard is not connected."}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black uppercase text-ink/60">
          <span className="rounded border border-ink/10 bg-white px-2 py-1">Import {importRunId || "N/A"}</span>
          <span className="rounded border border-ink/10 bg-white px-2 py-1">Report {reportId || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="rounded border border-ink/10 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-ink/55"><ShieldCheck size={14} />{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      {detail && <div className="mt-1 text-xs font-semibold text-ink/50">{detail}</div>}
    </div>
  );
}

function LiveFetchLog({ logs, busy }) {
  return (
    <section className="aspect-square w-full max-w-80 overflow-hidden rounded border border-ink/20 bg-[#101817] text-white shadow-sm xl:justify-self-end" aria-live="polite" aria-label="MSME API live fetch log">
      <div className="flex h-11 items-center justify-between border-b border-white/10 bg-white/5 px-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide"><Terminal size={15} />MSME API Live Log</div>
        <span className={`h-2.5 w-2.5 rounded-full ${busy ? "animate-pulse bg-amber" : "bg-teal"}`} title={busy ? "Fetching" : "Idle"} />
      </div>
      <div className="h-[calc(100%-2.75rem)] space-y-2 overflow-y-auto p-3 font-mono text-[11px] leading-4">
        {logs.length ? logs.map((entry) => (
          <div key={entry.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
            <span className="text-white/40">{entry.time}</span>
            <span className={logTone(entry.level)}><span className="mr-1 text-white/35">›</span>{entry.message}</span>
          </div>
        )) : <div className="text-white/45">Waiting for fetch activity...</div>}
        {busy && <div className="animate-pulse text-amber">› receiving MSME data_</div>}
      </div>
    </section>
  );
}

function appendLog(setter, level, message) {
  setter((current) => [...current, makeLog(level, message)].slice(-30));
}

function makeLog(level, message) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: new Date().toLocaleTimeString("en-IN", { hour12: false }),
    level,
    message,
  };
}

function logTone(level) {
  if (level === "error") return "text-[#ff8a7a]";
  if (level === "warn" || level === "wait") return "text-amber";
  if (level === "ok" || level === "done") return "text-[#67d8c7]";
  if (level === "data") return "text-[#9cc8ff]";
  return "text-white/75";
}

function Panel({ title, children }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><h2 className="flex items-center gap-2 font-black"><TrendingUp size={17} />{title}</h2><div className="mt-3">{children}</div></div>;
}

function Fact({ label, value }) {
  return <div className="flex items-center justify-between border-b border-ink/10 py-2 text-sm"><span className="font-semibold text-ink/60">{label}</span><span className="font-black">{displayValue(value)}</span></div>;
}

function TablePanel({ title, rows, columns, empty }) {
  return (
    <Panel title={title}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="border-b text-left">{columns.map(([, label]) => <th key={label} className="py-2 pr-3">{label}</th>)}</tr></thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} className="border-b">
                {columns.map(([key, , formatter]) => <td key={key} className="py-2 pr-3 font-semibold text-ink/75">{displayValue(formatter ? formatter(row[key]) : row[key])}</td>)}
              </tr>
            )) : <tr><td className="py-3 font-semibold text-ink/55" colSpan={columns.length}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function getRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function statusLabel(status) {
  return {
    available: "Connected",
    offline: "Offline",
    not_configured: "Not configured",
    auth_failed: "Auth failed",
    error: "Error",
  }[status] || "Unknown";
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatRisk(value) {
  return value == null ? "Not available" : `${value} / 100`;
}

function apiErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      const location = Array.isArray(item?.loc) ? item.loc.join(" → ") : "request";
      return item?.msg ? `${location}: ${item.msg}` : displayValue(item);
    }).filter(Boolean);
    if (messages.length) return messages.join("; ");
  }
  if (detail && typeof detail === "object") return detail.msg || displayValue(detail);
  return detail || error?.message || fallback;
}

function displayValue(value) {
  if (value == null || value === "") return "-";
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (typeof value === "object") {
    if (value.msg) return String(value.msg);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
