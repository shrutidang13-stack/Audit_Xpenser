import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Link2, RefreshCcw, Search } from "lucide-react";
import { Badge } from "../components/Badge";
import { api, caDashboardApi } from "../lib/api";

const disclosureColumns = [
  ["clause", "Clause"],
  ["section_act", "Section / Act"],
  ["expense_description", "Expense Ledger / Description"],
  ["amount", "Amount"],
  ["answer_value", "Answer / Value"],
  ["disclosure_text", "Disclosure Text for Portal"],
  ["status", "Status"],
  ["ca_action_required", "CA Action Required"]
];

const clause22Columns = [
  ["financialYear", "FY"],
  ["supplier", "MSME Supplier"],
  ["panNumber", "PAN"],
  ["udyamNumber", "Udyam No."],
  ["totalPurchasesFromMicroSmall", "Purchases from MSE"],
  ["amountPaidDuringYear", "Paid During Year"],
  ["postMarchPaymentsWithin45Days", "Post-Year Payment Within Time"],
  ["clause22iiiBOutstandingDisallowance", "Clause 22(iii)(b) Outstanding"],
  ["interestUnderSection16", "Section 16 Interest"],
  ["remarks", "Disclosure Remarks"]
];

const clause26Columns = [
  ["financialYear", "FY"],
  ["supplier", "MSME Supplier"],
  ["panNumber", "PAN"],
  ["udyamNumber", "Udyam No."],
  ["principalDisallowance", "Section 43B(h) Disallowance"],
  ["sourceClause", "Source Clause"],
  ["allowedInYear", "Allowed In Year"],
  ["status", "Status"],
  ["remarks", "Remarks"]
];

const clause26AColumns = [
  ["financialYear", "FY"],
  ["vendorName", "MSME Supplier"],
  ["panNumber", "PAN"],
  ["udyamNumber", "Udyam No."],
  ["invoiceNumber", "Invoice"],
  ["invoiceDate", "Invoice Date"],
  ["openingDisallowance", "Opening Disallowance"],
  ["paidDuringYear", "Paid During Year"],
  ["deductibleCurrentYear", "Deductible Current Year"],
  ["closingCarryForward", "Closing Carry Forward"],
  ["settlementSource", "Settlement Source"],
  ["status", "Status"]
];

const clause34aColumns = [
  ["tan", "Tax Deduction and Collection Account Number (TAN)"],
  ["section", "Section"],
  ["nature_of_payment", "Nature of Payment"],
  ["total_payment_receipt", "Total amount of payment or receipt of the nature specified in column (3)"],
  ["amount_tax_required", "Total amount on which tax was required to be deducted or collected at specified rate out of (4)"],
  ["amount_tax_at_specified_rate", "Total amount on which tax was deducted or collected at specified rate out of (5)"],
  ["tax_deducted_specified_rate", "Amount of tax deducted or collected out of (6)"],
  ["amount_tax_less_rate", "Total amount on which tax was deducted or collected at less than specified rate out of (7)"],
  ["tax_deducted_less_rate", "Amount of tax deducted or collected out of (8)"],
  ["tax_not_deposited", "Amount of tax deducted or collected not deposited to the credit of the Central Government out of (6) and (8)"]
];

const gstColumns = [
  ["sr", "Sl. No."],
  ["total_exp", "Total Amount of Expenditure Incurred"],
  ["exempt_nil_non_taxable", "Expenditure in respect of entities registered under GST (Exempted / Nil-Rated / Non-Taxable)"],
  ["composition_scheme", "Expenditure relating to entities registered under GST (Composition Scheme)"],
  ["gst_registered", "Expenditure relating to entities registered under GST (Registered Persons)"],
  ["unregistered", "Expenditure relating to entities not registered under GST"]
];

const gstWorksheetColumns = [
  ["sr", "Sr."],
  ["expenditure_ledger", "Expenditure Ledger"],
  ["type", "Type"],
  ["total_exp", "Total Exp"],
  ["exempt_nil_non_taxable", "Exempted / Nil-Rated / Non-Taxable"],
  ["gst_registered", "GST-Registered"],
  ["composition_scheme", "Composition Scheme"],
  ["unregistered", "Unregistered"]
];

const moneyFields = new Set([
  "amount",
  "amount_at_risk",
  "disallowance_30",
  "disallowance_100",
  "net_max_risk",
  "amount_paid",
  "tds_as_per_act",
  "tds_deducted",
  "difference",
  "default_amount",
  "total_payment_receipt",
  "amount_tax_required",
  "amount_tax_at_specified_rate",
  "tax_deducted_specified_rate",
  "amount_tax_less_rate",
  "tax_deducted_less_rate",
  "tax_not_deposited",
  "total_exp",
  "exempt_nil_non_taxable",
  "gst_registered",
  "composition_scheme",
  "unregistered",
  "gst_paid",
  "totalPurchasesFromMicroSmall",
  "amountPaidDuringYear",
  "postMarchPaymentsWithin45Days",
  "clause22iiiBOutstandingDisallowance",
  "interestUnderSection16",
  "principalDisallowance",
  "openingDisallowance",
  "paidDuringYear",
  "deductibleCurrentYear",
  "closingCarryForward"
]);

export function Form3CD() {
  const { clientId } = useParams();
  const [report, setReport] = useState(null);
  const [msme, setMsme] = useState(null);
  const [msmeError, setMsmeError] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("disclosures");
  const [regenerating, setRegenerating] = useState(false);
  const [showClause44Worksheet, setShowClause44Worksheet] = useState(false);

  useEffect(() => {
    let mounted = true;
    setError("");
    setMsmeError("");
    setReport(null);
    setMsme(null);
    Promise.allSettled([
      api.get(`/api/dashboard/${clientId}/form3cd-report`),
      caDashboardApi.dashboard(clientId)
    ]).then(([form3cdResult, connectedResult]) => {
      if (!mounted) return;
      if (form3cdResult.status === "fulfilled") setReport(form3cdResult.value.data);
      else setError(form3cdResult.reason?.response?.data?.detail || form3cdResult.reason?.message || "Could not load Form 3CD report");

      if (connectedResult.status === "fulfilled") setMsme(connectedResult.value.data?.msme_guard || {});
      else setMsmeError(connectedResult.reason?.response?.data?.detail || connectedResult.reason?.message || "MSME Guard data is unavailable");
    });
    return () => { mounted = false; };
  }, [clientId]);

  const regenerateReport = async () => {
    setRegenerating(true);
    setError("");
    try {
      const { data } = await api.post(`/api/dashboard/${clientId}/form3cd-report/regenerate`);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not regenerate Form 3CD report");
    } finally {
      setRegenerating(false);
    }
  };

  const filteredDisclosures = useMemo(() => filterRows(
    (report?.disclosures || []).filter((row) => row.section_group !== "SEC 40(a) - TDS DEFAULTS - 30% DISALLOWANCE"),
    query
  ), [report, query]);
  const totals = useMemo(() => {
    const form3cd = msme?.form3cd || {};
    return {
      mandatory: (report?.disclosures || []).filter((row) => ["Mandatory", "Critical"].includes(row.status)).length,
      msmeRows: [form3cd.clause22, form3cd.clause26, form3cd.clause26A].reduce((sum, rows) => sum + (rows?.length || 0), 0),
      clause44Expenditure: (report?.gst_expenditure || []).find((row) => row.expenditure_ledger === "GRAND TOTAL")?.total_exp || 0
    };
  }, [report, msme]);

  const clause44Rows = useMemo(() => {
    const total = (report?.gst_expenditure || []).find((row) => row.expenditure_ledger === "GRAND TOTAL");
    if (!total) return [];
    return [{
      sr: 1,
      total_exp: total.total_exp || 0,
      exempt_nil_non_taxable: total.exempt_nil_non_taxable || 0,
      composition_scheme: total.composition_scheme || 0,
      gst_registered: total.gst_registered || 0,
      unregistered: total.unregistered || 0
    }];
  }, [report]);

  const clause44WorksheetRows = useMemo(() => (report?.gst_expenditure || []).map((row) => ({
    ...row,
    exempt_nil_non_taxable: row.exempt_nil_non_taxable || 0
  })), [report]);

  if (!report) {
    return (
      <div className={`rounded border p-6 text-sm font-semibold ${error ? "border-coral/20 bg-coral/10 text-coral" : "border-ink/10 bg-white text-ink/60"}`}>
        {error || "Loading Form 3CD report..."}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-ink/10 bg-white">
        <div className="border-b border-ink/10 bg-ink px-4 py-4 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/70">
                <FileSpreadsheet size={16} />
                Form 3CD
              </div>
              <h1 className="mt-2 max-w-5xl text-2xl font-black leading-tight">{report.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="medium">CA Review Required</Badge>
              <button onClick={regenerateReport} disabled={regenerating} className="focus-ring inline-flex h-9 items-center gap-2 rounded bg-white px-3 text-sm font-black text-ink disabled:opacity-60">
                <RefreshCcw size={15} className={regenerating ? "animate-spin" : ""} />
                {regenerating ? "Regenerating..." : "Regenerate Report"}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-white/85 sm:grid-cols-2 lg:grid-cols-5">
            <Meta label="PAN" value={report.meta.pan} />
            <Meta label="GSTIN" value={report.meta.gstin} />
            <Meta label="FY" value={report.meta.financial_year} />
            <Meta label="AY" value={report.meta.assessment_year} />
            <Meta label="Generated" value={report.meta.generated} />
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Mandatory / Critical Items" value={totals.mandatory} tone="high" />
          <Metric label="Connected MSME Clause Rows" value={totals.msmeRows} tone="medium" />
          <Metric label="Clause 44 Total Expenditure" value={formatMoney(totals.clause44Expenditure)} tone="low" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Tab id="disclosures" active={activeTab} setActive={setActiveTab}>Expense Clauses</Tab>
          <Tab id="msme" active={activeTab} setActive={setActiveTab}>MSME Clauses</Tab>
          <Tab id="clause34a" active={activeTab} setActive={setActiveTab}>Clause 34(a)</Tab>
          <Tab id="gst" active={activeTab} setActive={setActiveTab}>Clause 44 GST</Tab>
        </div>
        {activeTab === "disclosures" && (
          <label className="flex min-w-72 items-center gap-2 rounded border border-ink/15 bg-white px-3 py-2">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clause, ledger, section..." className="w-full bg-transparent text-sm outline-none" />
          </label>
        )}
      </div>

      {activeTab === "disclosures" && <DisclosureTable rows={filteredDisclosures} />}
      {activeTab === "msme" && <MSMEClauses msme={msme} error={msmeError} />}
      {activeTab === "clause34a" && (
        <div className="space-y-4">
          <ReportTable
            title="FORM 3CD - CLAUSE 34(a): TDS / TCS STATEMENT"
            subtitle={`${report.meta.financial_year || "2025-26"} | As per prescribed Clause 34(a) format`}
            columns={clause34aColumns}
            rows={report.clause_34a?.rows || []}
            totalMatcher={(row) => row.section === "TOTAL"}
            minWidth="2600px"
          />
          <div className="rounded border border-amber/30 bg-amber/10 p-4 text-sm font-semibold leading-6 text-ink/75">
            <div className="flex gap-2">
              <AlertTriangle className="mt-1 shrink-0 text-amber" size={16} />
              <span><strong>Note:</strong> {report.clause_34a?.note}</span>
            </div>
          </div>
        </div>
      )}
      {activeTab === "gst" && (
        <div className="space-y-4">
          <ReportTable
            title="CLAUSE 44 - BREAK-UP OF TOTAL EXPENDITURE"
            subtitle="Expenditure is classified by the GST registration status of the supplier."
            columns={gstColumns}
            rows={clause44Rows}
            headerAction={(
              <button onClick={() => setShowClause44Worksheet((visible) => !visible)} className="focus-ring inline-flex h-9 items-center gap-2 rounded bg-teal px-3 text-sm font-bold text-white">
                <FileSpreadsheet size={15} />
                {showClause44Worksheet ? "Hide Worksheet" : "View Worksheet"}
              </button>
            )}
          />
          {showClause44Worksheet && (
            <ReportTable
              title="CLAUSE 44 - CALCULATION WORKSHEET"
              subtitle="Ledger-wise working used to arrive at the Clause 44 summary above."
              columns={gstWorksheetColumns}
              rows={clause44WorksheetRows}
              totalMatcher={(row) => row.expenditure_ledger === "GRAND TOTAL"}
            />
          )}
        </div>
      )}

      <div className="rounded border border-amber/30 bg-amber/10 p-4 text-sm font-semibold leading-6 text-ink/75">
        {report.notes.map((note) => (
          <div key={note} className="flex gap-2">
            <AlertTriangle className="mt-1 shrink-0 text-amber" size={16} />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MSMEClauses({ msme, error }) {
  if (!msme && !error) {
    return <div className="rounded border border-ink/10 bg-white p-6 text-sm font-semibold text-ink/60">Loading connected MSME Form 3CD schedules...</div>;
  }

  const form3cd = msme?.form3cd || {};
  const clause22 = (form3cd.clause22 || []).map((row) => ({
    ...row,
    clause22iiiBOutstandingDisallowance: row.clause22iiiBOutstandingDisallowance ?? row.amountInadmissible ?? row.outstandingBalanceDisallowance ?? 0,
    interestUnderSection16: row.interestUnderSection16 ?? row.interestPayable ?? 0
  }));
  const clause26 = (form3cd.clause26 || []).map((row) => ({
    ...row,
    supplier: row.supplier || row.vendorName,
    principalDisallowance: row.principalDisallowance ?? row.disallowanceAmount ?? 0
  }));
  const clause26A = form3cd.clause26A || [];
  const connected = msme?.status === "available";
  const clause22Total = sumRows(clause22, "clause22iiiBOutstandingDisallowance");
  const clause26Total = sumRows(clause26, "principalDisallowance");
  const carryForwardTotal = sumRows(clause26A, "closingCarryForward");

  return (
    <div className="space-y-4">
      <div className={`rounded border px-4 py-4 ${connected ? "border-teal/25 bg-teal/10" : "border-amber/30 bg-amber/10"}`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            {connected ? <Link2 className="mt-0.5 shrink-0 text-teal" size={20} /> : <AlertTriangle className="mt-0.5 shrink-0 text-amber" size={20} />}
            <div>
              <h2 className="font-black text-ink">MSME Guard {connected ? "Connected" : "Connection Required"}</h2>
              <p className="mt-1 text-sm font-semibold text-ink/65">
                {error || msme?.message || "MSME schedules are sourced directly from the latest connected compliance report."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-ink/65">
            <span className="rounded border border-ink/10 bg-white px-2 py-1.5">Import: {msme?.import_run_id || "Not available"}</span>
            <span className="rounded border border-ink/10 bg-white px-2 py-1.5">Report: {msme?.report_id || "Not available"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Clause 22(iii)(b) Outstanding" value={formatMoney(clause22Total)} tone="high" />
        <Metric label="Clause 26 / 43B(h)" value={formatMoney(clause26Total)} tone="medium" />
        <Metric label="Clause 26(A) Carry Forward" value={formatMoney(carryForwardTotal)} tone="low" />
      </div>

      <ReportTable
        title="FORM 3CD - CLAUSE 22: MSME DISCLOSURE"
        subtitle="Purchases, year-end outstanding amounts and MSMED Act Section 16 interest from the connected MSME computation."
        columns={clause22Columns}
        rows={clause22}
        minWidth="1900px"
        empty="No Clause 22 MSME computation rows are available in the connected report."
      />
      <ReportTable
        title="FORM 3CD - CLAUSE 26 / SECTION 43B(h)"
        subtitle="Actual-payment disallowance derived from Clause 22(iii)(b), preserving one source of truth."
        columns={clause26Columns}
        rows={clause26}
        minWidth="1550px"
        empty="No Clause 26 / Section 43B(h) rows are available in the connected report."
      />
      <ReportTable
        title="FORM 3CD - CLAUSE 26(A): CARRY-FORWARD REGISTER"
        subtitle="Prior-year MSME disallowances, current-year settlements and the closing amount carried forward."
        columns={clause26AColumns}
        rows={clause26A}
        minWidth="2050px"
        empty="No Clause 26(A) carry-forward rows are available in the connected report."
      />
    </div>
  );
}

function DisclosureTable({ rows }) {
  const grouped = groupBySection(rows);
  return (
    <div className="overflow-x-auto rounded border border-ink/10 bg-white">
      <table className="min-w-[1320px] text-left text-sm">
        <thead className="bg-ink text-white">
          <tr>
            {disclosureColumns.map(([, label]) => (
              <th key={label} className="px-3 py-3 font-semibold">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map((item) => item.type === "group" ? (
            <tr key={item.label} className="bg-moss/10">
              <td colSpan={disclosureColumns.length} className="px-3 py-2 text-xs font-black uppercase tracking-wide text-moss">{item.label}</td>
            </tr>
          ) : (
            <tr key={`${item.row.clause}-${item.row.expense_description}`} className="border-t border-ink/10">
              {disclosureColumns.map(([key]) => (
                <td key={key} className={`max-w-md px-3 py-3 align-top ${key === "amount" ? "text-right font-semibold tabular-nums" : ""}`}>
                  {formatCell(item.row[key], key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ title, subtitle, columns, rows, totalMatcher, emphasizedKey, headerAction, minWidth = "1100px", empty = "No rows available." }) {
  return (
    <div className="rounded border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
        <div>
          <h2 className="text-base font-black text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-sm font-semibold text-ink/60">{subtitle}</p>}
        </div>
        {headerAction}
      </div>
      <div className="overflow-x-auto">
        <table className="text-left text-sm" style={{ minWidth }}>
          <thead className="bg-ink text-white">
            <tr>
              {columns.map(([, label]) => (
                <th key={label} className="px-3 py-3 font-semibold">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center font-semibold text-ink/50">{empty}</td>
              </tr>
            )}
            {rows.map((row, index) => {
              const isTotal = totalMatcher?.(row);
              return (
                <tr key={index} className={`border-t border-ink/10 ${isTotal ? "bg-amber/10 font-black" : ""}`}>
                  {columns.map(([key]) => (
                    <td key={key} className={`max-w-md px-3 py-3 align-top ${moneyFields.has(key) ? "text-right font-semibold tabular-nums" : ""}`}>
                      {key === emphasizedKey ? <Badge tone={String(row[key]).toLowerCase().includes("critical") ? "high" : "medium"}>{row[key]}</Badge> : formatCell(row[key], key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const classes = tone === "high" ? "border-coral/25 bg-coral/10" : tone === "medium" ? "border-amber/25 bg-amber/10" : "border-teal/25 bg-teal/10";
  return (
    <div className={`rounded border px-3 py-3 ${classes}`}>
      <div className="text-xs font-bold uppercase text-ink/55">{label}</div>
      <div className="mt-1 text-xl font-black text-ink">{value}</div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <span className="text-white/50">{label}: </span>
      <span>{value || "Not available"}</span>
    </div>
  );
}

function Tab({ id, active, setActive, children }) {
  const selected = active === id;
  return (
    <button onClick={() => setActive(id)} className={`rounded border px-3 py-2 text-sm font-bold ${selected ? "border-moss bg-moss text-white" : "border-ink/15 bg-white text-ink/70 hover:bg-ink/5"}`}>
      {children}
    </button>
  );
}

function groupBySection(rows) {
  const output = [];
  let lastGroup = "";
  rows.forEach((row) => {
    if (row.section_group !== lastGroup) {
      output.push({ type: "group", label: row.section_group });
      lastGroup = row.section_group;
    }
    output.push({ type: "row", row });
  });
  return output;
}

function filterRows(rows, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle)));
}

function sumRows(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

function formatCell(value, key) {
  if (value === null || value === undefined || value === "") return <span className="text-ink/40">-</span>;
  if (moneyFields.has(key) && typeof value === "number") return formatMoney(value);
  if (key === "status" || key === "deposit_status") return <Status value={value} />;
  return String(value);
}

function Status({ value }) {
  const text = String(value);
  const lower = text.toLowerCase();
  if (lower.includes("filled") || lower.includes("not required") || lower.includes("below")) {
    return <span className="inline-flex items-center gap-1 font-bold text-moss"><CheckCircle2 size={14} />{text}</span>;
  }
  return <Badge tone={lower.includes("critical") || lower.includes("mandatory") ? "high" : "medium"}>{text}</Badge>;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
}
