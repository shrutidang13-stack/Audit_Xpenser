const automationService = require("../services/mcaMsme1FilingAutomation.service");

function start(req, res, next) {
  try {
    res.json({ success: true, ...automationService.startAssistedFiling(req.params.filingId, req.body || {}) });
  } catch (error) {
    next(error);
  }
}

function status(req, res, next) {
  try {
    const result = automationService.getStatus(req.params.runId);
    if (!result.run) return res.status(404).json({ success: false, error: "MCA filing automation run not found" });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

function continueRun(req, res, next) {
  try {
    res.json({ success: true, ...automationService.continueAutomation(req.params.runId) });
  } catch (error) {
    next(error);
  }
}

async function abort(req, res, next) {
  try {
    res.json({ success: true, ...(await automationService.abortAutomation(req.params.runId)) });
  } catch (error) {
    next(error);
  }
}

async function captureSrn(req, res, next) {
  try {
    res.json({ success: true, ...(await automationService.captureSrn(req.params.runId, req.body?.srn || "")) });
  } catch (error) {
    next(error);
  }
}

module.exports = { start, status, continueRun, abort, captureSrn };
