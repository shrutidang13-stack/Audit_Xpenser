const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const puppeteer = require("puppeteer");
const env = require("../config/env");
const { preferSeleniumManagerChromeDriver } = require("../utils/seleniumChromeDriver");

const UDYAM_FORMAT = /^UDYAM-([A-Z]{2})-(\d{2})-(\d{7})$/i;
const execFileAsync = promisify(execFile);

function validateUdyamNumber(udyamNumber) {
  const match = String(udyamNumber || "").trim().toUpperCase().match(UDYAM_FORMAT);
  if (!match) return false;
  const [, state, district, serial] = match;
  if (state === "XX" || district === "00" || serial === "0000000") return false;
  return true;
}

function parsePortalText(pageText) {
  const text = pageText || "";
  const lower = text.toLowerCase();
  if (lower.includes("captcha") || lower.includes("enter verification code")) {
    return {
      verified: false,
      verificationStatus: "manual_fallback_required",
      captchaRequired: true,
      error: "Udyam portal requires captcha/manual verification.",
    };
  }
  if (lower.includes("invalid") || lower.includes("not found") || lower.includes("incorrect")) {
    return {
      verified: false,
      verificationStatus: "not_verified",
      error: "Invalid or unavailable Udyam registration.",
    };
  }

  let enterpriseType = "";
  if (lower.includes("micro")) enterpriseType = "Micro";
  else if (lower.includes("small")) enterpriseType = "Small";
  else if (lower.includes("medium")) enterpriseType = "Medium";

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const enterpriseNameLine = lines.find((line) =>
    /enterprise|organisation|organization|name/i.test(line) && !/type|classification/i.test(line)
  );
  const registrationDateLine = lines.find((line) => /date.*registration|registration.*date/i.test(line));
  const validityLine = lines.find((line) => /valid|active|inactive/i.test(line));

  return {
    verified: Boolean(enterpriseType),
    verificationStatus: enterpriseType ? "verified" : "manual_fallback_required",
    enterpriseName: enterpriseNameLine || "",
    enterpriseType,
    registrationValidity: validityLine || (enterpriseType ? "Active/visible on portal" : ""),
    registrationDate: registrationDateLine || "",
    rawText: lines.slice(0, 30).join(" | "),
  };
}

async function saveFailureScreenshot(page, udyamNumber, attempt) {
  await fs.mkdir(path.resolve(process.cwd(), env.udyamFailureDir), { recursive: true });
  const fileName = `${String(udyamNumber).replace(/[^A-Z0-9-]/gi, "_")}_attempt_${attempt}_${Date.now()}.png`;
  const fullPath = path.resolve(process.cwd(), env.udyamFailureDir, fileName);
  await page.screenshot({ path: fullPath, fullPage: true });
  return fullPath;
}

async function solveCaptchaWithEasyOcr(imagePath) {
  if (!env.udyamOcrEnabled) return { success: false, text: "", error: "OCR disabled" };
  const scriptPath = path.resolve(process.cwd(), "backend/scripts/solve_udyam_captcha_easyocr.py");
  try {
    const { stdout } = await execFileAsync(env.udyamOcrPython, [scriptPath, imagePath], { timeout: 60000 });
    return JSON.parse(stdout || "{}");
  } catch (error) {
    return { success: false, text: "", error: error.message };
  }
}

async function saveSeleniumScreenshot(driver, udyamNumber, attempt) {
  await fs.mkdir(path.resolve(process.cwd(), env.udyamFailureDir), { recursive: true });
  const fileName = `${String(udyamNumber).replace(/[^A-Z0-9-]/gi, "_")}_selenium_attempt_${attempt}_${Date.now()}.png`;
  const fullPath = path.resolve(process.cwd(), env.udyamFailureDir, fileName);
  const image = await driver.takeScreenshot();
  await fs.writeFile(fullPath, image, "base64");
  return fullPath;
}

async function saveSeleniumElementImage(element, udyamNumber, attempt) {
  await fs.mkdir(path.resolve(process.cwd(), env.udyamFailureDir), { recursive: true });
  const fileName = `${String(udyamNumber).replace(/[^A-Z0-9-]/gi, "_")}_captcha_${attempt}_${Date.now()}.png`;
  const fullPath = path.resolve(process.cwd(), env.udyamFailureDir, fileName);
  const image = await element.takeScreenshot(true);
  await fs.writeFile(fullPath, image, "base64");
  return fullPath;
}

async function verifyOnceWithSelenium(udyamNumber, attempt) {
  let webdriver;
  let chrome;
  try {
    preferSeleniumManagerChromeDriver();
    webdriver = require("selenium-webdriver");
    chrome = require("selenium-webdriver/chrome");
  } catch (error) {
    return {
      verified: false,
      verificationStatus: "selenium_unavailable",
      error: `Selenium runtime is unavailable: ${error.message}`,
    };
  }

  const { Builder, By, Key, until } = webdriver;
  const options = new chrome.Options();
  options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu");
  let driver;
  try {
    driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
    await driver.manage().setTimeouts({ implicit: 3000, pageLoad: 45000, script: 15000 });
    await driver.get("https://udyamregistration.gov.in/Udyam_Verify.aspx");

    const inputs = await driver.findElements(By.css("input"));
    const textInputs = [];
    for (const input of inputs) {
      const type = String(await input.getAttribute("type") || "text").toLowerCase();
      if (!["submit", "button", "hidden", "checkbox", "radio"].includes(type)) textInputs.push(input);
    }
    if (!textInputs.length) {
      return {
        verified: false,
        verificationStatus: "manual_fallback_required",
        captchaRequired: true,
        screenshotPath: await saveSeleniumScreenshot(driver, udyamNumber, attempt),
        error: "Portal input field not available.",
      };
    }

    await textInputs[0].clear();
    await textInputs[0].sendKeys(udyamNumber.trim());

    const captchaElements = await driver.findElements(By.css("img[src*='Captcha'], img[id*='Captcha'], img[alt*='Captcha'], canvas"));
    if (captchaElements.length && textInputs[1]) {
      const captchaPath = await saveSeleniumElementImage(captchaElements[0], udyamNumber, attempt);
      const solved = await solveCaptchaWithEasyOcr(captchaPath);
      if (solved.success && solved.text) {
        await textInputs[1].clear();
        await textInputs[1].sendKeys(solved.text);
      } else {
        return {
          verified: false,
          verificationStatus: "manual_fallback_required",
          captchaRequired: true,
          screenshotPath: await saveSeleniumScreenshot(driver, udyamNumber, attempt),
          captchaImagePath: captchaPath,
          error: solved.error || "CAPTCHA OCR did not produce a usable answer.",
        };
      }
    }

    const buttons = await driver.findElements(By.css("input[type='submit'], button[type='submit'], input[type='button'], button"));
    if (buttons.length) await buttons[0].click();
    else await textInputs[0].sendKeys(Key.ENTER);
    await driver.wait(until.elementLocated(By.css("body")), 15000).catch(() => null);
    await driver.sleep(2500);
    const body = await driver.findElement(By.css("body"));
    const pageText = await body.getText();
    const parsed = parsePortalText(pageText);
    if (!parsed.verified && parsed.verificationStatus !== "not_verified") {
      parsed.screenshotPath = await saveSeleniumScreenshot(driver, udyamNumber, attempt);
    }
    return {
      ...parsed,
      automationEngine: "selenium_easyocr",
    };
  } finally {
    if (driver) await driver.quit().catch(() => {});
  }
}

async function verifyOnce(udyamNumber, attempt) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    );
    await page.goto("https://udyamregistration.gov.in/Udyam_Verify.aspx", {
      waitUntil: "networkidle2",
      timeout: 45000,
    });

    const inputSelector = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input"));
      const candidate = inputs.find((input) => {
        const type = (input.type || "").toLowerCase();
        return !["submit", "button", "hidden", "checkbox", "radio"].includes(type);
      });
      if (!candidate) return "";
      return candidate.id ? `#${candidate.id}` : `input[name="${candidate.name}"]`;
    });

    if (!inputSelector) {
      const screenshotPath = await saveFailureScreenshot(page, udyamNumber, attempt);
      return {
        verified: false,
        verificationStatus: "manual_fallback_required",
        captchaRequired: true,
        screenshotPath,
        error: "Portal input field not available. Captcha or anti-bot protection may be active.",
      };
    }

    await page.click(inputSelector, { clickCount: 3 });
    await page.type(inputSelector, udyamNumber.trim(), { delay: 20 });
    await Promise.allSettled([
      page.click("input[type='submit'], button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const pageText = await page.evaluate(() => document.body.innerText);
    const parsed = parsePortalText(pageText);
    if (!parsed.verified && parsed.verificationStatus !== "not_verified") {
      parsed.screenshotPath = await saveFailureScreenshot(page, udyamNumber, attempt);
    }
    return parsed;
  } finally {
    if (browser) await browser.close();
  }
}

async function verifyUdyamNumber(udyamNumber, options = {}) {
  const cleaned = String(udyamNumber || "").trim().toUpperCase();
  if (!validateUdyamNumber(cleaned)) {
    return {
      udyamNumber: cleaned,
      verified: false,
      verificationStatus: "invalid_format",
      error: "Invalid format. Use UDYAM-XX-00-0000000.",
    };
  }

  const retries = Number(options.retries ?? 2);
  let lastResult = null;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      lastResult = env.udyamVerifierEngine === "selenium"
        ? await verifyOnceWithSelenium(cleaned, attempt)
        : await verifyOnce(cleaned, attempt);
      if (lastResult?.verificationStatus === "selenium_unavailable") {
        lastResult = await verifyOnce(cleaned, attempt);
      }
      if (lastResult.verified || lastResult.verificationStatus === "not_verified") break;
    } catch (error) {
      lastResult = {
        verified: false,
        verificationStatus: "failed",
        error: error.message,
      };
    }
  }

  return {
    udyamNumber: cleaned,
    verified: Boolean(lastResult?.verified),
    verificationStatus: lastResult?.verificationStatus || "failed",
    enterpriseName: lastResult?.enterpriseName || "",
    enterpriseType: lastResult?.enterpriseType || "",
    registrationValidity: lastResult?.registrationValidity || "",
    registrationDate: lastResult?.registrationDate || "",
    captchaRequired: Boolean(lastResult?.captchaRequired),
    screenshotPath: lastResult?.screenshotPath || "",
    captchaImagePath: lastResult?.captchaImagePath || "",
    automationEngine: lastResult?.automationEngine || (env.udyamVerifierEngine === "selenium" ? "selenium_easyocr" : "puppeteer"),
    error: lastResult?.error || "",
    verifiedAt: lastResult?.verified ? new Date().toISOString() : "",
  };
}

module.exports = { verifyUdyamNumber, validateUdyamNumber };
