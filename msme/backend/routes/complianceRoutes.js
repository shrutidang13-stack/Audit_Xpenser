const express = require("express");
const complianceController = require("../controllers/complianceController");

const router = express.Router();

router.get("/compliance/risk-score/:reportId", complianceController.riskScore);
router.post("/compliance/payment-simulation", complianceController.paymentSimulation);
router.get("/compliance/audit-pack/:reportId/download", complianceController.auditPack);
router.post("/compliance/explain", complianceController.explain);
router.get("/compliance/payment-recommendations/:reportId", complianceController.paymentRecommendations);

module.exports = router;
