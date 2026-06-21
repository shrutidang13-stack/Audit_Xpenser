const express = require("express");
const taxAuditController = require("../controllers/taxAuditController");

const router = express.Router();

router.get("/tax-audit/schema/:formType", taxAuditController.schema);
router.get("/tax-audit/reports", taxAuditController.list);
router.post("/tax-audit/reports", taxAuditController.create);
router.get("/tax-audit/reports/:id", taxAuditController.get);
router.post("/tax-audit/reports/:id/assessee", taxAuditController.updateAssessee);
router.post("/tax-audit/reports/:id/auditor", taxAuditController.updateAuditor);
router.post("/tax-audit/reports/:id/clauses/:clauseNo", taxAuditController.updateClause);
router.post("/tax-audit/reports/:id/validate", taxAuditController.validate);
router.get("/tax-audit/reports/:id/download.json", taxAuditController.downloadJson);
router.get("/tax-audit/reports/:id/preview.pdf", taxAuditController.downloadPdf);
router.get("/tax-audit/reports/:id/export.zip", taxAuditController.downloadPackage);

module.exports = router;
