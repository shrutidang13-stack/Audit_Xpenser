import { AlertTriangle, CheckCircle2, CircleSlash, RefreshCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await caDashboardApi.dashboard(clientId);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load Complete CA Dashboard");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const analytics = data?.analytics || {};
  const audit = data?.auditxpenser || {};
  const msme = data?.msme_guard || {};
  const expenseSummary = audit.expense_audit?.summary || {};
  const sundryCreditors = getRows(msme.sundry_creditors);
  const riskData = useMemo(() => [
    { name: "Expense", value: analytics.total_expense_risk || 0 },
    { name: "MSME", value: analytics.total_msme_risk || 0 },
    { name: "Combined", value: analytics.risk_score || 0 },
  ], [analytics]);
  const statutoryData = useMemo(() => [
    { name: "TDS", value: audit.gst_tds?.tds_alerts || 0 },
    { name: "GST", value: audit.gst_tds?.gst_alerts || 0 },
    { name: "RCM", value: audit.gst_tds?.rcm_alerts || 0 },
  ], [audit]);

  if (!data && !error) {
    return <PageTitle title="Complete CA Dashboard" subtitle="Loading combined audit and MSME compliance view." />;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Complete CA Dashboard" subtitle="AuditXpenser expense audit with optional MSME Guard compliance data." />
        <button onClick={load} disabled={busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white disabled:opacity-60">
          <RefreshCcw className={busy ? "animate-spin" : ""} size={16} /> Refresh
        </button>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      {data && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Metric label="Combined Risk" value={`${analytics.risk_score || 0} / 100`} />
            <Metric label="Expense Risk" value={`${analytics.total_expense_risk || 0} / 100`} />
            <Metric label="MSME Risk" value={`${analytics.total_msme_risk || 0} / 100`} />
            <Metric label="Tax Impact" value={formatInr(analytics.total_tax_impact)} />
            <Metric label="Critical Issues" value={analytics.critical_issues_count || 0} />
          </div>

          <MSMEStatus status={msme.status} message={msme.message} importRunId={msme.import_run_id} reportId={msme.report_id} />

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
              <Fact label="CA review required" value={expenseSummary.ca_review_required_count || 0} />
            </Panel>
            <Panel title="MSME Compliance">
              <Fact label="Sundry creditors" value={sundryCreditors.length} />
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
              title="Trial Balance"
              rows={getRows(msme.trial_balance).slice(0, 8)}
              columns={[
                ["ledgerName", "Ledger"],
                ["parent", "Group"],
                ["debit", "Debit", formatInr],
                ["credit", "Credit", formatInr],
              ]}
              empty="No MSME trial balance rows available."
            />
            <TablePanel
              title="MSME Interest"
              rows={getRows(msme.interest?.section23).slice(0, 8)}
              columns={[
                ["vendorName", "Vendor"],
                ["invoiceNumber", "Invoice"],
                ["interestPayable", "Interest Payable", formatInr],
                ["permanentlyDisallowedAmount", "Disallowed", formatInr],
              ]}
              empty="No MSME interest rows available."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <StatementPanel title="Profit & Loss" statement={msme.profit_loss} />
            <StatementPanel title="Balance Sheet" statement={msme.balance_sheet} />
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

function Metric({ label, value }) {
  return (
    <div className="rounded border border-ink/10 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-ink/55"><ShieldCheck size={14} />{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><h2 className="flex items-center gap-2 font-black"><TrendingUp size={17} />{title}</h2><div className="mt-3">{children}</div></div>;
}

function Fact({ label, value }) {
  return <div className="flex items-center justify-between border-b border-ink/10 py-2 text-sm"><span className="font-semibold text-ink/60">{label}</span><span className="font-black">{value}</span></div>;
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
                {columns.map(([key, , formatter]) => <td key={key} className="py-2 pr-3 font-semibold text-ink/75">{formatter ? formatter(row[key]) : row[key] || "-"}</td>)}
              </tr>
            )) : <tr><td className="py-3 font-semibold text-ink/55" colSpan={columns.length}>{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function StatementPanel({ title, statement }) {
  const rows = getStatementRows(statement);
  return (
    <TablePanel
      title={title}
      rows={rows.slice(0, 8)}
      columns={[
        ["name", "Particular"],
        ["ledgerName", "Ledger"],
        ["amount", "Amount", formatInr],
      ]}
      empty={`${title} data is not available from MSME Guard.`}
    />
  );
}

function getRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function getStatementRows(statement) {
  const rows = getRows(statement);
  if (rows.length) return rows;
  const groups = Array.isArray(statement?.groups) ? statement.groups : [];
  return groups.flatMap((group) => {
    const ledgers = Array.isArray(group.ledgers) ? group.ledgers : [];
    if (!ledgers.length) {
      return [{
        name: group.groupName,
        ledgerName: group.groupName,
        amount: Math.abs(group.closingBalance || group.credit || group.debit || 0),
      }];
    }
    return ledgers.map((ledger) => ({
      ...ledger,
      name: group.groupName,
      amount: Math.abs(ledger.derivedClosingBalance ?? ledger.closingBalance ?? ledger.credit ?? ledger.debit ?? 0),
    }));
  });
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
