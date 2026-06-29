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

- [ ] P0 - Add source timeouts, backoff, and stale-cache fallback
  Why: Adapter failures and rate limits can collapse into empty results, making outages look like no scripts exist.
  Evidence: `UserScript-Finder.user.js` adapter `_fetch` methods, `_loadScripts`; GitHub Search API rate-limit docs.
  Touches: shared fetch helper, every source adapter, result empty/error state, settings cache handling.
  Acceptance: Each source has a timeout, classifies rate-limit/parse/network errors, reuses stale cached results when available, and displays a source-specific retry/manual-search path.
  Complexity: M

- [ ] P0 - Validate install URLs before opening them
  Why: Registry and scraped results feed direct install handoffs; the app should refuse unexpected origins or non-userscript payloads before invoking the manager.
  Evidence: `UserScript-Finder.user.js` `_createScriptItem`, Gist/GitHub/raw install flows, userscript metadata docs.
  Touches: source adapter result normalization, install button handler, match preview fetcher, error/toast copy.
  Acceptance: Install buttons only open adapter-allowlisted HTTPS origins with `.user.js` metadata; invalid results downgrade to View with an explicit warning.
  Complexity: M

- [ ] P1 - Replace root-domain parsing with Public Suffix List-grade normalization
  Why: The hand-rolled suffix list handles only a few second-level domains and can miss domains such as multi-part public suffixes and hosted subdomains.
  Evidence: `UserScript-Finder.user.js` `HostService.extractRootDomain`; Public Suffix List.
  Touches: `HostService`, source query construction, related-site suggestions, parser fixtures.
  Acceptance: Tests cover `co.uk`, `com.au`, `github.io`, common mobile prefixes, localhost/IPs, and exact host fallback behavior.
  Complexity: M

- [ ] P1 - Add modal accessibility semantics and focus management
  Why: The Shadow DOM modal lacks dialog roles, live result announcements, and focus containment/restoration expected by assistive technology.
  Evidence: `UserScript-Finder.user.js` modal markup/event wiring; WAI-ARIA modal dialog pattern.
  Touches: modal creation, close/open lifecycle, loading/error/result count elements, tab controls.
  Acceptance: Modal opens with `role="dialog"` and `aria-modal`, focus moves into it and returns on close, result counts/errors announce via `aria-live`, and controls have accessible names.
  Complexity: M

- [ ] P1 - Add adapter contract and fixture-based parser tests
  Why: Eight sources now normalize heterogeneous HTML/API payloads with no executable guardrail against markup drift or field regressions.
  Evidence: `UserScript-Finder.user.js` source classes; recent commit history adding one adapter at a time.
  Touches: parser helpers, source adapters, lightweight Node/browser test harness, sample fixtures.
  Acceptance: A local test command validates each adapter's sample payload into the shared result shape and verifies sorting/filter helper behavior.
  Complexity: M

- [ ] P1 - Surface per-source health and diagnostics
  Why: Users need to distinguish no results from source outages, rate limits, blocked fetches, and parser drift without opening DevTools.
  Evidence: `UserScript-Finder.user.js` `_loadScripts` generic error state; GitHub rate-limit docs; Chrome extension network docs.
  Touches: shared fetch result type, modal header/status area, empty/error states, copy diagnostics action.
  Acceptance: Each tab shows OK/stale/rate-limited/failed state, last fetch time, cached result age, and a copyable diagnostic string with no personal page content beyond host/source/status.
  Complexity: S

- [ ] P1 - Add per-source privacy controls
  Why: Some users will want to disable adult, store, GitHub, or catalog network calls while preserving local-only settings.
  Evidence: `UserScript-Finder.user.js` menu registration always includes all sources; AdGuard userscript trust guidance.
  Touches: settings schema, menu registration, tab rendering, reset/settings UI.
  Acceptance: Users can disable individual sources; disabled sources disappear from menu/tabs and make no network requests until re-enabled.
  Complexity: S

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

- [ ] P0 - Reconcile ROADMAP.md with shipped work
  Why: `ROADMAP.md` still lists shipped v1.8.1-v1.15.0 work, which can cause future agents to duplicate completed implementation.
  Evidence: `CHANGELOG.md` v1.8.1-v1.15.0; `ROADMAP.md` existing Research-Driven Additions.
  Touches: `ROADMAP.md`
  Acceptance: Completed rows already shipped in `CHANGELOG.md` are deleted; remaining rows describe only incomplete work.
  Complexity: S

- [ ] P1 - Add sensitive-host no-fetch rules
  Why: Per-source privacy controls do not stop all network discovery on sensitive hosts such as banks, identity pages, localhost, admin consoles, or user-defined domains.
  Evidence: Magic Userscript+ blacklist feature; `UserScript-Finder.user.js` `@match *://*/*`, `SettingsService`, `ScriptFinder._loadScripts`.
  Touches: `SettingsService`, menu registration, settings UI, `HostService`, source loading guards, README privacy/settings docs, tests.
  Acceptance: Built-in and user-defined host patterns suppress source menus/tabs/fetches on matching pages, show a local-only disabled notice, and can be overridden intentionally.
  Complexity: M

- [ ] P1 - Post-filter root-domain results with metadata coverage
  Why: Registry by-site APIs often fall back to root domains, making subdomain-specific searches noisy unless candidate `@match`/`@include` metadata is checked.
  Evidence: Magic Userscript+ issue #68; `UserScript-Finder.user.js` `ScriptService.searchScriptsByHost`, `ScriptService._filter`, `MatchCoverage`.
  Touches: `ScriptService`, `MatchCoverage`, source runtime/cache, result notices, adapter fixtures.
  Acceptance: When exact-host GreasyFork/SleazyFork lookup falls back to root domain, candidates with install URLs are metadata-checked and labeled exact, broad, or uncertain before display.
  Complexity: M

- [ ] P1 - Show extension permission and privacy badges
  Why: Extension alternatives can be higher risk than userscripts; AMO and store pages expose permissions, host permissions, privacy policies, data-collection signals, and promoted status that are currently discarded.
  Evidence: Mozilla Add-ons API search response; Chrome Web Store/Edge Add-ons store metadata; `ChromeWebStoreService`, `MozillaAddonsService`.
  Touches: store adapters, result normalization, badge rendering, sorting/trust helpers, adapter fixtures, README source table.
  Acceptance: Chrome/Firefox extension results display concise permission/privacy/trust badges and warn on `<all_urls>`, broad host access, missing privacy policy, or stale update dates.
  Complexity: M

- [ ] P1 - Add manager compatibility and degraded-mode checks
  Why: README claims Tampermonkey, Violentmonkey, and Greasemonkey support, but manager APIs and strict CSP/Trusted Types behavior vary across managers and browsers.
  Evidence: Magic Userscript+ known issues and https://github.com/magicoflolis/Userscript-Plus/issues/71; https://github.com/Tampermonkey/tampermonkey/issues/2800; https://github.com/Tampermonkey/tampermonkey/issues/2814; `UserScript-Finder.user.js` GM API use and Trusted Types policy.
  Touches: boot capability checks, diagnostics payload, README compatibility matrix, tests for missing/partial GM APIs.
  Acceptance: Missing or partial GM APIs produce actionable in-modal diagnostics; README lists verified manager/browser behavior and degraded paths.
  Complexity: M

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
