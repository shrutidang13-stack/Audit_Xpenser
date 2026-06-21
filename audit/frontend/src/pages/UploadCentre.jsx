import { RefreshCcw, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { DataTable } from "../components/DataTable";
import { api } from "../lib/api";

const categories = [
  ["trial-balance", "Tally Book / Trial Balance"],
  ["bills", "Bills / Invoices / Vouchers"],
  ["gst-data", "GST Data / GSTR-2B"],
  ["fixed-assets-opening", "Opening Fixed Assets"],
  ["supporting-documents", "Supporting Documents"]
];
const MAX_FILES_PER_BATCH = 500;

export function UploadCentre() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const initialClientId = sanitizeClientId(clientId) || "";
  const [activeClientId, setActiveClientId] = useState(initialClientId);
  const [activeClientName, setActiveClientName] = useState(window.localStorage.getItem("auditxpenser.activeClientName") || "");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const load = async (targetClientId = activeClientId) => {
    if (!targetClientId) {
      setFiles([]);
      return;
    }
    const { data } = await api.get(`/api/upload/${targetClientId}/files`);
    setFiles(data);
  };
  useEffect(() => {
    const routeClientId = sanitizeClientId(clientId);
    if (routeClientId && routeClientId !== activeClientId) {
      setActiveClientId(routeClientId);
      window.localStorage.setItem("auditxpenser.activeClientId", routeClientId);
    }
  }, [clientId, activeClientId]);
  useEffect(() => {
    if (activeClientId) return;
    api.get("/api/clients/default").then(({ data }) => {
      const seededClientId = String(data.id);
      setActiveClientId(seededClientId);
      setActiveClientName(data.name);
      window.localStorage.setItem("auditxpenser.activeClientId", seededClientId);
      window.localStorage.setItem("auditxpenser.activeClientName", data.name);
      navigate(`/client/${seededClientId}/upload`, { replace: true });
    }).catch(() => {
      setMessage("Default client workspace could not be loaded. Please check backend status.");
    });
  }, [activeClientId, navigate]);
  useEffect(() => {
    if (!activeClientId) return;
    api.get(`/api/clients/${activeClientId}`).then(({ data }) => {
      setActiveClientName(data.name);
      window.localStorage.setItem("auditxpenser.activeClientName", data.name);
    }).catch(() => {});
  }, [activeClientId]);
  useEffect(() => { load(); }, [activeClientId]);

  const clearDisplay = () => {
    setFiles([]);
    setMessage("");
    window.localStorage.removeItem("auditxpenser.latestUploadFileIds");
    window.localStorage.removeItem("auditxpenser.latestUploadSessionId");
    window.localStorage.removeItem("auditxpenser.latestUploadCategory");
    window.localStorage.removeItem("auditxpenser.latestUploadClientId");
  };

  const upload = async (category, selectedFiles) => {
    const selected = Array.from(selectedFiles || []);
    const batch = selected.slice(0, MAX_FILES_PER_BATCH);
    if (!batch.length) return;
    if (selected.length > MAX_FILES_PER_BATCH) {
      setMessage(`Selected ${selected.length} files. Uploading first ${MAX_FILES_PER_BATCH} files in this batch.`);
    }
    let uploadClientId = activeClientId;
    let uploadClientName = activeClientName;
    if (!uploadClientId) {
      setMessage("Loading fixed client workspace...");
      const { data: client } = await api.get("/api/clients/default");
      uploadClientId = String(client.id);
      uploadClientName = client.name;
      setActiveClientId(uploadClientId);
      setActiveClientName(uploadClientName);
      window.localStorage.setItem("auditxpenser.activeClientId", uploadClientId);
      window.localStorage.setItem("auditxpenser.activeClientName", uploadClientName);
      navigate(`/client/${uploadClientId}/upload`, { replace: true });
    }
    const uploadedIds = [];
    const uploadSessionId = makeUploadSessionId();
    for (const [index, file] of batch.entries()) {
      const body = new FormData();
      body.append("file", file);
      setMessage(`Uploading ${index + 1} of ${batch.length}: ${file.name}`);
      const query = `?upload_session_id=${encodeURIComponent(uploadSessionId)}`;
      const { data: uploaded } = await api.post(`/api/upload/${uploadClientId}/${category}${query}`, body);
      uploadedIds.push(uploaded.id);
    }
    window.localStorage.setItem("auditxpenser.latestUploadFileIds", JSON.stringify(uploadedIds));
    window.localStorage.setItem("auditxpenser.latestUploadSessionId", uploadSessionId);
    window.localStorage.setItem("auditxpenser.latestUploadCategory", category);
    window.localStorage.setItem("auditxpenser.latestUploadClientId", uploadClientId);
    if (category === "expense-ledger") {
      const { data: refreshedClient } = await api.get(`/api/clients/${uploadClientId}`);
      uploadClientName = refreshedClient.name;
      setActiveClientName(uploadClientName);
      window.localStorage.setItem("auditxpenser.activeClientName", uploadClientName);
    }
    setMessage(`${batch.length} file${batch.length === 1 ? "" : "s"} uploaded to ${labelForCategory(category)}. Client workspace ${uploadClientName || `Client #${uploadClientId}`} is ready.`);
    await load(uploadClientId);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <PageTitle title="Upload Client Data" compact />
        <button onClick={clearDisplay} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ink px-3 text-sm font-bold text-white">
          <RefreshCcw size={16} />
          Refresh display
        </button>
      </div>
      <div className="rounded border border-teal/20 bg-white px-4 py-3 text-sm font-semibold text-ink/75">
        Active client: {activeClientId ? <span className="text-teal">{activeClientName || `Client #${activeClientId}`}</span> : <span className="text-coral">Loading seeded client workspace</span>}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {categories.map(([key, label]) => (
          <label key={key} className="flex min-h-32 cursor-pointer flex-col justify-between rounded border border-ink/10 bg-white p-4 hover:border-teal">
            <span className="text-sm font-black">{label}</span>
            <span className="mt-2 text-xs leading-5 text-ink/60">xlsx, xls, csv, pdf, jpg, jpeg, png, xml, json</span>
            <span className="mt-1 text-xs font-semibold text-teal">Select up to {MAX_FILES_PER_BATCH} files</span>
            <span className="mt-3 inline-flex h-9 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white"><Upload size={16} />Upload Batch</span>
            <input type="file" multiple className="hidden" onChange={(event) => upload(key, event.target.files)} />
          </label>
        ))}
      </div>
      {message && <div className="rounded border border-teal/20 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">{message}</div>}
      <DataTable columns={[
        { key: "filename", label: "File Name" },
        { key: "category", label: "Category" },
        { key: "upload_session_id", label: "Run" },
        { key: "file_type", label: "Type" },
        { key: "parse_status", label: "Parse Status" },
        { key: "records_extracted", label: "Records" },
        { key: "ca_review_required", label: "CA Review Required" },
        { key: "error_message", label: "Error" }
      ]} data={files.map((f) => ({ ...f, parse_status: <Badge tone={f.ca_review_required ? "medium" : "low"}>{f.parse_status}</Badge> }))} />
    </section>
  );
}

function makeUploadSessionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function labelForCategory(category) {
  return categories.find(([key]) => key === category)?.[1] || "selected category";
}

function sanitizeClientId(value) {
  if (!value || value === "undefined" || value === "null") return "";
  return String(value);
}

export function PageTitle({ title, subtitle, compact = false }) {
  return (
    <header className={compact ? "" : "border-b border-ink/10 pb-4"}>
      <h1 className="text-2xl font-black tracking-normal">{title}</h1>
      {subtitle && <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/70">{subtitle}</p>}
    </header>
  );
}
