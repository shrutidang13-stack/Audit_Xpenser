import { useCallback, useEffect, useState } from "react";
import {
  createTaxAuditReport,
  fetchReports,
  fetchTaxAuditReport,
  fetchTaxAuditReports,
} from "./services/api";
import AuditEvidencePackButton from "./components/AuditEvidencePackButton";
import ComplianceExplanationPanel from "./components/ComplianceExplanationPanel";

export default function TaxAuditReportGenerator({ displayResetVersion = 0 }) {
  const [msmeReports, setMsmeReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [selectedMsmeReportId, setSelectedMsmeReportId] = useState("");
  const [formType, setFormType] = useState("3CB");
  const [assessmentYear, setAssessmentYear] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");

  const load = useCallback(async () => {
    if (displayResetVersion > 0) return;
    const [msme, tax] = await Promise.all([fetchReports(), fetchTaxAuditReports()]);
    setMsmeReports(msme.reports || []);
    if (!selectedMsmeReportId && msme.reports?.[0]) setSelectedMsmeReportId(msme.reports[0].id);
    if (!activeReport && tax.reports?.[0]?.id) {
      const response = await fetchTaxAuditReport(tax.reports[0].id);
      setActiveReport(response.report);
    }
  }, [activeReport, displayResetVersion, selectedMsmeReportId]);

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [load]);

  useEffect(() => {
    if (displayResetVersion === 0) return;
    setMsmeReports([]);
    setActiveReport(null);
    setSelectedMsmeReportId("");
    setFormType("3CB");
    setAssessmentYear("");
    setMessage("Display cleared. Create a fresh tax audit draft when ready.");
    setLoading("");
  }, [displayResetVersion]);

  const createReport = async () => {
    if (!selectedMsmeReportId) return;
    setLoading("create");
    setMessage("");
    try {
      const response = await createTaxAuditReport({ msmeReportId: selectedMsmeReportId, formType, assessmentYear });
      setActiveReport(response.report);
      setMessage("Tax audit draft created for CA review.");
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg p-5 shadow">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tax Audit Report Generator</h2>
            <p className="text-sm text-gray-500 mt-1">CA-reviewable Form 3CA/3CB + 3CD draft preparation with schema validation and MSME annexures.</p>
          </div>
        </div>
        <div className="mt-4 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-3 text-sm font-semibold">
          Draft for CA review only. Final filing, upload, validation and DSC must happen through the official Income Tax utility/portal.
        </div>
        {message && <div className="mt-4 border border-blue-200 bg-blue-50 text-blue-800 rounded-lg p-3 text-sm font-semibold">{message}</div>}
      </section>

      <section className="bg-white rounded-lg p-5 shadow">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Create Draft</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <select value={selectedMsmeReportId} onChange={(event) => setSelectedMsmeReportId(event.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Select MSME report</option>
            {msmeReports.map((report) => (
              <option key={report.id} value={report.id}>{report.fiscalYear} | {report.createdAt}</option>
            ))}
          </select>
          <select value={formType} onChange={(event) => setFormType(event.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="3CB">Form 3CB + 3CD</option>
            <option value="3CA">Form 3CA + 3CD</option>
          </select>
          <input value={assessmentYear} onChange={(event) => setAssessmentYear(event.target.value)} placeholder="Assessment year e.g. 2026-27" className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={createReport} disabled={!selectedMsmeReportId || loading === "create"} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading === "create" ? "Creating..." : "Create Tax Audit Draft"}
          </button>
        </div>
        {selectedMsmeReportId && (
          <div className="mt-4 flex flex-wrap gap-2">
            <AuditEvidencePackButton reportId={selectedMsmeReportId} className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" />
          </div>
        )}
      </section>

      {activeReport && (
        <>
          <section className="grid lg:grid-cols-2 gap-5">
            <AnnexurePreview
              title="Clause 22 MSME Computation"
              rows={activeReport.annexures?.find((item) => item.annexureType === "clause22")?.payload || []}
              amountKey="clause22iiiBOutstandingDisallowance"
              columns={[
                ["supplier", "Supplier"],
                ["totalPurchasesFromMicroSmall", "Purchases"],
                ["amountPaidDuringYear", "Paid"],
                ["clause22iiiBOutstandingDisallowance", "Clause 22(iii)(b)"],
                ["remarks", "Remarks"],
              ]}
            />
            <AnnexurePreview
              title="Clause 26 43B(h) Disallowance"
              rows={activeReport.annexures?.find((item) => item.annexureType === "clause26")?.payload || []}
              amountKey="principalDisallowance"
              columns={[
                ["supplier", "Supplier"],
                ["principalDisallowance", "Disallowance"],
                ["sourceClause", "Source"],
                ["allowedInYear", "Allowed in year"],
                ["remarks", "Remarks"],
              ]}
            />
          </section>
          <ComplianceExplanationPanel reportId={activeReport.sourceMsmeReportId || selectedMsmeReportId} />
        </>
      )}
    </div>
  );
}

function AnnexurePreview({ title, rows, amountKey, columns }) {
  const total = rows.reduce((sum, row) => sum + Number(row[amountKey] || row.disallowanceAmount || row.amountInadmissible || 0), 0);

  return (
    <section className="bg-white rounded-lg p-5 shadow">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <span className="text-sm font-bold text-gray-700">Rs {total.toLocaleString("en-IN")}</span>
      </div>
      <div className="overflow-auto max-h-96 border border-gray-100 rounded-lg">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              {columns.map(([, label]) => (
                <th key={label} className="text-left p-2 text-gray-600 whitespace-nowrap">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length && (
              <tr>
                <td colSpan={columns.length} className="p-3 text-gray-500">No rows.</td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={`${row.supplier || row.vendorName || "row"}-${row.invoiceNumber || index}`} className="border-t border-gray-100 align-top">
                {columns.map(([key]) => (
                  <td key={key} className="p-2 min-w-24">{formatCell(row[key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatCell(value) {
  if (typeof value === "number") return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return String(value ?? "-");
}
