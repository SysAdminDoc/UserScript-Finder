# Research - UserScript Finder

## Executive Summary
UserScript Finder is a single-file userscript that adds manager menu entries for discovering current-site userscripts, userstyles-adjacent catalogs, GitHub/Gist candidates, and extension-store alternatives from an in-page Shadow DOM modal. Verified: its strongest current shape is trust-oriented current-host discovery with install safety, source health diagnostics, per-source privacy controls, sensitive-host blocking, match-coverage previews, extension trust badges, and manager compatibility reporting already shipped through v1.19.0 in `UserScript-Finder.user.js`, `README.md`, and `CHANGELOG.md`. Highest-value direction: keep privacy/source trust explainable, make source/parser drift testable, and verify real rendered/manager behavior before adding more sources.

Top opportunities in priority order:
- Reconcile stale legacy roadmap rows that duplicate shipped install and author-reputation work.
- Complete the existing first-run network disclosure and source preflight item before adding more enabled-by-default sources.
- Complete the existing generated `@connect` allowlist/release metadata audits so adapter, permission, README, and changelog drift is caught locally.
- Complete the existing portable `npm test` runner and rendered modal smoke tests; current browser-backed tests depend on machine-local Playwright paths.
- Complete the existing diagnostics manual-copy fallback for denied/unavailable Clipboard API.
- Complete existing cross-tab settings sync, source-specific query modes, fielded filtering, and aggregate all-sources comparison.
- Add a live fixture refresh command for registry/store parser drift.
- Add a UI string catalog so localization work is feasible without rewriting modal/menu constructors.
- Capture a dated live manager/browser compatibility matrix for the v1.19 compatibility checks.

## Product Map
- Core workflows: open a userscript-manager menu command; fetch enabled sources for the current host; filter/sort results; inspect diagnostics and source health; open a validated install/view URL.
- User personas: power users searching for current-site scripts; privacy-conscious users limiting registry/store calls; users comparing extension alternatives to userscripts; maintainers tracking source/API drift.
- Platforms and distribution: raw GitHub userscript with `@downloadURL`/`@updateURL`; Tampermonkey/Violentmonkey-style managers exposing GM menu, storage, tab, style, and request APIs; no package manifest or build step.
- Key integrations and data flows: metadata `@connect` permits registry/store/GitHub domains; `GM_xmlhttpRequest` fetches source data; `GM_setValue` stores settings/cache; `GM_openInTab` delegates installs/views; `.cjs` tests validate helper, adapter, accessibility, diagnostics, privacy, host, and manager-compatibility contracts.

## Competitive Landscape
- Magic Userscript+: Direct current-site discovery competitor with userscript and web-extension builds, source toggles, blacklist, GitHub token support, language filters, theme import/export, source-code preview, and documented browser issues. Learn its source disclosure, bug taxonomy, browser-issue docs, and advanced filters; avoid its always-visible page control because this project is intentionally menu-triggered.
- Find Scripts For This Site: Lightweight direct competitor covering Greasy Fork, OpenUserJS, ScriptCat, GitHub, and Gist, with domain/keyword modes, centralized i18n, smart domain extraction, and `GM_addValueChangeListener` tab sync. Learn source-specific query modes, UI string cataloging, and cross-tab settings sync; avoid sending users out to source tabs as the primary experience.
- UserScriptHunt: Adjacent sibling static web app with unified seven-source search, dedupe, trust scoring, saved searches, installed import/export, source health, and PWA/offline shell. Learn all-sources comparison, dedupe, and trust evidence; keep this repo focused on in-page current-host discovery rather than becoming a separate search portal.
- Greasy Fork/OpenUserJS/ScriptCat: Registry baselines. Learn by-site metadata, update/install URLs, localized metadata, stats, and search APIs; avoid assuming root-domain results are precise without parsed `@match`/`@include` coverage.
- Tampermonkey/Violentmonkey/quoid/userscripts: Manager ecosystem. Learn API variance, metadata rules, manager-owned install/update/sync boundaries, and mobile/Safari limitations; avoid replacing editor, installer, sync, and update workflows owned by managers.
- Stylus/UserStyles.world: Adjacent userstyle ecosystem with no-tracking positioning, gallery discovery, export/import, sync, previews, and style metadata. Learn privacy posture, backup/export patterns, and optional style-source discovery; avoid becoming a style editor.
- Chrome Web Store/Mozilla AMO/Edge Add-ons: Extension alternative sources. Learn permission, host-permission, privacy-policy, promoted/recommended, review, update, and user-count signals; avoid treating scraped HTML as stable where structured APIs or fixture-backed parsers are available.

## Security, Privacy, and Reliability
- Verified: `ROADMAP.md:8` still lists one-click install even though `README.md:72` documents One-Click Install and `CHANGELOG.md` records install safety in v1.10.0; `ROADMAP.md:18` still lists author reputation even though v1.6.0 shipped author reputation sort. This planning drift is the top reliability defect because autonomous dev agents can rework shipped behavior.
- Verified: `UserScript-Finder.user.js:17-27` manually lists `@connect` domains while `SOURCE_META` starts at `UserScript-Finder.user.js:69` and defaults all sources on at `UserScript-Finder.user.js:80-82`; the existing P1 disclosure and allowlist-audit roadmap items should land before new source expansion.
- Verified: `UserScript-Finder.user.js:3275-3284` copies diagnostics only through `navigator.clipboard.writeText` or console logging; Clipboard API availability and permissions vary by context, so the existing manual-copy fallback item remains important for support recovery.
- Verified: no `GM_addValueChangeListener` use exists in `UserScript-Finder.user.js`; `SettingsService.saveSettings` writes storage at `UserScript-Finder.user.js:863`, so cross-tab source/privacy/sort changes currently need reloads.
- Verified: browser-backed tests hardcode `C:/Users/--/.cache/codex-runtimes/.../node_modules` in several `tests/*.test.cjs`, and no `package.json` exists. The existing portable local test runner item is required before visual smoke tests are maintainable by other clones.
- Verified: no package manifest or lockfile exists, so there is no dependency advisory scan surface until the portable runner introduces explicit dev dependencies; runtime should remain dependency-free.
- Verified: v1.19.0 already added manager compatibility reporting and Trusted Types duplicate-policy fallback (`CHANGELOG.md`, `UserScript-Finder.user.js:43-60`); do not re-add that item.
- Verified: v1.18.0 already added extension trust badges for permissions, host access, privacy/data flags, promoted status, and stale updates (`README.md:82`, `UserScript-Finder.user.js:344-417`, fixtures in `tests/fixtures/`). Future trust work should focus on parser drift, rendered proof, and source comparison, not duplicate badges.
- Likely: current markup tests catch semantic regressions, but no rendered browser smoke validates clipping, overflow, focus, or mobile widths across empty/loading/error/many-results/settings/diagnostics states. Magic Userscript+ and manager issue trackers show these failures happen in real browser/manager combinations.

## Architecture Assessment
- Boundary improvements: centralize source capability metadata so each adapter declares required `@connect` hosts, query modes, result trust fields, and fixture endpoints; this supports the existing adapter plugin-pattern, `@connect` audit, and source-specific query-mode items.
- Refactor candidates: extract inline UI strings from modal/menu/settings/toast construction (`UserScript-Finder.user.js:2606-2850`, `3305-3418`) into an English catalog before adding more localization or locale filtering.
- Test gaps: add a manifest-based test runner, a fixture-refresh command for live source samples, and rendered smoke tests after the portable runner lands.
- Documentation gaps: update `ROADMAP.md` to remove shipped legacy rows; update README compatibility/source tables only when backed by release checks or a live matrix.
- Observability gaps: source diagnostics are useful, but clipboard-denied support flow is weak until the manual-copy fallback item lands.
- Security hardening: generated `@connect` and release metadata checks should be release-blocking because new sources expand install-time network permissions.
- i18n/l10n: locale-aware filtering is already on the roadmap; UI localization needs the separate string-catalog groundwork added below.
- Plugin ecosystem: keep adapter extension static and reviewed; remote-loaded plugins are rejected because they would weaken userscript/store trust boundaries.
- Distribution/packaging: no package manifest exists; adding one should serve local tests/release checks, not introduce runtime bundling.
- Mobile/offline/resilience: use the existing rendered smoke, cache/offline, and manager-compatibility items rather than a separate mobile rewrite.
- Multi-user/migration: intentionally excluded; settings are local to the user's manager, and manager-level sync/import/export is the better boundary.

## Rejected Ideas
- Full WebExtension rewrite - Magic Userscript+ proves the path is possible, but Chrome MV3 remote-code policy and this repo's userscript-first distribution make it a separate product.
- Bookmarklet distribution - Magic Userscript+ itself labels bookmarklet use as not recommended, and this project depends on GM request/storage/menu/tab APIs.
- Built-in script manager/editor - Tampermonkey, Violentmonkey, quoid/userscripts, ScriptCat, and Stylus already own install/edit/update/sync flows; duplicating them would increase security and maintenance risk.
- Remote-loaded adapter plugins - Chrome Web Store MV3 policy and userscript trust expectations favor static reviewed adapters over runtime code loading.
- Public social/recommendation layer - Greasy Fork/UserStyles.world already host registry-level social and popularity signals; this project should consume trust metadata, not host accounts/comments.
- Multi-user/team sync - no evidence of demand in current-site userscript discovery; manager-level sync/import/export remains the right migration path.

## Sources
Competitive:
- https://github.com/magicoflolis/Userscript-Plus
- https://github.com/utags/userscripts/tree/main/find-scripts-for-this-site
- https://github.com/SysAdminDoc/UserScriptHunt
- https://github.com/scriptscat/scriptcat
- https://github.com/greasyfork-org/greasyfork
- https://github.com/openstyles/stylus
- https://github.com/violentmonkey/violentmonkey
- https://github.com/quoid/userscripts

Issue signal:
- https://github.com/magicoflolis/Userscript-Plus/issues/58
- https://github.com/magicoflolis/Userscript-Plus/issues/68
- https://github.com/magicoflolis/Userscript-Plus/issues/71
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/2549
- https://github.com/quoid/userscripts/issues/887
- https://github.com/quoid/userscripts/issues/919
- https://github.com/scriptscat/scriptcat/issues/1517

APIs, standards, and security:
- https://www.tampermonkey.net/documentation.php?locale=en
- https://violentmonkey.github.io/api/metadata-block/
- https://violentmonkey.github.io/api/gm/
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- https://developer.mozilla.org/en-US/docs/Web/API/TrustedTypePolicyFactory/createPolicy
- https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings
- https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- https://mozilla.github.io/addons-server/topics/api/addons.html
- https://research.gatech.edu/study-finds-thousands-browser-extensions-compromise-user-data

Live endpoints:
- https://greasyfork.org/en/scripts/by-site/reddit.com.json?language=all
- https://addons.mozilla.org/api/v5/addons/search/?q=reddit&type=extension
- https://microsoftedge.microsoft.com/edgestorewebautocomplete/v1/search?q=reddit
- https://userstyles.world/api/index/uso-format

## Open Questions
None blocking. Manager/browser compatibility details require implementation-time live testing, not more research.
