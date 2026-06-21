const riskScoreService = require("../services/complianceRiskScore.service");
const paymentSimulatorService = require("../services/paymentSimulator.service");
const auditEvidencePackService = require("../services/auditEvidencePack.service");
const explanationService = require("../services/complianceExplanation.service");
const recommendationService = require("../services/paymentRecommendation.service");

async function riskScore(req, res, next) {
  try {
    res.json({ success: true, riskScore: riskScoreService.getRiskScore(req.params.reportId) });
  } catch (error) {
    next(error);
  }
}

async function paymentSimulation(req, res, next) {
  try {
    res.json({ success: true, simulation: paymentSimulatorService.runPaymentSimulation(req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function auditPack(req, res, next) {
  try {
    const buffer = await auditEvidencePackService.buildAuditEvidencePack(req.params.reportId);
    res.type("application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=MSME_Audit_Evidence_Pack_${req.params.reportId}.zip`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

async function explain(req, res, next) {
  try {
    res.json({ success: true, explanation: explanationService.explain(req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function paymentRecommendations(req, res, next) {
  try {
    res.json({ success: true, recommendations: recommendationService.getPaymentRecommendations(req.params.reportId, req.query || {}) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  riskScore,
  paymentSimulation,
  auditPack,
  explain,
  paymentRecommendations,
};
