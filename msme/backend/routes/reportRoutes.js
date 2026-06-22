const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.get("/reports", reportController.listReports);
router.post("/reports/msme", reportController.createMSME);
router.get("/reports/:id/integration-summary", reportController.integrationSummary);
router.get("/reports/:id", reportController.getReport);
router.get("/reports/:id/download.csv", reportController.downloadCsv);
router.get("/reports/:id/download.xml", reportController.downloadXml);
router.get("/reports/:id/download.xlsx", reportController.downloadXlsx);
router.get("/reports/:id/download.pdf", reportController.downloadPdf);
router.get("/reports/:id/summary", reportController.summary);
router.get("/reports/:id/ledger-summary", reportController.ledgerSummary);
router.get("/reports/:id/voucher-evidence", reportController.voucherEvidence);
router.get("/reports/:id/tax-disallowance", reportController.taxDisallowance);
router.get("/reports/:id/schedule-iii", reportController.scheduleIII);
router.get("/reports/:id/form-3cd", reportController.form3cd);
router.get("/reports/:id/carry-forward", reportController.carryForward);
router.get("/reports/:id/verification-required", reportController.verificationRequired);
router.get("/reports/:id/evidence-bundle", reportController.evidenceBundle);
router.get("/reports/:id/tally-reconciliation", reportController.tallyReconciliation);

module.exports = router;
