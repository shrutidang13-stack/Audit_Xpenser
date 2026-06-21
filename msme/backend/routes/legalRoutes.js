const express = require("express");
const legalController = require("../controllers/legalController");

const router = express.Router();

router.get("/legal/rules", legalController.getRulePack);

module.exports = router;
