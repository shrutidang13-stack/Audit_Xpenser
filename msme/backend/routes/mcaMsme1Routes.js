const express = require("express");
const mcaMsme1Controller = require("../controllers/mcaMsme1Controller");

const router = express.Router();

router.post("/mca/msme1/preview", mcaMsme1Controller.preview);
router.post("/mca/msme1/generate", mcaMsme1Controller.generate);
router.get("/mca/msme1/filings", mcaMsme1Controller.list);
router.get("/mca/msme1/filings/:id/download", mcaMsme1Controller.download);
router.post("/mca/msme1/filings/:id/srn", mcaMsme1Controller.recordSrn);
router.post("/mca/msme1/upload/start", mcaMsme1Controller.startUpload);
router.post("/mca/msme1/upload-excel", mcaMsme1Controller.uploadExcel);
router.post("/mca/msme1/validate", mcaMsme1Controller.validate);
router.post("/mca/msme1/generate-xml", mcaMsme1Controller.generateXml);
router.get("/mca/msme1/xml/:id/download", mcaMsme1Controller.downloadXml);
router.get("/mca/msme1/filings/:id/validation-report", mcaMsme1Controller.validationReport);

module.exports = router;
