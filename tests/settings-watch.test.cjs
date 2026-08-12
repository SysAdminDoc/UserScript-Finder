const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

let nextTimer = 0;
const timers = new Map();
const cleared = [];
const store = {};
const hooks = {};
const sandboxWindow = {
  __SF_TEST_HOOKS__: hooks,
  location: { hostname: "example.test", href: "https://example.test/" },
  addEventListener() {}
};
sandboxWindow.self = sandboxWindow;
sandboxWindow.top = sandboxWindow;

const sandbox = {
  URL,
  console,
  window: sandboxWindow,
  document: { readyState: "loading", addEventListener() {} },
  setTimeout() {},
  setInterval(callback, delay) {
    const id = ++nextTimer;
    timers.set(id, { callback, delay });
    return id;
  },
  clearInterval(id) {
    cleared.push(id);
    timers.delete(id);
  },
  GM_getValue(key, fallback) { return key in store ? store[key] : fallback; },
  GM_setValue(key, value) { store[key] = value; },
  GM_deleteValue(key) { delete store[key]; }
};

vm.runInNewContext(userscript, sandbox, { filename: "UserScript-Finder.user.js" });
const SettingsService = hooks.SettingsService;
assert.ok(SettingsService, "SettingsService test hook was exported");

const first = new SettingsService();
const firstCleanup = first.watchForChanges(() => {});
assert.equal(timers.size, 1, "polling fallback starts one interval");
const firstTimer = [...timers.keys()][0];

const second = new SettingsService();
const secondCleanup = second.watchForChanges(() => {});
assert.deepEqual(cleared, [firstTimer], "starting a new watcher clears the previous interval");
assert.equal(timers.size, 1, "only the current watcher owns an interval");

secondCleanup();
assert.equal(timers.size, 0, "watch cleanup clears the polling interval");
assert.equal(second._pollTimer, null, "cleared watcher releases its timer handle");
const clearedAfterSecond = [...cleared];
firstCleanup();
assert.deepEqual(cleared, clearedAfterSecond, "cleanup remains idempotent");

console.log("settings watch tests passed");
