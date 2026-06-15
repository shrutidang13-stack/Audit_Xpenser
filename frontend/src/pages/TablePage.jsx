import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { DataTable } from "../components/DataTable";
import { api, endpoints } from "../lib/api";
import { PageTitle } from "./UploadCentre";

const configs = {
  "bill-matches": {
    title: "Bill Matching",
    subtitle: "Best-effort bill-to-ledger matching with CA Review Required labels where confidence is weak.",
    columns: ["status", "score", "ledger", "vendor", "amount", "invoice_number", "reason"]
  },
  "high-risk-expenses": {
    title: "High-Risk Expenses",
    subtitle: "Indicative risk score by transaction.",
    columns: ["score", "level", "ledger", "vendor", "amount", "date", "reasons"]
  },
  "statutory-alerts": {
    title: "Statutory Alerts",
    subtitle: "Possible TDS, GST and RCM review areas.",
    columns: ["alert_type", "severity", "issue", "suggested_review", "transaction_id"]
  },
  "vendor-risks": {
    title: "Vendor Risks",
    subtitle: "Vendor master, PAN, GSTIN and support gaps.",
    columns: ["vendor_name", "severity", "issue", "suggested_action"]
  },
  "capital-review": {
    title: "Capital Review",
    subtitle: "Possible capital-vs-revenue cases requiring CA review.",
    columns: ["transaction_id", "amount", "reason", "suggested_review_area", "ca_review_required"]
  },
  "form3cd-impact": {
    title: "Form 3CD Impact Map",
    subtitle: "Potential tax audit reporting areas. No final conclusion is generated.",
    columns: ["clause_area", "observation", "suggested_review", "source_type", "source_id"]
  },
  "client-queries": {
    title: "Client Queries",
    subtitle: "Professional suggested queries generated from exceptions.",
    columns: ["query_number", "priority", "status", "ledger", "vendor", "transaction_date", "amount", "issue_detected", "required_document", "suggested_wording"]
  },
  "audit-trail": {
    title: "Audit Trail",
    subtitle: "System actions recorded during upload, mapping and audit processing.",
    columns: ["created_at", "action", "details", "actor"]
  }
};

export function TablePage({ type }) {
  const { clientId } = useParams();
  const [rows, setRows] = useState([]);
  const config = configs[type];
  useEffect(() => {
    api.get(endpoints.rows(clientId, type)).then(({ data }) => setRows(data));
  }, [clientId, type]);
  return (
    <section className="space-y-5">
      <PageTitle title={config.title} subtitle={config.subtitle} />
      <DataTable columns={config.columns.map((key) => ({ key, label: title(key) }))} data={rows.map(decorate)} />
    </section>
  );
}

function decorate(row) {
  const out = { ...row };
  for (const key of ["status", "level", "severity", "priority"]) {
    if (out[key]) out[key] = <Badge tone={tone(out[key])}>{out[key]}</Badge>;
  }
  return out;
}

function tone(value) {
  const text = String(value).toLowerCase();
  if (text.includes("high") || text.includes("missing") || text.includes("required")) return "high";
  if (text.includes("medium") || text.includes("partial") || text.includes("open")) return "medium";
  return "low";
}

function title(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
