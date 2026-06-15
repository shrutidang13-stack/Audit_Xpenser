import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, Search } from "lucide-react";
import React from "react";
import { useMemo, useState } from "react";

export function DataTable({ columns, data, searchPlaceholder = "Search records" }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const tableColumns = useMemo(() => columns.map((col) => ({ accessorKey: col.key, header: col.label, cell: (info) => formatValue(info.getValue()) })), [columns]);
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div className="space-y-3">
      <label className="flex max-w-sm items-center gap-2 rounded border border-ink/15 bg-white px-3 py-2">
        <Search size={16} />
        <input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder={searchPlaceholder} className="w-full bg-transparent text-sm outline-none" />
      </label>
      <div className="overflow-x-auto rounded border border-ink/10 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ink text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-3 py-3 font-semibold">
                    <button className="flex items-center gap-2" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown size={14} />
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-ink/10">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="max-w-md px-3 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!data.length && (
              <tr>
                <td className="px-3 py-8 text-sm text-ink/60" colSpan={columns.length}>No records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatValue(value) {
  if (React.isValidElement(value)) return value;
  if (value === null || value === undefined || value === "") return <span className="text-ink/45">Not available</span>;
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
