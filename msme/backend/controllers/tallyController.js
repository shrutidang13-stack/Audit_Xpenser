const tallyService = require("../services/tally.service");
const tallyImportService = require("../services/tallyImport.service");
const importRepository = require("../repositories/importRepository");
const { actorFromUser } = require("../middleware/auth");

let currentImport = null;

function importStatusPayload() {
  return {
    running: Boolean(currentImport),
    currentImport,
  };
}

async function status(req, res, next) {
  try {
    res.json(await tallyService.checkStatus());
  } catch (error) {
    res.json({ online: false, tallyConnected: false, message: error.message });
  }
}

async function health(req, res, next) {
  try {
    res.json(await tallyService.tallyHealth({ companyName: req.query?.companyName }));
  } catch (error) {
    next(error);
  }
}

async function companyContext(req, res, next) {
  try {
    res.json(await tallyService.companyContextStatus({ companyName: req.query?.companyName }));
  } catch (error) {
    next(error);
  }
}

async function importStatus(req, res) {
  res.json({ success: true, ...importStatusPayload() });
}

async function importTally(req, res, next) {
  if (currentImport) {
    return res.status(409).json({
      success: false,
      error: "A Tally import is already running. Please wait for it to finish before starting another import.",
      ...importStatusPayload(),
    });
  }

  const { periodType, fiscalYear, fromDate, toDate, asOn, capToAsOn, companyName } = req.body || {};
  currentImport = {
    startedAt: new Date().toISOString(),
    periodType: periodType || "",
    fiscalYear: fiscalYear || "",
    fromDate: fromDate || "",
    toDate: toDate || "",
    asOn: asOn || "",
    companyName: companyName || "",
  };
  try {
    if (!fiscalYear || !fromDate || !toDate) {
      return res.status(400).json({ success: false, error: "fiscalYear, fromDate, and toDate are required" });
    }
    const result = await tallyImportService.importFromTally({
      fiscalYear,
      periodType,
      fromDate,
      toDate,
      asOn,
      capToAsOn,
      companyName,
      actor: actorFromUser(req),
    });
    res.json(result);
  } catch (error) {
    next(error);
  } finally {
    currentImport = null;
  }
}

async function getDaybook(req, res, next) {
  try {
    const result = tallyImportService.getDaybook(req.params.id, req.query || {});
    if (!result) return res.status(404).json({ success: false, error: "Import run not found" });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

function statementHandler(type) {
  return (req, res, next) => {
    try {
      const result = tallyImportService.getStatement(req.params.id, type, req.query || {});
      if (!result) return res.status(404).json({ success: false, error: "Import run not found" });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}

async function getImport(req, res, next) {
  try {
    const result = tallyImportService.getImportRun(req.params.id, req.query || {});
    if (!result) return res.status(404).json({ success: false, error: "Import run not found" });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getLatestCompletedImport(req, res, next) {
  try {
    const result = tallyImportService.getLatestCompletedImportRun(req.query || {});
    if (!result) return res.status(404).json({ success: false, error: "No completed Tally import found" });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getLatestCompletedImportSummary(req, res, next) {
  try {
    const result = tallyImportService.getLatestCompletedImportSummary();
    if (!result) return res.status(404).json({ success: false, error: "No completed Tally import found" });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function downloadLatestCompletedImportXml(req, res, next) {
  try {
    const result = tallyImportService.latestCompletedImportXml();
    if (!result) return res.status(404).json({ success: false, error: "No completed Tally import found" });
    const safeRunId = String(result.run.id || "latest").replace(/[^a-zA-Z0-9_-]/g, "-");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="tally-import-${safeRunId}.xml"`);
    res.setHeader("X-Tally-Import-Run-Id", String(result.run.id || ""));
    res.setHeader("X-Tally-Voucher-Count", String(result.voucherCount));
    res.setHeader("X-Tally-Creditor-Count", String(result.creditorCount));
    res.send(result.xml);
  } catch (error) {
    next(error);
  }
}

async function getStatementSummary(req, res, next) {
  try {
    const result = tallyImportService.getStatementSummary(req.params.id, req.query || {});
    if (!result) return res.status(404).json({ success: false, error: "Import run not found" });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getLedgerVouchers(req, res, next) {
  try {
    const result = tallyImportService.getLedgerVouchers(req.params.id, req.query || {});
    if (!result) return res.status(404).json({ success: false, error: "Import run not found" });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function listImports(req, res, next) {
  try {
    res.json({ success: true, imports: importRepository.listRuns() });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  status,
  health,
  companyContext,
  importStatus,
  importTally,
  getLatestCompletedImport,
  getLatestCompletedImportSummary,
  downloadLatestCompletedImportXml,
  getStatementSummary,
  getImport,
  getLedgerVouchers,
  getDaybook,
  getTrialBalance: statementHandler("trial-balance"),
  getBalanceSheet: statementHandler("balance-sheet"),
  getProfitLoss: statementHandler("profit-loss"),
  listImports,
};
