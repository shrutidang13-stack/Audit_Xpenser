const express = require("express");
const rbiBankRateController = require("../controllers/rbiBankRateController");

const router = express.Router();

router.get("/admin/rbi-bank-rates", rbiBankRateController.list);
router.post("/admin/rbi-bank-rates/update", rbiBankRateController.updateOfficial);
router.post("/admin/rbi-bank-rates/manual-override", rbiBankRateController.manualOverride);
router.get("/admin/rbi-bank-rates/audit-log", rbiBankRateController.auditLog);

module.exports = router;
