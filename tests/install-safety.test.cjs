const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

function loadInstallSafety() {
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
  assert.ok(testHooks.InstallSafety, "InstallSafety test hook was exported");
  return testHooks.InstallSafety;
}

const safety = loadInstallSafety();

assert.equal(safety.validateInstallUrl(
  { _source: "greasyfork" },
  "https://update.greasyfork.org/scripts/123/Test.user.js"
).ok, true);

assert.equal(safety.validateInstallUrl(
  { _source: "sleazyfork" },
  "https://sleazyfork.org/scripts/123/code/Test.user.js"
).ok, true);

assert.equal(safety.validateInstallUrl(
  { _source: "openuserjs" },
  "https://openuserjs.org/install/alice/Test.user.js"
).ok, true);

assert.equal(safety.validateInstallUrl(
  { _source: "githubgist" },
  "https://gist.githubusercontent.com/alice/0123456789abcdef0123456789abcdef/raw/Test.user.js"
).ok, true);

assert.equal(safety.validateInstallUrl(
  { _source: "catalogs" },
  "https://raw.githubusercontent.com/alice/repo/main/Test.user.js"
).ok, true);

assert.match(safety.validateInstallUrl(
  { _source: "greasyfork" },
  "http://update.greasyfork.org/scripts/123/Test.user.js"
).reason, /HTTPS/);

assert.match(safety.validateInstallUrl(
  { _source: "greasyfork" },
  "https://evil.example/scripts/123/Test.user.js"
).reason, /not trusted/);

assert.match(safety.validateInstallUrl(
  { _source: "githubgist" },
  "https://gist.githubusercontent.com/alice/id/raw/Test.js"
).reason, /\.user\.js/);

assert.equal(safety.hasUserScriptMetadata(`// ==UserScript==
// @name Test
// @match *://example.com/*
// ==/UserScript==
console.log("ok");`), true);

assert.equal(safety.hasUserScriptMetadata(`// ==UserScript==
// @match *://example.com/*
// ==/UserScript==`), false);

assert.equal(safety.hasUserScriptMetadata("console.log('not metadata');"), false);

console.log("install-safety tests passed");
