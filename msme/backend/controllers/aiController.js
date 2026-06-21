const env = require("../config/env");
const { loadRulePack, getConfiguredBankRatePercent, getDefaultAnnualInterestRate } = require("../services/msmeRuleEngine.service");
const reportRepository = require("../repositories/reportRepository");

function compactRuleContext(rulePack) {
  const rules = (rulePack.rules || []).map((rule) => ({
    id: rule.id,
    name: rule.name,
    condition: rule.condition,
    effect: rule.effect,
    sourceRefs: rule.sourceRefs || rule.sources || [],
  }));
  const sources = (rulePack.sources || []).map((source) => ({
    id: source.id,
    title: source.title,
    url: source.officialUrl || source.officialPdfUrl || "",
  }));
  return { version: rulePack.version, rules, sources };
}

function latestReportContext() {
  const latest = reportRepository.listReports()[0];
  if (!latest) return null;
  const schedules = latest.schedules || {};
  const clause22Total = (schedules.clause22Computation || []).reduce((sum, row) => sum + Number(row.clause22iiiBOutstandingDisallowance || 0), 0);
  const clause43Total = (schedules.clause43BhFromClause22 || []).reduce((sum, row) => sum + Number(row.principalDisallowance || 0), 0);
  return {
    reportId: latest.id,
    fiscalYear: latest.fiscalYear,
    totalDisallowed: Number(latest.summary?.totalDisallowed || 0),
    totalInterest: Number(latest.summary?.totalInterest || 0),
    pendingVerificationVendors: Number(latest.summary?.pendingVerificationVendors || 0),
    clause22iiiBTotal: clause22Total,
    clause43BhTotal: clause43Total,
  };
}

function reportContextLine(reportContext) {
  if (!reportContext) return "Latest report context: no generated MSME compliance report is available.";
  return `Latest report context (${reportContext.fiscalYear}, ${reportContext.reportId}): Clause 22(iii)(b) total Rs ${reportContext.clause22iiiBTotal}; 43B(h) total Rs ${reportContext.clause43BhTotal}; report total disallowed Rs ${reportContext.totalDisallowed}; Section 16 interest Rs ${reportContext.totalInterest}; pending verification vendors ${reportContext.pendingVerificationVendors}.`;
}

function localRuleAnswer(question, rulePack, reportContext = null) {
  const normalized = question.toLowerCase();
  const bankRate = getConfiguredBankRatePercent();
  const annualRate = Math.round(getDefaultAnnualInterestRate(bankRate) * 10000) / 100;
  const matchingRules = (rulePack.rules || []).filter((rule) => {
    const haystack = [rule.id, rule.name, rule.condition, rule.effect, ...(rule.sourceRefs || [])].join(" ").toLowerCase();
    return normalized.split(/\W+/).filter((word) => word.length > 3).some((word) => haystack.includes(word));
  }).slice(0, 5);

  if (normalized.includes("43b") || normalized.includes("43b(h)") || normalized.includes("disallow")) {
    return [
      "Rule-module answer:",
      "43B(h) / actual-payment disallowance is computed from verified MSME invoice ageing. Principal that remains unpaid beyond the appointed day at year-end is disclosed in Clause 22(iii)(b), and this app derives the 43B(h) amount only from Clause 22(iii)(b) so there is one source of truth.",
      reportContextLine(reportContext),
      `Configured RBI bank rate is ${bankRate}%, so Section 16 annual interest is ${annualRate}% before monthly compounding.`,
      matchingRules.length ? `Relevant rules: ${matchingRules.map((rule) => `${rule.id} - ${rule.name}`).join("; ")}` : "",
    ].filter(Boolean).join("\n");
  }

  if (normalized.includes("clause 22") || normalized.includes("interest") || normalized.includes("section 16")) {
    return [
      "Rule-module answer:",
      "Clause 22 disclosure is driven by MSMED Act interest. The app calculates invoice-wise Section 16 interest for delayed MSME payments at three times the applicable RBI Bank Rate, compounded monthly, and treats MSMED interest as inadmissible under Section 23.",
      reportContextLine(reportContext),
      `Current configured bank rate: ${bankRate}%. Current computed annual rate: ${annualRate}%.`,
      matchingRules.length ? `Relevant rules: ${matchingRules.map((rule) => `${rule.id} - ${rule.name}`).join("; ")}` : "",
    ].filter(Boolean).join("\n");
  }

  if (normalized.includes("udyam") || normalized.includes("verify") || normalized.includes("msme status")) {
    return [
      "Rule-module answer:",
      "Do not classify a vendor as MSME from its name. Use Udyam verification or approved manual evidence. The report includes only vendors marked MSME with verified or approved Udyam status in the vendor master.",
      matchingRules.length ? `Relevant rules: ${matchingRules.map((rule) => `${rule.id} - ${rule.name}`).join("; ")}` : "",
    ].filter(Boolean).join("\n");
  }

  if (normalized.includes("mca") || normalized.includes("msme-1") || normalized.includes("form")) {
    return [
      "Rule-module answer:",
      "MCA MSME-1 rows are generated from the completed MSME compliance report. Use verified MSME vendors, split by half-year, with paid within 45 days, paid after 45 days, outstanding within 45 days, and outstanding beyond 45 days buckets.",
      reportContextLine(reportContext),
      matchingRules.length ? `Relevant rules: ${matchingRules.map((rule) => `${rule.id} - ${rule.name}`).join("; ")}` : "",
    ].filter(Boolean).join("\n");
  }

  return [
    "Rule-module answer:",
    "I can answer from the MSME rules loaded in the Rules module. Ask specifically about Udyam verification, Clause 22, 43B(h), Clause 26(A), Section 16 interest, Section 23 disallowance, or MCA MSME-1.",
    reportContextLine(reportContext),
    matchingRules.length ? `Closest matching rules: ${matchingRules.map((rule) => `${rule.id} - ${rule.name}`).join("; ")}` : `Loaded rule pack version: ${rulePack.version}.`,
  ].join("\n");
}

async function chat(req, res, next) {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question) return res.status(400).json({ success: false, error: "question is required" });
    const rulePack = loadRulePack();
    const ruleContext = compactRuleContext(rulePack);
    const reportContext = latestReportContext();
    if (!env.anthropicApiKey) {
      const reply = localRuleAnswer(question, rulePack, reportContext);
      return res.json({
        success: true,
        source: "rules-local-fallback",
        rulePackVersion: rulePack.version,
        reportContext,
        reply,
        answer: reply,
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.anthropicChatModel,
        max_tokens: 1024,
        system:
          `You are an expert CA assistant specializing in MSME compliance in India. Answer from this active MSME Guard rule pack and the latest computed report context. Cite rule ids and report totals when useful. Do not classify a vendor as MSME by guessing from its name. For vendor MSME status, instruct users to verify Udyam registration or use stored vendor master data. Keep answers practical and concise.\n\nActive rule context:\n${JSON.stringify(ruleContext)}\n\nLatest report context:\n${JSON.stringify(reportContext)}`,
        messages: [{ role: "user", content: question }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ success: false, error: data.error?.message || "AI request failed" });
    const reply = data.content?.[0]?.text || "No response returned.";
    res.json({ success: true, reportContext, reply, answer: reply });
  } catch (error) {
    next(error);
  }
}

module.exports = { chat };
