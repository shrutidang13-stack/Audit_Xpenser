export default function TaxAuditValidationPanel({ validation = [] }) {
  const errors = validation.filter((item) => item.severity === "error");
  const warnings = validation.filter((item) => item.severity === "warning");
  const tone = errors.length ? "border-red-200 bg-red-50 text-red-800" : warnings.length ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800";
  return (
    <section className={`border ${tone} rounded-lg p-4`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">Validation</h3>
        <span className="text-xs font-semibold">{errors.length} errors | {warnings.length} warnings</span>
      </div>
      {!validation.length && <p className="text-sm mt-2">No validation issues found.</p>}
      {validation.length > 0 && (
        <div className="mt-3 max-h-64 overflow-auto bg-white/70 rounded border border-current/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                <th className="p-2">Severity</th>
                <th className="p-2">Code</th>
                <th className="p-2">Clause</th>
                <th className="p-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {validation.map((item) => (
                <tr key={item.id || `${item.code}-${item.schemaPath}-${item.message}`} className="border-t border-current/10">
                  <td className="p-2 font-semibold">{item.severity}</td>
                  <td className="p-2 font-mono">{item.code}</td>
                  <td className="p-2">{item.clauseNo || "-"}</td>
                  <td className="p-2">{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
