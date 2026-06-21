const express = require("express");
const auditController = require("../controllers/auditController");
const vendorController = require("../controllers/vendorController");

const router = express.Router();

router.post("/run-full-audit", auditController.runFullAudit);
router.get("/audit-trail/download", vendorController.auditTrailDownload);

module.exports = router;
