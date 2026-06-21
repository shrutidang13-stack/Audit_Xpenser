const path = require("path");

function pathParts() {
  return String(process.env.PATH || process.env.Path || "")
    .split(path.delimiter)
    .filter(Boolean);
}

function isBundledChromeDriverPath(value) {
  const normalized = String(value || "").toLowerCase();
  return normalized.includes(`${path.sep}node_modules${path.sep}.bin`) ||
    normalized.includes(`${path.sep}node_modules${path.sep}chromedriver`);
}

function preferSeleniumManagerChromeDriver() {
  const cleaned = pathParts().filter((part) => !isBundledChromeDriverPath(part));
  process.env.PATH = cleaned.join(path.delimiter);
  process.env.Path = process.env.PATH;
  delete process.env.webdriver_chrome_driver;
  delete process.env.WEBDRIVER_CHROME_DRIVER;
  delete process.env.SELENIUM_BROWSER_PATH;
}

module.exports = { preferSeleniumManagerChromeDriver };
