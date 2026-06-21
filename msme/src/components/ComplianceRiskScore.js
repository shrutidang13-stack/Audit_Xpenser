import { useEffect, useState } from "react";
import { fetchComplianceRiskScore } from "../services/api";

function tone(category) {
  if (category === "Low Risk") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (category === "Moderate Risk") return "bg-amber-50 text-amber-800 border-amber-200";
  if (category === "High Risk") return "bg-orange-50 text-orange-800 border-orange-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function ComplianceRiskScore({ reportId }) {
  const [riskScore, setRiskScore] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    if (!reportId) return undefined;
    fetchComplianceRiskScore(reportId)
      .then((data) => alive && setRiskScore(data.riskScore))
      .catch((err) => alive && setError(err.message));
    return () => { alive = false; };
  }, [reportId]);

  if (!reportId) return null;
  if (error) return <div className="border border-red-200 bg-red-50 text-red-700 rounded-md p-3 text-sm font-semibold">{error}</div>;
  if (!riskScore) return <div className="text-sm text-slate-500">Loading compliance risk score...</div>;

  return (
    <section className={`border rounded-md p-4 ${tone(riskScore.riskCategory)}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold">MSME Compliance Risk Score</h3>
          <p className="text-sm font-semibold">{riskScore.riskCategory}</p>
        </div>
        <div className="text-4xl font-black">{riskScore.score}<span className="text-base font-bold">/100</span></div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2 mt-4">
        {(riskScore.scoreBreakup || []).map((item) => (
          <div key={item.key} className="bg-white/80 rounded-md p-3 border border-white text-slate-700">
            <div className="flex justify-between gap-2 text-sm font-bold">
              <span>{item.label}</span>
              <span>{item.points}/{item.maxPoints}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{item.reason}</p>
          </div>
        ))}
      </div>
      <h4 className="text-sm font-bold mt-4 mb-2">Top 5 risk drivers</h4>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {(riskScore.topRisks || []).length
          ? riskScore.topRisks.map((risk) => <li key={risk.area}>{risk.area}: {risk.reason}</li>)
          : <li>No major risk driver detected.</li>}
      </ul>
    </section>
  );
}
