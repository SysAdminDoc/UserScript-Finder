const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const fixtureDir = path.join(__dirname, "fixtures", "live");
if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

const SOURCES = [
  {
    name: "greasyfork-by-site",
    url: "https://greasyfork.org/scripts/by-site/youtube.com.json",
    type: "json",
    redact: data => {
      const arr = JSON.parse(data);
      return JSON.stringify(arr.slice(0, 5).map(s => ({
        ...s,
        users: s.users?.map(u => ({ ...u, name: u.name?.replace(/./g, (c, i) => i < 2 ? c : "*") }))
      })), null, 2);
    }
  },
  {
    name: "mozilla-addons",
    url: "https://addons.mozilla.org/api/v5/addons/search/?q=youtube&type=extension&page_size=5",
    type: "json",
    redact: data => {
      const parsed = JSON.parse(data);
      parsed.results = (parsed.results || []).slice(0, 5).map(r => ({
        ...r,
        authors: r.authors?.map(a => ({ ...a, name: a.name?.replace(/./g, (c, i) => i < 2 ? c : "*"), email: undefined }))
      }));
      return JSON.stringify(parsed, null, 2);
    }
  },
  {
    name: "github-search",
    url: "https://api.github.com/search/repositories?q=youtube+userscript+language:javascript&sort=stars&per_page=5",
    type: "json",
    redact: data => {
      const parsed = JSON.parse(data);
      parsed.items = (parsed.items || []).slice(0, 5).map(r => ({
        ...r,
        owner: r.owner ? { ...r.owner, email: undefined } : r.owner
      }));
      return JSON.stringify(parsed, null, 2);
    }
  }
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "UserScript-Finder-Fixture-Refresh/1.0", Accept: "application/json" } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      let body = "";
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        else resolve(body);
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

(async () => {
  let success = 0;
  let failed = 0;

  for (const source of SOURCES) {
    const outPath = path.join(fixtureDir, `${source.name}.${source.type}`);
    try {
      console.log(`Fetching ${source.name} from ${source.url}...`);
      const data = await fetch(source.url);
      const redacted = source.redact(data);
      fs.writeFileSync(outPath, redacted, "utf8");
      console.log(`  OK: ${outPath} (${redacted.length} bytes)`);
      success++;
    } catch (err) {
      console.error(`  FAIL: ${source.name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${success} refreshed, ${failed} failed`);
  if (failed) process.exit(1);
})();
