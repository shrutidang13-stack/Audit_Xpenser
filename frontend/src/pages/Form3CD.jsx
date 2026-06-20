import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Search } from "lucide-react";
import { Badge } from "../components/Badge";
import { api } from "../lib/api";

const disclosureColumns = [
  ["clause", "Clause"],
  ["section_act", "Section / Act"],
  ["expense_description", "Expense Ledger / Description"],
  ["amount", "Amount"],
  ["answer_value", "Answer / Value"],
  ["disclosure_text", "Disclosure Text for Portal"],
  ["status", "Status"],
  ["ca_action_required", "CA Action Required"]
];

const riskColumns = [
  ["risk_area", "Risk Area"],
  ["clause", "Clause"],
  ["amount_at_risk", "Amount at Risk"],
  ["disallowance_30", "30% Disallowance"],
  ["disallowance_100", "100% Disallowance"],
  ["net_max_risk", "Net Max Risk"],
  ["priority", "Priority"],
  ["note", "Note"]
];

const gstColumns = [
  ["sr", "Sr."],
  ["expenditure_ledger", "Expenditure Ledger"],
  ["type", "Type"],
  ["total_exp", "Total Exp"],
  ["gst_registered", "GST-Registered"],
  ["composition_scheme", "Composition Scheme"],
  ["unregistered", "Unregistered"],
  ["gst_paid", "GST Paid on Exp"]
];

const moneyFields = new Set([
  "amount",
  "amount_at_risk",
  "disallowance_30",
  "disallowance_100",
  "net_max_risk",
  "amount_paid",
  "tds_as_per_act",
  "tds_deducted",
  "difference",
  "default_amount",
  "total_exp",
  "gst_registered",
  "composition_scheme",
  "unregistered",
  "gst_paid"
]);

export function Form3CD() {
  const { clientId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("disclosures");

  useEffect(() => {
    let mounted = true;
    setError("");
    setReport(null);
    api.get(`/api/dashboard/${clientId}/form3cd-report`)
      .then(({ data }) => {
        if (mounted) setReport(data);
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.detail || err.message || "Could not load Form 3CD report");
      });
    return () => { mounted = false; };
  }, [clientId]);

  const filteredDisclosures = useMemo(() => filterRows(
    (report?.disclosures || []).filter((row) => row.section_group !== "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE"),
    query
  ), [report, query]);
  const totals = useMemo(() => {
    const risk = report?.risk_summary || [];
    return {
      mandatory: (report?.disclosures || []).filter((row) => ["Mandatory", "Critical"].includes(row.status)).length,
      maxRisk: risk.reduce((sum, row) => sum + (row.net_max_risk || 0), 0),
      gstPaid: (report?.gst_expenditure || []).find((row) => row.expenditure_ledger === "GRAND TOTAL")?.gst_paid || 0
    };
  }, [report]);

  if (!report) {
    return (
      <div className={`rounded border p-6 text-sm font-semibold ${error ? "border-coral/20 bg-coral/10 text-coral" : "border-ink/10 bg-white text-ink/60"}`}>
        {error || "Loading Form 3CD report..."}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-ink/10 bg-white">
        <div className="border-b border-ink/10 bg-ink px-4 py-4 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/70">
                <FileSpreadsheet size={16} />
                Form 3CD
              </div>
              <h1 className="mt-2 max-w-5xl text-2xl font-black leading-tight">{report.title}</h1>
            </div>
            <Badge tone="medium">CA Review Required</Badge>
          </div>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-white/85 sm:grid-cols-2 lg:grid-cols-5">
            <Meta label="PAN" value={report.meta.pan} />
            <Meta label="GSTIN" value={report.meta.gstin} />
            <Meta label="FY" value={report.meta.financial_year} />
            <Meta label="AY" value={report.meta.assessment_year} />
            <Meta label="Generated" value={report.meta.generated} />
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Mandatory / Critical Items" value={totals.mandatory} tone="high" />
          <Metric label="Net Max Quantified Risk" value={formatMoney(totals.maxRisk)} tone="high" />
          <Metric label="Clause 44 GST Paid" value={formatMoney(totals.gstPaid)} tone="low" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Tab id="disclosures" active={activeTab} setActive={setActiveTab}>Expense Clauses</Tab>
          <Tab id="risk" active={activeTab} setActive={setActiveTab}>Risk Summary</Tab>
          <Tab id="gst" active={activeTab} setActive={setActiveTab}>Clause 44 GST</Tab>
        </div>
        {activeTab === "disclosures" && (
          <label className="flex min-w-72 items-center gap-2 rounded border border-ink/15 bg-white px-3 py-2">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clause, ledger, section..." className="w-full bg-transparent text-sm outline-none" />
          </label>
        )}
      </div>

      {activeTab === "disclosures" && <DisclosureTable rows={filteredDisclosures} />}
      {activeTab === "risk" && <ReportTable title="RISK SUMMARY - POTENTIAL MAXIMUM DISALLOWANCES" columns={riskColumns} rows={report.risk_summary.filter((row) => !String(row.risk_area || "").startsWith("TDS not deducted"))} emphasizedKey="priority" />}
      {activeTab === "gst" && <ReportTable title="CLAUSE 44 - GST EXPENDITURE BREAKUP | As Required on Portal" subtitle="Split each expenditure: GST-Registered vendors, Composition Scheme, Unregistered vendors, GST Paid" columns={gstColumns} rows={report.gst_expenditure} totalMatcher={(row) => row.expenditure_ledger === "GRAND TOTAL"} />}

      <div className="rounded border border-amber/30 bg-amber/10 p-4 text-sm font-semibold leading-6 text-ink/75">
        {report.notes.map((note) => (
          <div key={note} className="flex gap-2">
            <AlertTriangle className="mt-1 shrink-0 text-amber" size={16} />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DisclosureTable({ rows }) {
  const grouped = groupBySection(rows);
  return (
    <div className="overflow-x-auto rounded border border-ink/10 bg-white">
      <table className="min-w-[1320px] text-left text-sm">
        <thead className="bg-ink text-white">
          <tr>
            {disclosureColumns.map(([, label]) => (
              <th key={label} className="px-3 py-3 font-semibold">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map((item) => item.type === "group" ? (
            <tr key={item.label} className="bg-moss/10">
              <td colSpan={disclosureColumns.length} className="px-3 py-2 text-xs font-black uppercase tracking-wide text-moss">{item.label}</td>
            </tr>
          ) : (
            <tr key={`${item.row.clause}-${item.row.expense_description}`} className="border-t border-ink/10">
              {disclosureColumns.map(([key]) => (
                <td key={key} className={`max-w-md px-3 py-3 align-top ${key === "amount" ? "text-right font-semibold tabular-nums" : ""}`}>
                  {formatCell(item.row[key], key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ title, subtitle, columns, rows, totalMatcher, emphasizedKey }) {
  return (
    <div className="rounded border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <h2 className="text-base font-black text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-semibold text-ink/60">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {columns.map(([, label]) => (
                <th key={label} className="px-3 py-3 font-semibold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isTotal = totalMatcher?.(row);
              return (
                <tr key={index} className={`border-t border-ink/10 ${isTotal ? "bg-amber/10 font-black" : ""}`}>
                  {columns.map(([key]) => (
                    <td key={key} className={`max-w-md px-3 py-3 align-top ${moneyFields.has(key) ? "text-right font-semibold tabular-nums" : ""}`}>
                      {key === emphasizedKey ? <Badge tone={String(row[key]).toLowerCase().includes("critical") ? "high" : "medium"}>{row[key]}</Badge> : formatCell(row[key], key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const classes = tone === "high" ? "border-coral/25 bg-coral/10" : tone === "medium" ? "border-amber/25 bg-amber/10" : "border-teal/25 bg-teal/10";
  return (
    <div className={`rounded border px-3 py-3 ${classes}`}>
      <div className="text-xs font-bold uppercase text-ink/55">{label}</div>
      <div className="mt-1 text-xl font-black text-ink">{value}</div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <span className="text-white/50">{label}: </span>
      <span>{value || "Not available"}</span>
    </div>
  );
}

function Tab({ id, active, setActive, children }) {
  const selected = active === id;
  return (
    <button onClick={() => setActive(id)} className={`rounded border px-3 py-2 text-sm font-bold ${selected ? "border-moss bg-moss text-white" : "border-ink/15 bg-white text-ink/70 hover:bg-ink/5"}`}>
      {children}
    </button>
  );
}

function groupBySection(rows) {
  const output = [];
  let lastGroup = "";
  rows.forEach((row) => {
    if (row.section_group !== lastGroup) {
      output.push({ type: "group", label: row.section_group });
      lastGroup = row.section_group;
    }
    output.push({ type: "row", row });
  });
  return output;
}

function filterRows(rows, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle)));
}

function formatCell(value, key) {
  if (value === null || value === undefined || value === "") return <span className="text-ink/40">-</span>;
  if (moneyFields.has(key) && typeof value === "number") return formatMoney(value);
  if (key === "status" || key === "deposit_status") return <Status value={value} />;
  return String(value);
}

function Status({ value }) {
  const text = String(value);
  const lower = text.toLowerCase();
  if (lower.includes("filled") || lower.includes("not required") || lower.includes("below")) {
    return <span className="inline-flex items-center gap-1 font-bold text-moss"><CheckCircle2 size={14} />{text}</span>;
  }
  return <Badge tone={lower.includes("critical") || lower.includes("mandatory") ? "high" : "medium"}>{text}</Badge>;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
}
