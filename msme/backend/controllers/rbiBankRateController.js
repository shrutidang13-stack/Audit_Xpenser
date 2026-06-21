const rbiBankRateService = require("../services/rbiBankRate.service");
const { actorFromUser } = require("../middleware/auth");

async function updateOfficial(req, res, next) {
  try {
    const result = await rbiBankRateService.updateFromOfficialSource({
      actor: actorFromUser(req),
      sourceUrl: req.body?.sourceUrl || rbiBankRateService.DICGC_BANK_RATE_URL,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

function list(req, res, next) {
  try {
    res.json({
      success: true,
      rates: rbiBankRateService.listRates(),
      latest: rbiBankRateService.getLatestRate(),
    });
  } catch (error) {
    next(error);
  }
}

function manualOverride(req, res, next) {
  try {
    const rate = rbiBankRateService.createManualOverride(req.body || {}, actorFromUser(req));
    res.json({
      success: true,
      rate,
      latest: rbiBankRateService.getLatestRate(),
      rates: rbiBankRateService.listRates(),
    });
  } catch (error) {
    next(error);
  }
}

function auditLog(req, res, next) {
  try {
    res.json({ success: true, auditLog: rbiBankRateService.listAuditLog() });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateOfficial,
  list,
  manualOverride,
  auditLog,
};
