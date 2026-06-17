import { CheckCircle, Eye, RefreshCcw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const statuses = ["", "Pending", "Under Review", "Resolved", "Not Applicable"];
const risks = ["", "High", "Medium", "Low"];

export function Exceptions() {
  const { clientId } = useParams();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category: searchParams.get("category") || "", risk_level: "", status: "", search: "" });
  const [sorting, setSorting] = useState({ sort_by: "id", sort_order: "desc" });
  const [selected, setSelected] = useState({});
  const [drawer, setDrawer] = useState(null);
  const [saving, setSaving] = useState("");

  const load = async () => {
    const { data } = await api.get(`/api/audit/${clientId}/exceptions`, { params: { ...filters, ...sorting, page, page_size: 50 } });
    setRows(data.exceptions || []);
    setSummary(data.summary);
    setTotal(data.total || 0);
  };

  useEffect(() => { load(); }, [clientId, page, filters, sorting]);

  const save = async (item, patch) => {
    setSaving(String(item.id));
    const { data } = await api.patch(`/api/audit/${clientId}/exceptions/${item.id}`, { status: patch.status || item.status, comment: patch.ca_remarks ?? item.ca_remarks ?? "" });
    setRows((current) => current.map((row) => row.id === item.id ? data : row));
    setDrawer((current) => current?.id === item.id ? data : current);
    setSaving("");
  };

  const bulkResolve = async () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    for (const id of ids) {
      const item = rows.find((row) => String(row.id) === String(id));
      if (item) await save(item, { status: "Resolved" });
    }
    setSelected({});
  };

  const columns = useMemo(() => [
    { id: "select", header: "", cell: ({ row }) => <input type="checkbox" checked={!!selected[row.original.id]} onChange={(event) => setSelected((current) => ({ ...current, [row.original.id]: event.target.checked }))} /> },
    { accessorKey: "voucher_date", header: "Date", cell: (info) => formatDate(info.getValue()) },
    { accessorKey: "voucher_type", header: "Voucher Type" },
    { accessorKey: "voucher_number", header: "Voucher No." },
    { accessorKey: "party_name", header: "Party Name", cell: (info) => <span title={info.getValue() || ""}>{truncate(info.getValue())}</span> },
    { accessorKey: "ledger_name", header: "Ledger" },
    { accessorKey: "amount", header: "Amount", cell: (info) => <span className="font-bold">{formatInr(info.getValue())}</span> },
    { accessorKey: "exception_type", header: "Review Area", cell: (info) => <Tag value={info.getValue()} /> },
    { accessorKey: "risk_level", header: "Risk", cell: (info) => <Risk value={info.getValue()} /> },
    { accessorKey: "form_3cd_clause", header: "Form 3CD" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <select value={row.original.status || "Pending"} onChange={(event) => save(row.original, { status: event.target.value })} className="rounded border border-ink/15 px-2 py-1 text-xs font-bold">{statuses.filter(Boolean).map((item) => <option key={item}>{item}</option>)}</select> },
    { accessorKey: "ca_remarks", header: "CA Remarks", cell: ({ row }) => <input defaultValue={row.original.ca_remarks || ""} onBlur={(event) => save(row.original, { ca_remarks: event.target.value })} className="w-48 rounded border border-ink/15 px-2 py-1 text-xs focus:ring-2 focus:ring-blue-300" placeholder="CA Review Required" /> },
    { id: "action", header: "Action", cell: ({ row }) => <button onClick={() => setDrawer(row.original)} className="inline-flex items-center gap-1 rounded bg-ink px-2 py-1 text-xs font-bold text-white"><Eye size={13} />Open</button> },
  ], [selected]);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <section className="space-y-5">
      <PageTitle title="Exception Register" subtitle="Filterable canonical exceptions requiring CA Review Required workflow." />
      <div className="flex flex-wrap items-center gap-2 rounded border border-ink/10 bg-white p-3">
        <Select value={filters.category} onChange={(value) => setFilters((f) => ({ ...f, category: value }))} options={["", ...(summary?.category_summary || []).map((item) => item.category)]} label="All Categories" />
        <Select value={filters.risk_level} onChange={(value) => setFilters((f) => ({ ...f, risk_level: value }))} options={risks} label="All Risk Levels" />
        <Select value={filters.status} onChange={(value) => setFilters((f) => ({ ...f, status: value }))} options={statuses} label="All Statuses" />
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 text-ink/35" size={15} />
          <input value={filters.search} onChange={(event) => setFilters((f) => ({ ...f, search: event.target.value }))} className="h-10 rounded border border-ink/15 pl-8 pr-3 text-sm" placeholder="Search party or voucher" />
        </div>
        <button onClick={() => setFilters({ category: "", risk_level: "", status: "", search: "" })} className="text-sm font-bold text-moss">Clear Filters</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(summary?.risk_counts || []).map((item) => <button key={item.risk_level} onClick={() => setFilters((f) => ({ ...f, risk_level: item.risk_level }))} className="rounded border border-ink/10 bg-white px-3 py-1 text-sm font-bold">{item.risk_level}: {item.count}</button>)}
        <span className="rounded border border-ink/10 bg-white px-3 py-1 text-sm font-bold">{total} exceptions | CA Review Required</span>
        {saving && <span className="inline-flex items-center gap-1 rounded bg-moss/10 px-3 py-1 text-sm font-bold text-moss"><CheckCircle size={14} />Saved</span>}
      </div>
      <div className="overflow-x-auto rounded border border-ink/10 bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-ink text-white">
            {table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} onClick={() => header.column.columnDef.accessorKey && setSorting({ sort_by: header.column.columnDef.accessorKey, sort_order: sorting.sort_order === "asc" ? "desc" : "asc" })} className="whitespace-nowrap px-3 py-2 text-left text-xs font-black">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => <tr key={row.id} className="h-11 border-b hover:bg-blue-50">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-3 py-2 align-top">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
            {!rows.length && <tr><td colSpan={columns.length} className="px-3 py-10 text-center font-bold text-ink/55">No exceptions found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-2 text-sm font-bold disabled:opacity-40">Previous</button>
        <div className="text-sm font-bold">Page {page} of {pages}</div>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-2 text-sm font-bold disabled:opacity-40">Next</button>
      </div>
      {selectedCount > 0 && <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-3 bg-white px-4 py-3 shadow-lg"><span className="font-bold">{selectedCount} selected</span><button onClick={bulkResolve} className="rounded bg-moss px-3 py-2 text-sm font-bold text-white">Mark as Resolved</button><button onClick={() => setSelected({})} className="text-sm font-bold text-ink/70">Clear selection</button></div>}
      {drawer && <Drawer item={drawer} onClose={() => setDrawer(null)} onSave={save} />}
    </section>
  );
}

function Select({ value, onChange, options, label }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded border border-ink/15 bg-white px-3 text-sm font-semibold"><option value="">{label}</option>{options.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function Drawer({ item, onClose, onSave }) {
  const [remarks, setRemarks] = useState(item.ca_remarks || "");
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black">Exception Detail</h2><button onClick={onClose}><X size={20} /></button></div>
      <div className="mt-4 space-y-3 text-sm">
        <Detail label="Voucher" value={`${item.voucher_type || ""} ${item.voucher_number || ""}`} />
        <Detail label="Date" value={formatDate(item.voucher_date)} />
        <Detail label="Party" value={item.party_name} />
        <Detail label="Ledger" value={item.ledger_name} />
        <Detail label="Amount" value={formatInr(item.amount)} />
        <Detail label="Review Area" value={item.exception_type} />
        <Detail label="Potential Form 3CD Impact" value={item.form_3cd_clause} />
        <Detail label="Explanation" value={item.exception_description} />
        <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} className="h-28 w-full rounded border border-ink/15 p-2 text-sm focus:ring-2 focus:ring-blue-300" placeholder="CA remarks" />
        <div className="flex gap-2">
          <button onClick={() => onSave(item, { status: "Resolved", ca_remarks: remarks })} className="rounded bg-moss px-3 py-2 text-sm font-bold text-white">Mark Resolved</button>
          <button onClick={() => onSave(item, { ca_remarks: remarks })} className="rounded border border-ink/15 px-3 py-2 text-sm font-bold">Save Remarks</button>
        </div>
      </div>
    </aside>
  );
}

function Detail({ label, value }) {
  return <div><div className="text-xs font-black uppercase text-ink/45">{label}</div><div className="mt-1 font-semibold text-ink/80">{value || "-"}</div></div>;
}

function Tag({ value }) {
  return <span className="rounded border border-teal/20 bg-teal/10 px-2 py-1 text-xs font-bold text-teal">{value}</span>;
}

function Risk({ value }) {
  const cls = value === "High" ? "border-red-200 bg-red-50 text-red-700" : value === "Medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-green-200 bg-green-50 text-green-700";
  return <span className={`rounded border px-2 py-1 text-xs font-black ${cls}`}>{value}</span>;
}

function truncate(value) {
  const text = value || "";
  return text.length > 22 ? `${text.slice(0, 22)}...` : text;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
}

function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
