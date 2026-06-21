import { useState } from "react";
import { runPaymentSimulation } from "../services/api";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function PaymentWhatIfSimulator({ report }) {
  const [scenario, setScenario] = useState("pay_all_overdue");
  const [simulationDate, setSimulationDate] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [amountToPay, setAmountToPay] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!report?.id) return null;
  const vendors = [...new Set((report.report || []).map((row) => row.vendorName).filter(Boolean))];

  const simulate = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await runPaymentSimulation({
        reportId: report.id,
        scenario,
        simulationDate: simulationDate || new Date().toISOString().slice(0, 10),
        amountToPay: amountToPay === "" ? undefined : Number(amountToPay),
        selected: vendorName ? [{ vendorName }] : [],
      });
      setResult(response.simulation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-md border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-slate-900">What-if Payment Simulator</h3>
          <p className="text-sm text-slate-500">Simulation Only — this never updates Tally, ledger, or report data.</p>
        </div>
        <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">Simulation Only</span>
      </div>
      {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-md p-3 my-3 text-sm font-semibold">{error}</div>}
      <div className="grid md:grid-cols-5 gap-3 mt-4 items-end">
        <label className="text-sm font-semibold text-slate-700">
          Scenario
          <select value={scenario} onChange={(event) => setScenario(event.target.value)} className="field">
            <option value="pay_all_overdue">Pay all overdue vendors</option>
            <option value="pay_top_10">Pay top 10 high-risk vendors</option>
            <option value="before_31_march">Pay vendors before 31 March</option>
            <option value="selected">Pay selected vendor only</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Simulation date
          <input type="date" value={simulationDate} onChange={(event) => setSimulationDate(event.target.value)} className="field" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Vendor
          <select value={vendorName} onChange={(event) => setVendorName(event.target.value)} className="field">
            <option value="">All applicable</option>
            {vendors.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Optional amount
          <input type="number" value={amountToPay} onChange={(event) => setAmountToPay(event.target.value)} className="field" placeholder="Full if blank" />
        </label>
        <button onClick={simulate} disabled={loading} className="bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50">
          {loading ? "Simulating..." : "Run Simulation"}
        </button>
      </div>
      {result && (
        <div className="mt-4">
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <Metric label="43B(h) reduction" value={money(result.disallowanceReduction)} />
            <Metric label="Outstanding reduction" value={money(result.outstandingExposureReduction)} />
            <Metric label="Interest impact" value={money(result.interestImpact)} />
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-2">Simulated payments</h4>
          <div className="overflow-auto max-h-72 border border-slate-100 rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>{["Vendor", "Invoice", "Payment", "Interest delta", "Disallowance reduction"].map((head) => <th key={head} className="text-left p-2">{head}</th>)}</tr>
              </thead>
              <tbody>
                {(result.simulatedPayments || []).map((row, index) => (
                  <tr key={`${row.vendorName}-${row.invoiceNumber}-${index}`} className="border-t border-slate-100">
                    <td className="p-2">{row.vendorName}</td>
                    <td className="p-2">{row.invoiceNumber || "-"}</td>
                    <td className="p-2">{money(row.simulatedPayment)}</td>
                    <td className="p-2">{money(row.interestDelta)}</td>
                    <td className="p-2">{money(row.disallowanceReduction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-purple-50 text-purple-800 rounded-md p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
}
