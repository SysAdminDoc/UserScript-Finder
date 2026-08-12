const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolvePlaywright } = require("./helpers/playwright-setup.cjs");
const { chromium } = resolvePlaywright();

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

let browser;

(async () => {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route("https://example.test/*", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>source preview</title>"
  }));
  await page.goto("https://example.test/");
  await page.evaluate(() => {
    const source = [
      "// ==UserScript==",
      "// @name Preview Fixture",
      "// ==/UserScript==",
      "const markup = \"<img src=x>\";",
      "function greet() { return markup; }",
      ""
    ].join("\n");
    const store = {
      sf_settings_v4: {
        lastService: "greasyfork",
        sources: {
          greasyfork: true,
          sleazyfork: false,
          openuserjs: false,
          chromewebstore: false,
          mozillaaddons: false,
          catalogs: false,
          githubgist: false,
          github: false
        },
        disclosureAckedSources: ["greasyfork", "sleazyfork", "openuserjs", "chromewebstore", "mozillaaddons", "catalogs", "githubgist", "github"]
      }
    };
    const results = [{
      id: 1,
      name: "Preview Fixture",
      description: "A source preview fixture",
      url: "/scripts/1/preview-fixture",
      code_url: "https://update.greasyfork.org/scripts/1/preview-fixture.user.js",
      version: "1.0.0",
      license: "MIT",
      total_installs: 100,
      daily_installs: 10,
      good_ratings: 5,
      fan_score: 5,
      code_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      users: [{ name: "fixture-author" }],
      _source: "greasyfork",
      _full_name: "preview-fixture",
      _topics: ["userscript"]
    }];

    window.__store = store;
    window.__menus = new Map();
    window.__requests = [];
    window.__SF_TEST_HOOKS__ = {};
    let nextMenuId = 0;
    window.GM_getValue = (key, fallback) => key in store ? store[key] : fallback;
    window.GM_setValue = (key, value) => { store[key] = value; };
    window.GM_deleteValue = key => { delete store[key]; };
    window.GM_addStyle = () => {};
    window.GM_openInTab = () => {};
    window.GM_registerMenuCommand = (name, callback) => {
      const id = ++nextMenuId;
      window.__menus.set(id, { name, callback });
      return id;
    };
    window.GM_unregisterMenuCommand = id => window.__menus.delete(id);
    window.GM_xmlhttpRequest = request => {
      window.__requests.push(request.url);
      const responseText = request.url.endsWith(".user.js") ? source : JSON.stringify(results);
      setTimeout(() => request.onload({ status: 200, responseText }), 0);
    };
  });

  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => Array.from(window.__menus?.values() || []).some(menu => menu.name.endsWith("(GreasyFork)")));
  await page.evaluate(() => {
    Array.from(window.__menus.values()).find(menu => menu.name.endsWith("(GreasyFork)")).callback();
  });
  await page.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-code-preview-btn");
  });

  const beforePreview = await page.evaluate(() => window.__requests.filter(url => url.endsWith(".user.js")).length);
  assert.equal(beforePreview, 0, "source is not fetched before the preview is opened");

  await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    shadow.querySelector(".sf-code-preview-btn").click();
  });
  await page.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-code-preview:not(.hidden) pre");
  });

  const preview = await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    const pane = shadow.querySelector(".sf-code-preview");
    const code = pane.querySelector("code");
    const helperResult = window.__SF_TEST_HOOKS__.highlightUserScript("x".repeat(100005));
    return {
      text: code.textContent,
      html: code.innerHTML,
      hasKeyword: !!code.querySelector(".sf-code-token-keyword"),
      hasComment: !!code.querySelector(".sf-code-token-comment"),
      hasString: !!code.querySelector(".sf-code-token-string"),
      escapedMarkup: !code.querySelector("img") && code.textContent.includes("<img src=x>"),
      expanded: shadow.querySelector(".sf-code-preview-btn").getAttribute("aria-expanded"),
      note: pane.querySelector(".sf-code-preview-note")?.textContent,
      helperTruncated: helperResult.truncated,
      helperBounded: helperResult.sourceLength > 100000 && helperResult.html.length < 120000
    };
  });
  assert.match(preview.text, /const markup/);
  assert.ok(preview.hasKeyword, "keywords receive syntax highlighting");
  assert.ok(preview.hasComment, "comments receive syntax highlighting");
  assert.ok(preview.hasString, "strings receive syntax highlighting");
  assert.ok(preview.escapedMarkup, "source is escaped before insertion into the preview");
  assert.equal(preview.expanded, "true");
  assert.match(preview.note, /6 lines/);
  assert.equal(preview.helperTruncated, true, "large source is truncated");
  assert.equal(preview.helperBounded, true, "highlighted source remains bounded");

  await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    shadow.querySelector(".sf-code-preview-btn").click();
  });
  await page.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-code-preview.hidden");
  });

  await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    shadow.querySelector(".sf-code-preview-btn").click();
  });
  await page.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-code-preview:not(.hidden) pre");
  });
  const sourceRequests = await page.evaluate(() => window.__requests.filter(url => url.endsWith(".user.js")).length);
  assert.equal(sourceRequests, 1, "preview reuses the fetched source");

  await browser.close();
  console.log("source preview tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exit(1);
});
