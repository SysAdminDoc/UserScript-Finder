# Changelog

All notable changes to UserScript-Finder will be documented in this file.

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
