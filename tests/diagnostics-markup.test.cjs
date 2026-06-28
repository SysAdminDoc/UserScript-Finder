const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");

assert.match(userscript, /sf-health-pill/);
assert.match(userscript, /sf-diagnostics-btn/);
assert.match(userscript, /data-health-label/);
assert.match(userscript, /_recordSourceHealth/);
assert.match(userscript, /_diagnosticString/);
assert.match(userscript, /source=\$\{this\.currentService\}/);
assert.match(userscript, /host=\$\{rootHost\}/);
assert.match(userscript, /navigator\.clipboard/);

console.log("diagnostics markup tests passed");
