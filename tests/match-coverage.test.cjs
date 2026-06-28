const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

function loadMatchCoverage() {
  const testHooks = {};
  const sandboxWindow = {
    __SF_TEST_HOOKS__: testHooks,
    location: { hostname: "reddit.com", href: "https://reddit.com/r/test?sort=new#comments" },
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
          get innerHTML() {
            return this._text
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
          }
        };
      }
    }
  };

  vm.runInNewContext(userscript, sandbox, { filename: "UserScript-Finder.user.js" });
  assert.ok(testHooks.MatchCoverage, "MatchCoverage test hook was exported");
  return testHooks.MatchCoverage;
}

function metadata(lines) {
  return `// ==UserScript==\n${lines.map(line => `// ${line}`).join("\n")}\n// ==/UserScript==\nconsole.log("body");`;
}

const coverage = loadMatchCoverage();
const currentUrl = "https://reddit.com/r/test?sort=new#comments";

assert.deepEqual(JSON.parse(JSON.stringify(coverage.extractUserScriptMetadata(metadata([
  "@name Example",
  "@match *://*.reddit.com/r/*",
  "@include https://reddit.com/*",
  "@exclude *://old.reddit.com/*"
])))), {
  match: ["*://*.reddit.com/r/*"],
  include: ["https://reddit.com/*"],
  exclude: ["*://old.reddit.com/*"]
});

assert.equal(coverage.evaluate(metadata(["@match *://*.reddit.com/r/*"]), "reddit.com", currentUrl).status, "good");
assert.equal(coverage.evaluate(metadata(["@match http://*.reddit.com/r/*"]), "reddit.com", currentUrl).status, "bad");
assert.equal(coverage.evaluate(metadata(["@match *://*.reddit.com/messages/*"]), "reddit.com", currentUrl).status, "bad");
assert.equal(coverage.evaluate(metadata(["@match *://*.evilreddit.com/r/*"]), "reddit.com", currentUrl).status, "bad");
assert.equal(coverage.evaluate(metadata(["@include https://reddit.com/r/*"]), "reddit.com", currentUrl).status, "good");
assert.equal(coverage.evaluate(metadata(["@include /reddit\\.com\\/r\\/test\\?sort=new/i"]), "reddit.com", currentUrl).status, "good");
assert.equal(coverage.evaluate(metadata(["@match <all_urls>"]), "reddit.com", currentUrl).status, "good");
assert.equal(coverage.evaluate(metadata(["@match *://*.reddit.com/r/*", "@exclude https://reddit.com/r/test*"]), "reddit.com", currentUrl).status, "bad");
assert.equal(coverage.evaluate(metadata(["@name No coverage"]), "reddit.com", currentUrl).status, "warn");

const excluded = coverage.evaluate(metadata(["@match *://*.reddit.com/r/*", "@exclude https://reddit.com/r/test*"]), "reddit.com", currentUrl);
assert.equal(excluded.title, "Excluded on reddit.com");
assert.deepEqual(JSON.parse(JSON.stringify(excluded.patterns)), ["https://reddit.com/r/test*"]);

console.log("match-coverage tests passed");
