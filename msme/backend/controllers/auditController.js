const db = require("../config/database");
const { firebaseConfigStatus, actorFromUser } = require("../middleware/auth");
const tallyService = require("../services/tally.service");
const tallyImportService = require("../services/tallyImport.service");
const reportService = require("../services/report.service");
const vendorRepository = require("../repositories/vendorRepository");
const { verifyUdyamNumber } = require("../services/udyamVerifier.service");

async function runFullAudit(req, res, next) {
  try {
    const actor = actorFromUser(req);
    const {
      fiscalYear = "2025-26",
      fromDate = "20250401",
      toDate = "20260331",
      asOn,
    } = req.body || {};

    const databaseConnected = Boolean(db.prepare("SELECT 1 AS ok").get().ok);
    const firebase = firebaseConfigStatus();
    const tallyHealth = await tallyService.tallyHealth();

    let importResult = null;
    let report = null;
    let reportError = "";
    let udyamVerified = 0;
    let manualReviewRequired = 0;

    if (tallyHealth.reachable && tallyHealth.companyLoaded) {
      importResult = await tallyImportService.importFromTally({ fiscalYear, fromDate, toDate, asOn, actor });

      for (const creditor of importResult.creditors) {
        let master = creditor.vendorMaster;
        if (!master) {
          master = vendorRepository.upsertVendorStatus(
            {
              vendorName: creditor.party,
              isMSME: false,
              verificationStatus: "pending",
              udyamStatus: "not_started",
            },
            actor,
            "run_full_audit_vendor_created"
          );
        }

        if (master?.udyamNumber && !["verified", "approved"].includes(master.udyamStatus)) {
          const verification = await verifyUdyamNumber(master.udyamNumber, { retries: 1 });
          master = vendorRepository.updateVendorById(
            master.id,
            {
              isMSME: verification.verified,
              udyamNumber: verification.udyamNumber,
              enterpriseName: verification.enterpriseName,
              enterpriseType: verification.enterpriseType,
              verificationStatus: verification.verified ? "verified" : verification.verificationStatus,
              udyamStatus: verification.verified ? "verified" : "manual_fallback_required",
              registrationValidity: verification.registrationValidity,
              registrationDate: verification.registrationDate,
              verifiedAt: verification.verifiedAt,
              lastVerifiedAt: new Date().toISOString(),
              udyamRemarks: verification.verified ? "" : verification.error || "Udyam automation did not produce a certain result.",
            },
            actor,
            "run_full_audit_udyam"
          );
          vendorRepository.recordVerificationAttempt({
            vendorId: master.id,
            vendorName: master.vendorName,
            udyamNumber: verification.udyamNumber,
            status: verification.verificationStatus,
            response: verification,
            screenshotPath: verification.screenshotPath,
            actor,
          });
        }
        if (master?.udyamStatus === "verified" || master?.udyamStatus === "approved") udyamVerified += 1;
        else manualReviewRequired += 1;
      }

      try {
        report = reportService.createMSMEReport({ importRunId: importResult.importRun.id, actor });
      } catch (error) {
        reportError = error.message;
      }
    }

    const vendorsImported = importResult?.creditors?.length || 0;
    const excludedFromReport = report?.summary?.excludedFromReport ?? vendorsImported - (report?.summary?.reportVendors || 0);

    res.json({
      success: Boolean(databaseConnected && tallyHealth.reachable),
      databaseConnected,
      firebaseConfigured: firebase.productionReady || firebase.authDisabled,
      firebase,
      tallyConnected: Boolean(tallyHealth.reachable && tallyHealth.companyLoaded),
      tallyHealth,
      vendorsImported,
      udyamVerified,
      manualReviewRequired,
      excludedFromReport,
      reportsGenerated: report ? ["csv", "xml"] : [],
      reportId: report?.id || "",
      reportError,
      message: report
        ? `Audit completed. ${manualReviewRequired} vendors require manual Udyam review.`
        : `Audit completed but report was not generated. ${reportError || "Resolve Tally/Udyam readiness first."}`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { runFullAudit };
