const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolvePlaywright } = require("./helpers/playwright-setup.cjs");
const { chromium } = resolvePlaywright();

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 375, height: 667 }
];

let browser;

async function setupPage(viewport) {
  const page = await browser.newPage({ viewport });
  await page.route("https://example.test/*", route => route.fulfill({
    status: 200, contentType: "text/html",
    body: "<!doctype html><title>layout test</title>"
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
    window.__SF_TEST_HOOKS__ = {};
    let nextMenuId = 0;
    window.GM_getValue = (key, fallback) => key in store ? store[key] : fallback;
    window.GM_setValue = (key, value) => { store[key] = value; };
    window.GM_deleteValue = key => { delete store[key]; };
    window.GM_addStyle = () => {};
    window.GM_openInTab = () => {};
    window.GM_addValueChangeListener = () => {};
    window.GM_registerMenuCommand = (name, callback) => {
      const id = ++nextMenuId;
      window.__menus.set(id, { name, callback });
      return id;
    };
    window.GM_unregisterMenuCommand = id => window.__menus.delete(id);
    window.GM_xmlhttpRequest = request => {
      const results = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Test Script ${i + 1} for example.test`,
        description: `A helpful script that does thing ${i + 1} on example.test domain pages`,
        url: `/scripts/${i + 1}`,
        code_url: `https://update.greasyfork.org/scripts/${i + 1}/test.user.js`,
        version: `1.${i}.0`,
        license: "MIT",
        total_installs: 10000 - i * 100,
        daily_installs: 100 - i,
        good_ratings: 50 - i,
        fan_score: 9 - i * 0.1,
        code_updated_at: new Date(Date.now() - i * 86400000).toISOString(),
        created_at: new Date(Date.now() - i * 86400000 * 30).toISOString(),
        users: [{ name: `author${i}` }],
        _source: "greasyfork",
        _full_name: `test-script-${i + 1}`,
        _topics: ["userscript", "example"]
      }));
      setTimeout(() => request.onload({ status: 200, responseText: JSON.stringify(results) }), 10);
    };
  });
  await page.addScriptTag({ content: userscript });
  await page.waitForFunction(() => window.__menus?.size >= 8);
  return page;
}

(async () => {
  browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const page = await setupPage(vp);

    await page.evaluate(() => {
      Array.from(window.__menus.values()).find(menu => menu.name.includes("(GreasyFork)")).callback();
    });

    await page.waitForFunction(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      return shadow?.querySelectorAll(".sf-item")?.length > 0;
    }, { timeout: 10000 });

    const layout = await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      const modal = shadow.querySelector(".sf-modal");
      const rect = modal.getBoundingClientRect();
      const items = shadow.querySelectorAll(".sf-item");
      const tabs = shadow.querySelectorAll(".sf-tab");
      const searchInput = shadow.querySelector(".sf-search-input");
      const sortSelect = shadow.querySelector(".sf-sort-select");
      const closeBtn = shadow.querySelector(".sf-btn-close");
      const settingsBtn = shadow.querySelector(".sf-btn-settings");
      const footer = shadow.querySelector(".sf-footer");

      const isVisible = el => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      const isInViewport = el => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.left >= 0 && r.right <= window.innerWidth;
      };

      return {
        modalVisible: modal.classList.contains("visible"),
        modalWidth: rect.width,
        modalWithinViewport: rect.left >= 0 && rect.right <= window.innerWidth,
        noHorizontalOverflow: modal.scrollWidth <= modal.clientWidth + 2,
        itemCount: items.length,
        tabCount: tabs.length,
        searchVisible: isVisible(searchInput),
        sortVisible: isVisible(sortSelect),
        closeVisible: isVisible(closeBtn),
        settingsVisible: isVisible(settingsBtn),
        footerVisible: isVisible(footer),
        footerInViewport: isInViewport(footer),
        allTabsVisible: Array.from(tabs).every(t => isVisible(t))
      };
    });

    assert.ok(layout.modalVisible, `${vp.name}: modal is visible`);
    assert.ok(layout.modalWithinViewport, `${vp.name}: modal fits within viewport (${layout.modalWidth}px)`);
    assert.ok(layout.noHorizontalOverflow, `${vp.name}: no horizontal overflow`);
    assert.ok(layout.itemCount > 0, `${vp.name}: result items rendered (${layout.itemCount})`);
    assert.ok(layout.tabCount >= 8, `${vp.name}: tabs rendered (${layout.tabCount})`);
    assert.ok(layout.searchVisible, `${vp.name}: search input visible`);
    assert.ok(layout.sortVisible, `${vp.name}: sort select visible`);
    assert.ok(layout.closeVisible, `${vp.name}: close button visible`);
    assert.ok(layout.settingsVisible, `${vp.name}: settings button visible`);
    assert.ok(layout.footerVisible, `${vp.name}: footer visible`);

    // Test settings panel doesn't clip
    await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      shadow.querySelector(".sf-btn-settings").click();
    });
    await page.waitForFunction(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      return shadow?.querySelector(".sf-settings.visible");
    });

    const settingsLayout = await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      const settings = shadow.querySelector(".sf-settings");
      return {
        visible: settings.classList.contains("visible"),
        noOverflow: settings.scrollWidth <= settings.clientWidth + 2
      };
    });
    assert.ok(settingsLayout.visible, `${vp.name}: settings panel visible`);
    assert.ok(settingsLayout.noOverflow, `${vp.name}: settings panel no overflow`);

    // Test empty state
    await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      shadow.querySelector(".sf-btn-settings").click();
      const input = shadow.querySelector(".sf-search-input");
      input.value = "xyznonexistent99999";
      input.dispatchEvent(new Event("input"));
    });

    const emptyLayout = await page.evaluate(() => {
      const shadow = Array.from(document.querySelectorAll("div")).map(el => el.shadowRoot).find(root => root?.querySelector(".sf-modal"));
      const empty = shadow.querySelector(".sf-empty");
      return {
        hasEmpty: !!empty,
        noClip: empty ? empty.getBoundingClientRect().right <= window.innerWidth : true
      };
    });
    assert.ok(emptyLayout.hasEmpty, `${vp.name}: empty state shown`);
    assert.ok(emptyLayout.noClip, `${vp.name}: empty state not clipped`);

    await page.close();
  }

  await browser.close();
  console.log("modal layout tests passed");
})().catch(async err => {
  if (browser) await browser.close();
  console.error(err);
  process.exit(1);
});
