# Changelog

All notable changes to UserScript-Finder will be documented in this file.

## [Next]

### Fixed
- Clear and replace the settings polling fallback interval so repeated injection does not retain old Script Finder instances.
- Queue source reload requests that arrive during an active fetch so a tab change cannot start parallel single-source loads.
- Cap dismissed-script history at 500 entries per domain and the cross-domain try queue at 200 entries, trimming existing oversized values.
- Treat OpenUserJS script paths without both author and script segments as view-only instead of generating invalid install URLs.
- Deduplicate GitHub Gist results using case-insensitive owner/hash keys across snippets and search queries.

## [v1.28.0] - 2026-07-01

### Fixed
- Fix _loadAllSources blocking subsequent tab clicks (isLoading stuck true during parallel fetches); added generation counter to discard stale loads
- Fix duplicate language filter listener causing double re-render on every language filter change
- Fix _sourceNoticeHtml crash when currentService is _all (undefined service has no getDirectSearchUrl)
- Fix _displayScripts crash when _all mode returns empty results
- Fix _fetchPreviewSource missing timeout (Coverage/Install buttons could hang indefinitely)
- Fix _renderChunked stale-frame race where old items append to cleared content between _safeHTML and rAF cancel
- Fix click-to-open guard missing queue/preview/dismiss buttons (relied only on stopPropagation)
- Fix settings import accepting arbitrary keys (now validates against DEFAULT_SETTINGS)
- Fix scriptUrl allowing non-HTTP protocols from API responses for GH/Gist/Catalog sources
- Fix relativeTime showing misleading "just now" for future dates (clock skew)
- Fix footer showing "_all" text and broken link in All mode
- Fix result count saying "scripts" for mixed All-mode results (now "results")
- Fix empty state showing generic "Source" label in All mode
- Fix "Search manually" button showing broken # link in All mode empty state

### Improved
- Add prefers-reduced-motion support (disables all animations and transitions)
- Add focus-visible outline for all interactive elements in shadow DOM
- Add aria-label/aria-pressed to dense mode toggle and All tab
- Increase queue/dismiss button touch targets from ~24px to ~32px
- Rename sort bar "Search" label to "Mode" for clearer semantics
- Deduplicate _cleanText into shared cleanText() utility (4 copies removed)
- Remove 3 dead wrapper methods never called from any code path
- Clean up .gitignore duplicate blocks and CHANGELOG formatting

## [v1.27.0] - 2026-07-01

- Added UI string catalog centralizing modal titles, toasts, empty states, disclosure text, and button labels for localization readiness.
- Added live fixture refresh script that fetches redacted samples from GreasyFork, Mozilla AMO, and GitHub APIs into tests/fixtures/live/.
- Added source-adapter documentation in README Contributing section.

## [v1.26.0] - 2026-07-01

- Added aggregate all-sources comparison mode with an "All" tab that queries all enabled sources in parallel, deduplicates results by URL, and shows per-item source badges with accent colors.
- Added search mode selector (Auto/Exact host/Root domain/Keyword) for query control with persistent mode selection.

## [v1.25.0] - 2026-07-01

- Added rendered modal smoke tests at desktop (1280x800) and mobile (375x667) widths verifying no overflow, clipping, or missing controls.

## [v1.24.0] - 2026-07-01

- Added cross-domain "Queue to try" list with a calendar button on each result that toggles scripts into a persistent queue stored via GM_setValue.

## [v1.23.0] - 2026-07-01

- Added per-domain dismissed scripts with a dismiss button on each result, persistent hidden-script storage via GM_setValue, and a "Show all" restore button at the bottom of filtered results.

## [v1.22.0] - 2026-07-01

- Added red "Stale" badge for userscript, GitHub, and Gist results not updated in 2+ years.
- Added settings export/import as JSON for cross-machine settings transfer.
- Added dangerous @grant warning during install handoff — toasts a warning when scripts request GM_xmlhttpRequest, unsafeWindow, window.close, or window.focus.

## [v1.21.0] - 2026-07-01

- Added diagnostics manual-copy fallback with a selectable textarea, retry-copy button, and close control when clipboard API is denied.
- Added cross-tab settings sync via GM_addValueChangeListener with a 3-second polling fallback for managers that lack the API.
- Added chunked result rendering (batches of 30 via requestAnimationFrame) to prevent modal jank on large result sets.
- Replaced the English-only toggle with a locale-aware language filter dropdown (Any / Browser language / English) that respects explicit script locale metadata before falling back to the Latin-ratio heuristic.
- Added fielded result filtering with `author:`, `license:`, `source:`, `name:`, and `url:` prefix support in the search box.
- Added release metadata consistency checks (CHANGELOG entry, package.json version) to the @connect allowlist audit.

## [v1.20.0] - 2026-06-30

- Added first-run network disclosure that shows source-to-host mapping before any fetch, lets users disable sources before continuing, and re-triggers when new sources are enabled or settings are reset. Added @connect allowlist audit that validates header/adapter/README consistency.

## [v1.19.0] - 2026-06-30

- Added runtime manager compatibility checks, degraded-mode reports, Trusted Types duplicate-policy fallback, GM API-safe settings/request/open wrappers, and browser-backed tests for missing GM network/menu capabilities.

## [v1.18.0] - 2026-06-30

- Added extension trust badges for Chrome Web Store and Mozilla AMO results, including permission counts, broad host-access warnings, privacy policy signals, data-collection flags, promoted status, and stale-update warnings.

## [v1.17.0] - 2026-06-29

- Added root-domain fallback coverage labels for GreasyFork/SleazyFork results by checking raw userscript metadata and marking exact, broad/root, or uncertain host coverage.

## [v1.16.0] - 2026-06-29

- Added sensitive-host protection that suppresses source menus, tabs, and network fetches on built-in or user-defined sensitive hosts, plus a per-host override flow and browser-backed coverage.

## [v1.15.0] - 2026-06-28

- Added per-source privacy controls that hide disabled sources from menus/tabs, persist source choices, prevent disabled-source network requests, and cover the flow with a browser-backed source privacy test.

## [v1.14.0] - 2026-06-28

- Added per-source health badges, footer health age, copyable source diagnostics, and diagnostics markup tests while keeping copied diagnostics limited to source, root host, status, timestamps, cache age, and result count.

## [v1.13.0] - 2026-06-28

- Added fixture-backed adapter contract tests for all eight sources plus shared rating, language, and reputation helper checks.

## [v1.12.0] - 2026-06-28

- Added modal accessibility semantics, live result/status announcements, accessible control names, focus entry/restoration, contained Tab navigation, and accessibility markup tests.

## [v1.11.0] - 2026-06-28

- Added public-suffix-aware host normalization for common multi-label and hosted suffixes, exact-host searching before root fallback, and HostService tests for `co.uk`, `com.au`, `github.io`, mobile prefixes, localhost, and IP hosts.

## [v1.10.0] - 2026-06-28

- Added install URL safety checks with per-source HTTPS allowlists, `.user.js` URL validation, metadata-block verification before install handoff, unsafe-result View downgrades, inline warnings, and tests.

## [v1.9.0] - 2026-06-28

- Added per-source request timeouts, rate-limit/backoff classification, stale-cache fallback, degraded-result notices, retry controls, manual-search links, and runtime tests.
- Clamped the modal width to the viewport so resized/mobile views cannot clip the overlay.

## [v1.8.1] - 2026-06-28

- Standardized the repository, README, and userscript metadata on the MIT license.

## [v1.8.0] - 2026-06-27

- Added inline match coverage previews for installable scripts by fetching raw userscript metadata and comparing `@match`, `@include`, and `@exclude` rules against the current host.
- Hardened match coverage evaluation to respect scheme, host, path, wildcard, regex-style include, `<all_urls>`, and exclude precedence semantics, with fixture coverage.

## [v1.7.0] - 2026-06-27

- Added result filters for updated-within window, normalized minimum rating, and English-looking script names/descriptions, with filter-aware counts and empty states.

## [v1.6.0] - 2026-06-27

- Added an Author reputation sort mode that ranks results using available source metrics such as installs, ratings, fan score, stars, forks, extension ratings, and curated catalog source quality.

## [v1.5.0] - 2026-06-27

- Added a combined Catalogs source for Awesome Userscripts domain matches and Tampermonkey's Userscript.Zone catalog handoff, with menu/tab wiring, source badges, install/view actions, accent styling, and README coverage.

## [v1.4.0] - 2026-06-27

- Added GitHub Gists as a separate userscript source with HTML search parsing, direct raw install handoff for `.user.js` files, tab/menu wiring, source accent, and README coverage.

## [v1.3.0] - 2026-06-27

- Added Mozilla AMO as a Firefox extension-alternative source with JSON API search, View actions, tab/menu wiring, source accent, and README coverage.

## [v1.2.0] - 2026-06-27

- Added Chrome Web Store as an extension-alternative source with embedded-result parsing, View actions, tab/menu wiring, source accent, and README coverage.

## [v1.1.0] - 2026-06-27

- Added OpenUserJS as a fourth source with search, install handoff, menu entry, modal tab, source accent, and README coverage.

## [v1.0.0] - 2026-06-27

- README: add related tools section differentiating from UserScriptHunt
- Removed: Delete UserScript Finder-1.0.0.user.js
- Removed: Delete LICENSE
- Added: Add files via upload
- Changed: Update UserScript Finder-1.0.0.user.js
- Added: Add files via upload
- Added: Add files via upload

## Roadmap archive — 2026-08-10 — ROADMAP.md

<details>
<summary>Original roadmap snapshot</summary>

```markdown
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
```

</details>
