import { useState } from "react";
import { explainCompliance } from "../services/api";

const TYPES = [
  ["client", "Explain to Client"],
  ["auditor", "Explain to Auditor"],
  ["tax_impact", "Explain Tax Impact"],
  ["mca_impact", "Explain MCA Filing Impact"],
];

export default function ComplianceExplanationPanel({ reportId }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  if (!reportId) return null;

  const load = async (type) => {
    setLoading(type);
    setError("");
    try {
      const response = await explainCompliance({ reportId, explanationType: type });
      setExplanation(response.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  };

  return (
    <section className="bg-white rounded-md border border-slate-200 p-4">
      <h3 className="text-lg font-bold text-slate-900">AI Compliance Explanation Layer</h3>
      <p className="text-sm text-slate-500 mb-3">Rule-based by default; no external AI API is required.</p>
      {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-md p-3 mb-3 text-sm font-semibold">{error}</div>}
      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES.map(([type, label]) => (
          <button key={type} onClick={() => load(type)} disabled={Boolean(loading)} className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
            {loading === type ? "Generating..." : label}
          </button>
        ))}
      </div>
      {explanation && (
        <div className="bg-slate-50 border border-slate-100 rounded-md p-4 text-sm whitespace-pre-wrap text-slate-700">
          {explanation.outputText}
        </div>
      )}
    </section>
  );
}
