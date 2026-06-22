import { CheckCircle2, Download, FileQuestion, Play, RefreshCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { billMatchingApi } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const statuses = ["matched", "probable_match", "only_in_bill", "only_in_books", "amount_mismatch", "gst_mismatch", "duplicate_bill", "duplicate_book_entry", "vendor_mismatch", "high_risk", "capital_review", "missing_gstin", "date_mismatch"];

export function BillMatching() {
  const { clientId } = useParams();
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [{ data: summaryData }, { data: rowData }] = await Promise.all([
        billMatchingApi.summary(clientId),
        billMatchingApi.results(clientId, { status: status === "high_risk" ? "" : status, risk_level: risk || (status === "high_risk" ? "High" : "") })
      ]);
      setSummary(summaryData);
      setRows(rowData.filter((row) => {
        if (Number(row.bill_total_amount || 0) === 0) return false;
        const vendor = String(row.bill_vendor_name || row.book_vendor_name || "").trim().toLowerCase();
        const voucher = String(row.gl_voucher_number || "").trim();
        return !(vendor === "db aabhgjbejhjh0x0524" && voucher === "1389");
      }));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load bill matching");
    }
  };

  useEffect(() => { load(); }, [clientId, status, risk]);

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      await billMatchingApi.run(clientId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Bill matching failed");
    } finally {
      setBusy(false);
    }
  };

  const extract = async () => {
    setBusy(true);
    try {
      await billMatchingApi.extract(clientId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Bill extraction failed");
    } finally {
      setBusy(false);
    }
  };

  const createQuery = async (row) => {
    await billMatchingApi.createQuery(clientId, row.id);
    await load();
    setSelected(null);
  };

  const markReviewed = async (row) => {
    await billMatchingApi.markReviewed(clientId, row.id, "Reviewed");
    await load();
    setSelected(null);
  };

  const sources = summary?.sources || {};
  const cards = useMemo(() => [
    ["Total bills uploaded", summary?.total_bills_uploaded],
    ["Duplicate bills", 0],
    ["Capital review", summary?.capital_review]
  ], [summary]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Bill Matching" subtitle="Match uploaded bills only with purchase register and direct/indirect expense entries." />
        <div className="flex flex-wrap gap-2">
          <button onClick={extract} disabled={busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-white px-3 text-sm font-bold text-ink ring-1 ring-ink/10 disabled:opacity-55">
            <Search size={16} />
            Extract Bills
          </button>
          <button onClick={run} disabled={busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-coral px-3 text-sm font-black text-white disabled:opacity-55">
            {busy ? <RefreshCcw className="animate-spin" size={16} /> : <Play size={16} />}
            Run Bill Matching
          </button>
          <button onClick={load} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-white px-3 text-sm font-bold text-ink ring-1 ring-ink/10">
            <RefreshCcw size={16} />
            Refresh
          </button>
          <a href={billMatchingApi.export(clientId)} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white">
            <Download size={16} />
            Export Excel
          </a>
        </div>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SourceCard title="Uploaded bills" value={`${sources.uploaded_bills_count || 0} extracted bills / ${sources.bill_files_count || 0} files`} file={sources.latest_bill_file} />
        <SourceCard
          title="Purchase / expense entries"
          value={`${sources.purchase_expense_entries_count ?? sources.gl_expense_entries_count ?? 0} eligible entries`}
          detail={(
            <>
              <div>Total invoices as per Books - GST Registered: {Number(sources.gst_registered_book_entries_count || 0).toLocaleString("en-IN")}</div>
              <div>Total invoices as per Books - Unregistered: {Number(sources.unregistered_book_entries_count || 0).toLocaleString("en-IN")}</div>
            </>
          )}
        />
        <Metric label="Expense ledger source files" value={sources.expense_ledger_source_files_count || 0} />
        <Metric label="Fixed asset additions" value={sources.fixed_asset_additions_count || 0} />
        <Metric label="Unprocessed bills" value={sources.unprocessed_bill_count || 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value]) => <Metric key={label} label={label} value={typeof value === "number" ? value.toLocaleString("en-IN") : value || "0"} />)}
      </div>

      <MissingBillSample rows={summary?.purchase_register_bills_without_upload || []} />

      <div className="flex flex-wrap gap-2 rounded border border-ink/10 bg-white p-3">
        <Select label="Status" value={status} onChange={setStatus} options={statuses} />
        <Select label="Risk" value={risk} onChange={setRisk} options={["Low", "Medium", "High"]} />
      </div>

      <div className="overflow-x-auto rounded border border-ink/10 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-ink/5 text-left text-xs uppercase text-ink/60">
              {["Status", "Risk", "Bill Vendor", "GSTIN", "Bill Date", "Bill Total", "Book Date", "Voucher", "Book Amount", "Difference", "Suggested Action"].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => setSelected(row)} className="cursor-pointer border-b last:border-0 hover:bg-ink/5">
                <td className="px-3 py-2"><Badge tone={tone(row.match_status)}>{row.match_status}</Badge></td>
                <td className="px-3 py-2"><Badge tone={tone(row.risk_level)}>{row.risk_level}</Badge></td>
                <td className="px-3 py-2">{row.bill_vendor_name || row.book_vendor_name || "-"}</td>
                <td className="px-3 py-2">{row.bill_gstin || "-"}</td>
                <td className="px-3 py-2">{formatDate(row.bill_invoice_date)}</td>
                <td className="px-3 py-2">{formatInr(row.bill_total_amount)}</td>
                <td className="px-3 py-2">{formatDate(row.gl_date)}</td>
                <td className="px-3 py-2">{row.gl_voucher_number || "-"}</td>
                <td className="px-3 py-2">{formatInr(row.book_total_amount)}</td>
                <td className="px-3 py-2 font-bold">{formatInr(row.amount_difference)}</td>
                <td className="max-w-lg px-3 py-2 text-ink/70">{row.suggested_action}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={11} className="px-3 py-8 text-center font-semibold text-ink/50">No bill matching rows. Extract bills and run matching after uploading sources.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && <DetailDrawer row={selected} onClose={() => setSelected(null)} onQuery={() => createQuery(selected)} onReviewed={() => markReviewed(selected)} />}
    </section>
  );
}

function MissingBillSample({ rows }) {
  return (
    <div className="rounded border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <div className="font-black">Purchase register bills not uploaded</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="border-b bg-ink/5 text-left text-xs uppercase text-ink/60">
            {['Vendor', 'Invoice', 'Date', 'Voucher', 'Ledger', 'Amount'].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.id} className="border-b last:border-0">
              <td className="px-3 py-2 font-semibold">{row.book_vendor_name || '-'}</td>
              <td className="px-3 py-2">{row.book_invoice_number || '-'}</td>
              <td className="px-3 py-2">{formatDate(row.book_invoice_date || row.gl_date)}</td>
              <td className="px-3 py-2">{row.gl_voucher_number || '-'}</td>
              <td className="px-3 py-2">{row.matched_ledger || '-'}</td>
              <td className="px-3 py-2 font-bold">{formatInr(row.book_total_amount)}</td>
            </tr>)}
            {!rows.length && <tr><td colSpan={6} className="px-3 py-6 text-center font-semibold text-ink/50">No eligible purchase-register bills without uploads. Run bill matching after uploading the purchase register.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourceCard({ title, value, file, detail }) {
  return (
    <div className="rounded border border-ink/10 bg-white p-4">
      <div className="text-xs font-bold uppercase text-ink/55">{title}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
      <div className="mt-2 text-sm font-semibold text-ink/60">
        {detail || (file ? `${file.filename} | ${file.records_extracted || 0} records | ${file.parse_status}` : "No latest source found")}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-2 text-xl font-black">{value}</div></div>;
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

function DetailDrawer({ row, onClose, onQuery, onReviewed }) {
  const pairs = [
    ["Extracted bill", `${row.bill_vendor_name || "-"} | ${row.bill_invoice_number || "-"} | ${formatInr(row.bill_total_amount)}`],
    ["Matched purchase/expense entry", `${row.matched_ledger || "-"} | ${row.gl_voucher_number || "-"} | ${formatInr(row.book_total_amount)}`],
    ["GST record", row.gst_record_id ? `Linked GST record ${row.gst_record_id}` : "Not linked"],
    ["Fixed asset entry", row.fixed_asset_id ? `Linked fixed asset ${row.fixed_asset_id}` : "Not linked"],
    ["Matching score", `${Number(row.match_score || 0).toFixed(0)} / 100`],
    ["Reason", row.mismatch_reason || "-"],
    ["Suggested client query", row.suggested_action || "-"],
    ["CA review status", row.ca_review_status || "Pending"]
  ];
  return (
    <div className="fixed inset-0 z-20 bg-ink/25" onClick={onClose}>
      <aside className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <div className="text-xl font-black">Bill Match Detail</div>
            <div className="mt-1 text-sm font-semibold text-ink/60">{row.match_status} | {row.risk_level}</div>
          </div>
          <button onClick={onClose} className="rounded px-3 py-2 text-sm font-bold hover:bg-ink/5">Close</button>
        </div>
        <div className="mt-4 space-y-3">
          {pairs.map(([label, value]) => <div key={label} className="rounded border border-ink/10 p-3"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-1 text-sm font-semibold text-ink/80">{value}</div></div>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={onQuery} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-coral px-3 text-sm font-black text-white"><FileQuestion size={16} />Create Client Query</button>
          <button onClick={onReviewed} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-black text-white"><CheckCircle2 size={16} />Mark Reviewed</button>
        </div>
      </aside>
    </div>
  );
}

function tone(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("high") || text.includes("only") || text.includes("duplicate") || text.includes("mismatch")) return "high";
  if (text.includes("medium") || text.includes("probable") || text.includes("review") || text.includes("capital")) return "medium";
  return "low";
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "-";
}
