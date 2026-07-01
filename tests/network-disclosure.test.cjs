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

  // Test 1: First run shows disclosure
  {
    const page = await browser.newPage();
    await page.route("https://example.test/*", route => route.fulfill({
      status: 200, contentType: "text/html",
      body: "<!doctype html><title>disclosure</title>"
    }));
    await page.goto("https://example.test/");
    await page.evaluate(() => {
      const store = {};
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
        const body = request.url.includes("api.github.com") ? JSON.stringify({ items: [] }) : "[]";
        setTimeout(() => request.onload({ status: 200, responseText: body }), 0);
      };
    });
    await page.addScriptTag({ content: userscript });
    await page.waitForFunction(() => window.__menus?.size >= 8);

    await page.evaluate(() => {
      Array.from(window.__menus.values()).find(menu => menu.name.includes("(GreasyFork)")).callback();
    });

    const disclosure = await page.waitForFunction(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      const title = shadow?.querySelector(".sf-modal-title");
      const table = shadow?.querySelector(".sf-disclosure-table");
      const btn = shadow?.querySelector(".sf-disclosure-continue");
      if (title && table && btn) return { title: title.textContent, rows: table.querySelectorAll("tbody tr").length, hasBtn: true };
      return null;
    });

    const result = await disclosure.jsonValue();
    assert.equal(result.title, "Network disclosure");
    assert.equal(result.rows, 8);
    assert.equal(result.hasBtn, true);

    const noFetch = await page.evaluate(() => window.__requests.length);
    assert.equal(noFetch, 0, "no network requests before disclosure acknowledged");

    await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      shadow.querySelector(".sf-disclosure-continue").click();
    });
    await page.waitForFunction(() => window.__requests.length > 0);

    const afterAck = await page.evaluate(() => ({
      requests: window.__requests.length,
      acked: window.__store.sf_settings_v4.disclosureAckedSources
    }));
    assert.ok(afterAck.requests > 0, "network requests started after acknowledgement");
    assert.ok(afterAck.acked.length === 8, "all sources acknowledged");

    await page.close();
  }

  // Test 2: Unchecking a source in disclosure disables it
  {
    const page = await browser.newPage();
    await page.route("https://example.test/*", route => route.fulfill({
      status: 200, contentType: "text/html",
      body: "<!doctype html><title>disclosure uncheck</title>"
    }));
    await page.goto("https://example.test/");
    await page.evaluate(() => {
      const store = {};
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
        const body = request.url.includes("api.github.com") ? JSON.stringify({ items: [] }) : "[]";
        setTimeout(() => request.onload({ status: 200, responseText: body }), 0);
      };
    });
    await page.addScriptTag({ content: userscript });
    await page.waitForFunction(() => window.__menus?.size >= 8);

    await page.evaluate(() => {
      Array.from(window.__menus.values()).find(menu => menu.name.includes("(GreasyFork)")).callback();
    });

    await page.waitForFunction(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      return shadow?.querySelector(".sf-disclosure-continue");
    });

    await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      const githubCb = shadow.querySelector('.sf-disclosure-source input[data-source="github"]');
      githubCb.checked = false;
      shadow.querySelector(".sf-disclosure-continue").click();
    });

    await page.waitForFunction(() => window.__requests.length > 0);

    const result = await page.evaluate(() => ({
      githubEnabled: window.__store.sf_settings_v4.sources.github,
      acked: window.__store.sf_settings_v4.disclosureAckedSources,
      githubRequests: window.__requests.filter(u => u.includes("api.github.com")).length
    }));
    assert.equal(result.githubEnabled, false, "unchecked source is disabled");
    assert.ok(!result.acked.includes("github"), "unchecked source not in acked list");
    assert.equal(result.githubRequests, 0, "no requests to disabled source");

    await page.close();
  }

  // Test 3: Already-acked sources skip disclosure
  {
    const page = await browser.newPage();
    await page.route("https://example.test/*", route => route.fulfill({
      status: 200, contentType: "text/html",
      body: "<!doctype html><title>disclosure skip</title>"
    }));
    await page.goto("https://example.test/");
    await page.evaluate(() => {
      const store = {
        sf_settings_v4: {
          disclosureAckedSources: ["greasyfork", "sleazyfork", "openuserjs", "chromewebstore", "mozillaaddons", "catalogs", "githubgist", "github"]
        }
      };
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
        setTimeout(() => request.onload({ status: 200, responseText: "[]" }), 0);
      };
    });
    await page.addScriptTag({ content: userscript });
    await page.waitForFunction(() => window.__menus?.size >= 8);

    await page.evaluate(() => {
      Array.from(window.__menus.values()).find(menu => menu.name.includes("(GreasyFork)")).callback();
    });

    await page.waitForFunction(() => window.__requests.length > 0);

    const result = await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      return {
        hasDisclosure: !!shadow.querySelector(".sf-disclosure"),
        hasTabs: shadow.querySelectorAll(".sf-tab").length > 0,
        requests: window.__requests.length
      };
    });
    assert.equal(result.hasDisclosure, false, "no disclosure shown");
    assert.ok(result.hasTabs, "tabs shown directly");
    assert.ok(result.requests > 0, "scripts loaded immediately");

    await page.close();
  }

  await browser.close();
  console.log("network disclosure tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exit(1);
});
