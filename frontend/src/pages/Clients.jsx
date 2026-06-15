import { Plus, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: "", pan: "", gstin: "", financial_year: "2025-26" });
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await api.get("/api/clients");
    setClients(data);
  };

  useEffect(() => {
    load().catch(() => setMessage("Could not load clients. Check backend status."));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("Creating client...");
    const { data } = await api.post("/api/clients", form);
    setForm({ name: "", pan: "", gstin: "", financial_year: "2025-26" });
    setMessage(`${data.name} is ready for upload.`);
    await load();
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-ink/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-normal">AuditXpenser</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">CA-facing expense verification, bill matching and tax audit risk review from uploaded client records.</p>
        </div>
        <button onClick={load} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-semibold text-white"><RefreshCcw size={16} />Refresh</button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded border border-ink/10 bg-white p-4">
          <h2 className="text-lg font-bold">Create Client</h2>
          {["name", "pan", "gstin", "financial_year"].map((field) => (
            <label key={field} className="mt-4 block text-sm font-semibold capitalize text-ink/70">
              {field.replace("_", " ")}
              <input required={field === "name"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="focus-ring mt-1 h-10 w-full rounded border border-ink/15 px-3 text-ink" />
            </label>
          ))}
          <button className="focus-ring mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white"><Plus size={16} />Create</button>
          {message && <p className="mt-3 text-sm font-semibold text-teal">{message}</p>}
        </form>

        <div className="grid gap-3 md:grid-cols-2">
          {clients.map((client) => (
            <Link key={client.id} to={`/client/${client.id}/upload`} className="rounded border border-ink/10 bg-white p-4 transition hover:border-teal">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black">{client.name}</h3>
                  <p className="mt-1 text-sm text-ink/60">FY {client.financial_year}</p>
                </div>
                <span className="rounded bg-teal/15 px-2 py-1 text-xs font-bold text-teal">Select</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-ink/65">
                <span>PAN: {client.pan || "Not available"}</span>
                <span>GSTIN: {client.gstin || "Not available"}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
