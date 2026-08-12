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
    window.__store = {};
    window.GM_getValue = (key, fallback) => key in window.__store ? window.__store[key] : fallback;
    window.GM_setValue = (key, value) => { window.__store[key] = value; };
    window.GM_deleteValue = key => { delete window.__store[key]; };
    window.GM_xmlhttpRequest = () => {};
    window.GM_registerMenuCommand = () => 1;
  });
  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => !!window.__SF_TEST_HOOKS__.ScriptFinder);

  const result = await page.evaluate(() => {
    const { ScriptFinder, STORAGE_LIMITS } = window.__SF_TEST_HOOKS__;
    const finder = Object.create(ScriptFinder.prototype);
    finder.currentDomain = "example.test";

    window.__store.sf_dismissed = {
      "example.test": Array.from({ length: STORAGE_LIMITS.dismissedPerDomain + 25 }, (_, i) => `greasyfork:id-${i}`)
    };
    const dismissed = finder._getDismissed();
    finder._dismissScript({ _source: "greasyfork", _full_name: "newest" });

    window.__store.sf_queue = Array.from({ length: STORAGE_LIMITS.queueItems + 25 }, (_, i) => ({ key: `queue:${i}` }));
    const queueBeforeToggle = finder._getQueue();
    finder._toggleQueued({ _source: "greasyfork", _full_name: "new-queue-item", name: "Newest" });

    return {
      limits: STORAGE_LIMITS,
      dismissed: window.__store.sf_dismissed["example.test"],
      dismissedRead: dismissed,
      queueBeforeToggle,
      queue: window.__store.sf_queue
    };
  });

  assert.equal(result.dismissed.length, result.limits.dismissedPerDomain, "dismissed list is capped after a write");
  assert.equal(result.dismissed.at(-1), "greasyfork:newest", "newest dismissed key is retained");
  assert.equal(result.dismissedRead.length, result.limits.dismissedPerDomain, "oversized dismissed data is capped on read");
  assert.equal(result.queueBeforeToggle.length, result.limits.queueItems, "existing queue data is trimmed on read");
  assert.equal(result.queue.length, result.limits.queueItems, "queue remains capped after adding an item");
  assert.equal(result.queue.at(-1).key, "greasyfork:new-queue-item", "newest queue item is retained");

  await browser.close();
  console.log("storage limit tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exitCode = 1;
});
