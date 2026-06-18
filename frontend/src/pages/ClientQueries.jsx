import { Download, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

export function ClientQueries() {
  const { clientId } = useParams();
  const [status, setStatus] = useState("Pending");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await api.get(`/api/audit/${clientId}/queries`, { params: { status, page, page_size: 100 } });
    setRows(data.queries || []);
    setTotal(data.total || 0);
  };

  useEffect(() => { load(); }, [clientId, status, page]);

  const generate = async () => {
    const { data } = await api.post(`/api/audit/${clientId}/queries/generate`);
    setMessage(`${data.created} query${data.created === 1 ? "" : "ies"} generated from pending exceptions.`);
    await load();
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-end md:justify-between">
        <PageTitle title="Client Queries" subtitle="Suggested client-facing queries generated from canonical exceptions." />
        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded border border-ink/15 bg-white px-3 text-sm font-bold">
            {["Pending", "Under Review", "Resolved", "Not Applicable", ""].map((item) => <option key={item} value={item}>{item || "All Statuses"}</option>)}
          </select>
          <button onClick={generate} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white"><RefreshCcw size={16} />Generate Queries</button>
          <a href={`/api/reports/${clientId}/query-letter?status=${encodeURIComponent(status || "")}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white"><Download size={16} />Download Query Letter</a>
        </div>
      </div>
      {message && <div className="rounded border border-teal/20 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">{message}</div>}
      <div className="overflow-x-auto rounded border border-ink/10 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {["Query No.", "Status", "Category", "Vendor", "Amount", "Documents Required", "Query", "Client Response", "CA Note"].map((head) => <th key={head} className="px-3 py-2 text-left text-xs font-black">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b align-top hover:bg-blue-50">
                <td className="px-3 py-2 font-black">{row.query_number}</td>
                <td className="px-3 py-2"><Status value={row.status} /></td>
                <td className="px-3 py-2 font-semibold">{row.category}</td>
                <td className="px-3 py-2">{row.vendor}</td>
                <td className="px-3 py-2 font-bold">{formatInr(row.amount)}</td>
                <td className="max-w-xs px-3 py-2">{row.documents_required}</td>
                <td className="max-w-md px-3 py-2">{row.suggested_wording}</td>
                <td className="px-3 py-2">{row.client_response || ""}</td>
                <td className="px-3 py-2">{row.ca_note || ""}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={9} className="px-3 py-10 text-center font-bold text-ink/55">No client queries found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded border px-3 py-2 text-sm font-bold disabled:opacity-40">Previous</button>
        <div className="text-sm font-bold">Page {page} of {Math.max(1, Math.ceil(total / 100))} | {total.toLocaleString("en-IN")} queries</div>
        <button disabled={page >= Math.max(1, Math.ceil(total / 100))} onClick={() => setPage((current) => current + 1)} className="rounded border px-3 py-2 text-sm font-bold disabled:opacity-40">Next</button>
      </div>
    </section>
  );
}

function Status({ value }) {
  const cls = value === "Resolved" ? "border-green-200 bg-green-50 text-green-700" : "border-yellow-200 bg-yellow-50 text-yellow-800";
  return <span className={`rounded border px-2 py-1 text-xs font-black ${cls}`}>{value}</span>;
}

function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
