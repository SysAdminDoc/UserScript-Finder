const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const userscript = fs.readFileSync(path.join(repoRoot, "UserScript-Finder.user.js"), "utf8");
const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
const changelog = fs.readFileSync(path.join(repoRoot, "CHANGELOG.md"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

const headerEnd = userscript.indexOf("// ==/UserScript==");
const header = userscript.slice(0, headerEnd);
const body = userscript.slice(headerEnd);

const connectDomains = [...header.matchAll(/\/\/\s*@connect\s+(\S+)/g)].map(m => m[1]);

const nonFetchDomains = new Set([
  "www.w3.org",
  "github.com",
  "tampermonkey.net",
  "violentmonkey.github.io",
  "www.userscript.zone",
  "img.shields.io"
]);

const allUrlHosts = new Set();
for (const m of body.matchAll(/["'`](https?:\/\/[^"'`\s${}]+)/g)) {
  try {
    const host = new URL(m[1]).hostname;
    if (host !== "*" && !nonFetchDomains.has(host)) allUrlHosts.add(host);
  } catch {}
}

const installAllowlistHosts = new Set();
const allowlistBlock = body.match(/allowlists\s*:\s*\{([\s\S]*?)\n\s*\}/);
if (allowlistBlock) {
  for (const m of allowlistBlock[1].matchAll(/https?:\/\/([^/"'`\s,)]+)/g)) {
    installAllowlistHosts.add(m[1]);
  }
}

const fetchDomains = [...new Set([...allUrlHosts, ...installAllowlistHosts])];

const sourceMetaMatch = body.match(/const SOURCE_META\s*=\s*\{([\s\S]*?)\};/);
const sourceKeys = sourceMetaMatch
  ? [...sourceMetaMatch[1].matchAll(/(\w+)\s*:\s*\{/g)].map(m => m[1])
  : [];

let failures = 0;

console.log("=== @connect allowlist audit ===\n");

console.log("Header @connect entries:", connectDomains.join(", "));
console.log("Body fetch domains:", fetchDomains.sort().join(", "));
console.log("SOURCE_META keys:", sourceKeys.join(", "));
console.log();

const missingConnect = fetchDomains.filter(d => !connectDomains.includes(d));
if (missingConnect.length) {
  console.error("FAIL: Adapter domains missing from @connect:", missingConnect.join(", "));
  failures++;
} else {
  console.log("OK: All adapter domains present in @connect");
}

const orphanConnect = connectDomains.filter(d => !fetchDomains.includes(d));
if (orphanConnect.length) {
  console.error("FAIL: @connect domains not used by any adapter:", orphanConnect.join(", "));
  failures++;
} else {
  console.log("OK: No orphan @connect entries");
}

const readmeSourceRows = [...readme.matchAll(/\|\s*\*\*(\w[\w\s/]*?)\*\*\s*\|/g)].map(m => m[1].trim());
const sourceLabels = {
  greasyfork: "GreasyFork",
  sleazyfork: "SleazyFork",
  openuserjs: "OpenUserJS",
  chromewebstore: "Chrome Web Store",
  mozillaaddons: "Mozilla AMO",
  catalogs: "Catalogs",
  githubgist: "GitHub Gists",
  github: "GitHub"
};
const missingReadme = sourceKeys.filter(k => {
  const label = sourceLabels[k];
  return label && !readmeSourceRows.some(r => r.includes(label) || r.includes(k));
});
if (missingReadme.length) {
  console.error("FAIL: Sources missing from README Data Sources table:", missingReadme.join(", "));
  failures++;
} else {
  console.log("OK: All sources documented in README");
}

const versionHeader = header.match(/@version\s+(\S+)/)?.[1];
const versionReadme = readme.match(/version-([0-9.]+)-/)?.[1];
if (versionHeader && versionReadme && versionHeader !== versionReadme) {
  console.error(`FAIL: Version mismatch — header: ${versionHeader}, README badge: ${versionReadme}`);
  failures++;
} else if (versionHeader && versionReadme) {
  console.log(`OK: Version consistent (${versionHeader})`);
}

const licenseHeader = header.match(/@license\s+(\S+)/)?.[1];
const licenseReadme = readme.match(/license-([A-Za-z0-9.-]+)-/)?.[1];
if (licenseHeader && licenseReadme && licenseHeader !== licenseReadme) {
  console.error(`FAIL: License mismatch — header: ${licenseHeader}, README badge: ${licenseReadme}`);
  failures++;
} else if (licenseHeader && licenseReadme) {
  console.log(`OK: License consistent (${licenseHeader})`);
}

const downloadUrl = header.match(/@downloadURL\s+(\S+)/)?.[1];
const updateUrl = header.match(/@updateURL\s+(\S+)/)?.[1];
if (downloadUrl && !downloadUrl.startsWith("https://raw.githubusercontent.com/")) {
  console.error(`FAIL: @downloadURL not pointing to raw GitHub: ${downloadUrl}`);
  failures++;
}
if (updateUrl && !updateUrl.startsWith("https://raw.githubusercontent.com/")) {
  console.error(`FAIL: @updateURL not pointing to raw GitHub: ${updateUrl}`);
  failures++;
}
if (downloadUrl && updateUrl) {
  console.log("OK: @downloadURL and @updateURL point to raw GitHub");
}

if (versionHeader && !changelog.includes(`[v${versionHeader}]`)) {
  console.error(`FAIL: CHANGELOG.md missing entry for v${versionHeader}`);
  failures++;
} else if (versionHeader) {
  console.log(`OK: CHANGELOG has entry for v${versionHeader}`);
}

if (versionHeader && pkg.version !== versionHeader) {
  console.error(`FAIL: package.json version (${pkg.version}) does not match header (${versionHeader})`);
  failures++;
} else if (versionHeader) {
  console.log(`OK: package.json version matches (${pkg.version})`);
}

console.log(`\n${failures ? "FAILED" : "PASSED"} — ${failures} issue(s) found`);
process.exit(failures ? 1 : 0);
