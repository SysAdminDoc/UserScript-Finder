const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

assert.match(userscript, /role", "dialog"/);
assert.match(userscript, /aria-modal", "true"/);
assert.match(userscript, /aria-labelledby", "sf-modal-title"/);
assert.match(userscript, /aria-describedby", "sf-modal-subtitle"/);
assert.match(userscript, /aria-live="polite"/);
assert.match(userscript, /role="tablist"/);
assert.match(userscript, /role="tab"/);
assert.match(userscript, /aria-selected/);
assert.match(userscript, /aria-label="Filter results"/);
assert.match(userscript, /aria-pressed/);
assert.match(userscript, /_trapFocus/);
assert.match(userscript, /previousFocus\.focus/);

console.log("accessibility markup tests passed");
