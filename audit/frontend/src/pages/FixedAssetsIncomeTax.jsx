import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fixedAssetsApi } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const COLUMNS = [
  ["particular", "Particular"],
  ["rate_of_dep", "Rate of Dep"],
  ["opening_balance", "Opening Balance"],
  ["more_than_180_days", "More than 180 Days"],
  ["less_than_180_days", "Less than 180 Days"],
  ["total", "Total"],
  ["sales", "Sales"],
  ["balance", "Balance"],
  ["depreciation", "Depreciation"],
  ["closing_balance", "Closing Balance"]
];

export function FixedAssetsIncomeTax() {
  const { clientId } = useParams();
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const { data: payload } = await fixedAssetsApi.incomeTax(clientId, financialYear);
      setData(payload);
      setFinancialYear(payload.financial_year || financialYear);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load the Income Tax fixed asset schedule");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, [clientId, financialYear]);

  const total = data?.total || {};
  const deferredTax = data?.deferred_tax || {};
  const cards = useMemo(() => [
    ["Opening Balance", formatInr(total.opening_balance)],
    ["More than 180 Days", formatInr(total.more_than_180_days)],
    ["Less than 180 Days", formatInr(total.less_than_180_days)],
    ["Total / Balance", formatInr(total.balance)],
    ["IT Act Depreciation", formatInr(total.depreciation)],
    ["Closing Balance", formatInr(total.closing_balance)],
    ["Timing Difference", formatInr(deferredTax.timing_difference)],
    [deferredTax.nature || "DTA / DTL", formatInr(deferredTax.deferred_tax_amount)]
  ], [total, deferredTax]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Fixed Asset Schedule" subtitle="Income Tax Act" />
        <div className="flex flex-wrap gap-2">
          <label className="flex h-10 items-center gap-2 rounded border border-ink/10 bg-white px-3 text-sm font-semibold">
            FY
            <input value={financialYear} onChange={(event) => setFinancialYear(event.target.value)} className="w-24 bg-transparent font-bold outline-none" />
          </label>
          <button onClick={load} disabled={busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-black text-white disabled:opacity-55">
            <RefreshCcw className={busy ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <div className="rounded border border-ink/10 bg-white p-4">
        <div className="text-xs font-bold uppercase text-ink/55">Opening Fixed Asset Schedule as per Income Tax Act</div>
        {data?.source ? (
          <div className="mt-3">
            <div className="font-black">{data.source.filename}</div>
            <div className="mt-1 text-sm text-ink/65">{data.source.file_type} | {data.source.records_extracted || 0} records | {data.source.parse_status}</div>
          </div>
        ) : (
          <div className="mt-3 rounded bg-amber/10 px-3 py-2 text-sm font-semibold text-ink/70">
            Schedule populated from the approved Income Tax Act working for FY 2025-26.
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
      </div>

      <DeferredTaxCard deferredTax={deferredTax} />

      <ScheduleTable rows={data?.rows || []} total={total} />
    </section>
  );
}

function DeferredTaxCard({ deferredTax }) {
  return (
    <div className="rounded border border-ink/10 bg-white p-4">
      <div className="flex flex-col gap-1 border-b border-ink/10 pb-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase text-ink/55">DTA / DTL Calculation</div>
          <div className="mt-1 text-xl font-black">{deferredTax.nature || "DTL"} for FY 2025-26</div>
        </div>
        <div className="rounded bg-coral/10 px-3 py-2 text-right">
          <div className="text-xs font-bold uppercase text-coral">Deferred Tax Liability</div>
          <div className="text-2xl font-black text-coral">{formatInr(deferredTax.deferred_tax_amount)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <CalcItem label="Depreciation as per Companies Act (Books)" value={formatInr(deferredTax.books_depreciation)} />
        <CalcItem label="Depreciation as per Income Tax Act" value={formatInr(deferredTax.income_tax_depreciation)} />
        <CalcItem label="Timing Difference (IT Dep - Books Dep)" value={formatInr(deferredTax.timing_difference)} />
        <CalcItem label="Applicable Tax Rate" value={deferredTax.tax_rate_label || "25.168%"} />
        <CalcItem label="DTA / DTL for the year" value={formatInr(deferredTax.deferred_tax_amount)} />
      </div>

      <div className="mt-4 rounded bg-ink/5 px-3 py-2 text-sm font-semibold text-ink/70">
        {deferredTax.explanation}
      </div>
    </div>
  );
}

function CalcItem({ label, value }) {
  return <div className="rounded border border-ink/10 p-3"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-2 font-black">{value}</div></div>;
}

function Metric({ label, value }) {
  return <div className="rounded border border-ink/10 bg-white p-4"><div className="text-xs font-bold uppercase text-ink/55">{label}</div><div className="mt-2 text-xl font-black">{value}</div></div>;
}

function ScheduleTable({ rows, total }) {
  return (
    <div className="overflow-x-auto rounded border border-ink/10 bg-white">
      <div className="border-b px-4 py-3">
        <div className="text-sm font-black">Particulars of depreciation allowable as per The Income Tax Rules, 1962</div>
        <div className="text-xs font-semibold text-ink/55">For the Year Ended March 31, 2026</div>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-ink/5 text-left text-xs uppercase text-ink/60">
            {COLUMNS.map(([, label]) => <th key={label} className="px-3 py-2">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => row.is_block ? (
            <tr key={`${row.particular}-${index}`} className="border-b bg-moss/10">
              <td colSpan={COLUMNS.length} className="px-3 py-2 font-black">{row.particular}</td>
            </tr>
          ) : (
            <tr key={`${row.particular}-${index}`} className="border-b last:border-0">
              {COLUMNS.map(([key]) => <td key={key} className="whitespace-nowrap px-3 py-2 text-right first:text-left">{display(key, row[key])}</td>)}
            </tr>
          ))}
          {rows.length > 0 && (
            <tr className="border-t-2 border-ink bg-amber/10 font-black">
              {COLUMNS.map(([key]) => <td key={key} className="whitespace-nowrap px-3 py-2 text-right first:text-left">{key === "particular" ? "Total" : display(key, total[key])}</td>)}
            </tr>
          )}
          {!rows.length && <tr><td colSpan={COLUMNS.length} className="px-3 py-8 text-center font-semibold text-ink/50">No Income Tax Act schedule available for this financial year.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function display(key, value) {
  if (value === null || value === undefined || value === "") return "-";
  if (key === "rate_of_dep") return Number(value).toFixed(2);
  if (typeof value === "number") return Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return String(value);
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
