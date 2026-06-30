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

async function compatPage() {
  const page = await browser.newPage();
  await page.route("https://compat.test/*", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>compat</title><button id='outside'>Outside</button>"
  }));
  await page.goto("https://compat.test/path");
  return page;
}

(async () => {
  browser = await chromium.launch({ headless: true });

  const missingRequest = await compatPage();
  await missingRequest.evaluate(() => {
    let nextMenuId = 0;
    window.__menus = new Map();
    window.__SF_TEST_HOOKS__ = {};
    Object.defineProperty(window, "trustedTypes", {
      configurable: true,
      value: {
        createPolicy(name, rules) {
          if (name === "gf-script-finder") throw new Error("Policy already exists");
          return { createHTML: rules.createHTML };
        }
      }
    });
    window.GM_info = { scriptHandler: "Tampermonkey", version: "5.test", script: { name: "UserScript Finder" } };
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_setValue = () => {};
    window.GM_deleteValue = () => {};
    window.GM_openInTab = () => {};
    window.GM_registerMenuCommand = (name, callback) => {
      const id = ++nextMenuId;
      window.__menus.set(id, { name, callback });
      return id;
    };
    window.GM_unregisterMenuCommand = id => window.__menus.delete(id);
  });
  await missingRequest.addScriptTag({ content: userscript });
  await missingRequest.waitForFunction(() => window.__menus?.size >= 2);

  const missingRequestState = await missingRequest.evaluate(() => {
    const menuNames = Array.from(window.__menus.values()).map(menu => menu.name);
    Array.from(window.__menus.values()).find(menu => menu.name === "Script Finder compatibility report").callback();
    return {
      menuNames,
      report: window.__SF_TEST_HOOKS__.ManagerCompatibility.report()
    };
  });
  assert.ok(missingRequestState.menuNames.includes("Script Finder compatibility report"));
  assert.ok(!missingRequestState.menuNames.some(name => name.startsWith("Find ")));
  assert.equal(missingRequestState.report.ok, false);
  assert.equal(missingRequestState.report.available.GM_xmlhttpRequest, false);
  assert.equal(missingRequestState.report.trustedTypes.status, "renamed");

  await missingRequest.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-compat-report");
  });
  const reportText = await missingRequest.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow.querySelector(".sf-compat-report").textContent;
  });
  assert.match(reportText, /GM_xmlhttpRequest/);
  assert.match(reportText, /Tampermonkey/);

  const missingMenu = await compatPage();
  await missingMenu.evaluate(() => {
    window.__SF_TEST_HOOKS__ = {};
    window.GM_info = { scriptHandler: "PartialMonkey", version: "1.0" };
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_setValue = () => {};
    window.GM_deleteValue = () => {};
    window.GM_openInTab = () => {};
    window.GM_xmlhttpRequest = () => {};
  });
  await missingMenu.addScriptTag({ content: userscript });
  await missingMenu.waitForFunction(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow?.querySelector(".sf-compat-report");
  });
  const missingMenuText = await missingMenu.evaluate(() => {
    const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
    return shadow.querySelector(".sf-compat-report").textContent;
  });
  assert.match(missingMenuText, /GM_registerMenuCommand/);
  assert.match(missingMenuText, /PartialMonkey/);

  await browser.close();
  console.log("manager compatibility tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exitCode = 1;
});
