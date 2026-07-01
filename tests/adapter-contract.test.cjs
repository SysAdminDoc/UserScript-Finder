const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolvePlaywright } = require("./helpers/playwright-setup.cjs");
const { chromium } = resolvePlaywright();

const repoRoot = path.resolve(__dirname, "..");
const fixtureRoot = path.join(__dirname, "fixtures");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

function fixture(name) {
  return fs.readFileSync(path.join(fixtureRoot, name), "utf8");
}

function assertShape(item, source) {
  assert.equal(item._source, source);
  assert.equal(typeof item.name, "string");
  assert.ok(item.name.length > 0);
  assert.ok(item.url === null || typeof item.url === "string");
  assert.ok(item.code_url === null || typeof item.code_url === "string");
  assert.ok(Array.isArray(item.users));
  assert.ok("_full_name" in item);
  assert.ok("_topics" in item);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("about:blank");
  await page.evaluate(() => {
    window.__SF_TEST_HOOKS__ = {};
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_setValue = () => {};
    window.GM_deleteValue = () => {};
    window.GM_addStyle = () => {};
    window.GM_openInTab = () => {};
    window.GM_registerMenuCommand = () => 1;
    window.GM_unregisterMenuCommand = () => {};
    window.GM_xmlhttpRequest = () => {};
  });
  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => !!window.__SF_TEST_HOOKS__.GitHubGistService);

  const result = await page.evaluate(fixtures => {
    const hooks = window.__SF_TEST_HOOKS__;

    const greasy = new hooks.ScriptService("https://greasyfork.org", "greasyfork")
      ._filter(JSON.parse(fixtures.greasyfork), "reddit.com")[0];
    greasy._source = "greasyfork";
    greasy._full_name = greasy.url;
    greasy._topics = [];

    const openuserjs = new hooks.OpenUserJSScriptService()
      ._parseSearchResults(fixtures.openuserjs)[0];

    const chrome = new hooks.ChromeWebStoreService()
      ._parseSearchResults(fixtures.chrome)[0];

    const mozillaService = new hooks.MozillaAddonsService();
    const mozilla = JSON.parse(fixtures.mozilla).results
      .map(addon => mozillaService._normalize(addon))
      .filter(Boolean)[0];

    const githubService = new hooks.GitHubScriptService();
    const github = JSON.parse(fixtures.github).items
      .map(repo => githubService._normalize(repo))[0];

    const catalogService = new hooks.CatalogScriptService();
    const catalogs = [
      ...catalogService._parseTampermonkeyCatalog(fixtures.tampermonkey, "reddit.com"),
      ...catalogService._parseAwesomeUserscripts(fixtures.awesome, "reddit.com")
    ];

    const gist = new hooks.GitHubGistService()
      ._parseSearchResults(fixtures.gist)[0];

    const helperChecks = {
      normalizedRating: hooks.normalizedRating({ fan_score: 8 }),
      english: hooks.matchesLanguageFilter({ name: "Reddit Helper", description: "English text" }, "en"),
      nonEnglish: hooks.matchesLanguageFilter({ name: "帮助", description: "脚本" }, "en"),
      reputationOrder: hooks.reputationScore({ total_installs: 1000, good_ratings: 5 }) >
        hooks.reputationScore({ total_installs: 1, good_ratings: 0 }),
      broadHostAccess: hooks.hasBroadHostAccess(["<all_urls>"]),
      chromeTrust: hooks.extensionTrustBadges(chrome, Date.parse("2026-06-29T00:00:00Z")),
      mozillaTrust: hooks.extensionTrustBadges(mozilla, Date.parse("2026-06-29T00:00:00Z")),
      staleMissingPrivacyTrust: hooks.extensionTrustBadges({
        _source: "mozillaaddons",
        _permissions: ["storage"],
        _host_permissions: ["https://example.com/*"],
        code_updated_at: "2020-01-01T00:00:00Z"
      }, Date.parse("2026-06-29T00:00:00Z"))
    };

    return { greasy, openuserjs, chrome, mozilla, github, catalogs, gist, helperChecks };
  }, {
    greasyfork: fixture("greasyfork-by-site.json"),
    openuserjs: fixture("openuserjs-search.html"),
    chrome: fixture("chrome-web-store-search.html"),
    mozilla: fixture("mozilla-addons.json"),
    github: fixture("github-search.json"),
    tampermonkey: fixture("tampermonkey-scripts.html"),
    awesome: fixture("awesome-userscripts.txt"),
    gist: fixture("gist-search.html")
  });

  assertShape(result.greasy, "greasyfork");
  assert.equal(result.greasy.name, "Greasy Reddit Helper");
  assertShape(result.openuserjs, "openuserjs");
  assert.equal(result.openuserjs.code_url, "https://openuserjs.org/install/alice/OUJS_Reddit_Helper.user.js");
  assertShape(result.chrome, "chromewebstore");
  assert.equal(result.chrome.name, "Chrome Reddit Helper");
  assert.deepEqual(result.chrome._permissions, ["storage", "tabs"]);
  assert.deepEqual(result.chrome._host_permissions, ["<all_urls>"]);
  assert.equal(result.chrome._privacy_policy_url, "https://example.com/privacy");
  assert.deepEqual(result.chrome._data_collection, ["Browsing history"]);
  assertShape(result.mozilla, "mozillaaddons");
  assert.equal(result.mozilla.license, "MIT");
  assert.deepEqual(result.mozilla._permissions, ["storage", "tabs"]);
  assert.deepEqual(result.mozilla._optional_permissions, ["bookmarks"]);
  assert.deepEqual(result.mozilla._host_permissions, ["<all_urls>"]);
  assert.equal(result.mozilla._promoted, "recommended");
  assertShape(result.github, "github");
  assert.equal(result.github._stars, 77);
  assert.equal(result.catalogs.length, 2);
  result.catalogs.forEach(item => assertShape(item, "catalogs"));
  assertShape(result.gist, "githubgist");
  assert.match(result.gist.code_url, /^https:\/\/gist\.githubusercontent\.com\/alice\//);
  assert.equal(result.helperChecks.normalizedRating, 4);
  assert.equal(result.helperChecks.english, true);
  assert.equal(result.helperChecks.nonEnglish, false);
  assert.equal(result.helperChecks.reputationOrder, true);
  assert.equal(result.helperChecks.broadHostAccess, true);
  assert.ok(result.helperChecks.chromeTrust.some(badge => badge.text === "All sites" && badge.cls === "trust-bad"));
  assert.ok(result.helperChecks.chromeTrust.some(badge => badge.text === "Privacy" && badge.cls === "trust-ok"));
  assert.ok(result.helperChecks.chromeTrust.some(badge => badge.text === "Data" && badge.cls === "trust-warn"));
  assert.ok(result.helperChecks.mozillaTrust.some(badge => badge.text === "Recommended" && badge.cls === "trust-ok"));
  assert.ok(result.helperChecks.staleMissingPrivacyTrust.some(badge => badge.text === "No privacy" && badge.cls === "trust-warn"));
  assert.ok(result.helperChecks.staleMissingPrivacyTrust.some(badge => badge.text === "Stale" && badge.cls === "trust-bad"));

  await browser.close();
  console.log("adapter contract tests passed");
})().catch(async err => {
  console.error(err);
  process.exitCode = 1;
});
