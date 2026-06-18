import { ArrowRight, Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const sections = [
  {
    key: "direct_expenses",
    label: "DIRECT EXPENSES",
    totalLabel: "TOTAL DIRECT",
    totalKey: "total_direct_expenses",
    className: "bg-[#1e5f9d] text-white"
  },
  {
    key: "indirect_expenses",
    label: "INDIRECT EXPENSES",
    totalLabel: "TOTAL INDIRECT",
    totalKey: "total_indirect_expenses",
    className: "bg-[#2f855a] text-white"
  },
  {
    key: "ca_review_required",
    label: "CA REVIEW REQUIRED",
    totalLabel: "TOTAL CA REVIEW REQUIRED",
    totalKey: "total_ca_review_required",
    className: "bg-amber text-ink"
  }
];

export function Processing() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get(`/api/processing/${clientId}`);
      setSchedule(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Data schedule could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const runAudit = async () => {
    setBusy(true);
      setError("");
      setMessage("Running Expense Audit...");
    try {
      await api.post(`/api/expense-audit/${clientId}/run`);
      setMessage("Expense audit completed. View results in Audit Worksheet.");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Audit pipeline could not complete");
    } finally {
      setBusy(false);
    }
  };

  const hasRows = schedule && sections.some((section) => (schedule[section.key] || []).length);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Data" subtitle="Audit-ready Profit & Loss expense schedule generated from confirmed mappings." />
        <div className="flex flex-wrap gap-2">
          <button onClick={load} disabled={loading || busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white disabled:opacity-60"><RefreshCcw className={loading ? "animate-spin" : ""} size={16} />Refresh</button>
          <button onClick={runAudit} disabled={loading || busy || !hasRows} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-coral px-3 text-sm font-black text-white disabled:opacity-60">{busy ? <RefreshCcw className="animate-spin" size={16} /> : <Play size={16} />}Run Expense Audit</button>
        </div>
      </div>

      {message && (
        <div className="flex flex-col gap-2 rounded border border-teal/20 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal sm:flex-row sm:items-center sm:justify-between">
          <span>{message}</span>
          {message === "Expense audit completed. View results in Audit Worksheet." && (
            <button onClick={() => navigate(`/client/${clientId}/audit-worksheet`)} className="focus-ring inline-flex h-9 items-center gap-2 rounded bg-teal px-3 text-sm font-bold text-white">
              View Audit Worksheet
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <div className="overflow-hidden rounded border border-ink/15 bg-white shadow-sm">
        <div className="bg-[#123a63] px-4 py-4 text-center text-xl font-black uppercase tracking-normal text-white">
          {loading ? "Loading Client" : schedule?.client_name || "Client"}
        </div>
        <div className="bg-[#1e5f9d] px-4 py-3 text-center text-sm font-black uppercase text-white">
          Profit & Loss - Expenses Schedule
        </div>
        <div className="bg-[#dbeafe] px-4 py-3 text-center text-sm font-bold text-[#123a63]">
          Period: {schedule?.period || "FY"} | Source: {schedule?.source || "Uploaded Data / Tally / Excel"}
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#123a63] text-white">
              <tr>
                <th className="w-20 border border-white/20 px-3 py-3 text-left font-black">Sr.</th>
                <th className="min-w-60 border border-white/20 px-3 py-3 text-left font-black">Sub-Category</th>
                <th className="min-w-56 border border-white/20 px-3 py-3 text-left font-black">Ledger Name</th>
                <th className="w-44 border border-white/20 px-3 py-3 text-right font-black">Debit (₹)</th>
                <th className="w-44 border border-white/20 px-3 py-3 text-right font-black">Net Amount (₹)</th>
                <th className="w-32 border border-white/20 px-3 py-3 text-right font-black">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <ScheduleSection key={section.key} section={section} schedule={schedule} />
              ))}
              <tr className="bg-[#123a63] text-white">
                <td className="border border-[#123a63] px-3 py-4" />
                <td className="border border-[#123a63] px-3 py-4" />
                <td className="border border-[#123a63] px-3 py-4 text-base font-black">TOTAL EXPENSES</td>
                <td className="border border-[#123a63] px-3 py-4 text-right text-base font-black">{formatInr(schedule?.total_expenses)}</td>
                <td className="border border-[#123a63] px-3 py-4 text-right text-base font-black">{formatInr(schedule?.total_expenses)}</td>
                <td className="border border-[#123a63] px-3 py-4 text-right text-base font-black">100.00%</td>
              </tr>
              {!loading && !hasRows && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-sm font-semibold text-ink/60">
                    Confirm mappings to generate the Data expense schedule.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!!(schedule?.ca_review_required || []).length && (
        <div className="rounded border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-semibold text-ink/70">
          {(schedule.ca_review_required || []).length} ledger{schedule.ca_review_required.length === 1 ? "" : "s"} need CA Review Required classification before final audit judgement.
        </div>
      )}

      {hasRows && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate(`/client/${clientId}/audit-dashboard`)} className="focus-ring inline-flex h-10 items-center rounded bg-moss px-3 text-sm font-bold text-white">Open Audit Dashboard</button>
          <button onClick={() => navigate(`/client/${clientId}/exceptions`)} className="focus-ring inline-flex h-10 items-center rounded bg-ink px-3 text-sm font-bold text-white">View Exceptions</button>
        </div>
      )}
    </section>
  );
}

function ScheduleSection({ section, schedule }) {
  const rows = schedule?.[section.key] || [];
  const groupedRows = useMemo(() => groupBySubCategory(rows), [rows]);
  if (!rows.length) return null;
  return (
    <>
      <tr className={section.className}>
        <td colSpan={6} className="border border-white/20 px-3 py-3 text-sm font-black">
          {section.label} — CONSOLIDATED | Total: {formatInr(schedule?.[section.totalKey])} | {schedule?.period || "FY"}
        </td>
      </tr>
      {groupedRows.map((group) => (
        <GroupedRows key={`${section.key}-${group.subCategory}`} group={group} sectionKey={section.key} />
      ))}
      <tr className="bg-[#e8f1fb]">
        <td className="border border-ink/10 px-3 py-3" />
        <td className="border border-ink/10 px-3 py-3" />
        <td className="border border-ink/10 px-3 py-3 font-black text-[#123a63]">{section.totalLabel}</td>
        <td className="border border-ink/10 px-3 py-3 text-right font-black text-[#123a63]">{formatInr(schedule?.[section.totalKey])}</td>
        <td className="border border-ink/10 px-3 py-3 text-right font-black text-[#123a63]">{formatInr(schedule?.[section.totalKey])}</td>
        <td className="border border-ink/10 px-3 py-3 text-right font-black text-[#123a63]">100.00%</td>
      </tr>
    </>
  );
}

function GroupedRows({ group, sectionKey }) {
  return (
    <>
      <tr className="bg-[#eef5fb]">
        <td colSpan={6} className="border border-ink/10 px-3 py-2 font-black text-[#123a63]">
          {group.subCategory}
        </td>
      </tr>
      {group.rows.map((row, index) => (
        <tr key={`${sectionKey}-${row.sub_category}-${row.ledger_name}`} className={index % 2 === 0 ? "bg-white" : "bg-[#f8fbfe]"}>
          <td className="border border-ink/10 px-3 py-3 font-semibold text-ink/70">{row.sr_no}</td>
          <td className="border border-ink/10 px-3 py-3 font-semibold text-ink/70">{row.sub_category}</td>
          <td className="border border-ink/10 px-3 py-3 font-bold text-ink">{row.ledger_name}</td>
          <td className="border border-ink/10 px-3 py-3 text-right font-bold text-ink">{formatInr(row.debit_amount)}</td>
          <td className="border border-ink/10 px-3 py-3 text-right font-bold text-ink">{formatInr(row.net_amount)}</td>
          <td className="border border-ink/10 px-3 py-3 text-right font-semibold text-ink/75">{formatPercent(row.percentage_of_total)}</td>
        </tr>
      ))}
    </>
  );
}

function groupBySubCategory(rows) {
  const groups = [];
  for (const row of rows) {
    const subCategory = row.sub_category || "Uncategorised";
    const latest = groups[groups.length - 1];
    if (latest?.subCategory === subCategory) {
      latest.rows.push(row);
    } else {
      groups.push({ subCategory, rows: [row] });
    }
  }
  return groups;
}

function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
