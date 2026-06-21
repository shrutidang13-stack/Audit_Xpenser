import { useState } from "react";
import { calculateMSMEInterest } from "./services/api";

const initialForm = {
  vendorName: "",
  principal: "",
  invoiceDate: "",
  acceptanceDate: "",
  asOnDate: new Date().toISOString().slice(0, 10),
  hasWrittenAgreement: "no",
  agreedPaymentDays: "",
  useManualAnnualRate: false,
  annualInterestRate: "",
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MSMEInterestCalculator() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(initialForm);
    setResult(null);
    setError("");
  };

  const calculate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await calculateMSMEInterest({
        ...form,
        hasWrittenAgreement: form.hasWrittenAgreement === "yes",
        ...(form.useManualAnnualRate ? { annualInterestRate: Number(form.annualInterestRate || 0) / 100 } : {}),
      });
      setResult(response.result);
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">MSME Interest Calculator</h2>
        <p className="text-sm text-gray-500 mt-1">Manual delayed-payment interest calculation using the same backend formula as compliance reports.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm font-semibold">{error}</div>}

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <form onSubmit={calculate} className="bg-white rounded-lg p-5 shadow">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Vendor Name" value={form.vendorName} onChange={(value) => update("vendorName", value)} />
            <Field label="Principal / Outstanding" type="number" value={form.principal} onChange={(value) => update("principal", value)} required />
            <Field label="Invoice Date" type="date" value={form.invoiceDate} onChange={(value) => update("invoiceDate", value)} required />
            <Field label="Acceptance Date" type="date" value={form.acceptanceDate} onChange={(value) => update("acceptanceDate", value)} />
            <Field label="Payment / As-on Date" type="date" value={form.asOnDate} onChange={(value) => update("asOnDate", value)} required />
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 mb-1">Written Agreement</span>
              <select value={form.hasWrittenAgreement} onChange={(event) => update("hasWrittenAgreement", event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="no">No - 15 days</option>
                <option value="yes">Yes - cap at 45 days</option>
              </select>
            </label>
            <Field label="Agreed Payment Days" type="number" value={form.agreedPaymentDays} onChange={(value) => update("agreedPaymentDays", value)} />
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={form.useManualAnnualRate} onChange={(event) => update("useManualAnnualRate", event.target.checked)} />
              Manual annual rate
            </label>
            <Field label="Annual Interest Rate (%)" type="number" value={form.annualInterestRate} onChange={(value) => update("annualInterestRate", value)} disabled={!form.useManualAnnualRate} />
          </div>
          {form.useManualAnnualRate && (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              Manual annual rate is a calculator-only override and does not replace official stored RBI Bank Rate history.
            </p>
          )}
          <div className="flex gap-2 mt-5">
            <button type="submit" disabled={loading} className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {loading ? "Calculating..." : "Calculate Interest"}
            </button>
            <button type="button" onClick={reset} className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg text-sm font-semibold">Reset</button>
          </div>
        </form>

        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Result</h3>
          {!result && <p className="text-sm text-gray-500">Enter invoice details to calculate MSME delayed-payment interest.</p>}
          {result && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${result.isDelayed ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                <p className="text-sm font-semibold">{result.isDelayed ? "Delay detected" : "No delay"}</p>
                <p className="text-2xl font-bold">{result.delayDays.toLocaleString("en-IN")} delay days</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ResultMetric label="Days Outstanding" value={result.daysOutstanding} />
                <ResultMetric label="Allowed Days" value={result.allowedPaymentDays} />
                <ResultMetric label="Appointed Day" value={result.appointedDay || "N/A"} />
                <ResultMetric label="Bank Rate" value={`${result.bankRatePercent}%`} />
                <ResultMetric label="Annual Rate" value={`${result.annualInterestRatePercent}%`} />
                <ResultMetric label="Rate Source" value={result.interestRateSource || "N/A"} />
                <ResultMetric label="Interest" value={`Rs ${formatMoney(result.interest)}`} />
                <ResultMetric label="Total Payable" value={`Rs ${formatMoney(result.totalPayable)}`} />
              </div>
              {result.ratePeriods?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                  {result.ratePeriods.map((period, index) => (
                    <p key={`${period.fromDate}-${index}`}>
                      {period.fromDate} to {period.toDate}: Bank Rate {period.bankRatePercent}% from {period.sourceType}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">{result.legalNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, disabled = false }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        step={type === "number" ? "0.01" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
      />
    </label>
  );
}

function ResultMetric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-lg font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
