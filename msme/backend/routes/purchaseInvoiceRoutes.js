const express = require("express");
const purchaseInvoiceController = require("../controllers/purchaseInvoiceController");

const router = express.Router();

router.get("/purchase-invoices", purchaseInvoiceController.list);
router.post("/purchase-invoices", purchaseInvoiceController.create);
router.post("/purchase-invoices/bulk", purchaseInvoiceController.bulkCreate);
router.post("/purchase-invoices/import-tally", purchaseInvoiceController.importFromTally);
router.post("/purchase-invoices/:id/verify-udyam", purchaseInvoiceController.verifyInvoiceUdyam);

module.exports = router;
