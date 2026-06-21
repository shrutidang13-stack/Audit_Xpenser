const express = require("express");
const controller = require("../controllers/mcaMsme1FilingAutomationController");

const router = express.Router();

router.post("/mca-msme1/:filingId/file-msme1", controller.start);
router.get("/mca-msme1/automation/:runId/status", controller.status);
router.post("/mca-msme1/automation/:runId/continue", controller.continueRun);
router.post("/mca-msme1/automation/:runId/abort", controller.abort);
router.post("/mca-msme1/automation/:runId/capture-srn", controller.captureSrn);

module.exports = router;
