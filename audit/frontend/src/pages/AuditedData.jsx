import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const columns = [
  ["sr_no", "Sr. No."],
  ["ledger_name", "Ledger Name"],
  ["expense_type", "Expense Type"],
  ["amount_as_per_audit", "Amount as per Audit"],
  ["amount_as_per_gl", "Amount as per GL"],
  ["difference_amount", "Difference"],
  ["tds_review", "TDS Review"],
  ["gst_review", "GST Review"],
  ["payment_40a3_review", "Payment / 40A(3) Review"],
  ["gl_recording_check", "GL Recording Check"],
  ["finding", "Finding"],
  ["risk_level", "Risk Level"],
  ["ca_review_status", "CA Review Status"],
  ["ca_remarks", "CA Remarks"]
];

export function AuditedData() {
  const { clientId } = useParams();
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/expense-audit/${clientId}/results`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Audited Data could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const cards = useMemo(() => ([
    ["Total Ledgers Audited", formatNumber(data.summary?.total_ledgers_audited)],
    ["Total Amount Audited", formatInr(data.summary?.total_amount_audited)],
    ["GL Differences", formatNumber(data.summary?.gl_differences)],
    ["TDS Review Items", formatNumber(data.summary?.tds_review_items)],
    ["GST Review Items", formatNumber(data.summary?.gst_review_items)],
    ["CA Review Required Count", formatNumber(data.summary?.ca_review_required_count)]
  ]), [data.summary]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Audited Data" subtitle="Ledger-wise expense audit results generated from the structured Data tab." />
        <button onClick={load} disabled={loading} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white disabled:opacity-60">
          <RefreshCcw className={loading ? "animate-spin" : ""} size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded border border-ink/10 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-black uppercase text-ink/55">{label}</div>
            <div className="mt-2 text-xl font-black text-ink">{value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-ink/15 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-black uppercase text-ink">Audit Result Table</div>
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-ink text-white">
              <tr>
                {columns.map(([key, label]) => (
                  <th key={key} className="whitespace-nowrap border border-white/10 px-3 py-3 text-left font-black">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <tr key={`${row.ledger_name}-${row.sr_no}`} className={index % 2 === 0 ? "bg-white" : "bg-ink/5"}>
                  {columns.map(([key]) => (
                    <td key={key} className={`border border-ink/10 px-3 py-3 align-top ${isAmountKey(key) ? "text-right font-bold" : ""}`}>
                      {formatCell(key, row[key])}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && !data.rows.length && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-sm font-semibold text-ink/60">
                    Run Expense Audit from the Data tab to generate Audited Data.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-sm font-semibold text-ink/60">
                    Loading Audited Data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function isAmountKey(key) {
  return ["amount_as_per_audit", "amount_as_per_gl", "difference_amount"].includes(key);
}

function formatCell(key, value) {
  if (isAmountKey(key)) return value === null || value === undefined ? "Data not available for conclusion" : formatInr(value);
  return value === null || value === undefined || value === "" ? "Data not available for conclusion" : String(value);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
