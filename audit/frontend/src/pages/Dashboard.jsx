import { Download, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, endpoints } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const colors = ["#0f8b8d", "#d85c4a", "#d79a2b", "#275c53", "#16211f"];

export function Dashboard() {
  const { clientId } = useParams();
  const [summary, setSummary] = useState(null);
  const load = async () => {
    const { data } = await api.get(endpoints.summary(clientId));
    setSummary(data);
  };
  useEffect(() => { load(); }, [clientId]);
  if (!summary) return <PageTitle title="Dashboard" subtitle="Loading audit summary." />;
  const cards = [
    ["Expenses", summary.total_expenses],
    ["Expense Value", `Rs. ${Number(summary.total_amount || 0).toLocaleString("en-IN")}`],
    ["High Risk", summary.high_risk],
    ["Statutory Alerts", summary.statutory_alerts],
    ["Missing Bills", summary.missing_bills],
    ["Files Uploaded", summary.files_uploaded]
  ];
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4 border-b border-ink/10 pb-4">
        <PageTitle title="Risk Dashboard" subtitle="Indicative results generated from uploaded files." />
        <button onClick={load} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white"><RefreshCcw size={16} />Refresh</button>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value]) => <div key={label} className="rounded border border-ink/10 bg-white p-4"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartPanel title="Risk Levels">
          <ResponsiveContainer width="100%" height={280}><BarChart data={summary.risk_levels}><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#0f8b8d" /></BarChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Alert Mix">
          <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={summary.alert_mix} dataKey="value" nameKey="name" outerRadius={90} label>{summary.alert_mix.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </ChartPanel>
      </div>
      <div className="flex flex-wrap gap-2">
        <ExportButton href={endpoints.export(clientId, "client-queries")} label="Client Query Sheet" />
        <ExportButton href={endpoints.export(clientId, "exception-report")} label="Exception Report" />
        <ExportButton href={endpoints.export(clientId, "working-paper")} label="Working Paper" />
      </div>
    </section>
  );
}

function ChartPanel({ title, children }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><h2 className="font-black">{title}</h2><div className="mt-3">{children}</div></div>;
}

export function ExportButton({ href, label }) {
  return <a href={href} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white"><Download size={16} />{label}</a>;
}
