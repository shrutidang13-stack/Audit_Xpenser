import { useMemo, useState } from "react";

const FILTERS = [
  ["all", "All"],
  ["auto", "Auto-filled"],
  ["manual", "Manual"],
  ["needs", "Needs review"],
  ["blocking", "Blocking"],
];

export default function TaxAuditClauseReviewTable({ clauses = [], validation = [], onSaveClause }) {
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState({});
  const blockingByClause = useMemo(() => {
    const map = new Map();
    validation.filter((item) => item.severity === "error" && item.clauseNo).forEach((item) => map.set(String(item.clauseNo), true));
    return map;
  }, [validation]);
  const rows = clauses.filter((clause) => {
    if (filter === "auto") return clause.sourceType === "auto";
    if (filter === "manual") return clause.sourceType === "manual" || clause.sourceType === "hybrid";
    if (filter === "needs") return clause.reviewStatus === "requires_review";
    if (filter === "blocking") return blockingByClause.has(String(clause.clauseNo));
    return true;
  });
  const draftFor = (clause) => editing[clause.clauseNo] || {};
  const updateDraft = (clauseNo, patch) => setEditing((prev) => ({ ...prev, [clauseNo]: { ...(prev[clauseNo] || {}), ...patch } }));
  const save = async (clause) => {
    await onSaveClause(clause.clauseNo, draftFor(clause));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[clause.clauseNo];
      return next;
    });
  };
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-bold text-gray-800">Form 3CD Clause Review</h3>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 text-xs font-semibold rounded border ${filter === key ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-700 border-gray-200"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto max-h-[36rem] border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="p-2 text-left">Clause</th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Source</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-left">Review</th>
              <th className="p-2 text-left">Remarks</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((clause) => {
              const draft = draftFor(clause);
              return (
                <tr key={clause.id || clause.clauseNo} className={blockingByClause.has(String(clause.clauseNo)) ? "border-t bg-red-50" : "border-t"}>
                  <td className="p-2 font-bold">{clause.clauseNo}</td>
                  <td className="p-2 min-w-56">{clause.title}</td>
                  <td className="p-2">{clause.sourceType}</td>
                  <td className="p-2">
                    <select value={draft.status ?? clause.status} onChange={(event) => updateDraft(clause.clauseNo, { status: event.target.value })} className="border rounded px-2 py-1 bg-white">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="na">NA</option>
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    <input value={draft.amount ?? clause.amount ?? 0} onChange={(event) => updateDraft(clause.clauseNo, { amount: event.target.value })} className="w-24 border rounded px-2 py-1 text-right" />
                  </td>
                  <td className="p-2">
                    <select value={draft.reviewStatus ?? clause.reviewStatus} onChange={(event) => updateDraft(clause.clauseNo, { reviewStatus: event.target.value })} className="border rounded px-2 py-1 bg-white">
                      <option value="requires_review">Requires review</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="auto_filled">Auto-filled</option>
                    </select>
                  </td>
                  <td className="p-2 min-w-72">
                    <input value={draft.remarks ?? clause.remarks ?? ""} onChange={(event) => updateDraft(clause.clauseNo, { remarks: event.target.value })} className="w-full border rounded px-2 py-1" />
                  </td>
                  <td className="p-2">
                    <button onClick={() => save(clause)} className="bg-gray-900 text-white px-3 py-1 rounded text-xs font-semibold">Save</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
