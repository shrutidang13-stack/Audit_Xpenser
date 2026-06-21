import { useState } from "react";
import { auditEvidencePackUrl, downloadUrl } from "../services/api";

export default function AuditEvidencePackButton({ reportId, className = "" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!reportId) return null;

  const download = async () => {
    setLoading(true);
    setError("");
    try {
      await downloadUrl(auditEvidencePackUrl(reportId), `MSME_Audit_Evidence_Pack_${reportId}.zip`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span>
      <button onClick={download} disabled={loading} className={className || "bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"}>
        {loading ? "Preparing..." : "Download Audit Evidence Pack"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600 font-semibold">{error}</span>}
    </span>
  );
}
