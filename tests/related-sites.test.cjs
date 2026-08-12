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
    const finder = Object.create(ScriptFinder.prototype);
    finder.queryMode = "auto";
    finder.settings = {};
    const calls = [];
    const service = {
      serviceName: "greasyfork",
      searchScriptsByHost: async host => {
        calls.push(host);
        return [{
          _source: "greasyfork",
          _full_name: host,
          url: `https://example.test/${host}`,
          name: host
        }];
      }
    };

    const youtuHosts = finder._resolveQueryHosts("youtu.be");
    const youtubeResults = await finder._searchServiceByHosts(service, youtuHosts);
    finder.queryMode = "exact";
    const exactHosts = finder._resolveQueryHosts("youtu.be");

    return {
      youtuHosts,
      exactHosts,
      calls,
      resultNames: youtubeResults.map(script => script.name)
    };
  });

  assert.deepEqual(result.youtuHosts, ["youtu.be", "youtube.com"], "Auto mode adds the YouTube related host");
  assert.deepEqual(result.exactHosts, ["youtu.be"], "Exact mode does not add related hosts");
  assert.deepEqual(result.calls, ["youtu.be", "youtube.com"], "both related host queries run");
  assert.deepEqual(result.resultNames, ["youtu.be", "youtube.com"], "related results are merged in query order");

  await browser.close();
  console.log("related site tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exitCode = 1;
});
