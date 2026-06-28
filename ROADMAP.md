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

- [ ] P0 - Resolve license metadata mismatch
  Why: The install surface currently reports WTFPL while the repo license file is MIT, which weakens trust and release hygiene.
  Evidence: `LICENSE`, `README.md`, `UserScript-Finder.user.js` metadata.
  Touches: `LICENSE`, `README.md`, `UserScript-Finder.user.js`, release notes.
  Acceptance: One canonical SPDX license appears in the license file, README badge/text, userscript `@license`, and any release notes.
  Complexity: S

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
