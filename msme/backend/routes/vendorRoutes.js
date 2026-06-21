const express = require("express");
const vendorController = require("../controllers/vendorController");

const router = express.Router();

router.get("/unverified", vendorController.unverified);
router.get("/manual-review", vendorController.manualReview);
router.get("/verification-queue", vendorController.verificationQueue);
router.post("/seed-from-import", vendorController.seedFromImport);
router.post("/mark-not-required", vendorController.markNotRequired);
router.post("/udyam-import", vendorController.importUdyam);
router.post("/udyam-import/live", vendorController.importUdyamLive);
router.post("/verify-udyam", vendorController.verifyUdyam);
router.post("/save-status", vendorController.saveStatus);
router.post("/:id/udyam-proof", vendorController.uploadUdyamProof);
router.post("/:id/udyam-approve", vendorController.approveUdyamProof);
router.post("/:id/udyam-reject", vendorController.rejectUdyamProof);
router.post("/:id/proof-review", vendorController.proofReview);
router.get("/master", vendorController.master);
router.get("/audit-trail", vendorController.auditTrail);
router.get("/audit-trail/download", vendorController.auditTrailDownload);

module.exports = router;
