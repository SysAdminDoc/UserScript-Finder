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
  await page.route("https://example.test/*", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>source privacy</title><button id='outside'>Outside</button>"
  }));
  await page.goto("https://example.test/path");
  await page.evaluate(() => {
    const store = {
      sf_settings_v4: {
        lastService: "github",
        sources: {
          greasyfork: true,
          sleazyfork: false,
          openuserjs: true,
          chromewebstore: true,
          mozillaaddons: true,
          catalogs: true,
          githubgist: true,
          github: false
        },
        disclosureAckedSources: ["greasyfork", "sleazyfork", "openuserjs", "chromewebstore", "mozillaaddons", "catalogs", "githubgist", "github"]
      }
    };
    let nextMenuId = 0;
    window.__store = store;
    window.__menus = new Map();
    window.__requests = [];
    window.__SF_TEST_HOOKS__ = {};
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
      const body = request.url.includes("api.github.com") ? JSON.stringify({ items: [] }) : "[]";
      setTimeout(() => request.onload({ status: 200, responseText: body }), 0);
    };
  });
  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => window.__menus?.size >= 7);

  const initial = await page.evaluate(() => {
    const menuNames = Array.from(window.__menus.values()).map(menu => menu.name);
    return {
      menuNames,
      sources: window.__store.sf_settings_v4.sources,
      lastService: window.__store.sf_settings_v4.lastService
    };
  });
  assert.equal(initial.sources.github, false);
  assert.equal(initial.sources.sleazyfork, false);
  assert.ok(!initial.menuNames.some(name => name.endsWith("(GitHub)")));
  assert.ok(!initial.menuNames.some(name => name.endsWith("(SleazyFork)")));
  assert.equal(initial.lastService, "greasyfork");

  await page.evaluate(() => {
    Array.from(window.__menus.values()).find(menu => menu.name.endsWith("(GreasyFork)")).callback();
  });
  await page.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-tab[data-service='greasyfork']");
  });

  const disabledUi = await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    const tabs = Array.from(shadow.querySelectorAll(".sf-tab")).map(tab => tab.dataset.service);
    return {
      tabs,
      githubToggle: shadow.querySelector(".sf-source-toggle[data-source='github']").getAttribute("aria-pressed"),
      sleazyToggle: shadow.querySelector(".sf-source-toggle[data-source='sleazyfork']").getAttribute("aria-pressed"),
      requests: window.__requests.slice()
    };
  });
  assert.ok(!disabledUi.tabs.includes("github"));
  assert.ok(!disabledUi.tabs.includes("sleazyfork"));
  assert.equal(disabledUi.githubToggle, "false");
  assert.equal(disabledUi.sleazyToggle, "false");
  assert.ok(!disabledUi.requests.some(url => url.includes("api.github.com")));
  assert.ok(!disabledUi.requests.some(url => url.includes("sleazyfork.org")));

  const enabled = await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    shadow.querySelector(".sf-source-toggle[data-source='github']").click();
    const tabs = Array.from(shadow.querySelectorAll(".sf-tab")).map(tab => tab.dataset.service);
    const menuNames = Array.from(window.__menus.values()).map(menu => menu.name);
    return { tabs, menuNames, requests: window.__requests.slice() };
  });
  assert.ok(enabled.tabs.includes("github"));
  assert.ok(enabled.menuNames.some(name => name.endsWith("(GitHub)")));
  assert.ok(!enabled.requests.some(url => url.includes("api.github.com")));

  await page.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    shadow.querySelector(".sf-tab[data-service='github']").click();
  });
  await page.waitForFunction(() => window.__requests.some(url => url.includes("api.github.com")));

  const finalState = await page.evaluate(() => ({
    savedGitHub: window.__store.sf_settings_v4.sources.github,
    githubRequests: window.__requests.filter(url => url.includes("api.github.com")).length
  }));
  assert.equal(finalState.savedGitHub, true);
  assert.ok(finalState.githubRequests > 0);

  await browser.close();
  console.log("source privacy tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exitCode = 1;
});
