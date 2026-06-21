const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");
const mcaMsme1Service = require("./mcaMsme1.service");
const selectors = require("../config/mcaSelectors.json");
const { preferSeleniumManagerChromeDriver } = require("../utils/seleniumChromeDriver");

const MCA_PORTAL_URL = "https://www.mca.gov.in/content/mca/global/en/home.html";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "backend/storage/mca-automation-screenshots");
const STEP_TIMEOUT_MS = 30000;
const NAVIGATION_RETRIES = 2;

const runtimeRuns = new Map();

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function mapRun(row) {
  if (!row) return null;
  return {
    id: row.id,
    filingId: row.filing_id,
    status: row.status,
    currentStep: row.current_step || "",
    message: row.message || "",
    selectedFilePath: row.selected_file_path || "",
    fileTypeUsed: row.file_type_used || "",
    srn: row.srn || "",
    errorMessage: row.error_message || "",
    screenshotPath: row.screenshot_path || "",
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || "",
  };
}

function mapEvent(row) {
  return {
    id: row.id,
    runId: row.run_id,
    eventType: row.event_type,
    stepName: row.step_name || "",
    message: row.message || "",
    createdAt: row.created_at,
  };
}

function getRun(runId) {
  return mapRun(db.prepare("SELECT * FROM mca_filing_automation_runs WHERE id = ?").get(runId));
}

function listEvents(runId) {
  return db.prepare("SELECT * FROM mca_filing_automation_events WHERE run_id = ? ORDER BY created_at ASC").all(runId).map(mapEvent);
}

function addEvent(runId, eventType, stepName, message) {
  db.prepare(`
    INSERT INTO mca_filing_automation_events (id, run_id, event_type, step_name, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), runId, eventType, stepName || "", String(message || ""), nowIso());
}

function updateRun(runId, patch = {}) {
  const current = getRun(runId);
  if (!current) throw new Error("MCA filing automation run not found");
  const next = {
    status: patch.status ?? current.status,
    currentStep: patch.currentStep ?? current.currentStep,
    message: patch.message ?? current.message,
    selectedFilePath: patch.selectedFilePath ?? current.selectedFilePath,
    fileTypeUsed: patch.fileTypeUsed ?? current.fileTypeUsed,
    srn: patch.srn ?? current.srn,
    errorMessage: patch.errorMessage ?? current.errorMessage,
    screenshotPath: patch.screenshotPath ?? current.screenshotPath,
    completedAt: patch.completedAt ?? current.completedAt,
  };
  db.prepare(`
    UPDATE mca_filing_automation_runs
    SET status = ?, current_step = ?, message = ?, selected_file_path = ?, file_type_used = ?,
        srn = ?, error_message = ?, screenshot_path = ?, updated_at = ?, completed_at = ?
    WHERE id = ?
  `).run(
    next.status,
    next.currentStep,
    next.message,
    next.selectedFilePath,
    next.fileTypeUsed,
    next.srn,
    next.errorMessage,
    next.screenshotPath,
    nowIso(),
    next.completedAt || null,
    runId
  );
  addEvent(runId, patch.eventType || next.status, next.currentStep, next.message || next.errorMessage);
  return getRun(runId);
}

function statusWithEvents(runId) {
  return { run: getRun(runId), events: listEvents(runId) };
}

function assertNoSecretPersistence(input = {}) {
  return {
    companyDetails: input.companyDetails || {},
    signatoryDesignation: input.signatoryDesignation || "",
    signatoryId: input.signatoryId || "",
    attachmentPath: input.attachmentPath || "",
  };
}

function validateReadiness(filingId, input = {}) {
  const filing = mcaMsme1Service.getFiling(filingId);
  if (!filing) throw new Error("MCA MSME-1 filing not found");
  if (!filing.generatedFilePath || !fs.existsSync(filing.generatedFilePath)) {
    throw new Error("Please generate MSME-1 Excel/XLSM before filing.");
  }
  const company = input.companyDetails || {};
  if (!company.cin || !company.pan || !company.companyName) {
    throw new Error("Company CIN, PAN and company name are required before assisted filing.");
  }
  if (!filing.fiscalYear || !filing.halfYear) {
    throw new Error("Filing financial year and half-year are required before assisted filing.");
  }
  return filing;
}

function createRun(filing) {
  const timestamp = nowIso();
  const runId = crypto.randomUUID();
  const ext = path.extname(filing.generatedFilePath).replace(".", "").toLowerCase() || "xlsm";
  db.prepare(`
    INSERT INTO mca_filing_automation_runs (
      id, filing_id, status, current_step, message, selected_file_path, file_type_used,
      srn, error_message, screenshot_path, started_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, '', '', '', ?, ?, NULL)
  `).run(
    runId,
    filing.id,
    "started",
    "started",
    "Assisted MCA MSME-1 filing automation started.",
    filing.generatedFilePath,
    ext,
    timestamp,
    timestamp
  );
  addEvent(runId, "started", "started", "Assisted MCA MSME-1 filing automation started.");
  return getRun(runId);
}

function halfYearDates(fiscalYear, halfYear) {
  const startYear = Number(String(fiscalYear || "").slice(0, 4));
  if (!Number.isFinite(startYear)) throw new Error("Valid fiscal year is required.");
  if (halfYear === "apr-sep") return { start: `01/04/${startYear}`, end: `30/09/${startYear}` };
  return { start: `01/10/${startYear}`, end: `31/03/${startYear + 1}` };
}

function extractSrn(text = "") {
  const match = String(text || "").match(/\b[A-Z]{1,3}\d{6,12}\b/i) || String(text || "").match(/\bSRN\s*[:\-]?\s*([A-Z0-9]{6,15})\b/i);
  return match ? String(match[1] || match[0]).toUpperCase().replace(/^SRN\s*[:\-]?\s*/i, "") : "";
}

async function buildDriver() {
  preferSeleniumManagerChromeDriver();
  const { Builder } = require("selenium-webdriver");
  const chrome = require("selenium-webdriver/chrome");
  const options = new chrome.Options();
  options.addArguments("--start-maximized");
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function seleniumBy() {
  return require("selenium-webdriver").By;
}

async function findByText(driver, text) {
  const By = seleniumBy();
  const escaped = String(text).replace(/"/g, '\\"');
  const xpath = `//*[self::a or self::button or self::span or self::div or self::li or self::label][contains(normalize-space(.), "${escaped}")]`;
  const matches = await driver.findElements(By.xpath(xpath));
  for (const match of matches) {
    if (await isInteractable(match)) return match;
  }
  return null;
}

async function isInteractable(element) {
  try {
    return await element.isDisplayed() && await element.isEnabled();
  } catch {
    return false;
  }
}

async function resolveElement(driver, key, timeoutMs = STEP_TIMEOUT_MS) {
  const By = seleniumBy();
  const config = selectors[key] || {};
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const css of config.css || []) {
      const found = await driver.findElements(By.css(css));
      for (const element of found) {
        if (await isInteractable(element)) return element;
      }
    }
    for (const xpath of config.xpath || []) {
      const found = await driver.findElements(By.xpath(xpath));
      for (const element of found) {
        if (await isInteractable(element)) return element;
      }
    }
    for (const text of config.text || []) {
      const found = await findByText(driver, text);
      if (found) return found;
    }
    await sleep(500);
  }
  return null;
}

async function pageText(driver) {
  try {
    return await driver.findElement(seleniumBy().css("body")).getText();
  } catch {
    return "";
  }
}

async function clickIfFound(driver, key) {
  const element = await resolveElement(driver, key);
  if (!element) return false;
  await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", element).catch(() => {});
  await element.click().catch(async () => {
    await driver.executeScript("arguments[0].click();", element);
  });
  return true;
}

async function waitForLoginForm(driver, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await resolveElement(driver, "userId", 500)) return true;
    await sleep(300);
  }
  return false;
}

async function clickLoginOption(driver) {
  const By = seleniumBy();
  const xpath = "//*[self::a or self::button or @role='menuitem' or @role='button'][normalize-space(.)='V3 Login' or normalize-space(.)='Login']";
  const matches = await driver.findElements(By.xpath(xpath));
  for (const match of matches) {
    if (!(await isInteractable(match))) continue;
    await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", match).catch(() => {});
    await match.click().catch(async () => {
      await driver.executeScript("arguments[0].click();", match);
    });
    return true;
  }
  return false;
}

async function openLoginPanel(driver, runId) {
  if (await waitForLoginForm(driver, 1000)) return;
  const clickedLoginRegister = await clickIfFound(driver, "loginRegister");
  if (!clickedLoginRegister) {
    await pauseForManualNavigation(runId, "Please select Login/Register on the MCA portal, then click Continue.");
    return;
  }
  if (await waitForLoginForm(driver)) return;
  await clickLoginOption(driver);
  await waitForLoginForm(driver);
}

async function typeIfFound(driver, key, value) {
  const element = await resolveElement(driver, key);
  if (!element) return false;
  await element.clear().catch(() => {});
  await element.sendKeys(String(value || ""));
  return true;
}

async function selectOrType(driver, key, value) {
  const element = await resolveElement(driver, key);
  if (!element) return false;
  const tagName = await element.getTagName();
  if (tagName === "select") {
    const { Select } = require("selenium-webdriver/lib/select");
    const select = new Select(element);
    await select.selectByVisibleText(String(value || "")).catch(async () => {
      await select.selectByValue(String(value || ""));
    });
    return true;
  }
  await element.clear().catch(() => {});
  await element.sendKeys(String(value || ""));
  return true;
}

async function saveScreenshot(driver, runId, label) {
  if (!driver) return "";
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshotPath = path.join(SCREENSHOT_DIR, `${runId}_${label}_${Date.now()}.png`);
  const image = await driver.takeScreenshot();
  fs.writeFileSync(screenshotPath, image, "base64");
  return screenshotPath;
}

async function waitForUser(runId, status, step, message) {
  updateRun(runId, { status, currentStep: step, message, eventType: status });
  const runtime = runtimeRuns.get(runId);
  if (!runtime) throw new Error("Automation browser session is no longer active.");
  await new Promise((resolve, reject) => {
    runtime.resume = resolve;
    runtime.reject = reject;
  });
}

function runtime(runId) {
  const current = runtimeRuns.get(runId);
  if (!current) throw new Error("Automation browser session is no longer active. Please start a fresh assisted filing run.");
  if (current.aborted) throw new Error("Automation run was aborted.");
  return current;
}

async function pauseForManualNavigation(runId, message) {
  await waitForUser(runId, "manual_action_required", "manual_action_required", message);
}

async function detectCredentialChallenge(driver, runId) {
  const text = await pageText(driver);
  if (/captcha/i.test(text)) {
    await waitForUser(runId, "waiting_for_captcha", "login_security_check", "Please complete CAPTCHA manually on MCA portal and click Continue.");
  }
  const afterCaptcha = await pageText(driver);
  if (/\botp\b|one time password/i.test(afterCaptcha)) {
    await waitForUser(runId, "waiting_for_otp", "login_security_check", "Please enter OTP manually on MCA portal and click Continue.");
  }
}

async function navigateToMcaForm(driver, runId) {
  updateRun(runId, { status: "navigating_to_mca_services", currentStep: "mca_services", message: "Opening MCA Services menu." });
  const clickedServices = await clickIfFound(driver, "mcaServices");
  if (!clickedServices) {
    await pauseForManualNavigation(runId, "Please manually open MCA Services → Company e-Filing → Compliance Services → MSME Form-1, then click Continue.");
    return;
  }
  await sleep(800);
  await clickIfFound(driver, "companyEFiling");
  await sleep(500);
  await clickIfFound(driver, "complianceServices");
  await sleep(500);
  updateRun(runId, { status: "navigating_to_msme_form", currentStep: "msme_form", message: "Opening MSME Half-yearly Return form." });
  const clickedMsme = await clickIfFound(driver, "msmeForm");
  if (!clickedMsme) {
    await pauseForManualNavigation(runId, "Please manually open MCA Services → Company e-Filing → Compliance Services → MSME Form-1, then click Continue.");
  }
}

async function runAutomation(runId, secrets, safeInput) {
  let driver;
  try {
    const run = getRun(runId);
    const filing = mcaMsme1Service.getFiling(run.filingId);
    driver = await buildDriver();
    runtimeRuns.set(runId, { driver, resume: null, reject: null, aborted: false });

    updateRun(runId, { status: "opening_mca", currentStep: "opening_mca", message: "Opening MCA portal in visible Chrome." });
    await driver.get(MCA_PORTAL_URL);

    updateRun(runId, { status: "logging_in", currentStep: "logging_in", message: "Opening MCA login. Complete login manually if prompted." });
    await openLoginPanel(driver, runId);
    const userTyped = secrets.mcaUserId ? await typeIfFound(driver, "userId", secrets.mcaUserId) : false;
    const passwordTyped = secrets.mcaPassword ? await typeIfFound(driver, "password", secrets.mcaPassword) : false;
    if (!userTyped || !passwordTyped) {
      await pauseForManualNavigation(runId, "Please enter MCA User ID/password manually on the visible MCA portal, complete any security check, then click Continue.");
    } else {
      await clickIfFound(driver, "loginButton");
      await detectCredentialChallenge(driver, runId);
    }
    secrets.mcaUserId = "";
    secrets.mcaPassword = "";
    updateRun(runId, { status: "logged_in", currentStep: "logged_in", message: "MCA login step completed. Credentials cleared from memory." });

    runtime(runId);
    await navigateToMcaForm(driver, runId);

    runtime(runId);
    updateRun(runId, { status: "filling_company_details", currentStep: "company_details", message: "Filling CIN and validating company identity." });
    if (!(await typeIfFound(driver, "cin", safeInput.companyDetails.cin))) {
      await pauseForManualNavigation(runId, "Please enter CIN and pre-fill company details manually, then click Continue.");
    } else {
      await clickIfFound(driver, "searchOrPrefill");
      await sleep(2000);
    }
    const companyPageText = await pageText(driver);
    if (companyPageText && safeInput.companyDetails.companyName && !companyPageText.toLowerCase().includes(String(safeInput.companyDetails.companyName).toLowerCase().slice(0, 15))) {
      const screenshotPath = await saveScreenshot(driver, runId, "company_mismatch");
      updateRun(runId, {
        status: "validation_failed",
        currentStep: "company_details",
        message: "MCA company details do not match filing data.",
        errorMessage: "MCA company details do not match filing data.",
        screenshotPath,
        completedAt: nowIso(),
      });
      return;
    }

    runtime(runId);
    const dates = halfYearDates(filing.fiscalYear, filing.halfYear);
    updateRun(runId, { status: "filling_return_period", currentStep: "return_period", message: `Filling return period ${dates.start} to ${dates.end}.` });
    await selectOrType(driver, "returnType", "Periodic Half-yearly return");
    const startOk = await typeIfFound(driver, "startDate", dates.start);
    const endOk = await typeIfFound(driver, "endDate", dates.end);
    if (!startOk || !endOk) {
      await pauseForManualNavigation(runId, `Please fill return period manually as ${dates.start} to ${dates.end}, then click Continue.`);
    }

    runtime(runId);
    updateRun(runId, { status: "uploading_excel", currentStep: "uploading_excel", message: "Uploading generated MSME supplier Excel/XLSM." });
    const upload = await resolveElement(driver, "uploadExcel");
    if (!upload) {
      await pauseForManualNavigation(runId, "Please click Import/Upload Excel and upload the generated MSME-1 Excel/XLSM, then click Continue.");
    } else {
      await upload.sendKeys(filing.generatedFilePath);
      await sleep(3000);
      const text = await pageText(driver);
      if (/error|invalid|failed/i.test(text)) {
        const screenshotPath = await saveScreenshot(driver, runId, "upload_validation");
        updateRun(runId, {
          status: "validation_failed",
          currentStep: "uploading_excel",
          message: "MCA showed a validation error after Excel upload.",
          errorMessage: text.slice(0, 1000),
          screenshotPath,
          completedAt: nowIso(),
        });
        return;
      }
      addEvent(runId, "file_uploaded", "uploading_excel", "MSME supplier Excel uploaded.");
    }

    runtime(runId);
    updateRun(runId, { status: "saving_form", currentStep: "saving_form", message: "Saving MCA form and moving to next section." });
    await clickIfFound(driver, "save");
    await sleep(1500);
    await clickIfFound(driver, "next");

    runtime(runId);
    if (safeInput.attachmentPath) {
      updateRun(runId, { status: "saving_form", currentStep: "attachments", message: "Uploading optional attachment." });
      const attachmentInput = await resolveElement(driver, "attachment");
      if (attachmentInput) await attachmentInput.sendKeys(safeInput.attachmentPath);
      else await pauseForManualNavigation(runId, "Please upload the optional attachment manually, then click Continue.");
    }

    runtime(runId);
    updateRun(runId, { status: "filling_declaration", currentStep: "declaration", message: "Filling declaration and authorized signatory details." });
    const designationOk = safeInput.signatoryDesignation ? await selectOrType(driver, "designation", safeInput.signatoryDesignation) : false;
    const signatoryOk = safeInput.signatoryId ? await typeIfFound(driver, "signatoryId", safeInput.signatoryId) : false;
    if (!designationOk || !signatoryOk) {
      await pauseForManualNavigation(runId, "Please complete declaration/signatory details manually, then click Continue.");
    }
    await clickIfFound(driver, "checkForm");
    await sleep(2000);
    const validationText = await pageText(driver);
    if (/error|invalid|required|failed/i.test(validationText)) {
      const screenshotPath = await saveScreenshot(driver, runId, "declaration_validation");
      updateRun(runId, {
        status: "validation_failed",
        currentStep: "filling_declaration",
        message: "MCA validation failed before DSC.",
        errorMessage: validationText.slice(0, 1000),
        screenshotPath,
        completedAt: nowIso(),
      });
      return;
    }

    runtime(runId);
    await waitForUser(runId, "waiting_for_dsc", "dsc_signing", "Please select DSC and complete signing manually on MCA portal. Do not close Chrome. After DSC signing is complete, click Continue in MSME Guard.");
    runtime(runId);
    await waitForUser(runId, "waiting_for_final_submission", "final_submission", "Please review all MCA details and complete final submission manually. After successful submission, click Capture SRN in MSME Guard.");
    updateRun(runId, { status: "srn_capture_pending", currentStep: "srn_capture", message: "Final submission is manual. Click Capture SRN after MCA shows acknowledgement." });
  } catch (error) {
    let screenshotPath = "";
    try {
      screenshotPath = await saveScreenshot(driver, runId, "error");
    } catch {
      screenshotPath = "";
    }
    updateRun(runId, {
      status: "error",
      currentStep: getRun(runId)?.currentStep || "error",
      message: error.message,
      errorMessage: error.message,
      screenshotPath,
      completedAt: nowIso(),
      eventType: "error",
    });
  }
}

function startAssistedFiling(filingId, input = {}) {
  const filing = validateReadiness(filingId, input);
  const safeInput = assertNoSecretPersistence(input);
  const run = createRun(filing);
  setImmediate(() => {
    runAutomation(run.id, { mcaUserId: input.mcaUserId, mcaPassword: input.mcaPassword }, safeInput);
  });
  return statusWithEvents(run.id);
}

function continueAutomation(runId) {
  const current = runtimeRuns.get(runId);
  if (!current?.resume) {
    const run = getRun(runId);
    if (!run) throw new Error("MCA filing automation run not found");
    if (["completed", "aborted", "validation_failed", "error"].includes(run.status)) return statusWithEvents(runId);
    throw new Error("Automation is not currently waiting for Continue, or the browser session was lost.");
  }
  const resume = current.resume;
  current.resume = null;
  resume();
  updateRun(runId, { status: "started", currentStep: "resumed", message: "User continued assisted filing automation.", eventType: "continued" });
  return statusWithEvents(runId);
}

async function abortAutomation(runId) {
  const current = runtimeRuns.get(runId);
  if (current) {
    current.aborted = true;
    if (current.reject) current.reject(new Error("Automation run was aborted."));
    await current.driver?.quit().catch(() => {});
    runtimeRuns.delete(runId);
  }
  updateRun(runId, { status: "aborted", currentStep: "aborted", message: "Assisted MCA filing automation aborted by user.", completedAt: nowIso(), eventType: "aborted" });
  return statusWithEvents(runId);
}

async function captureSrn(runId, manualSrn = "") {
  const run = getRun(runId);
  if (!run) throw new Error("MCA filing automation run not found");
  const current = runtimeRuns.get(runId);
  let srn = String(manualSrn || "").trim().toUpperCase();
  if (!srn && current?.driver) srn = extractSrn(await pageText(current.driver));
  if (!srn) {
    updateRun(runId, { status: "srn_capture_pending", currentStep: "srn_capture", message: "SRN was not detected. Enter SRN manually and click Capture SRN again." });
    return { ...statusWithEvents(runId), srnDetected: false };
  }
  mcaMsme1Service.recordSrn(run.filingId, { srn, actor: "mca-assisted-automation" });
  if (current?.driver) {
    await current.driver.quit().catch(() => {});
    runtimeRuns.delete(runId);
  }
  updateRun(runId, { status: "completed", currentStep: "completed", message: `SRN ${srn} captured and saved.`, srn, completedAt: nowIso(), eventType: "completed" });
  return { ...statusWithEvents(runId), srnDetected: true };
}

module.exports = {
  NAVIGATION_RETRIES,
  STEP_TIMEOUT_MS,
  startAssistedFiling,
  getStatus: statusWithEvents,
  continueAutomation,
  abortAutomation,
  captureSrn,
  validateReadiness,
  halfYearDates,
  extractSrn,
  _private: { createRun, updateRun, addEvent, runtimeRuns },
};
