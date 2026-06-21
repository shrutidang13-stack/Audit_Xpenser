const express = require("express");
const msmeController = require("../controllers/msmeController");

const router = express.Router();

router.post("/msme/interest-calculator", msmeController.interestCalculator);

module.exports = router;
