import { useEffect, useMemo, useState } from "react";
import {
  bulkCreatePurchaseInvoices,
  createPurchaseInvoice,
  fetchPurchaseInvoices,
  importPurchaseInvoicesFromTally,
  verifyPurchaseInvoiceUdyam,
} from "./services/api";

const emptyForm = {
  vendorName: "",
  invoiceNumber: "",
  invoiceDate: "",
  dueDate: "",
  invoiceAmount: "",
  outstandingAmount: "",
  paymentStatus: "unpaid",
  udyamNumber: "",
  notes: "",
  autoVerify: true,
};

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const get = (row, names) => {
    for (const name of names) {
      const index = headers.indexOf(name);
      if (index >= 0) return row[index] || "";
    }
    return "";
  };
  return lines.slice(1).map((line) => {
    const row = parseCsvLine(line);
    return {
      vendorName: get(row, ["vendor", "vendorname", "party", "partyname", "supplier", "suppliername"]),
      invoiceNumber: get(row, ["invoiceno", "invoicenumber", "billno", "billnumber"]),
      invoiceDate: get(row, ["invoicedate", "billdate", "date"]),
      dueDate: get(row, ["duedate"]),
      invoiceAmount: get(row, ["invoiceamount", "amount", "billamount"]),
      outstandingAmount: get(row, ["outstanding", "outstandingamount", "balance"]),
      udyamNumber: get(row, ["udyam", "udyamnumber", "udyamregistrationnumber"]),
      paymentStatus: get(row, ["paymentstatus", "status"]) || "unpaid",
      source: "csv",
      autoVerify: true,
    };
  }).filter((row) => row.vendorName);
}

export default function PurchaseInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const load = async () => {
    const data = await fetchPurchaseInvoices();
    setInvoices(data.invoices || []);
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toUpperCase();
    return invoices.filter((invoice) => {
      const matchesQuery = !needle || [invoice.vendorName, invoice.invoiceNumber, invoice.udyamNumber].some((value) => String(value || "").toUpperCase().includes(needle));
      const matchesStatus = !status || invoice.udyamStatus === status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  const summary = useMemo(() => ({
    total: invoices.length,
    verified: invoices.filter((invoice) => ["verified", "approved"].includes(invoice.udyamStatus)).length,
    pending: invoices.filter((invoice) => ["not_started", "pending"].includes(invoice.udyamStatus)).length,
    review: invoices.filter((invoice) => ["manual_fallback_required", "pending_manual_review", "invalid_format", "rejected"].includes(invoice.udyamStatus)).length,
  }), [invoices]);

  const saveManual = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await createPurchaseInvoice({ ...form, source: "manual" });
      setForm(emptyForm);
      await load();
      setMessage("Invoice saved and Udyam verification triggered where possible.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveUpload = async () => {
    if (!uploadFile) return;
    setLoading(true);
    setMessage("");
    try {
      await createPurchaseInvoice({
        ...form,
        source: "upload",
        sourceFileName: uploadFile.name,
        notes: `${form.notes || ""}\nUploaded invoice file: ${uploadFile.name}`.trim(),
      });
      setUploadFile(null);
      setForm(emptyForm);
      await load();
      setMessage("Invoice file captured. Add Udyam number if it was not printed or extracted.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      await bulkCreatePurchaseInvoices(rows, "csv");
      await load();
      setMessage(`${rows.length} CSV invoices imported.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      event.target.value = "";
      setLoading(false);
    }
  };

  const handleTally = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await importPurchaseInvoicesFromTally({ fiscalYear: "2025-26", fromDate: "20250401", toDate: "20260331" });
      await load();
      setMessage(`${data.imported} invoice records created from Tally creditor import.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyInvoice = async (invoice) => {
    const udyamNumber = window.prompt("Enter Udyam number", invoice.udyamNumber || "");
    if (!udyamNumber) return;
    setLoading(true);
    setMessage("");
    try {
      await verifyPurchaseInvoiceUdyam(invoice.id, udyamNumber);
      await load();
      setMessage("Udyam verification completed or moved to manual review.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Purchase Invoices</h2>
        <p className="text-sm text-gray-500">One intake space for manual invoices, uploads, CSV registers, and Tally imports. Udyam verification starts from here when a Udyam number is available.</p>
      </div>

      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Invoices" value={summary.total} tone="bg-blue-100 text-blue-700" />
        <Metric label="Udyam Verified" value={summary.verified} tone="bg-green-100 text-green-700" />
        <Metric label="Pending Udyam" value={summary.pending} tone="bg-yellow-100 text-yellow-800" />
        <Metric label="Manual Review" value={summary.review} tone="bg-red-100 text-red-700" />
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <section className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-gray-800">Add Invoice Manually</h3>
          <form onSubmit={saveManual} className="grid md:grid-cols-2 gap-3 mt-4">
            <Field label="Vendor Name" value={form.vendorName} onChange={(value) => updateForm("vendorName", value)} required />
            <Field label="Invoice Number" value={form.invoiceNumber} onChange={(value) => updateForm("invoiceNumber", value)} />
            <Field label="Invoice Date" type="date" value={form.invoiceDate} onChange={(value) => updateForm("invoiceDate", value)} />
            <Field label="Due Date" type="date" value={form.dueDate} onChange={(value) => updateForm("dueDate", value)} />
            <Field label="Invoice Amount" type="number" value={form.invoiceAmount} onChange={(value) => updateForm("invoiceAmount", value)} />
            <Field label="Outstanding Amount" type="number" value={form.outstandingAmount} onChange={(value) => updateForm("outstandingAmount", value)} />
            <Field label="Udyam Number" value={form.udyamNumber} onChange={(value) => updateForm("udyamNumber", value.toUpperCase())} />
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">Payment Status</span>
              <select className="w-full border rounded-lg px-3 py-2" value={form.paymentStatus} onChange={(event) => updateForm("paymentStatus", event.target.value)}>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-gray-600 mb-1">Notes / Raw Text</span>
              <textarea className="w-full border rounded-lg px-3 py-2 min-h-20" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
              <input type="checkbox" checked={form.autoVerify} onChange={(event) => updateForm("autoVerify", event.target.checked)} />
              Auto-verify Udyam when number is available
            </label>
            <button disabled={loading} className="bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50 md:col-span-2">Save Invoice</button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Other Intake Options</h3>
          <div className="border rounded-lg p-4">
            <p className="font-semibold text-sm text-gray-800">Upload Invoice PDF/Image</p>
            <input className="mt-3 text-sm" type="file" accept=".pdf,image/*" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
            <button onClick={saveUpload} disabled={loading || !uploadFile || !form.vendorName} className="mt-3 w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">Capture Uploaded Invoice</button>
          </div>
          <div className="border rounded-lg p-4">
            <p className="font-semibold text-sm text-gray-800">Upload Excel/CSV Purchase Register</p>
            <p className="text-xs text-gray-500 mt-1">CSV headers can include vendorName, invoiceNumber, invoiceDate, amount, outstandingAmount, udyamNumber.</p>
            <input className="mt-3 text-sm" type="file" accept=".csv,text/csv" onChange={handleCsv} />
          </div>
          <div className="border rounded-lg p-4">
            <p className="font-semibold text-sm text-gray-800">Import From Tally</p>
            <p className="text-xs text-gray-500 mt-1">Uses the existing Tally creditor import and creates invoice intake records for follow-up verification.</p>
            <button onClick={handleTally} disabled={loading} className="mt-3 w-full bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">Import From Tally</button>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex-1">Invoice Worklist</h3>
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Search vendor, invoice, Udyam" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All Udyam Status</option>
            <option value="verified">Verified</option>
            <option value="approved">Approved</option>
            <option value="not_started">Not Started</option>
            <option value="manual_fallback_required">Manual Fallback</option>
            <option value="invalid_format">Invalid Format</option>
          </select>
        </div>
        <div className="overflow-auto max-h-[34rem]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {["Vendor", "Invoice", "Date", "Amount", "Udyam", "Status", "Source", "Action"].map((label) => <th key={label} className="text-left p-2 text-gray-600">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="p-2 font-semibold text-gray-800">{invoice.vendorName}</td>
                  <td className="p-2 text-xs">{invoice.invoiceNumber}</td>
                  <td className="p-2 text-xs">{invoice.invoiceDate}</td>
                  <td className="p-2 text-xs">{invoice.outstandingAmount.toFixed(2)}</td>
                  <td className="p-2 text-xs">{invoice.udyamNumber}</td>
                  <td className="p-2 text-xs"><Status value={invoice.udyamStatus} /></td>
                  <td className="p-2 text-xs">{invoice.source}</td>
                  <td className="p-2"><button onClick={() => verifyInvoice(invoice)} disabled={loading} className="text-blue-700 font-semibold text-xs">Verify Udyam</button></td>
                </tr>
              ))}
              {!filtered.length && <tr><td className="p-4 text-sm text-gray-500" colSpan="8">No purchase invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input required={required} type={type} className="w-full border rounded-lg px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Metric({ label, value, tone }) {
  return <div className={`rounded-xl p-4 ${tone}`}><p className="text-2xl font-bold">{value}</p><p className="text-xs font-semibold">{label}</p></div>;
}

function Status({ value }) {
  const tone = ["verified", "approved"].includes(value)
    ? "bg-green-100 text-green-700"
    : ["manual_fallback_required", "pending_manual_review", "invalid_format", "rejected"].includes(value)
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-800";
  return <span className={`px-2 py-1 rounded-full font-semibold ${tone}`}>{value || "not_started"}</span>;
}
