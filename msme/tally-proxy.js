// LEGACY ONLY: MSME Guard now uses backend/server.js as the primary Express backend.
// Keep this file only for historical/manual raw Tally proxy debugging.
const http = require("http");
const puppeteer = require("puppeteer");

const PORT = Number(process.env.LEGACY_TALLY_PROXY_PORT || 3002);
const TALLY_HOST = "localhost";
const TALLY_PORT = 9000;

// ─── Tally Request Helper ─────────────────────────────────────────────────────

function tallyRequest(xmlBody) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TALLY_HOST,
      port: TALLY_PORT,
      path: "/",
      method: "POST",
      headers: {
        "Content-Type": "text/xml;charset=utf-8",
        "Content-Length": Buffer.byteLength(xmlBody, "utf8"),
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error("Tally timeout after 60s"));
    });
    req.write(xmlBody, "utf8");
    req.end();
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(raw) {
  if (!raw || raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function parseQuery(url) {
  const params = {};
  const idx = url.indexOf("?");
  if (idx === -1) return params;
  url.slice(idx + 1).split("&").forEach((p) => {
    const [k, v] = p.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
  });
  return params;
}

function cleanName(name) {
  return (name || "")
    .replace(/&#13;&#10;/g, "")
    .replace(/&#13;/g, "")
    .replace(/&#10;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

// ─── XML Builders ─────────────────────────────────────────────────────────────

// No company parameter — uses currently open company in TallyPrime
function buildGroupSummaryXML(from, to, groupName) {
  return `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Group Summary</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><SVFROMDATE>${from}</SVFROMDATE><SVTODATE>${to}</SVTODATE><GROUPNAME>${groupName}</GROUPNAME></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
}

// No company parameter — uses currently open company in TallyPrime
function buildDayBookXML(from, to) {
  return `<?xml version="1.0" encoding="utf-8"?><ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Day Book</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><SVFROMDATE>${from}</SVFROMDATE><SVTODATE>${to}</SVTODATE></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseGroupSummary(xml) {
  const creditors = [];
  const blocks = xml.split("<DSPACCNAME>");
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const nameMatch = block.match(/<DSPDISPNAME>([\s\S]*?)<\/DSPDISPNAME>/);
    if (!nameMatch) continue;
    const name = cleanName(nameMatch[1]);
    if (!name) continue;
    const crMatch = block.match(/<DSPCLCRAMTA>([\s\S]*?)<\/DSPCLCRAMTA>/);
    const drMatch = block.match(/<DSPCLDRAMTA>([\s\S]*?)<\/DSPCLDRAMTA>/);
    const crAmt = crMatch ? parseFloat(crMatch[1].trim()) || 0 : 0;
    const drAmt = drMatch ? parseFloat(drMatch[1].trim()) || 0 : 0;
    const outstanding = Math.abs(crAmt) - Math.abs(drAmt);
    if (outstanding > 0) {
      creditors.push({
        name,
        outstandingAmount: Math.round(outstanding * 100) / 100,
      });
    }
  }
  return creditors.sort((a, b) => b.outstandingAmount - a.outstandingAmount);
}

function parseVouchers(xml, filterType) {
  const vouchers = [];
  const re = /<VOUCHER\s[^>]*VCHTYPE="([^"]+)"[^>]*>([\s\S]*?)<\/VOUCHER>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const vchType = m[1];
    if (filterType && vchType !== filterType) continue;
    const block = m[2];
    const get = (tag) =>
      block.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`))?.[1]?.trim() || "";
    const date = get("DATE");
    const party = cleanName(get("PARTYLEDGERNAME"));
    if (!date || !party) continue;
    const amounts = [...block.matchAll(/<AMOUNT>([\-\d\.]+)<\/AMOUNT>/g)].map((a) =>
      parseFloat(a[1])
    );
    const amount = Math.abs(amounts.find((a) => a !== 0) || 0);
    vouchers.push({
      date: formatDate(date),
      vchType,
      party,
      voucherNumber: get("VOUCHERNUMBER"),
      amount,
    });
  }
  return vouchers;
}

// ─── FIFO Aging Engine ────────────────────────────────────────────────────────

function computeFIFOAging(purchases, payments, asOn) {
  const asOnDate = new Date(asOn || new Date());
  const parties = {};
  for (const p of purchases) {
    if (!parties[p.party]) parties[p.party] = { purchases: [], payments: [] };
    parties[p.party].purchases.push({ ...p });
  }
  for (const p of payments) {
    if (!parties[p.party]) parties[p.party] = { purchases: [], payments: [] };
    parties[p.party].payments.push({ ...p });
  }
  const agingMap = {};
  for (const [partyName, data] of Object.entries(parties)) {
    if (!data.purchases.length) continue;
    const invoices = [...data.purchases]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((p) => ({ ...p, remaining: p.amount, paid: 0 }));
    const pmts = [...data.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const pmt of pmts) {
      let left = pmt.amount;
      for (const inv of invoices) {
        if (left <= 0 || inv.remaining <= 0) continue;
        const applied = Math.min(inv.remaining, left);
        inv.remaining -= applied;
        inv.paid += applied;
        left -= applied;
      }
    }
    const outstanding = invoices.filter((inv) => inv.remaining >= 1);
    if (!outstanding.length) continue;
    const days = Math.floor((asOnDate - new Date(outstanding[0].date)) / 86400000);
    const isDisallowed = days > 45;
    const bucket =
      days <= 30 ? "0-30 days" :
      days <= 45 ? "31-45 days" :
      days <= 60 ? "46-60 days" :
      days <= 90 ? "61-90 days" : "90+ days";
    agingMap[partyName] = {
      oldestInvoiceDate: outstanding[0].date,
      daysOutstanding: days,
      bucket,
      isDisallowed,
      section: "43B(h) IT Act 1961",
    };
  }
  return agingMap;
}

// ─── Udyam Verification ───────────────────────────────────────────────────────

async function verifyUdyam(udyamNumber) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
    await page.goto("https://udyamregistration.gov.in/Udyam_Verify.aspx", {
      waitUntil: "networkidle2", timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 3000));
    const allInputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input")).map((i) => ({
        id: i.id, name: i.name, type: i.type, placeholder: i.placeholder,
      }))
    );
    const textInput = allInputs.find(
      (i) => i.type !== "submit" && i.type !== "button" && i.type !== "hidden" && i.type !== "checkbox" && i.type !== "radio"
    );
    if (!textInput) throw new Error("Portal did not load input field — anti-bot protection active");
    const selector = textInput.id ? `#${textInput.id}` : `input[name="${textInput.name}"]`;
    await page.click(selector, { clickCount: 3 });
    await page.type(selector, udyamNumber.trim());
    await page.click("input[type='submit'], button[type='submit']");
    await new Promise((r) => setTimeout(r, 4000));
    const result = await page.evaluate(() => {
      const pageText = document.body.innerText;
      if (pageText.includes("Invalid") || pageText.includes("Not Found") || pageText.includes("incorrect")) {
        return { valid: false, error: "Invalid Udyam Number" };
      }
      let msmeType = "Unknown";
      const t = pageText.toLowerCase();
      if (t.includes("micro")) msmeType = "Micro";
      else if (t.includes("small")) msmeType = "Small";
      else if (t.includes("medium")) msmeType = "Medium";
      const lines = pageText.split("\n").map((l) => l.trim()).filter(Boolean);
      return { valid: true, msmeType, rawText: lines.slice(0, 20).join(" | ") };
    });
    return result;
  } finally {
    await browser.close();
  }
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  const urlPath = req.url.split("?")[0];
  const query = parseQuery(req.url);

  const sendJSON = (d, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(d));
  };
  const sendError = (msg) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: msg }));
  };

  // ── POST / — raw XML proxy ──────────────────────────────────────────────────
  if (req.method === "POST" && urlPath === "/") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const data = await tallyRequest(body);
        res.writeHead(200, { "Content-Type": "text/xml" });
        res.end(data);
      } catch (e) { sendError(e.message); }
    });
    return;
  }

  // ── GET /api/status ─────────────────────────────────────────────────────────
  if (req.method === "GET" && urlPath === "/api/status") {
    try {
      const xml = await tallyRequest(
        `<?xml version="1.0"?><ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>Company</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`
      );
      sendJSON({ online: true, tallyConnected: !xml.includes("<LINEERROR>") });
    } catch (e) {
      sendJSON({ online: false, tallyConnected: false, message: e.message });
    }
    return;
  }

  // ── GET /api/verify-udyam ───────────────────────────────────────────────────
  if (req.method === "GET" && urlPath === "/api/verify-udyam") {
    const { udyam } = query;
    if (!udyam) return sendError("udyam parameter required");
    if (!/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i.test(udyam.trim())) {
      return sendJSON({ valid: false, error: "Invalid format. Use: UDYAM-XX-00-0000000" });
    }
    try {
      console.log(`[verify-udyam] ${udyam}`);
      const result = await verifyUdyam(udyam);
      console.log(`[verify-udyam] Result:`, result);
      sendJSON(result);
    } catch (e) {
      console.error(`[verify-udyam] Error:`, e.message);
      sendError("Verification failed: " + e.message);
    }
    return;
  }

  // ── GET /api/creditors ──────────────────────────────────────────────────────
  if (req.method === "GET" && urlPath === "/api/creditors") {
    const { from = "20250401", to = "20260331", group = "Sundry Creditors" } = query;
    const asOn = query.asOn || new Date().toISOString().split("T")[0];
    try {
      // Step 1: Group Summary — no company param, uses currently open company
      const groupXml = await tallyRequest(buildGroupSummaryXML(from, to, group));
      if (groupXml.includes("<LINEERROR>")) {
        return sendError(groupXml.match(/<LINEERROR>([^<]+)<\/LINEERROR>/)?.[1] || "Tally error");
      }
      const creditors = parseGroupSummary(groupXml);

      // Step 2: Day Book for aging — fetch from company start date
      const dayBookXml = await tallyRequest(buildDayBookXML("20230401", to));
      const purchases = [
        ...parseVouchers(dayBookXml, "Purchase"),
        ...parseVouchers(dayBookXml, "Journal"),
      ];
      const payments = parseVouchers(dayBookXml, "Payment");
      const agingMap = computeFIFOAging(purchases, payments, asOn);

      // Step 3: Merge
      const result = creditors.map((c) => {
        const aging = agingMap[c.name] || null;
        const days = aging ? aging.daysOutstanding : null;
        const isDisallowed = aging ? aging.isDisallowed : false;
        const interest = aging && isDisallowed
          ? c.outstandingAmount * (Math.pow(1 + 0.195 / 12, days / 30) - 1)
          : 0;
        return {
          party: c.name,
          outstandingAmount: c.outstandingAmount,
          daysOutstanding: days,
          bucket: aging ? aging.bucket : "Unknown",
          isDisallowed,
          interestLiability: Math.round(interest * 100) / 100,
          disallowanceAmount: isDisallowed ? c.outstandingAmount : 0,
          oldestInvoiceDate: aging ? aging.oldestInvoiceDate : null,
          section: "43B(h) IT Act 1961",
        };
      });

      const totalOutstanding = result.reduce((s, r) => s + r.outstandingAmount, 0);
      const totalDisallowance = result.reduce((s, r) => s + r.disallowanceAmount, 0);
      const totalInterest = result.reduce((s, r) => s + r.interestLiability, 0);

      sendJSON({
        success: true,
        asOn,
        period: { from, to },
        summary: {
          totalCreditors: result.length,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalDisallowance: Math.round(totalDisallowance * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
        },
        creditors: result,
      });
    } catch (e) {
      console.error("[creditors] Error:", e.message);
      sendError(e.message);
    }
    return;
  }

  // ── GET / ───────────────────────────────────────────────────────────────────
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    "MSME Guard Tally Proxy v3.0\n" +
    "  GET  /api/status\n" +
    "  GET  /api/creditors?from=20250401&to=20260331\n" +
    "  GET  /api/verify-udyam?udyam=UDYAM-XX-00-0000000\n" +
    "  POST /  (raw XML proxy)"
  );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ MSME Guard Tally Proxy v3.0 running on http://127.0.0.1:${PORT}`);
  console.log(`📡 Forwarding to TallyPrime at http://${TALLY_HOST}:${TALLY_PORT}`);
  console.log(`  GET  http://127.0.0.1:${PORT}/api/creditors?from=20250401&to=20260331`);
  console.log(`  GET  http://127.0.0.1:${PORT}/api/verify-udyam?udyam=UDYAM-XX-00-0000000`);
});
