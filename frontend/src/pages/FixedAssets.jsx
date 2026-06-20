import { Download, Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fixedAssetsApi } from "../lib/api";
import { PageTitle } from "./UploadCentre";

export function FixedAssets() {
  const { clientId } = useParams();
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assets, setAssets] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [{ data: summaryData }, { data: classData }, { data: assetData }] = await Promise.all([
        fixedAssetsApi.summary(clientId, financialYear),
        fixedAssetsApi.classSummary(clientId, financialYear),
        fixedAssetsApi.assets(clientId, financialYear)
      ]);
      setSummary(summaryData);
      setClasses(classData);
      setAssets(assetData);
      setFinancialYear(summaryData.financial_year || financialYear);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load fixed asset schedule");
    }
  };

  useEffect(() => { load(); }, [clientId, financialYear]);

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      await fixedAssetsApi.run(clientId, financialYear);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Fixed asset schedule failed");
    } finally {
      setBusy(false);
    }
  };

  const sources = summary?.sources || {};
  const cards = useMemo(() => [
    ["Opening gross block", formatInr(summary?.opening_gross_block)],
    ["Additions", formatInr(summary?.additions)],
    ["Disposals", formatInr(summary?.disposals)],
    ["Closing gross block", formatInr(summary?.closing_gross_block)],
    ["Opening accumulated depreciation", formatInr(summary?.opening_accumulated_depreciation)],
    ["Current year depreciation", formatInr(summary?.current_year_depreciation)],
    ["Closing accumulated depreciation", formatInr(summary?.closing_accumulated_depreciation)],
    ["Opening WDV", formatInr(summary?.opening_wdv)],
    ["Closing WDV", formatInr(summary?.closing_wdv)],
    ["CA review alerts", summary?.review_alerts || 0]
  ], [summary]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Fixed Asset Schedule" subtitle="Companies Act Schedule II useful-life depreciation, disposals, and CA review alerts from uploaded client data." />
        <div className="flex flex-wrap gap-2">
          <label className="flex h-10 items-center gap-2 rounded border border-ink/10 bg-white px-3 text-sm font-semibold">
            FY
            <input value={financialYear} onChange={(event) => setFinancialYear(event.target.value)} className="w-24 bg-transparent font-bold outline-none" />
          </label>
          <button onClick={run} disabled={busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-coral px-3 text-sm font-black text-white disabled:opacity-55">
            {busy ? <RefreshCcw className="animate-spin" size={16} /> : <Play size={16} />}
            Run Schedule
          </button>
          <a href={fixedAssetsApi.export(clientId)} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white">
            <Download size={16} />
            Export Excel
          </a>
        </div>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SourceCard title="Opening asset data" file={sources.opening} missing="Opening asset data not uploaded." />
        <SourceCard title="Addition data" file={sources.additions} missing="Current year additions not uploaded." />
        <SourceCard title="Disposal data" file={sources.disposals} missing="No disposal file uploaded." />
        <SourceCard title="Fixed asset ledger / GL" file={sources.ledger} missing="Optional fixed asset ledger not uploaded." />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
      </div>

      <ScheduleTable title="Class-wise schedule" columns={["asset_class", "opening_gross_block", "additions", "disposals", "closing_gross_block", "opening_accumulated_depreciation", "depreciation_for_year", "closing_accumulated_depreciation", "opening_wdv", "closing_wdv"]} rows={classes} />
      <ScheduleTable title="Asset-wise schedule" columns={["asset_code", "asset_description", "asset_class", "location", "vendor_name", "vendor_gstin", "invoice_number", "purchase_date", "put_to_use_date", "cost", "residual_value", "useful_life_schedule_ii", "useful_life_used", "depreciation_method", "current_year_depreciation", "closing_wdv", "profit_loss_on_disposal"]} rows={assets} />
    </section>
  );
}

function SourceCard({ title, file, missing }) {
  return (
    <div className="rounded border border-ink/10 bg-white p-4">
      <div className="text-xs font-bold uppercase text-ink/55">{title}</div>
      {file ? (
        <div className="mt-3">
          <div className="font-black">{file.filename}</div>
          <div className="mt-1 text-sm text-ink/65">{file.category} | {file.file_type} | {file.records_extracted || 0} records | {file.parse_status}</div>
        </div>
      ) : <div className="mt-3 rounded bg-amber/10 px-3 py-2 text-sm font-semibold text-ink/70">{missing}</div>}
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-2 text-xl font-black">{value}</div></div>;
}

function ScheduleTable({ title, columns, rows }) {
  return (
    <div className="overflow-x-auto rounded border border-ink/10 bg-white">
      <div className="border-b px-4 py-3 text-sm font-black">{title}</div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-ink/5 text-left text-xs uppercase text-ink/60">
            {columns.map((column) => <th key={column} className="px-3 py-2">{label(column)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || JSON.stringify(row)} className="border-b last:border-0">
              {columns.map((column) => <td key={column} className="max-w-sm px-3 py-2">{display(row[column])}</td>)}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={columns.length} className="px-3 py-8 text-center font-semibold text-ink/50">No data available. Upload source data and run the schedule.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function label(value) {
  return value.replaceAll("_", " ");
}

function display(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return String(value);
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
