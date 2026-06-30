# Roadmap

Forward-looking plans for UserScript Finder — a userscript that adds Tampermonkey/Violentmonkey menu entries to search userscript registries, extension stores, catalogs, Gists, and GitHub for matches on the current site.

## Planned Features

### Results UX
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

## Research-Driven Additions

- [ ] P2 - Add Edge Add-ons and Userstyles.World optional discovery sources
  Why: Extension and style alternatives are adjacent discovery paths when userscripts are unavailable for a site.
  Evidence: Existing Chrome Web Store/Mozilla AMO adapters, roadmap Stylus note, Userstyles.World adjacent ecosystem.
  Touches: source adapter registry, tabs/menu labels, result normalization, README source table.
  Acceptance: Optional Edge Add-ons and Userstyles.World tabs return view-only results with source badges and can be disabled in per-source settings.
  Complexity: M

- [ ] P2 - Replace the English-only heuristic with locale-aware filtering
  Why: The current non-ASCII ratio heuristic can hide legitimate localized scripts and cannot target a preferred language.
  Evidence: `UserScript-Finder.user.js` `looksEnglish`, OpenUserJS/Greasy Fork localized script ecosystems.
  Touches: filter settings, result normalization, locale extraction, filter UI.
  Acceptance: Users can choose Any, browser language, or English; scripts with explicit locale metadata rank/filter correctly before heuristic fallback.
  Complexity: M

- [ ] P3 - Document a source-adapter plugin pattern
  Why: New sources are now useful but repeatedly require wiring menus, tabs, accents, fetch, parse, sort, and install behavior by hand.
  Evidence: `UserScript-Finder.user.js` eight adapter classes and repeated service labels/tab wiring.
  Touches: adapter registry structure, source metadata object, README contributor section.
  Acceptance: Adding a source requires one adapter registration plus parser tests, with labels/accent/menu/tab behavior generated from metadata.
  Complexity: L

## Research-Driven Additions

- [ ] P2 - Sync settings across tabs
  Why: Changing source/privacy/sort settings in one tab does not update existing menus or modals in other tabs until reload.
  Evidence: Find Scripts For This Site uses `GM_addValueChangeListener` with fallback sync; `SettingsService.saveSettings`, `ScriptFinder._registerMenus`.
  Touches: userscript grants, `SettingsService`, menu re-registration, settings UI, source privacy tests.
  Acceptance: Settings changes propagate to other open tabs through `GM_addValueChangeListener` when available and polling fallback otherwise.
  Complexity: S

- [ ] P2 - Add ScriptCat as an optional discovery source
  Why: ScriptCat is a current userscript manager/repository and direct competitors search it alongside Greasy Fork/OpenUserJS/GitHub.
  Evidence: Find Scripts For This Site README; `scriptscat/scriptcat`; existing source adapter registry.
  Touches: source metadata, new ScriptCat adapter, install/view URL validation, fixtures, tabs/menu labels, README source table.
  Acceptance: ScriptCat results appear in an optional tab/menu, normalize into the shared result shape, respect source privacy toggles, and have parser fixtures.
  Complexity: M

- [ ] P2 - Add fielded result filtering
  Why: The current text filter and fixed date/rating/language controls cannot express common power-user filters such as author, license, source, URL, locale, or installability.
  Evidence: Magic Userscript+ `author:`, `license:`, `locale:`, `url:`, `engine:` filter grammar; `UserScript-Finder.user.js` `_displayScripts`.
  Touches: search parser helper, filter UI microcopy, result filter tests, README feature docs.
  Acceptance: Users can type documented field filters that combine with existing sort/date/rating/language controls without breaking plain text search.
  Complexity: M

- [ ] P2 - Add source-specific domain and keyword query modes
  Why: Some sources are strong at domain lookup while others need keyword queries; users need a manual escape when root-domain fallback is too broad or exact host is too narrow.
  Evidence: Find Scripts For This Site domain/keyword toggles; https://github.com/magicoflolis/Userscript-Plus/issues/61; current adapter `getDirectSearchUrl` methods.
  Touches: source metadata, query construction, modal controls, direct-search links, settings persistence, tests.
  Acceptance: Each source exposes supported query modes such as exact host, root domain, keyword, or all-site keyword, and the active mode is visible and persisted.
  Complexity: M

- [ ] P2 - Add a portable local test runner manifest
  Why: Browser-backed tests pass locally but hardcode a machine-local node_modules path, making contributor verification non-portable.
  Evidence: `tests/*.test.cjs` runtime path setup; missing `package.json`.
  Touches: `package.json`, test bootstrap helper, `.gitignore`, README verification docs, all `.cjs` tests.
  Acceptance: `npm test` runs every local test on a clean clone after `npm install`, with Playwright dependency resolution centralized in one helper.
  Complexity: S

- [ ] P2 - Chunk large result rendering
  Why: Source adapters can return up to 200 rows, and rendering all rows with animations in one synchronous pass risks modal jank on slower pages.
  Evidence: `ScriptService._filter` slice limit, Magic Userscript+ load-time improvements, https://developer.mozilla.org/en-US/docs/Web/API/Prioritized_Task_Scheduling_API.
  Touches: `ScriptFinder._displayScripts`, result count/live region updates, dense mode rendering, browser smoke tests.
  Acceptance: Large result sets render in measured chunks or a virtualized list, keep the modal responsive, and preserve keyboard/focus behavior.
  Complexity: M

## Research-Driven Additions

- [ ] P1 - Add first-run network disclosure and source preflight
  Why: All registered sources are enabled by default and the metadata grants broad external registry access, so privacy-conscious users need to review enabled destinations before first fetch.
  Evidence: UserScript-Finder.user.js @connect header, DEFAULT_SOURCE_SETTINGS; Magic Userscript+ source toggles/blacklist; Stylus no-tracking positioning.
  Touches: SettingsService, ScriptFinder open/load flow, source settings UI, diagnostics payload, source privacy tests, README privacy notes.
  Acceptance: First run, new source additions, or reset settings show a dismissible prefetch disclosure with host and enabled source destinations; users can disable sources before any fetch starts, and the choice persists.
  Complexity: M

- [ ] P1 - Add generated @connect allowlist audit
  Why: Every new source expands install-time network permissions, and current manual metadata can drift from adapters and docs.
  Evidence: UserScript-Finder.user.js @connect lines and SOURCE_META; Tampermonkey/Violentmonkey metadata docs; Chrome Web Store remote-code and permission policy.
  Touches: userscript metadata header, source adapter registry, README source table, local release/test script.
  Acceptance: A local check fails when an adapter requires a domain missing from @connect, when @connect contains an orphan domain, or when README source documentation omits an enabled source.
  Complexity: S

- [ ] P2 - Add diagnostics manual-copy fallback
  Why: Clipboard APIs can be unavailable or denied, and the current fallback only writes diagnostics to the browser console.
  Evidence: UserScript-Finder.user.js _copyDiagnostics; MDN Clipboard API; quoid/userscripts issue #887.
  Touches: diagnostics panel, toast/live-region messaging, modal markup tests, diagnostics tests.
  Acceptance: When navigator.clipboard.writeText fails, the modal shows a selectable diagnostics text area with retry-copy and close controls while preserving console logging.
  Complexity: S

- [ ] P2 - Add release metadata consistency checks
  Why: Raw userscript distribution depends on synchronized @version, install/update URLs, README badges, changelog entries, and license metadata.
  Evidence: UserScript-Finder.user.js metadata header, README badges/install URLs, CHANGELOG.md, Tampermonkey @downloadURL/@updateURL docs.
  Touches: local test/release script, README, CHANGELOG, userscript metadata, version docs.
  Acceptance: One local command validates version consistency, license metadata, raw GitHub @downloadURL/@updateURL reachability, and README badge alignment before release.
  Complexity: S

- [ ] P2 - Add rendered modal smoke tests
  Why: Existing tests assert markup but not actual desktop/mobile layout, and competitor issues show real clipping, overflow, and browser-specific rendering failures.
  Evidence: tests/accessibility-markup.test.cjs, tests/diagnostics-markup.test.cjs; Magic Userscript+ issues #4, #5, #15, #21, #32, #70.
  Touches: portable test runner, browser fixture page, modal state fixtures, screenshot/pixel assertions, .gitignore for generated artifacts.
  Acceptance: Local browser tests render empty, loading, error, many-results, settings, and diagnostics states at desktop and mobile widths with no clipped controls, horizontal overflow, or focus trap breakage.
  Complexity: M

- [ ] P2 - Add aggregate all-sources comparison mode
  Why: Users often need the best current-site candidate across registries and stores, not one source tab at a time.
  Evidence: Magic Userscript+ multi-source discovery; UserScriptHunt unified search; current source tabs and ScriptFinder._loadScripts single-source flow.
  Touches: source runtime scheduler, dedupe helper, result grouping UI, source health footer, privacy controls, adapter fixtures.
  Acceptance: An All view queries enabled sources within existing privacy/timeouts, groups duplicate install/view URLs, shows per-source health, and preserves source-specific tabs for focused troubleshooting.
  Complexity: L
