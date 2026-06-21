const { calculateMSMEInterest } = require("../services/interestCalculator.service");

function interestCalculator(req, res, next) {
  try {
    const result = calculateMSMEInterest(req.body || {});
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  interestCalculator,
};
