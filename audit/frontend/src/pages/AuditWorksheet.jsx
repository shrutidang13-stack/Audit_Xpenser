import { Download, Eye, RefreshCcw, Search, X } from "lucide-react";
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
  ["worksheet", "Worksheet"]
];

const filterFields = [
  ["expense_type", "Expense Type"]
];

export function AuditWorksheet() {
  const { clientId } = useParams();
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [loading, setLoading] = useState(true);
  const [busyDownload, setBusyDownload] = useState("");
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  const [worksheetError, setWorksheetError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/audit-worksheet/${clientId}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Audit Worksheet could not be loaded");
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
    ["Payment / 40A(3) Review Items", formatNumber(data.summary?.payment_40a3_review_items)],
    ["CA Review Required Count", formatNumber(data.summary?.ca_review_required_count)]
  ]), [data.summary]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.rows.filter((row) => {
      const matchesSearch = !query || columns.some(([key]) => String(row[key] ?? "").toLowerCase().includes(query));
      const matchesFilters = filterFields.every(([key]) => !filters[key] || row[key] === filters[key]);
      return matchesSearch && matchesFilters;
    });
  }, [data.rows, filters, search]);

  const openWorksheet = async (row) => {
    setSelectedRow(row);
    setSelectedWorksheet(null);
    setWorksheetError("");
    setWorksheetLoading(true);
    try {
      const resultId = row.result_id || row.id;
      const response = await api.get(`/api/audit-worksheet/${clientId}/ledger/${resultId}`);
      setSelectedWorksheet(response.data);
    } catch (err) {
      setWorksheetError(err.response?.data?.detail || err.message || "Worksheet could not be loaded");
    } finally {
      setWorksheetLoading(false);
    }
  };

  const closeWorksheet = () => {
    setSelectedRow(null);
    setSelectedWorksheet(null);
    setWorksheetError("");
  };

  const download = async (format, row = null) => {
    setBusyDownload(format);
    setDownloadError("");
    try {
      const response = await api.get(`/api/audit-worksheet/${clientId}/download`, {
        params: row ? { format, result_id: row.result_id || row.id } : { format },
        responseType: "blob"
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = row ? `${safeFilename(row.ledger_name)}-worksheet.${format}` : `audit-worksheet.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.response?.data?.detail || err.message || `${format.toUpperCase()} download could not be generated`);
    } finally {
      setBusyDownload("");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PageTitle title="Audit Worksheet" subtitle="Complete CA audit working for structured expense ledgers." />
        <div className="flex flex-wrap gap-2">
          <DownloadButton label="Download Word" format="docx" busyDownload={busyDownload} onClick={download} />
          <DownloadButton label="Download Excel" format="xlsx" busyDownload={busyDownload} onClick={download} />
          <DownloadButton label="Download PDF" format="pdf" busyDownload={busyDownload} onClick={download} />
          <button onClick={load} disabled={loading} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white disabled:opacity-60">
            <RefreshCcw className={loading ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}
      {downloadError && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{downloadError}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded border border-ink/10 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-black uppercase text-ink/55">{label}</div>
            <div className="mt-2 text-xl font-black text-ink">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded border border-ink/10 bg-white p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(150px,190px)]">
          <label className="flex h-10 items-center gap-2 rounded border border-ink/15 px-3">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Audit Worksheet" className="w-full bg-transparent text-sm outline-none" />
          </label>
          {filterFields.map(([key, label]) => (
            <select key={key} value={filters[key] || ""} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} className="h-10 rounded border border-ink/15 bg-white px-2 text-sm font-semibold text-ink/75 outline-none">
              <option value="">{label}</option>
              {uniqueValues(data.rows, key).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded border border-ink/15 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-4 py-3 text-sm font-black uppercase text-ink">Audit Worksheet Table</div>
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
              {filteredRows.map((row, index) => (
                <tr key={`${row.ledger_name}-${row.sr_no}`} className={index % 2 === 0 ? "bg-white" : "bg-ink/5"}>
                  {columns.map(([key]) => (
                    <td key={key} className={`border border-ink/10 px-3 py-3 align-top ${isAmountKey(key) ? "text-right font-bold" : ""} ${key === "worksheet" ? "min-w-[520px] whitespace-pre-line leading-6" : ""}`}>
                      {key === "worksheet" ? (
                        <button onClick={() => openWorksheet(row)} className="focus-ring inline-flex h-9 items-center gap-2 rounded bg-teal px-3 text-sm font-bold text-white">
                          <Eye size={15} />
                          View
                        </button>
                      ) : formatCell(key, row[key])}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && !filteredRows.length && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-sm font-semibold text-ink/60">
                    Run Expense Audit from the Data tab to generate the Audit Worksheet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-sm font-semibold text-ink/60">
                    Loading Audit Worksheet...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow && (
        <WorksheetPanel
          row={selectedRow}
          detail={selectedWorksheet}
          loading={worksheetLoading}
          error={worksheetError}
          onClose={closeWorksheet}
          onDownload={download}
          busyDownload={busyDownload}
        />
      )}
    </section>
  );
}

function WorksheetPanel({ row, detail, loading, error, onClose, onDownload, busyDownload }) {
  const worksheet = detail || row;
  const worksheetColumns = detail?.columns || [];
  const worksheetRows = detail?.rows || [];
  const headerGroups = detail?.header_groups || [];
  const notes = detail?.notes || [];
  const caRemarks = detail?.ca_remarks || "";

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 p-3">
      <div className="mx-auto flex max-h-[94vh] max-w-6xl flex-col overflow-hidden rounded border border-ink/15 bg-white shadow-xl">
        <div className="flex flex-col gap-3 border-b border-ink/10 px-4 py-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase text-teal">Worksheet</div>
            <h2 className="mt-1 text-xl font-black text-ink">{detail?.report_title || worksheet.ledger_name}</h2>
            <div className="mt-1 text-sm font-semibold text-ink/60">{worksheet.expense_type}</div>
            {detail?.worksheet_type && <div className="mt-1 text-sm font-black text-teal">{detail.worksheet_type}</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            <DownloadButton label="Download Word" format="docx" busyDownload={busyDownload} onClick={(format) => onDownload(format, detail || row)} />
            <DownloadButton label="Download Excel" format="xlsx" busyDownload={busyDownload} onClick={(format) => onDownload(format, detail || row)} />
            <DownloadButton label="Download PDF" format="pdf" busyDownload={busyDownload} onClick={(format) => onDownload(format, detail || row)} />
            <button onClick={onClose} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white">
              <X size={16} />
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-ink/10 p-4 sm:grid-cols-3">
          <AmountCard label="Amount as per Audit" value={worksheet.amount_as_per_audit} />
          <AmountCard label="Amount as per GL" value={worksheet.amount_as_per_gl} />
          <AmountCard label="Difference" value={worksheet.difference_amount} />
        </div>

        <div className="space-y-4 overflow-auto p-4">
          {loading && (
            <div className="rounded border border-ink/10 bg-ink/5 px-4 py-8 text-center text-sm font-semibold text-ink/60">
              Loading ledger worksheet...
            </div>
          )}
          {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}
          {!loading && !detail && !error && (
            <div className="rounded border border-ink/10 bg-ink/5 p-4 font-mono text-sm leading-7 text-ink whitespace-pre-line">
              {row.worksheet || "Data not available for conclusion"}
            </div>
          )}
          {!loading && detail && (
            <>
              <div className="overflow-auto rounded border border-ink/10">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="bg-ink text-white">
                    {!!headerGroups.length && (
                      <tr>
                        {headerGroups.map((group, index) => (
                          <th key={`${group.label}-${index}`} colSpan={group.span || 1} className="whitespace-nowrap border border-white/10 px-3 py-2 text-center font-black">
                            {group.label}
                          </th>
                        ))}
                      </tr>
                    )}
                    <tr>
                      {worksheetColumns.map((column) => (
                        <th key={column} className="whitespace-nowrap border border-white/10 px-3 py-3 text-left font-black">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {worksheetRows.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-ink/5"}>
                        {worksheetColumns.map((column) => (
                          <td key={column} className={`border border-ink/10 px-3 py-3 align-top ${isAmountLabel(column) ? "text-right font-bold" : ""}`}>
                            {formatWorksheetValue(column, item[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!worksheetRows.length && (
                      <tr>
                        <td colSpan={Math.max(worksheetColumns.length, 1)} className="px-3 py-8 text-center text-sm font-semibold text-ink/60">
                          Data not available for conclusion
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(!!notes.length || !!caRemarks) && (
                <div className="grid gap-3 lg:grid-cols-2">
                  {!!notes.length && (
                    <div className="rounded border border-ink/10 bg-ink/5 p-4">
                      <div className="text-xs font-black uppercase text-ink/55">Notes</div>
                      <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-ink/75">
                        {notes.map((note) => <li key={note}>{note}</li>)}
                      </ul>
                    </div>
                  )}
                  {!!caRemarks && (
                    <div className="rounded border border-ink/10 bg-white p-4">
                      <div className="text-xs font-black uppercase text-ink/55">CA Remarks</div>
                      <div className="mt-3 text-sm font-semibold leading-6 text-ink/75">{caRemarks}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AmountCard({ label, value }) {
  return (
    <div className="rounded border border-ink/10 bg-white px-3 py-3">
      <div className="text-xs font-black uppercase text-ink/50">{label}</div>
      <div className="mt-1 text-lg font-black text-ink">{formatInr(value)}</div>
    </div>
  );
}

function DownloadButton({ label, format, busyDownload, onClick }) {
  return (
    <button onClick={() => onClick(format)} disabled={!!busyDownload} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white disabled:opacity-60">
      {busyDownload === format ? <RefreshCcw className="animate-spin" size={16} /> : <Download size={16} />}
      {label}
    </button>
  );
}

function isAmountKey(key) {
  return ["amount_as_per_audit", "amount_as_per_gl", "difference_amount"].includes(key);
}

function isAmountLabel(label) {
  return /amount|difference|aggregate|tds|gst/i.test(label) && !/review|mode|party|name|data/i.test(label);
}

function formatCell(key, value) {
  if (isAmountKey(key)) return value === null || value === undefined ? "Data not available for conclusion" : formatInr(value);
  return value === null || value === undefined || value === "" ? "Data not available for conclusion" : String(value);
}

function formatWorksheetValue(label, value) {
  if (typeof value === "number" && isAmountLabel(label)) return formatInr(value);
  if (value === null || value === undefined || value === "") return "Data not available for conclusion";
  return String(value);
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function safeFilename(value) {
  return String(value || "expense").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}
