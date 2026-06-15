import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const targetFields = ["", "date", "voucher_number", "ledger_name", "vendor_name", "narration", "amount", "debit_credit", "payment_mode", "invoice_number", "gst_amount", "tds_amount", "name", "pan", "gstin", "address", "vendor_type", "contact", "section", "payment_amount", "tds_deducted", "tds_deposited", "challan_details", "invoice_date", "taxable_value", "itc_status", "particulars", "mode", "reference_number"];

export function Mapping() {
  const { clientId } = useParams();
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState(null);
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    api.get(`/api/upload/${clientId}/files`).then(({ data }) => setFiles(data));
  }, [clientId]);

  useEffect(() => {
    if (!selected) return;
    api.get(`/api/mapping/${selected}/preview`).then(({ data }) => {
      setPreview(data);
      setMappings(data.mappings);
    });
  }, [selected]);

  const save = async () => {
    await api.post(`/api/mapping/${selected}/confirm`, { mappings });
  };

  return (
    <section className="space-y-5">
      <PageTitle title="Column Mapping Preview" subtitle="Confirm suggested mappings before running the audit pipeline." />
      <select value={selected} onChange={(event) => setSelected(event.target.value)} className="focus-ring h-10 min-w-80 rounded border border-ink/15 bg-white px-3">
        <option value="">Select uploaded file</option>
        {files.map((file) => <option key={file.id} value={file.id}>{file.filename} - {file.category}</option>)}
      </select>
      {preview && (
        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <div className="rounded border border-ink/10 bg-white p-4">
            <h2 className="font-black">Mappings</h2>
            <div className="mt-3 space-y-3">
              {mappings.map((mapping, index) => (
                <div key={mapping.source_column} className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-ink/5 px-2 py-2 text-sm font-semibold">{mapping.source_column}</div>
                  <select value={mapping.target_field} onChange={(event) => setMappings(mappings.map((m, i) => i === index ? { ...m, target_field: event.target.value } : m))} className="rounded border border-ink/15 px-2 text-sm">
                    {targetFields.map((field) => <option key={field} value={field}>{field || "Ignore"}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={save} className="focus-ring mt-4 inline-flex h-10 items-center gap-2 rounded bg-moss px-3 text-sm font-bold text-white"><Save size={16} />Confirm</button>
          </div>
          <DataTable columns={(preview.columns || []).map((column) => ({ key: column, label: column }))} data={preview.preview || []} />
        </div>
      )}
    </section>
  );
}
