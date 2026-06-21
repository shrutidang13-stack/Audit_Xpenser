import { Download, Mail, RefreshCcw, Send, X } from "lucide-react";
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
  const [mailOpen, setMailOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [mailMessage, setMailMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await api.get(`/api/audit/${clientId}/queries`, { params: { status, page, page_size: 100 } });
    setRows(data.queries || []);
    setTotal(data.total || 0);
  };

  useEffect(() => { load(); }, [clientId, status, page]);

  const generate = async () => {
    const { data } = await api.post(`/api/audit/${clientId}/queries/generate`);
    setMessage(`${data.created} potential client queries loaded from the approved query register.`);
    await load();
  };

  const sendMail = async (event) => {
    event.preventDefault();
    const toEmail = recipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      setMailMessage("Enter a valid recipient email address.");
      return;
    }
    setSending(true);
    setMailMessage("");
    try {
      const { data } = await api.post(`/api/audit/${clientId}/queries/send-email`, {
        to_email: toEmail,
        status
      });
      setMessage(data.message || `Query letter sent successfully to ${toEmail}`);
      setMailOpen(false);
    } catch (error) {
      setMailMessage(error.response?.data?.detail || "Sending failed. Please try again or check SMTP settings.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 md:flex-row md:items-end md:justify-between">
        <PageTitle title="Client Queries" subtitle="Potential client queries from the approved FY 2025-26 query register." />
        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded border border-ink/15 bg-white px-3 text-sm font-bold">
            {["Pending", "Under Review", "Resolved", "Not Applicable", ""].map((item) => <option key={item} value={item}>{item || "All Statuses"}</option>)}
          </select>
          <button onClick={generate} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white"><RefreshCcw size={16} />Reload Query Register</button>
          <button onClick={() => { setRecipient(""); setMailOpen(true); setMailMessage(""); }} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-teal px-3 text-sm font-bold text-white"><Mail size={16} />Send Mail</button>
          <a href={`/api/reports/${clientId}/query-letter?status=${encodeURIComponent(status || "")}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white"><Download size={16} />Download Query Letter</a>
        </div>
      </div>
      {message && <div className="rounded border border-teal/20 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">{message}</div>}
      <div className="overflow-x-auto rounded border border-ink/10 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {["Query ID", "Ledger", "Category", "Severity", "Amount", "Observation", "Documents Required", "Status"].map((head) => <th key={head} className="px-3 py-2 text-left text-xs font-black">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b align-top hover:bg-blue-50">
                <td className="px-3 py-2 font-black">{row.query_number}</td>
                <td className="px-3 py-2 font-semibold">{row.ledger}</td>
                <td className="px-3 py-2 font-semibold">{row.category}</td>
                <td className="px-3 py-2"><Severity value={row.priority} /></td>
                <td className="px-3 py-2 font-bold">{formatInr(row.amount)}</td>
                <td className="max-w-lg px-3 py-2">{row.issue_detected}</td>
                <td className="max-w-xs px-3 py-2">{row.documents_required}</td>
                <td className="px-3 py-2"><Status value={row.status} /></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="px-3 py-10 text-center font-bold text-ink/55">No client queries found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded border px-3 py-2 text-sm font-bold disabled:opacity-40">Previous</button>
        <div className="text-sm font-bold">Page {page} of {Math.max(1, Math.ceil(total / 100))} | {total.toLocaleString("en-IN")} queries</div>
        <button disabled={page >= Math.max(1, Math.ceil(total / 100))} onClick={() => setPage((current) => current + 1)} className="rounded border px-3 py-2 text-sm font-bold disabled:opacity-40">Next</button>
      </div>
      {mailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <form onSubmit={sendMail} className="w-full max-w-lg rounded border border-ink/10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <div>
                <h2 className="text-lg font-black text-ink">Send Query Letter</h2>
                <p className="mt-1 text-sm font-semibold text-ink/60">The current query letter will be attached as a Word file.</p>
              </div>
              <button type="button" onClick={() => setMailOpen(false)} className="rounded p-2 text-ink/60 hover:bg-ink/5" aria-label="Close mail dialog"><X size={18} /></button>
            </div>
            <div className="space-y-3 p-4">
              <label className="block text-sm font-bold text-ink">
                Recipient Email
                <input value={recipient} onChange={(event) => setRecipient(event.target.value)} type="email" required placeholder="Enter recipient email address" className="mt-2 h-11 w-full rounded border border-ink/15 px-3 text-sm font-semibold outline-none focus:border-teal" />
              </label>
              {mailMessage && <div className="rounded border border-amber/25 bg-amber/10 px-3 py-2 text-sm font-semibold text-ink/75">{mailMessage}</div>}
              <div className="rounded border border-ink/10 bg-paper px-3 py-2 text-xs font-semibold leading-5 text-ink/60">
                Auto-send requires SMTP settings in backend/.env. For Gmail, use an app password instead of your normal password.
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-ink/10 px-4 py-3">
              <button type="button" onClick={() => setMailOpen(false)} className="rounded border border-ink/15 px-3 py-2 text-sm font-bold text-ink/70">Cancel</button>
              <button disabled={sending} className="focus-ring inline-flex items-center gap-2 rounded bg-teal px-3 py-2 text-sm font-bold text-white disabled:opacity-60"><Send size={16} />{sending ? "Sending..." : "Send"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function Status({ value }) {
  const cls = value === "Resolved" ? "border-green-200 bg-green-50 text-green-700" : "border-yellow-200 bg-yellow-50 text-yellow-800";
  return <span className={`rounded border px-2 py-1 text-xs font-black ${cls}`}>{value}</span>;
}

function Severity({ value }) {
  const text = String(value || "").toLowerCase();
  const cls = text === "critical" ? "border-red-300 bg-red-100 text-red-800" : text === "high" ? "border-coral/30 bg-coral/10 text-coral" : text === "medium" ? "border-amber/30 bg-amber/10 text-amber-800" : "border-green-200 bg-green-50 text-green-700";
  return <span className={`rounded border px-2 py-1 text-xs font-black uppercase ${cls}`}>{value}</span>;
}

function formatInr(value) {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
}
