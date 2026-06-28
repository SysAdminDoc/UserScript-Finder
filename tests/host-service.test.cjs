const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

function loadHostService(hostname = "m.reddit.com") {
  const testHooks = {};
  const sandboxWindow = {
    __SF_TEST_HOOKS__: testHooks,
    location: { hostname, href: `https://${hostname}/test` },
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
  assert.ok(testHooks.HostService, "HostService test hook was exported");
  return testHooks.HostService;
}

const HostService = loadHostService();

assert.equal(HostService.normalizeHost("www.Example.COM."), "example.com");
assert.equal(HostService.normalizeHost("m.reddit.com"), "reddit.com");
assert.equal(HostService.normalizeHost("mobile.youtube.com"), "youtube.com");
assert.equal(HostService.extractRootDomain("forums.news.bbc.co.uk"), "bbc.co.uk");
assert.equal(HostService.extractRootDomain("shop.example.com.au"), "example.com.au");
assert.equal(HostService.extractRootDomain("docs.project.github.io"), "project.github.io");
assert.equal(HostService.extractRootDomain("preview.team.pages.dev"), "team.pages.dev");
assert.equal(HostService.extractRootDomain("localhost"), "localhost");
assert.equal(HostService.extractRootDomain("127.0.0.1"), "127.0.0.1");
assert.equal(HostService.extractRootDomain("2001:db8::1"), "2001:db8::1");
assert.equal(loadHostService("m.reddit.com").getCurrentHost(), "reddit.com");

const exactHost = "old.reddit.com";
const rootHost = HostService.extractRootDomain(exactHost);
assert.equal(exactHost, "old.reddit.com");
assert.equal(rootHost, "reddit.com");
assert.notEqual(exactHost, rootHost);

console.log("host-service tests passed");
