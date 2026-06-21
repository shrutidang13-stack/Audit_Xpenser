const { loadRulePack } = require("../services/msmeRuleEngine.service");

function getRulePack(req, res, next) {
  try {
    res.json({ success: true, rulePack: loadRulePack() });
  } catch (error) {
    next(error);
  }
}

module.exports = { getRulePack };
