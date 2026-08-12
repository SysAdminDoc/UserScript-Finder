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
  await page.goto("about:blank");
  await page.evaluate(() => {
    window.__SF_TEST_HOOKS__ = {};
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_setValue = () => {};
    window.GM_deleteValue = () => {};
    window.GM_xmlhttpRequest = () => {};
    window.GM_registerMenuCommand = () => 1;
  });
  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => !!window.__SF_TEST_HOOKS__.ScriptFinder);

  const result = await page.evaluate(async () => {
    const { ScriptFinder } = window.__SF_TEST_HOOKS__;
    const calls = [];
    let releaseFirst;
    const firstPending = new Promise(resolve => { releaseFirst = resolve; });

    const makeService = (name, search) => ({
      serviceName: name,
      searchScriptsByHost: search,
      getDirectSearchUrl: () => "https://example.test/search"
    });
    const finder = Object.create(ScriptFinder.prototype);
    Object.assign(finder, {
      compatibility: null,
      settings: { get: () => 300000 },
      currentService: "greasyfork",
      services: {},
      currentDomain: "example.test",
      isOpen: true,
      isLoading: false,
      _loadQueued: false,
      content: { setAttribute() {} },
      _currentHostBlock: () => null,
      _showCompatibilityReport() {},
      _showHostBlocked() {},
      _isSourceEnabled: () => true,
      _ensureCurrentSource() {},
      _serviceClass: () => "",
      _recordSourceHealth() {},
      _setResultCount() {},
      _displayScripts() {},
      _sourceErrorTitle: () => "Source unavailable"
    });
    finder.services.greasyfork = makeService("greasyfork", async () => {
      calls.push("greasyfork");
      await firstPending;
      return [];
    });
    finder.services.sleazyfork = makeService("sleazyfork", async () => {
      calls.push("sleazyfork");
      return [];
    });

    const firstLoad = finder._loadScripts();
    await Promise.resolve();
    finder.currentService = "sleazyfork";
    finder._loadScripts();
    const queuedWhileLoading = finder._loadQueued;

    releaseFirst();
    await firstLoad;
    await new Promise(resolve => setTimeout(resolve, 0));
    return { calls, queuedWhileLoading, isLoading: finder.isLoading, queuedAfter: finder._loadQueued };
  });

  assert.deepEqual(result.calls, ["greasyfork", "sleazyfork"], "queued request runs once for the newly selected source");
  assert.equal(result.queuedWhileLoading, true, "re-entry is recorded while the first load is active");
  assert.equal(result.isLoading, false, "queued follow-up leaves loading idle");
  assert.equal(result.queuedAfter, false, "queued flag is consumed by the follow-up load");

  await browser.close();
  console.log("load concurrency tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exitCode = 1;
});
