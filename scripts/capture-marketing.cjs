const fs = require("node:fs");
const path = require("node:path");
const { resolvePlaywright } = require("../tests/helpers/playwright-setup.cjs");
const { chromium } = resolvePlaywright();

const repoRoot = path.resolve(__dirname, "..");
const screenshotDir = path.resolve(process.env.USF_SCREENSHOT_DIR || path.join(repoRoot, "assets", "screenshots"));
const marketingDir = path.resolve(process.env.USF_MARKETING_DIR || path.join(repoRoot, "assets", "marketing"));
const sourcePath = path.resolve(process.env.USF_SOURCE_PATH || path.join(repoRoot, "UserScript-Finder.user.js"));
const userscript = fs.readFileSync(sourcePath, "utf8");

const allSources = [
  "greasyfork", "sleazyfork", "openuserjs", "chromewebstore",
  "mozillaaddons", "catalogs", "githubgist", "github"
];

const fixtureSource = [
  "// ==UserScript==",
  "// @name YouTube Focus Mode",
  "// @namespace https://example.invalid/userscripts",
  "// @version 2.4.1",
  "// @description Hide distractions while keeping playlists and captions close.",
  "// @match https://www.youtube.com/*",
  "// @grant GM_getValue",
  "// @grant GM_setValue",
  "// ==/UserScript==",
  "",
  "const preferences = GM_getValue('focus-mode', { recommendations: false });",
  "document.documentElement.dataset.focusMode = String(!preferences.recommendations);"
].join("\n");

function result(id, name, description, author, version, license, total, daily, ratings, score, daysAgo) {
  return {
    id,
    name,
    description,
    url: `/scripts/${id}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    code_url: `https://update.greasyfork.org/scripts/${id}/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.user.js`,
    version,
    license,
    total_installs: total,
    daily_installs: daily,
    good_ratings: ratings,
    fan_score: score,
    code_updated_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    created_at: new Date(Date.now() - (daysAgo + 640) * 86400000).toISOString(),
    users: [{ name: author }]
  };
}

const fixtureResults = [
  result(101, "YouTube Focus Mode", "Hide distractions while keeping playlists, captions, and keyboard controls close.", "pixelharbor", "2.4.1", "MIT", 184000, 860, 982, 9.6, 3),
  result(102, "Cinema Controls for YouTube", "Add precise playback speed, frame stepping, and a cleaner theater view.", "northstar", "4.8.0", "GPL-3.0", 93700, 412, 704, 9.1, 11),
  result(103, "Playlist Queue Tools", "Save temporary queues, remove watched videos, and export a playlist backup.", "queuecraft", "1.9.3", "MIT", 42100, 206, 388, 8.8, 28),
  result(104, "Caption Shortcut Kit", "Switch subtitle tracks, resize captions, and copy the current line from the keyboard.", "captionworks", "3.2.0", "MPL-2.0", 26700, 117, 241, 8.4, 44)
];

function initialStore(acknowledged) {
  return acknowledged ? {
    sf_settings_v4: {
      lastService: "greasyfork",
      disclosureAckedSources: allSources
    }
  } : {};
}

async function createProductPage(browser, acknowledged) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.route(/^https:\/\/www\.youtube\.com\/.*/, route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><head><title>Product capture</title><style>html,body{margin:0;min-height:100%;background:#0b0b10}</style></head><body></body></html>"
  }));
  await page.goto("https://www.youtube.com/watch?v=demo");
  await page.evaluate(({ store, results, source }) => {
    window.__store = store;
    window.__menus = new Map();
    window.__SF_TEST_HOOKS__ = {};
    let nextMenuId = 0;
    window.GM_getValue = (key, fallback) => key in store ? store[key] : fallback;
    window.GM_setValue = (key, value) => { store[key] = value; };
    window.GM_deleteValue = key => { delete store[key]; };
    window.GM_addStyle = () => {};
    window.GM_openInTab = () => {};
    window.GM_addValueChangeListener = () => {};
    window.GM_registerMenuCommand = (name, callback) => {
      const id = ++nextMenuId;
      window.__menus.set(id, { name, callback });
      return id;
    };
    window.GM_unregisterMenuCommand = id => window.__menus.delete(id);
    window.GM_xmlhttpRequest = request => {
      let responseText = "[]";
      if (request.url.endsWith(".user.js")) responseText = source;
      else if (request.url.includes("greasyfork.org")) responseText = JSON.stringify(results);
      else if (request.url.includes("api.github.com")) responseText = JSON.stringify({ items: [] });
      setTimeout(() => request.onload({ status: 200, responseText }), 5);
    };
  }, { store: initialStore(acknowledged), results: fixtureResults, source: fixtureSource });
  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => Array.from(window.__menus?.values() || []).some(menu => menu.name.endsWith("(GreasyFork)")));
  await page.evaluate(() => {
    Array.from(window.__menus.values()).find(menu => menu.name.endsWith("(GreasyFork)")).callback();
  });
  return page;
}

async function shadowQuery(page, selector) {
  return page.waitForFunction(value => {
    const shadow = Array.from(document.querySelectorAll("div"))
      .map(element => element.shadowRoot)
      .find(root => root?.querySelector(".sf-modal"));
    return !!shadow?.querySelector(value);
  }, selector);
}

async function clickInShadow(page, selector) {
  await page.evaluate(value => {
    const shadow = Array.from(document.querySelectorAll("div"))
      .map(element => element.shadowRoot)
      .find(root => root?.querySelector(".sf-modal"));
    shadow.querySelector(value).click();
  }, selector);
}

async function capturePanel(page, filename) {
  const rect = await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div"))
      .map(element => element.shadowRoot)
      .find(root => root?.querySelector(".sf-modal"));
    const bounds = shadow.querySelector(".sf-modal").getBoundingClientRect();
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  });
  const margin = 14;
  await page.screenshot({
    path: path.join(screenshotDir, filename),
    clip: {
      x: Math.max(0, rect.x - margin),
      y: Math.max(0, rect.y - margin),
      width: Math.min(1440, rect.width + margin * 2),
      height: Math.min(1000, rect.height + margin * 2)
    }
  });
}

async function renderSocialCard(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
  const logo = fs.readFileSync(path.join(repoRoot, "assets", "brand", "userscript-finder-mark.png")).toString("base64");
  const product = fs.readFileSync(path.join(screenshotDir, "search-results.png")).toString("base64");
  await page.setContent(`<!doctype html><html><head><style>
    *{box-sizing:border-box}html,body{margin:0;width:1280px;height:640px;overflow:hidden}
    body{font-family:Inter,"Segoe UI",Arial,sans-serif;color:#f3f5ff;background:
      radial-gradient(circle at 22% 20%,rgba(24,192,246,.18),transparent 32%),
      radial-gradient(circle at 76% 18%,rgba(75,231,160,.11),transparent 28%),#070811}
    .frame{position:relative;display:grid;grid-template-columns:54% 46%;width:100%;height:100%;padding:56px 58px;gap:34px}
    .frame:after{content:"";position:absolute;inset:18px;border:1px solid rgba(255,255,255,.07);border-radius:12px;pointer-events:none}
    .copy{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center}
    .brand{display:flex;align-items:center;gap:18px;margin-bottom:30px}.brand img{width:76px;height:76px;object-fit:contain}
    .name{font-size:29px;font-weight:760;letter-spacing:-.8px}.version{margin-top:5px;color:#8d96b8;font-size:15px;font-weight:650;letter-spacing:.4px}
    h1{font-size:48px;line-height:1.04;letter-spacing:-2.2px;margin:0 0 22px;max-width:610px}
    p{margin:0;color:#b8c0dd;font-size:20px;line-height:1.45;max-width:570px}
    .proof{display:flex;flex-wrap:wrap;gap:9px;margin-top:32px}.proof span{padding:8px 11px;border:1px solid rgba(137,220,235,.24);border-radius:6px;background:#101322;color:#cbd3ef;font-size:12px;font-weight:750;text-transform:uppercase;letter-spacing:.65px}
    .product{position:relative;z-index:1;height:720px;margin-top:-38px;overflow:hidden;border:1px solid rgba(148,226,213,.20);border-radius:12px;box-shadow:0 32px 80px rgba(0,0,0,.48);background:#0a0a0f}
    .product img{width:100%;height:auto;display:block}
    .accent{position:absolute;left:58px;bottom:38px;width:126px;height:3px;background:linear-gradient(90deg,#18c0f6,#4be7a0)}
  </style></head><body><div class="frame"><section class="copy"><div class="brand"><img src="data:image/png;base64,${logo}"><div><div class="name">UserScript Finder</div><div class="version">v1.29.1</div></div></div><h1>Find the right script without leaving the site.</h1><p>Search eight sources, compare signals, and inspect match coverage or source code before you install.</p><div class="proof"><span>8 sources</span><span>Match checks</span><span>Source preview</span><span>Local settings</span></div></section><section class="product"><img src="data:image/png;base64,${product}"></section><div class="accent"></div></div></body></html>`);
  await page.screenshot({ path: path.join(marketingDir, "social-preview.png") });
  await page.close();
}

(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });
  fs.mkdirSync(marketingDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const disclosurePage = await createProductPage(browser, false);
  await shadowQuery(disclosurePage, ".sf-disclosure-continue");
  await capturePanel(disclosurePage, "network-disclosure.png");
  await disclosurePage.close();

  const page = await createProductPage(browser, true);
  await page.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div"))
      .map(element => element.shadowRoot)
      .find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelectorAll(".sf-item").length === 4;
  });
  await capturePanel(page, "search-results.png");

  await clickInShadow(page, ".sf-btn-settings");
  await shadowQuery(page, ".sf-settings.visible");
  await capturePanel(page, "source-controls.png");

  await clickInShadow(page, ".sf-btn-settings");
  await clickInShadow(page, ".sf-code-preview-btn");
  await shadowQuery(page, ".sf-code-preview:not(.hidden) pre");
  await capturePanel(page, "source-preview.png");

  const audit = await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div"))
      .map(element => element.shadowRoot)
      .find(root => root?.querySelector(".sf-modal"));
    const modal = shadow.querySelector(".sf-modal");
    const bounds = modal.getBoundingClientRect();
    return {
      width: bounds.width,
      height: bounds.height,
      horizontalOverflow: modal.scrollWidth > modal.clientWidth + 2,
      sourcePreviewVisible: !!shadow.querySelector(".sf-code-preview:not(.hidden) pre")
    };
  });
  await page.close();

  await renderSocialCard(browser);
  await browser.close();
  console.log(JSON.stringify({ screenshotDir, marketingDir, audit }));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
