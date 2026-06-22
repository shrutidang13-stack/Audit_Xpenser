import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

export function AuditDashboard() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const { data } = await api.get(`/api/audit/${clientId}/summary`);
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load audit summary");
    }
  };

  useEffect(() => { load(); }, [clientId]);

  if (!summary && !error) return <Skeleton />;

  const cards = summary ? [
    ["Risk Label", "Medium"],
    ["Total Vouchers", formatNumber(summary.total_vouchers)],
    ["Total Exceptions", formatNumber(summary.total_exceptions)],
    ["Indicative Amount", formatInr(summary.total_indicative_amount)],
    ["Pending Queries", formatNumber(summary.pending_query_count)],
  ] : [];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Audit Dashboard" subtitle="Canonical exception summary with CA Review Required wording." />
        <div className="flex flex-wrap gap-2">
          <ExportButton href={`/api/reports/${clientId}/exception-register`} label="Exception Register" />
          <ExportButton href={`/api/reports/${clientId}/working-paper`} label="Working Paper" />
          <ExportButton href={`/api/reports/${clientId}/query-letter`} label="Query Letter" />
        </div>
      </div>
      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}
      {summary && (
        <>
          <div className="rounded border border-teal/20 bg-white px-4 py-3 text-sm font-semibold text-ink/70">
            {summary.client?.name} | PAN {summary.client?.pan} | GSTIN {summary.client?.gstin} | FY {summary.client?.financial_year}
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {cards.map(([label, value]) => <Metric key={label} label={label} value={value} tone={label === "Risk Label" ? "Medium" : ""} />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(summary.category_summary || []).map((item) => (
              <button key={item.category} onClick={() => navigate(`/client/${clientId}/exceptions?category=${encodeURIComponent(item.category)}`)} className="rounded border border-ink/10 bg-white p-4 text-left transition hover:border-moss">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-black">{item.category}</h2>
                  <RiskBadge value={item.risk_level} />
                </div>
                <div className="mt-3 text-3xl font-black">{item.count}</div>
                <div className="mt-1 text-sm font-semibold text-ink/60">{formatInr(item.indicative_amount)} under indicative review</div>
                <div className="mt-3 text-sm font-bold text-moss">View exceptions</div>
              </button>
            ))}
          </div>
          <div className="rounded border border-ink/10 bg-white p-4">
            <h2 className="font-black">Exception Categories</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary.category_summary || []}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value, name) => name === "indicative_amount" ? formatInr(value) : value} />
                <Bar dataKey="count" fill="#0f8b8d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded border border-ink/10 bg-white p-4">
            <h2 className="font-black">Potential Form 3CD Impact - CA Review Required</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b text-left"><th className="py-2">Clause</th><th className="py-2">Possible Items</th></tr></thead>
                <tbody>{(summary.form_3cd_summary || []).map((item) => <tr key={item.clause} className="border-b"><td className="py-2 font-bold">{item.clause}</td><td className="py-2">{item.count}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="mt-3 rounded bg-amber/10 px-3 py-2 text-sm font-semibold text-ink/70">This is an indicative mapping only. Final Form 3CD reporting requires CA professional judgement.</p>
          </div>
        </>
      )}
    </section>
  );
}

function Skeleton() {
  return <section className="space-y-4"><PageTitle title="Audit Dashboard" subtitle="Loading canonical audit summary." /><div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded bg-ink/10" />)}</div></section>;
}

function Metric({ label, value, tone }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-2 text-2xl font-black">{value}</div>{tone && <div className="mt-2"><RiskBadge value={tone} /></div>}</div>;
}

function RiskBadge({ value }) {
  const text = value || "Low";
  const cls = text === "High" ? "border-red-200 bg-red-50 text-red-700" : text === "Medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700";
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-black ${cls}`}>{text}</span>;
}

function ExportButton({ href, label }) {
  return <a href={href} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white"><Download size={16} />{label}</a>;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

