import { Download, Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { exportGSTReco, getGSTRecoResults, getGSTRecoSummary, runGSTReco } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const statuses = [
  "MATCHED",
  "POSSIBLE_MATCH",
  "ONLY_IN_GSTR",
  "ONLY_IN_BOOKS",
  "AMOUNT_MISMATCH",
  "GSTIN_MISMATCH",
  "DATE_MISMATCH",
  "TAX_HEAD_MISMATCH",
  "DUPLICATE_IN_GSTR",
  "DUPLICATE_IN_BOOKS",
  "REVIEW_REQUIRED"
];

const risks = ["Low", "Low-Medium", "Medium", "High"];

export function GSTReco() {
  const { clientId } = useParams();
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [{ data: summaryData }, { data: resultData }] = await Promise.all([
        getGSTRecoSummary(clientId),
        getGSTRecoResults(clientId, compact({ status, risk_level: risk }))
      ]);
      setSummary(summaryData);
      setRows(resultData);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load GST reconciliation");
    }
  };

  useEffect(() => { load(); }, [clientId, status, risk]);

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      await runGSTReco(clientId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "GST reconciliation failed");
    } finally {
      setBusy(false);
    }
  };

  const sources = summary?.sources || {};
  const gstrFile = sources.gstr_file;
  const booksFile = sources.books_file;
  const purchaseRegisterFile = sources.purchase_register_file;
  const inputLedgerFile = sources.input_ledger_file;
  const combinedBooksFile = sources.combined_books_file;
  const displayedBooksFile = combinedBooksFile || purchaseRegisterFile || inputLedgerFile || booksFile;
  const ready = Boolean(gstrFile && displayedBooksFile);
  const cards = useMemo(() => [
    ["Total invoices as per GSTR-2A/B", summary?.total_gstr_invoices],
    ["Total invoices as per Books", summary?.total_books_invoices],
    ["Matched", summary?.matched],
    ["Only in GSTR-2A/B", summary?.only_in_gstr],
    ["Only in Books", summary?.only_in_books],
    ["Amount mismatch", summary?.amount_mismatch],
    ["Duplicate invoices", summary?.duplicate_invoices],
    ["ITC as per GSTR-2A/B", formatInr(summary?.itc_as_per_gstr)],
    ["ITC as per Books", formatInr(summary?.itc_as_per_books)],
    ["Net ITC difference", formatInr(summary?.net_itc_difference)]
  ], [summary]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="GST Reconciliation" subtitle="Match already uploaded GSTR-2A/2B JSON with books / Daybook and identify ITC differences." />
        <div className="flex flex-wrap gap-2">
          <button onClick={run} disabled={busy || !ready} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-coral px-3 text-sm font-black text-white disabled:opacity-55">
            {busy ? <RefreshCcw className="animate-spin" size={16} /> : <Play size={16} />}
            Run GST Reco with Books and GSTR-2A/B
          </button>
          <button onClick={load} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-white px-3 text-sm font-bold text-ink ring-1 ring-ink/10">
            <RefreshCcw size={16} />
            Refresh
          </button>
          <a href={exportGSTReco(clientId)} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white">
            <Download size={16} />
            Export Excel
          </a>
        </div>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <div className="grid gap-3 lg:grid-cols-2">
        <SourceCard title="GSTR-2A / GSTR-2B JSON files for reconciliation" file={gstrFile} missing="GSTR-2A/B JSON not found. Please upload it from Upload Centre." />
        <SourceCard title={combinedBooksFile ? "Books ITC source for reconciliation" : purchaseRegisterFile ? "Purchase Register used for Books ITC" : "Latest Daybook / Books / GL file"} file={displayedBooksFile} missing="Books / Daybook not found. Please upload it from Upload Centre." />
      </div>

      <div className={`rounded border px-4 py-3 text-sm font-semibold ${ready ? "border-teal/20 bg-teal/10 text-teal" : "border-amber/30 bg-amber/10 text-ink/75"}`}>
        {ready ? "Ready to run GST reconciliation using uploaded GSTR-2A/B and Books." : "Upload the missing source from Upload Centre, then refresh this tab."}
      </div>

      {summary?.latest_run && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {cards.map(([label, value]) => <Metric key={label} label={label} value={typeof value === "number" ? formatNumber(value) : value} />)}
          </div>

          <div className="flex flex-wrap gap-2 rounded border border-ink/10 bg-white p-3">
            <Select label="Status" value={status} onChange={setStatus} options={statuses} />
            <Select label="Risk" value={risk} onChange={setRisk} options={risks} />
          </div>

          <div className="overflow-x-auto rounded border border-ink/10 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-ink/5 text-left text-xs uppercase text-ink/60">
                  {["Status", "Risk", "Vendor", "GSTIN", "Invoice", "GSTR Tax", "Books Tax", "Difference", "Suggested Action"].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2"><Badge tone={tone(row.status)}>{row.status}</Badge></td>
                    <td className="px-3 py-2"><Badge tone={tone(row.risk_level)}>{row.risk_level}</Badge></td>
                    <td className="px-3 py-2 font-semibold">{row.vendor_name || "-"}</td>
                    <td className="px-3 py-2">{row.gstin || "-"}</td>
                    <td className="px-3 py-2">{row.invoice_number || "-"}</td>
                    <td className="px-3 py-2">{formatInr(row.gstr_tax_amount)}</td>
                    <td className="px-3 py-2">{formatInr(row.books_tax_amount)}</td>
                    <td className="px-3 py-2 font-bold">{formatInr(row.difference_amount)}</td>
                    <td className="max-w-lg px-3 py-2 text-ink/70">{row.suggested_action}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={9} className="px-3 py-8 text-center font-semibold text-ink/50">No reconciliation rows for the selected filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function SourceCard({ title, file, missing }) {
  const filenames = file?.filenames || [];
  return (
    <div className="rounded border border-ink/10 bg-white p-4">
      <div className="text-xs font-bold uppercase text-ink/55">{title}</div>
      {file ? (
        <div className="mt-3 space-y-1">
          <div className="font-black text-ink">{file.filename}</div>
          <div className="text-sm text-ink/65">{file.category} | {file.file_type} | {file.records_extracted || 0} records | {file.parse_status}</div>
          {filenames.length > 0 && (
            <div className="mt-3 max-h-28 overflow-y-auto rounded bg-ink/5 px-3 py-2 text-xs font-semibold leading-5 text-ink/65">
              {filenames.map((name) => <div key={name}>{name}</div>)}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded bg-amber/10 px-3 py-2 text-sm font-semibold text-ink/70">{missing}</div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-2 text-xl font-black">{value || "0"}</div></div>;
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded border border-ink/10 bg-white px-3 text-sm font-semibold">
      <span className="text-ink/55">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent font-bold outline-none">
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item));
}

function tone(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("high") || text.includes("missing") || text.includes("mismatch") || text.includes("only")) return "high";
  if (text.includes("medium") || text.includes("possible") || text.includes("review")) return "medium";
  return "low";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
