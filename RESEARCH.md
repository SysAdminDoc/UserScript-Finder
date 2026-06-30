# Research - UserScript Finder

## Executive Summary
UserScript Finder is a single-file userscript for Tampermonkey/Violentmonkey-style managers that opens a menu-triggered Shadow DOM modal and discovers current-site scripts, styles, extensions, gists, catalogs, and GitHub-hosted candidates. Verified: the strongest current shape is trust-oriented, zero-footprint discovery with source resilience, install handoff checks, public-suffix-aware host handling, accessibility markup, diagnostics, and per-source privacy controls already shipped in `UserScript-Finder.user.js` and `CHANGELOG.md`. The highest-value direction is to remove planning drift, make every network/source decision explainable, and harden real-world manager/browser behavior before adding more sources. Top opportunities: reconcile completed roadmap rows; add sensitive-host no-fetch rules; add first-run network disclosure; post-filter root-domain results with metadata coverage; expose extension permission/privacy badges; harden manager/Trusted Types degraded modes; add cross-tab settings sync; add ScriptCat/source-specific query modes; add release metadata and `@connect` drift checks; add visual smoke coverage for modal states.

## Product Map
- Core workflows: open source menu command; fetch one source for the current host; sort/filter results; inspect source health/diagnostics; open a validated install/view URL.
- User personas: power users looking for current-site userscripts; privacy-conscious users limiting external registry calls; extension users comparing lower-risk userscript alternatives; maintainers tracking parser/source drift.
- Platforms and distribution: raw GitHub userscript install/update URLs; userscript managers that provide `GM_xmlhttpRequest`, `GM_openInTab`, storage, styles, and menu commands; no package manifest or build step.
- Key integrations and data flows: `@connect` permits registry/store/GitHub domains; `GM_xmlhttpRequest` fetches source data; `GM_setValue` persists settings; `GM_openInTab` delegates install/view; `.cjs` tests execute local adapter and markup contracts.

## Competitive Landscape
- Magic Userscript+: Direct current-site discovery competitor with mobile/desktop UI, import/export, theme config, GitHub token support, code preview, sensitive-host blacklist, and web-extension distribution. Learn source disclosure, filter grammar, browser issue docs, and blacklist UX; avoid its always-visible page bubble because this project is intentionally menu-triggered.
- Find Scripts For This Site: Direct lightweight userscript competitor covering Greasy Fork, OpenUserJS, ScriptCat, GitHub, and Gist with domain/keyword modes, i18n menu strings, and cross-tab setting sync. Learn per-source query modes and `GM_addValueChangeListener` fallback sync; avoid making external tabs the primary result UI.
- UserScriptHunt: Adjacent sibling aggregate search app for Greasy Fork, Sleazy Fork, GitHub, and OpenUserJS. Learn cross-source comparison and dedupe expectations; keep this repo focused on current-host in-page discovery.
- Greasy Fork/OpenUserJS/ScriptCat: Registry baselines. Learn by-site metadata, install/update URLs, localized metadata, stats, and source availability signals; avoid assuming root-domain registry hits precisely match subdomains.
- Stylus/UserStyles.world: Adjacent userstyle ecosystem with no-tracking positioning, gallery discovery, backups, metadata/source mirroring, previews, and update flows. Learn trust copy, export/import, and style source metadata; avoid becoming a full style manager/editor.
- Tampermonkey/Violentmonkey/quoid/userscripts: Manager ecosystem. Learn API variance, permission troubleshooting, install/update metadata, mobile/Safari constraints, sync/import/export pressure, and logging needs; avoid replacing manager-owned install/edit/update workflows.
- Chrome Web Store/Mozilla AMO/Edge Add-ons: Extension alternative sources. Learn permission, host-permission, privacy policy, promoted/recommended, review, update, and user-count signals; avoid treating scraped store pages as stable contracts when structured APIs exist.

## Security, Privacy, and Reliability
- Verified: `ROADMAP.md` still contains completed v1.8.1-v1.15.0 work recorded in `CHANGELOG.md`, including license, install safety, source resilience, public-suffix normalization, accessibility, adapter fixtures, diagnostics, and source privacy controls. This is the top planning reliability defect.
- Verified: `UserScript-Finder.user.js:17-27` manually lists `@connect` domains while `SOURCE_META` and adapters live separately at `UserScript-Finder.user.js:47-57`; new sources can create permission drift unless release checks validate the allowlist.
- Verified: `DEFAULT_SOURCE_SETTINGS` enables all registered sources by default at `UserScript-Finder.user.js:58-69`; per-source toggles exist, but there is no first-run prefetch disclosure that lets a user review network destinations before the first active fetch on a host.
- Verified: `UserScript-Finder.user.js:42-45` creates a Trusted Types policy without a duplicate-policy fallback. Magic Userscript+ documents current Outlook breakage from a duplicated default Trusted Types policy, so the existing manager compatibility roadmap item should include this specific guard.
- Verified: diagnostics copy falls back only to console logging at `UserScript-Finder.user.js:2577-2587` when `navigator.clipboard.writeText` is unavailable; clipboard APIs are permission/secure-context-sensitive, so bug-report recovery needs an in-modal manual-copy fallback.
- Verified: Chrome Web Store/AMO adapters normalize basic result data but do not expose extension permissions, host permissions, privacy/data-collection flags, promoted/recommended status, or broad-access warnings even though AMO search responses and store pages expose trust metadata.
- Verified: settings are persisted with `GM_setValue` at `UserScript-Finder.user.js:507-532`, but no `GM_addValueChangeListener` or polling fallback exists, so settings changed in one tab do not update menus or modals in other open tabs.
- Likely: existing markup tests catch semantic regressions, but no rendered browser smoke validates clipping/overflow across modal states; Magic Userscript+ issues show real user failures around width growth, off-screen content, Trusted Types/CSP, and browser-specific page breakage.

## Architecture Assessment
- Boundary improvements: keep `SOURCE_META`, adapters, `@connect`, README source tables, and fixtures synchronized through a local release check instead of relying on manual review.
- Refactor candidates: isolate source capability metadata so each adapter declares supported query modes, required connect domains, result fields, and trust badges before more sources are added.
- UI/testing gaps: add visual smoke coverage for empty/loading/error/many-results/settings/diagnostics states after the portable runner item lands; current `.cjs` tests are useful but not rendered layout tests.
- Observability gaps: source diagnostics are strong but clipboard failure recovery is weak; add a manual-copy state so diagnostics remain shareable without console spelunking.
- i18n/l10n: competitors support localized menus and locale filtering; the existing roadmap already covers locale-aware filtering, so do not add another duplicate item.
- Plugin ecosystem: an adapter plugin pattern is already on the roadmap; keep it internal/static for now because remote plugins would conflict with userscript/store trust boundaries.
- Mobile/offline/resilience: source resilience and stale-cache fallback are represented in existing roadmap/changelog drift; mobile should be validated through visual smoke, not a separate UI rewrite.
- Multi-user/migration: intentionally excluded. The project stores per-manager/per-user settings locally and should not add account, team, or server migration flows.
- Distribution/upgrade strategy: add release metadata consistency checks for `@version`, `@downloadURL`, `@updateURL`, README badge, CHANGELOG, license, and raw GitHub reachability.

## Rejected Ideas
- Full WebExtension rewrite - Magic Userscript+ proves a web-extension path is possible, but Chrome MV3 remote-code policy and this repo's userscript-first design make it a separate product, not a near-term roadmap item.
- Bookmarklet distribution - Magic Userscript+ lists a bookmarklet as not recommended; this project relies on GM APIs and install validation that bookmarklets cannot provide.
- Built-in script manager/editor - Tampermonkey, Violentmonkey, quoid/userscripts, and Stylus already own install/edit/update/sync flows; duplicating them would increase security and maintenance risk.
- Remote-loaded adapter plugins - Chrome Web Store MV3 policy and userscript trust expectations favor static reviewed adapters over runtime plugin loading.
- Public social/recommendation layer - Greasy Fork/UserStyles.world already provide registry-level social signals; this project should consume trust metadata, not host accounts or comments.
- Multi-user/team sync - No evidence of demand for shared team workflows in current-site discovery; manager-level sync/import/export is the better fit.

## Sources
Competitive:
- https://github.com/magicoflolis/Userscript-Plus
- https://github.com/utags/userscripts/tree/main/find-scripts-for-this-site
- https://github.com/SysAdminDoc/UserScriptHunt
- https://github.com/scriptscat/scriptcat
- https://github.com/greasyfork-org/greasyfork
- https://github.com/openstyles/stylus
- https://github.com/userstyles-world/userstyles.world
- https://github.com/violentmonkey/violentmonkey
- https://github.com/quoid/userscripts

Issue signal:
- https://github.com/magicoflolis/Userscript-Plus/issues/68
- https://github.com/magicoflolis/Userscript-Plus/issues/71
- https://github.com/magicoflolis/Userscript-Plus/issues/61
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/2263
- https://github.com/quoid/userscripts/issues/836
- https://github.com/quoid/userscripts/issues/887

APIs and standards:
- https://www.tampermonkey.net/documentation.php?locale=en
- https://violentmonkey.github.io/api/metadata-block/
- https://violentmonkey.github.io/api/gm/
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
- https://publicsuffix.org/
- https://developer.mozilla.org/en-US/docs/Web/API/TrustedTypePolicyFactory/createPolicy
- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- https://mozilla.github.io/addons-server/topics/api/addons.html
- https://docs.github.com/en/rest/search/search

Live endpoints:
- https://greasyfork.org/en/scripts/by-site/reddit.com.json?language=all
- https://microsoftedge.microsoft.com/edgestorewebautocomplete/v1/search?q=reddit
- https://addons.mozilla.org/api/v5/addons/search/?q=reddit&type=extension
- https://userstyles.world/api/index/uso-format

## Open Questions
None blocking. The next implementation agent can prioritize directly from `ROADMAP.md`; manager/browser compatibility details require live matrix testing during implementation, not more research.
