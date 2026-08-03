# Roadmap

Forward-looking plans for UserScript Finder — a userscript that adds Tampermonkey/Violentmonkey menu entries to search userscript registries, extension stores, catalogs, Gists, and GitHub for matches on the current site.

## Planned Features

### Discovery Features
- Related sites: if the script supports youtube.com, suggest it on youtu.be and music.youtube.com

### Safety & Trust
- Source-code preview with syntax highlighting before install

### Reliability
- [ ] P2 — Clear `setInterval` handle from `watchForChanges` polling fallback
  Why: The 3000ms interval is never cleared; on SPA re-injection, multiple intervals accumulate holding ScriptFinder closures alive.
  Where: `SettingsService.watchForChanges`, line ~958
- [ ] P2 — Guard `_loadScripts` finally-block recursive call against concurrent re-entry
  Why: Between `isLoading = false` and the recursive `_loadScripts()` call, other callers can slip in and start a parallel load.
  Where: `ScriptFinder._loadScripts`, finally block at end
- [ ] P3 — Cap per-domain dismissed scripts and queue storage
  Why: `sf_dismissed` and `sf_queue` GM values grow without bound; heavy use could eventually hit manager storage limits.
  Where: `_dismissScript`, `_toggleQueued`
- [ ] P3 — OpenUserJS install URL assumes two-segment script paths
  Why: Paths like `/scripts/123` (without author segment) produce broken install URLs that pass validation but 404 on fetch.
  Where: `OpenUserJSScriptService._normalizeRow`, line ~1268
- [ ] P3 — Gist deduplication uses case-sensitive hash comparison
  Why: The regex match is case-insensitive but the `seen` Set key preserves original casing; mixed-case hashes from GitHub could duplicate results.
  Where: `GitHubGistService._normalizeSnippet`, line ~1965

## Competitive Research

- **UserScriptHunt** (sibling project): web app doing the same search in parallel — this userscript is the in-page companion. Keep feature parity on sources.
- **Greasy Fork's own "for this site" filter**: good baseline but siloed. We aggregate; they don't.
- **Tampermonkey Dashboard**: the install destination. Don't try to replace — complement by linking cleanly into its editor.
- **Stylus equivalent for CSS**: similar search-for-this-site pattern exists for userstyles (userstyles.world). Consider a styles tab as a v2 addition.

## Nice-to-Haves

- Bang-prefix shortcut bar (`!gf youtube`, `!gh tampermonkey youtube`) inside the overlay
- "Copy install URL" + QR code for mobile-to-desktop transfer
- Per-source API-key support (GitHub token) to raise rate limits
- Offline cache of the last N searches
- Script conflict detector — warn if two installed scripts both touch the same element tree
- AI-assisted summary of a script's source (local model) for "does this script do what it claims?"

## Open-Source Research (Round 2)

### Related OSS Projects
- https://github.com/ish4ra/greasyforksearch — userscript that aggregates searches across GF/SF/OUJ/MG
- https://github.com/ChinaGodMan/UserScripts — greasyfork-search via Google advanced operators
- https://github.com/F9y4ng/GreasyFork-Scripts — SE-assistant + script-shop shell
- https://github.com/greasyfork-org/greasyfork — upstream Greasy Fork (API surface to mirror)
- https://github.com/OpenUserJs/OpenUserJS.org — OpenUserJS source
- https://github.com/Tampermonkey/tampermonkey — GM API surface reference
- https://github.com/violentmonkey/violentmonkey — fully-OSS alternative manager
- https://github.com/awesome-scripts/awesome-userscripts — curated list, good for seed data
- https://github.com/sizzlemctwizzle/OpenUserJS.org — OpenUserJS maintainer-side patterns

### Features to Borrow
- Multi-site toggle in-UI (GF/SF/OUJ/MonkeyGuts/Google CSE) following greasyforksearch UX
- Google Custom Search Engine (CSE) fallback for sites without a proper search API (greasyforksearch)
- Advanced-operator support (site:, inurl:, intext:) exposed as a simple pill-filter (ChinaGodMan)
- Script-metadata preview (author, version, updated, install count) pulled from GF's `/scripts/ID.json` (greasyfork-org)
- Source-diff between two scripts via GF's raw URL (already in roadmap; uses GF's versioned raw endpoints)
- Install-count sparkline from GF daily stats (greasyfork-org has per-script stats)
- Script-version watcher using `@updateURL` polling with HEAD-only checks (Tampermonkey GM API pattern)
- Import from Violentmonkey/Tampermonkey export JSON for "has-installed" filtering (GM_listValues extension bridge)
- Per-category landing pages seeded from awesome-userscripts taxonomy
- AI-assisted summary of a script (local ONNX model) — already in roadmap; use CodeT5-small or similar ≤50MB

### Patterns & Architectures Worth Studying
- Source-federation layer: each registry (GF/SF/OUJ/GitHub) is an adapter with `search()`, `getScript()`, `stats()`
- Install-handoff protocol: redirect to `*.user.js` raw URL, let Tampermonkey/Violentmonkey capture the install (avoid re-implementing the parser)
- CORS-proxy fallback for sites without permissive headers — Cloudflare Worker or local proxy when running as userscript
- Rate-limit respect: per-source backoff + cached results in `GM_setValue` with TTL
- Conflict detector: parse `@match` / `@include` from installed scripts and flag overlapping DOM targets

