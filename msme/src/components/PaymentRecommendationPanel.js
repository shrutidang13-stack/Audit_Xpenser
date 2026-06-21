import { useEffect, useState } from "react";
import { fetchPaymentRecommendations } from "../services/api";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function PaymentRecommendationPanel({ reportId, compact = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    if (!reportId) return undefined;
    fetchPaymentRecommendations(reportId)
      .then((response) => alive && setData(response.recommendations))
      .catch((err) => alive && setError(err.message));
    return () => { alive = false; };
  }, [reportId]);

  if (!reportId) return null;
  if (error) return <div className="border border-red-200 bg-red-50 text-red-700 rounded-md p-3 text-sm font-semibold">{error}</div>;
  const rows = (data?.recommendations || []).slice(0, compact ? 5 : 50);
  return (
    <section className="bg-white rounded-md border border-slate-200 p-4">
      <h3 className="text-lg font-bold text-slate-900">Pay These Vendors First</h3>
      <p className="text-sm text-slate-500 mb-3">Priority ranks consider due date, overdue days, outstanding amount, interest, 43B(h), MSME-1 impact, and evidence confidence.</p>
      {!data && <p className="text-sm text-slate-500">Loading payment recommendations...</p>}
      {data && !rows.length && <p className="text-sm text-slate-500">No payment recommendations available.</p>}
      {!!rows.length && (
        <div className="overflow-auto max-h-96 border border-slate-100 rounded-md">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                {["Rank", "Vendor", "Invoice", "Outstanding", "Due date", "Overdue / Remaining", "Priority", "Action"].map((head) => (
                  <th key={head} className="text-left p-2 text-slate-600 whitespace-nowrap">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.priorityRank}-${row.vendorName}-${row.invoiceNumber}`} className="border-t border-slate-100 align-top">
                  <td className="p-2 font-bold">{row.priorityRank}</td>
                  <td className="p-2 min-w-44">{row.vendorName}</td>
                  <td className="p-2">{row.invoiceNumber || "-"}</td>
                  <td className="p-2">{money(row.outstandingAmount)}</td>
                  <td className="p-2">{row.dueDate || "-"}</td>
                  <td className="p-2">{row.daysOverdue ? `${row.daysOverdue} overdue` : `${row.daysRemaining || 0} remaining`}</td>
                  <td className="p-2 font-bold">{row.priority}</td>
                  <td className="p-2 min-w-56">{row.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
