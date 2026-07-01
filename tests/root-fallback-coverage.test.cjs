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
  const page = await browser.newPage();
  await page.route("https://old.reddit.com/*", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>root fallback</title>"
  }));
  await page.goto("https://old.reddit.com/r/test");
  await page.evaluate(() => {
    window.__SF_TEST_HOOKS__ = {};
    window.__requests = [];
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_setValue = () => {};
    window.GM_deleteValue = () => {};
    window.GM_addStyle = () => {};
    window.GM_openInTab = () => {};
    window.GM_registerMenuCommand = () => 1;
    window.GM_unregisterMenuCommand = () => {};
    window.GM_xmlhttpRequest = request => {
      window.__requests.push(request.url);
      let body = "[]";
      if (request.url.endsWith("/scripts/by-site/reddit.com.json")) {
        body = JSON.stringify([
          {
            name: "Exact Reddit",
            url: "/scripts/1-exact-reddit",
            code_url: "https://update.greasyfork.org/scripts/1/exact.user.js",
            users: [{ name: "alice" }],
            domains: ["reddit.com"]
          },
          {
            name: "Broad Reddit",
            url: "/scripts/2-broad-reddit",
            code_url: "https://update.greasyfork.org/scripts/2/broad.user.js",
            users: [{ name: "bob" }],
            domains: ["reddit.com"]
          },
          {
            name: "Uncertain Reddit",
            url: "/scripts/3-uncertain-reddit",
            code_url: "https://update.greasyfork.org/scripts/3/uncertain.user.js",
            users: [{ name: "carol" }],
            domains: ["reddit.com"]
          }
        ]);
      } else if (request.url.endsWith("/exact.user.js")) {
        body = "// ==UserScript==\n// @name Exact Reddit\n// @match *://*.reddit.com/r/*\n// ==/UserScript==";
      } else if (request.url.endsWith("/broad.user.js")) {
        body = "// ==UserScript==\n// @name Broad Reddit\n// @match https://reddit.com/r/*\n// ==/UserScript==";
      } else if (request.url.endsWith("/uncertain.user.js")) {
        body = "// ==UserScript==\n// @name Uncertain Reddit\n// ==/UserScript==";
      }
      setTimeout(() => request.onload({ status: 200, responseText: body }), 0);
    };
  });
  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => !!window.__SF_TEST_HOOKS__.ScriptService);

  const result = await page.evaluate(async () => {
    const settings = { get: key => key === "cacheDuration" ? 0 : null };
    const service = new window.__SF_TEST_HOOKS__.ScriptService("https://greasyfork.org", "greasyfork");
    const scripts = await service.searchScriptsByHost("old.reddit.com", settings);
    return {
      labels: scripts.map(script => ({
        name: script.name,
        coverage: script._hostCoverage,
        label: script._hostCoverageLabel,
        detail: script._hostCoverageDetail,
        preview: script._matchPreview?.status
      })),
      status: scripts._sfStatus,
      requests: window.__requests.slice()
    };
  });

  assert.deepEqual(result.labels.map(item => item.coverage), ["exact", "broad", "uncertain"]);
  assert.deepEqual(result.labels.map(item => item.label), ["Exact host", "Broad/root match", "Coverage uncertain"]);
  assert.deepEqual(result.labels.map(item => item.preview), ["good", "bad", "warn"]);
  assert.equal(result.status.type, "partial");
  assert.match(result.status.detail, /1 exact, 1 broad, 1 uncertain/);
  assert.ok(result.requests.some(url => url.endsWith("/scripts/by-site/old.reddit.com.json")));
  assert.ok(result.requests.some(url => url.endsWith("/scripts/by-site/reddit.com.json")));
  assert.ok(result.requests.some(url => url.endsWith("/exact.user.js")));
  assert.ok(result.requests.some(url => url.endsWith("/broad.user.js")));
  assert.ok(result.requests.some(url => url.endsWith("/uncertain.user.js")));

  await browser.close();
  console.log("root fallback coverage tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exitCode = 1;
});
