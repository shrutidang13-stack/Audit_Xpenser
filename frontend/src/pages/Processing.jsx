import { Play, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { PageTitle } from "./UploadCentre";

export function Processing() {
  const { clientId } = useParams();
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/api/process/run-audit/${clientId}`);
      setResult(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageTitle title="Processing Status" subtitle="Run the expense audit pipeline after uploads and mapping confirmation." />
      <button onClick={run} disabled={busy} className="focus-ring inline-flex h-11 items-center gap-2 rounded bg-coral px-4 text-sm font-black text-white disabled:opacity-60">{busy ? <RefreshCcw className="animate-spin" size={17} /> : <Play size={17} />}Run Expense Audit</button>
      {result && (
        <div className="rounded border border-ink/10 bg-white p-4">
          <h2 className="font-black">Pipeline Complete</h2>
          <pre className="mt-3 overflow-x-auto rounded bg-ink p-4 text-sm text-white">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
