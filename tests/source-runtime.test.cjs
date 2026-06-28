const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

function loadSourceRuntime() {
  const testHooks = {};
  const sandboxWindow = {
    __SF_TEST_HOOKS__: testHooks,
    location: { hostname: "reddit.com", href: "https://reddit.com/" },
    addEventListener() {}
  };
  sandboxWindow.self = sandboxWindow;
  sandboxWindow.top = sandboxWindow;

  const sandbox = {
    URL,
    console,
    setTimeout() {},
    trustedTypes: undefined,
    window: sandboxWindow,
    document: {
      readyState: "loading",
      addEventListener() {},
      createElement() {
        return {
          _text: "",
          set textContent(value) { this._text = String(value || ""); },
          get innerHTML() { return this._text; }
        };
      }
    }
  };

  vm.runInNewContext(userscript, sandbox, { filename: "UserScript-Finder.user.js" });
  assert.ok(testHooks.SourceRuntime, "SourceRuntime test hook was exported");
  return testHooks.SourceRuntime;
}

const runtime = loadSourceRuntime();
const service = {
  serviceName: "github",
  cache: new Map()
};
const fresh = [{ name: "fresh" }];
const stale = [{ name: "stale" }];
const now = Date.now();

service.cache.set("fresh-key", { data: fresh, timestamp: now });
service.cache.set("stale-key", { data: stale, timestamp: now - 120000 });

assert.equal(runtime.label(service), "GitHub");
assert.equal(runtime.freshCache(service, "fresh-key", { get: () => 60000 }).data, fresh);

const staleHit = runtime.freshCache(service, "stale-key", { get: () => 60000 });
assert.equal(staleHit.data, null);
assert.equal(staleHit.cached.data, stale);

const rateLimit = runtime.httpError("GitHub", 429);
assert.equal(rateLimit.kind, "rate-limit");
assert.equal(rateLimit.retryMs, 60000);

const staleFallback = runtime.staleOrThrow(service, "stale-key", staleHit.cached, rateLimit);
assert.equal(staleFallback[0].name, "stale");
assert.equal(staleFallback._sfStatus.type, "stale");
assert.match(staleFallback._sfStatus.detail, /rate limited/);

const backingOff = runtime.backoffFallback(service, "stale-key", staleHit.cached);
assert.equal(backingOff._sfStatus.title, "GitHub is backing off");

service._sfBackoff.set("missing-key", Date.now() + 1000);
assert.throws(
  () => runtime.backoffFallback(service, "missing-key", null),
  err => err.kind === "backoff" && /Waiting/.test(err.message)
);

assert.throws(
  () => runtime.staleOrThrow(service, "uncached", null, runtime.error("GitHub", "network request failed", "network")),
  err => err.kind === "network"
);

console.log("source-runtime tests passed");
