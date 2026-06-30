const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const runtimeNodeModules = "C:/Users/--/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
process.env.NODE_PATH = [
  runtimeNodeModules,
  `${runtimeNodeModules}/.pnpm/node_modules`,
  `${runtimeNodeModules}/playwright/node_modules`,
  process.env.NODE_PATH || ""
].filter(Boolean).join(path.delimiter);
Module._initPaths();

const { chromium } = require("playwright");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

let browser;

async function installHarness(page, url, savedSettings = {}) {
  await page.route("**/*", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>sensitive host</title><button id='outside'>Outside</button>"
  }));
  await page.goto(url);
  await page.evaluate(settings => {
    const store = { sf_settings_v4: settings };
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
  }, savedSettings);
  await page.addScriptTag({ content: userscript });
}

(async () => {
  browser = await chromium.launch({ headless: true });

  const bankPage = await browser.newPage();
  await installHarness(bankPage, "https://bank.example.test/accounts");
  await bankPage.waitForFunction(() => window.__menus?.size >= 2);

  const blockedMenuState = await bankPage.evaluate(() => {
    const menuNames = Array.from(window.__menus.values()).map(menu => menu.name);
    return { menuNames, requests: window.__requests.slice() };
  });
  assert.ok(blockedMenuState.menuNames.some(name => name.includes("blocked on bank.example.test")));
  assert.ok(!blockedMenuState.menuNames.some(name => name.startsWith("Find ")));
  assert.deepEqual(blockedMenuState.requests, []);

  await bankPage.evaluate(() => {
    Array.from(window.__menus.values()).find(menu => menu.name.includes("blocked on bank.example.test")).callback();
  });
  await bankPage.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-host-blocked");
  });

  const blockedUi = await bankPage.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return {
      tabs: shadow.querySelectorAll(".sf-tab").length,
      title: shadow.querySelector(".sf-empty-title").textContent,
      requests: window.__requests.slice()
    };
  });
  assert.equal(blockedUi.tabs, 0);
  assert.equal(blockedUi.title, "Search disabled on sensitive host");
  assert.deepEqual(blockedUi.requests, []);

  await bankPage.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    shadow.querySelector(".sf-host-allow-btn").click();
  });
  await bankPage.waitForFunction(() => window.__requests.length > 0);

  const allowedState = await bankPage.evaluate(() => {
    const menuNames = Array.from(window.__menus.values()).map(menu => menu.name);
    return {
      overrides: window.__store.sf_settings_v4.sensitiveHostOverrides,
      hasSourceMenu: menuNames.some(name => name.endsWith("(GreasyFork)")),
      requests: window.__requests.slice()
    };
  });
  assert.deepEqual(allowedState.overrides, ["bank.example.test"]);
  assert.equal(allowedState.hasSourceMenu, true);
  assert.ok(allowedState.requests.some(url => url.includes("greasyfork.org")));

  const customPage = await browser.newPage();
  await installHarness(customPage, "https://custom.example.test/path", {
    sensitiveHostPatterns: "custom.example.test"
  });
  await customPage.waitForFunction(() => window.__menus?.size >= 2);
  const customState = await customPage.evaluate(() => {
    const menuNames = Array.from(window.__menus.values()).map(menu => menu.name);
    return { menuNames, requests: window.__requests.slice() };
  });
  assert.ok(customState.menuNames.some(name => name.includes("blocked on custom.example.test")));
  assert.ok(!customState.menuNames.some(name => name.startsWith("Find ")));
  assert.deepEqual(customState.requests, []);

  await browser.close();
  console.log("sensitive host tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exitCode = 1;
});
