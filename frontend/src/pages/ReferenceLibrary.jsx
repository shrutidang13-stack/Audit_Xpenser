import { Eye, RefreshCcw, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const categories = [
  "Income Tax Act",
  "Income Tax Rules",
  "GST Act",
  "GST Rules",
  "TDS / TCS",
  "Form 3CD",
  "Audit Guidance",
  "Circular / Notification",
  "Other"
];

export function ReferenceLibrary() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [form, setForm] = useState({ title: "", category: "Income Tax Rules", effective_date: "", version_label: "", source_type: "Uploaded Reference", notes: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedChunks = useMemo(() => selected?.chunks || [], [selected]);

  const loadDocuments = async () => {
    setError("");
    try {
      const { data } = await api.get("/api/reference-library");
      setDocuments(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Reference documents could not be loaded");
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const uploadDocument = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Select a PDF, DOCX, or XLSX reference document.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("Uploading and indexing reference document...");
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(form)) body.append(key, value || "");
      body.append("file", file);
      const { data } = await api.post("/api/reference-library/upload", body);
      setMessage(`${data.title} uploaded. Parsing status: ${data.parsing_status}.`);
      setFile(null);
      setForm({ title: "", category: "Income Tax Rules", effective_date: "", version_label: "", source_type: "Uploaded Reference", notes: "" });
      await loadDocuments();
      await viewDocument(data.document_id);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Reference document could not be uploaded");
    } finally {
      setBusy(false);
    }
  };

  const viewDocument = async (documentId) => {
    setError("");
    try {
      const { data } = await api.get(`/api/reference-library/${documentId}`);
      setSelected(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Reference document could not be opened");
    }
  };

  const reparseDocument = async (documentId) => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/reference-library/${documentId}/parse`);
      setMessage("Reference document parsing refreshed.");
      await loadDocuments();
      await viewDocument(documentId);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Reference document could not be re-parsed");
    } finally {
      setBusy(false);
    }
  };

  const deleteDocument = async (documentId) => {
    setBusy(true);
    setError("");
    try {
      await api.delete(`/api/reference-library/${documentId}`);
      if (selected?.id === documentId) setSelected(null);
      setMessage("Reference document removed from the library.");
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Reference document could not be removed");
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get("/api/reference-library/search", { params: { q: searchQuery.trim() } });
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Search could not be completed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageTitle title="Rules" subtitle="Upload, view, and search statutory reference documents independent of client processing data." />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={uploadDocument} className="rounded border border-ink/10 bg-white p-4">
          <h2 className="font-black">Upload Reference Document</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Document Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Income-tax Rules, 2026" />
            <label className="space-y-1 text-sm font-bold text-ink/70">
              <span>Category</span>
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-10 w-full rounded border border-ink/15 bg-white px-3 text-sm outline-none">
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <Field label="Effective Date" type="date" value={form.effective_date} onChange={(value) => setForm({ ...form, effective_date: value })} />
            <Field label="Version / Notification Date" value={form.version_label} onChange={(value) => setForm({ ...form, version_label: value })} placeholder="1 April 2026" />
            <Field label="Source Type" value={form.source_type} onChange={(value) => setForm({ ...form, source_type: value })} />
            <label className="space-y-1 text-sm font-bold text-ink/70">
              <span>File</span>
              <input type="file" accept=".pdf,.docx,.xlsx" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block h-10 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="mt-3 block space-y-1 text-sm font-bold text-ink/70">
            <span>Notes</span>
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-20 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm outline-none" />
          </label>
          <button disabled={busy} className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white disabled:opacity-60"><Upload size={16} />Upload Reference Document</button>
        </form>

        <div className="rounded border border-ink/10 bg-white p-4">
          <form onSubmit={runSearch} className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-10 flex-1 items-center gap-2 rounded border border-ink/15 bg-white px-3">
              <Search size={16} />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search TDS, expenditure, depreciation, Form 3CD..." className="w-full bg-transparent text-sm outline-none" />
            </label>
            <button disabled={busy} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white disabled:opacity-60"><Search size={16} />Search</button>
          </form>
          <div className="mt-4 space-y-2">
            {searchResults.map((item, index) => (
              <button key={`${item.document_id}-${index}`} onClick={() => viewDocument(item.document_id)} className="block w-full rounded border border-ink/10 bg-ink/5 px-3 py-3 text-left transition hover:border-teal">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-teal">
                  <span>{item.document_title}</span>
                  <span>Page {item.page_number || "NA"}</span>
                  {item.rule_number && <span>Rule {item.rule_number}</span>}
                  {item.section_number && <span>Section {item.section_number}</span>}
                </div>
                <div className="mt-1 text-sm font-bold text-ink">{item.heading || "Suggested statutory reference"}</div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink/65">{item.matching_text_snippet}</p>
              </button>
            ))}
            {!searchResults.length && <div className="rounded bg-ink/5 px-3 py-6 text-sm font-semibold text-ink/55">Search results will appear here.</div>}
          </div>
        </div>
      </div>

      {message && <div className="rounded border border-teal/20 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">{message}</div>}
      {error && <div className="rounded border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">{error}</div>}

      <DataTable columns={[
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
        { key: "effective_date", label: "Effective Date" },
        { key: "version_label", label: "Version" },
        { key: "file_type", label: "Type" },
        { key: "parsing_status", label: "Parsing Status" },
        { key: "created_at", label: "Uploaded Date" },
        { key: "actions", label: "Actions" }
      ]} data={documents.map((document) => ({
        ...document,
        created_at: formatDate(document.created_at),
        effective_date: document.effective_date || "Not available",
        actions: (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => viewDocument(document.id)} className="focus-ring inline-flex h-8 items-center gap-1 rounded bg-ink px-2 text-xs font-bold text-white"><Eye size={14} />View</button>
            <button onClick={() => reparseDocument(document.id)} disabled={busy} className="focus-ring inline-flex h-8 items-center gap-1 rounded bg-moss px-2 text-xs font-bold text-white disabled:opacity-60"><RefreshCcw size={14} />Re-parse</button>
            <button onClick={() => deleteDocument(document.id)} disabled={busy} className="focus-ring inline-flex h-8 items-center gap-1 rounded bg-coral px-2 text-xs font-bold text-white disabled:opacity-60"><Trash2 size={14} />Delete</button>
          </div>
        )
      }))} searchPlaceholder="Search uploaded reference documents" />

      {selected && (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded border border-ink/10 bg-white p-4">
            <h2 className="font-black">{selected.title}</h2>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <Detail label="Category" value={selected.category} />
              <Detail label="Effective Date" value={selected.effective_date} />
              <Detail label="Version" value={selected.version_label} />
              <Detail label="Parsing Status" value={selected.parsing_status} />
              <Detail label="Indexed Status" value={selected.indexed_status} />
              <Detail label="Chunks" value={selectedChunks.length} />
            </div>
            {selected.file_type === ".pdf" ? (
              <iframe title={selected.title} src={`/api/reference-library/${selected.id}/view`} className="mt-4 h-[640px] w-full rounded border border-ink/10" />
            ) : (
              <a href={`/api/reference-library/${selected.id}/view`} className="focus-ring mt-4 inline-flex h-10 items-center rounded bg-ink px-3 text-sm font-bold text-white">Open Original Document</a>
            )}
          </div>

          <div className="rounded border border-ink/10 bg-white p-4">
            <h2 className="font-black">Parsed Text</h2>
            <div className="mt-3 max-h-[740px] space-y-3 overflow-auto pr-2">
              {selectedChunks.map((chunk) => (
                <div key={chunk.id} className="rounded border border-ink/10 bg-ink/5 px-3 py-3">
                  <div className="flex flex-wrap gap-2 text-xs font-black uppercase text-teal">
                    <span>Page {chunk.page_number || "NA"}</span>
                    {chunk.rule_number && <span>Rule {chunk.rule_number}</span>}
                    {chunk.section_number && <span>Section {chunk.section_number}</span>}
                  </div>
                  <div className="mt-1 text-sm font-black text-ink">{chunk.heading || "Suggested statutory reference"}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/70">{chunk.content_text}</p>
                </div>
              ))}
              {!selectedChunks.length && <div className="rounded bg-ink/5 px-3 py-8 text-sm font-semibold text-ink/60">Parsed text is not available. Parsing Review Required may apply.</div>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="space-y-1 text-sm font-bold text-ink/70">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded border border-ink/15 bg-white px-3 text-sm outline-none" />
    </label>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded bg-ink/5 px-3 py-2">
      <div className="text-xs font-black uppercase text-ink/45">{label}</div>
      <div className="mt-1 font-semibold text-ink">{value || "Not available"}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}
