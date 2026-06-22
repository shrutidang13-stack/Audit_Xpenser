const express = require("express");
const tallyController = require("../controllers/tallyController");

const router = express.Router();

router.get("/status", tallyController.status);
router.get("/tally/health", tallyController.health);
router.get("/tally/company-context", tallyController.companyContext);
router.get("/tally/import/status", tallyController.importStatus);
router.post("/tally/import", tallyController.importTally);
router.get("/tally/imports", tallyController.listImports);
router.get("/tally/imports/latest/summary", tallyController.getLatestCompletedImportSummary);
router.get("/tally/imports/latest", tallyController.getLatestCompletedImport);
router.get("/tally/imports/:id/statements/summary", tallyController.getStatementSummary);
router.get("/tally/imports/:id/daybook", tallyController.getDaybook);
router.get("/tally/imports/:id/trial-balance", tallyController.getTrialBalance);
router.get("/tally/imports/:id/balance-sheet", tallyController.getBalanceSheet);
router.get("/tally/imports/:id/profit-loss", tallyController.getProfitLoss);
router.get("/tally/imports/:id/ledger-vouchers", tallyController.getLedgerVouchers);
router.get("/tally/imports/:id", tallyController.getImport);

module.exports = router;
