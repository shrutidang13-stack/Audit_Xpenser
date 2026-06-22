import { CheckCheck, FileCheck2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { selectLatestUploadFilesByCategory } from "../lib/uploadSelection";
import { PageTitle } from "./UploadCentre";

export function Mapping() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [mappingsByFile, setMappingsByFile] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/upload/${clientId}/files`).then(async ({ data }) => {
      const activeFiles = selectLatestUploadFilesByCategory(data);
      const mappingFiles = activeFiles.filter(isMappingCandidate);
      if (!cancelled) setFiles(activeFiles);
      const loaded = await mapWithConcurrency(mappingFiles, 4, async (file) => (
        api.get(`/api/mapping/${file.id}/preview`)
          .then((response) => response.data)
          .catch(() => ({ file, mappings: [] }))
      ));
      if (cancelled) return;
      const nextMappings = {};
      for (const item of loaded) nextMappings[item.file.id] = item.mappings || [];
      setMappingsByFile(nextMappings);
    }).catch((error) => {
      if (!cancelled) setMessage(`Mapping files could not be loaded: ${error.message || "Unknown error"}`);
    });
    return () => { cancelled = true; };
  }, [clientId]);

  const confirmAllSuggested = async () => {
    const mappingFiles = files.filter(isMappingCandidate);
    if (!mappingFiles.length) return;
    setBusy(true);
    setProcessingResult(null);
    setMessage(`Confirming mappings for ${mappingFiles.length} structured file${mappingFiles.length === 1 ? "" : "s"}...`);
    try {
      let latest = null;
      const fileIds = files.map((item) => item.id);
      for (const [index, file] of mappingFiles.entries()) {
        const { data } = await api.post(`/api/mapping/${file.id}/confirm`, {
          mappings: cleanMappings(mappingsByFile[file.id] || []),
          file_ids: fileIds,
          generate_processing: index === mappingFiles.length - 1
        });
        latest = data;
      }
      setProcessingResult(latest);
      setMessage(`Mappings saved and Processing schedule generated. Total expenses: ${formatInr(latest?.total_expenses)}.`);
      navigate(`/client/${clientId}/processing`);
    } catch (error) {
      const detail = error.response?.data?.detail || error.message || "Processing schedule could not be generated";
      setMessage(`Mapping could not complete: ${detail}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageTitle title="Data Mapping Status" subtitle="Uploaded files are auto-mapped for the expense audit pipeline." />
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={confirmAllSuggested} disabled={!files.some(isMappingCandidate) || busy} className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white disabled:opacity-50"><CheckCheck size={16} />Confirm All Mappings</button>
      </div>

      <div className="rounded border border-teal/20 bg-white px-4 py-3 text-sm font-semibold text-ink/70">
        {files.length} latest uploaded file{files.length === 1 ? "" : "s"} ready. {files.filter(isMappingCandidate).length} structured file{files.filter(isMappingCandidate).length === 1 ? "" : "s"} require mapping; bills and supporting documents are processed without column mapping.
      </div>

      {message && <div className="rounded border border-teal/20 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">{message}</div>}

      {processingResult && (
        <div className="rounded border border-moss/20 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-black">Processing Schedule Ready</h2>
              <p className="mt-1 text-sm font-semibold text-ink/60">Structured expense data is available for audit review.</p>
            </div>
            <button onClick={() => navigate(`/client/${clientId}/processing`)} className="focus-ring inline-flex h-10 items-center justify-center rounded bg-moss px-3 text-sm font-bold text-white">Open Processing</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Metric label="Direct Expenses" value={formatInr(processingResult.direct_expense_total)} />
            <Metric label="Indirect Expenses" value={formatInr(processingResult.indirect_expense_total)} />
            <Metric label="CA Review Required" value={processingResult.ca_review_required_count || 0} />
            <Metric label="Total Expenses" value={formatInr(processingResult.total_expenses)} />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded border border-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_140px_110px_120px] gap-3 border-b border-ink/10 bg-ink/5 px-4 py-3 text-xs font-black uppercase text-ink/60">
          <span>File</span>
          <span>Category</span>
          <span>Records</span>
          <span>Status</span>
        </div>
        {files.map((file) => {
          const mappings = mappingsByFile[file.id] || [];
          const mappingRequired = isMappingCandidate(file);
          return (
            <div key={file.id} className="grid grid-cols-[1fr_140px_110px_120px] gap-3 border-b border-ink/10 px-4 py-3 text-sm last:border-b-0">
              <div className="flex min-w-0 items-center gap-2 font-bold">
                <FileCheck2 size={16} className="shrink-0 text-moss" />
                <span className="truncate">{file.filename}</span>
              </div>
              <span className="font-semibold text-ink/65">{labelForCategory(file.category)}</span>
              <span className="font-semibold text-ink/65">{file.records_extracted}</span>
              <span className={`font-black ${mappings.length || !mappingRequired ? "text-moss" : "text-amber"}`}>{mappingRequired ? (mappings.length ? "Auto-mapped" : "Stored") : "Not required"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function cleanMappings(mappings) {
  return mappings.map((mapping) => ({
    source_column: mapping.source_column,
    target_field: mapping.target_field || ""
  }));
}

const MAPPABLE_CATEGORIES = new Set([
  "expense-ledger",
  "vendor-master",
  "tds-data",
  "gst-data",
  "bank-data",
  "trial-balance"
]);

function isMappingCandidate(file) {
  return MAPPABLE_CATEGORIES.has(file?.category);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function Metric({ label, value }) {
  return (
    <div className="rounded border border-ink/10 bg-ink/5 px-3 py-3">
      <div className="text-xs font-black uppercase text-ink/50">{label}</div>
      <div className="mt-1 text-xl font-black text-ink">{value}</div>
    </div>
  );
}

function labelForCategory(category) {
  const labels = {
    "expense-ledger": "Day Book / Tally",
    "trial-balance": "Tally Book",
    bills: "Bills",
    "tds-data": "TDS Challan",
    "gst-data": "GSTR-2B",
    "supporting-documents": "Support"
  };
  return labels[category] || category;
}

function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
