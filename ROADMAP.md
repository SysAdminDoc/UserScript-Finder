# Roadmap

Forward-looking plans for UserScript Finder — a userscript that adds a Tampermonkey/Violentmonkey menu entry to search GreasyFork, SleazyFork, and GitHub for scripts matching the current site.

## Planned Features

### Sources
- OpenUserJS as a fourth source (matches UserScriptHunt coverage)
- Search Chrome Web Store for matching extensions (surface extension alternatives to scripts)
- Search Mozilla AMO similarly
- GitHub Gists as a separate source (many quick scripts live there, not in repos)
- Awesome-userscript lists + Tampermonkey's own script catalog

### Results UX
- In-page overlay instead of new tab, matches UserScriptHunt layout
- Sort by: daily installs, rating, updated date, author reputation
- Filter by: has-update-in-last-N-months, minimum rating, English-only
- Preview pane showing `@match` coverage vs the current host so users see which scripts actually apply
- One-click install button (opens the raw `.user.js` to the user's userscript manager)

### Discovery Features
- "Already-installed" badge — query `GM_info` / compare to installed scripts, don't re-suggest
- Trending-for-site panel: show what other users of this domain tend to install
- Related sites: if the script supports youtube.com, suggest it on youtu.be and music.youtube.com
- Dark/light theme toggle synced with the host page's `prefers-color-scheme`

### Safety & Trust
- Source-code preview with syntax highlighting before install
- Author reputation score (fork count / total installs / age of account)
- Flag scripts that request dangerous `@grant` (GM_xmlhttpRequest to arbitrary hosts, unsafeWindow)
- Show last-updated red flag when > 2 years stale

### Persistence
- Remember dismissed scripts per domain
- "Queue to try" list across domains
- Export/import settings as JSON (for users on multiple machines)

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
