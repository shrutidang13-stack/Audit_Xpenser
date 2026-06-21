import { FileText } from "lucide-react";
import { useParams } from "react-router-dom";
import { endpoints } from "../lib/api";
import { ExportButton } from "./Dashboard";
import { PageTitle } from "./UploadCentre";

export function WorkingPaper() {
  const { clientId } = useParams();
  return (
    <section className="space-y-5">
      <PageTitle title="Working Paper Export" subtitle="Generate an audit-ready Word working paper with CA review notes and conclusion placeholder." />
      <div className="rounded border border-ink/10 bg-white p-5">
        <FileText size={36} className="text-teal" />
        <h2 className="mt-3 text-xl font-black">Expense Audit Working Paper</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">The generated document includes objective, scope, data reviewed, procedures, exception summaries, potential Form 3CD impact areas, client queries and review placeholders.</p>
        <div className="mt-4"><ExportButton href={endpoints.export(clientId, "working-paper")} label="Download Working Paper" /></div>
      </div>
    </section>
  );
}
