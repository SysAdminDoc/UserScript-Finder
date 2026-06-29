# Research - UserScript Finder

## Executive Summary
UserScript Finder is a single-file userscript that opens a zero-footprint Shadow DOM modal from Tampermonkey/Violentmonkey menu commands and searches the current site across GreasyFork, SleazyFork, OpenUserJS, Chrome Web Store, Mozilla AMO, catalogs, GitHub Gists, and GitHub. Verified: v1.9.0-v1.15.0 drained the prior highest-risk work around resilience, install validation, public-suffix normalization, accessibility, adapter tests, diagnostics, and per-source privacy controls. The highest-value direction now is precision and trust: remove stale completed roadmap rows, improve subdomain relevance, avoid unwanted network calls on sensitive hosts, expose extension permissions/privacy, make settings consistent across tabs, add ScriptCat as the next source, and make the test harness portable.

Top opportunities:
- P0: Reconcile `ROADMAP.md` with shipped work recorded in `CHANGELOG.md`.
- P1: Add host-level privacy blacklist/no-fetch rules for sensitive sites.
- P1: Post-filter root-domain registry results with metadata coverage to fix subdomain noise.
- P1: Show extension permission/privacy badges for Chrome Web Store and AMO results.
- P1: Add manager/browser compatibility checks and degraded-mode messages.
- P2: Add cross-tab settings sync with `GM_addValueChangeListener` plus polling fallback.
- P2: Add ScriptCat as an optional source.
- P2: Add fielded result filtering and source-specific domain/keyword query modes.
- P2: Add a portable local test runner manifest instead of hardcoded runtime paths.
- P2: Chunk or virtualize large result rendering.

## Product Map
- Core workflows: open per-site source menu, fetch a source, filter/sort results, inspect source health, preview match coverage, install or view a result.
- User personas: power users looking for site-specific scripts, users comparing extension alternatives, privacy-conscious users limiting network calls, maintainers validating source reach and parser drift.
- Platforms and distribution: Tampermonkey, Violentmonkey, and Greasemonkey-compatible userscript managers; raw GitHub install/update URLs; no package manifest or build step.
- Key integrations and data flows: `GM_xmlhttpRequest` reaches registries/stores/catalogs/GitHub; `GM_setValue` stores settings; `GM_openInTab` hands install/view URLs to the manager/browser; fixture-backed `.cjs` tests exercise adapters and UI markup.

## Competitive Landscape
- Magic Userscript+: Direct competitor for current-page userscript/userstyle discovery. Learn from mobile/desktop UI, import/export, theme config, GitHub token support, code/metadata preview, sensitive-host blacklist, filter grammar, and web-extension fallback; avoid its visible page bubble because this project intentionally stays menu-only until activated.
- Find Scripts For This Site: Direct lightweight competitor. Learn from per-repository domain/keyword search toggles, ScriptCat support, cross-tab settings sync, i18n menu strings, and menu reordering; avoid opening many external tabs as the primary UX when this repo already has an in-page comparison modal.
- Greasy Fork/OpenUserJS: Registry baselines. Learn from by-site metadata, install/update URLs, localized metadata, stats, and direct script details; avoid assuming root-domain by-site results are precise for subdomains.
- Stylus/UserStyles.world: Adjacent userstyle ecosystem. Learn from style gallery discovery, backup/export, usercss metadata, preview screenshots, and no-tracking positioning; avoid becoming a full style manager.
- Tampermonkey/Violentmonkey/ScriptCat/quoid/userscripts: Manager ecosystem. Learn from import/export, sync, mobile constraints, per-site enable/disable friction, permission troubleshooting, and manager API variance; avoid replacing install/edit/update workflows.
- Chrome Web Store/Mozilla AMO/Edge Add-ons: Extension alternative sources. Learn from ratings, daily users, reviews, privacy policy, data collection, permissions, promoted/recommended signals, and official AMO API shape; avoid treating scraped store search pages as stable contracts when a structured API exists.
- UserScriptHunt: Sibling standalone search app. Learn from aggregate search/dedupe expectations; keep this repo focused on current-site in-page discovery.

## Security, Privacy, and Reliability
- Verified: `ROADMAP.md` still contains completed work from v1.8.1-v1.15.0, including install safety, source resilience, accessibility, adapter tests, diagnostics, and per-source privacy. This is a planning reliability defect because future agents can reimplement shipped work.
- Verified: `UserScript-Finder.user.js` `ScriptService.searchScriptsByHost` falls back from exact host to root domain, but `ScriptService._filter` trusts registry domain fields and does not fetch candidate metadata to prove `@match`/`@include` coverage for noisy subdomain cases.
- Verified: `UserScript-Finder.user.js` runs on `*://*/*` and has per-source toggles, but no host-level blacklist/no-fetch setting for banks, government, localhost, admin consoles, identity pages, or user-defined sensitive domains.
- Verified: Chrome Web Store and AMO result adapters normalize users/ratings/update data, but they do not surface extension permissions, host permissions, privacy policies, promoted/recommended status, or data collection fields available from AMO and store pages.
- Verified: settings are persisted with `GM_setValue`, but there is no `GM_addValueChangeListener` or polling fallback, so settings changed in one tab do not update menus/tabs in existing tabs until reload/reopen.
- Verified: tests pass locally, but every browser-backed `.cjs` test hardcodes a machine-local runtime path instead of a portable `package.json`/local dependency path.
- Likely: Greasemonkey/AdGuard/manager compatibility claims need live validation because Magic Userscript+ has current open compatibility issues around AdGuard 204 responses and Trusted Types policy collisions.
- Missing guardrails: no fielded filter parser, no source query mode control, no manager-capability detection panel, and no large-result rendering budget despite adapters returning up to 200 rows.
- Recovery needs: settings export/import is already in `ROADMAP.md`; add sync and compatibility diagnostics before expanding stored settings further.

## Architecture Assessment
- `UserScript-Finder.user.js` is still intentionally single-file and ship-readable; keep that distribution model, but continue extracting pure helper contracts inside the file and covering them with `.cjs` tests.
- Refactor candidates: `SOURCE_META`/adapter registration, `ScriptService._filter`, store adapter normalization, settings persistence, search filter parsing, and result rendering.
- Test gaps: no package manifest, no `npm test`, no manager compatibility smoke, no fixture for manager API differences, no performance/render budget test, no ScriptCat fixture.
- Documentation gaps: README documents current v1.15 behavior, but `ROADMAP.md` needs shipped-item pruning; README does not state manager-specific degraded behavior or sensitive-host privacy model.
- Category coverage: security, privacy, accessibility, i18n, observability, testing, docs, distribution, plugin/source ecosystem, mobile, offline resilience, migration/upgrade strategy are covered by current code or roadmap. Multi-user workflows are intentionally excluded because settings are local-only and adding accounts/server state would contradict the zero-server product shape.

## Rejected Ideas
- Full userscript manager replacement: Tampermonkey, Violentmonkey, ScriptCat, and quoid/userscripts already own install/edit/update; this project should remain discovery and trust screening.
- Server-backed trending panel: existing roadmap mentions trending, but a hosted dataset would require telemetry or curation infrastructure that conflicts with local-only privacy unless a public dataset appears.
- Default external CORS proxy: useful for brittle sources, but a fixed proxy creates privacy and availability risk; keep direct source requests plus manual-search fallbacks.
- Immediate WebExtension rewrite: Magic Userscript+ shows this can work, but it is a larger distribution and store-review project; stabilize the adapter registry and test harness first.
- Shortcut-first command UX: source/query commands are useful for power users, but this repo should keep visible controls as the primary path because global rules prohibit keyboard-shortcut-first behavior.
- Bundled source-summary model: deterministic metadata, grant, permission, age, and source signals should land before adding a large local model dependency.

## Sources
Project and local ecosystem:
- https://github.com/SysAdminDoc/UserScript-Finder
- https://github.com/SysAdminDoc/UserScriptHunt

Direct competitors and adjacent OSS:
- https://github.com/magicoflolis/Userscript-Plus
- https://github.com/magicoflolis/Userscript-Plus/issues/68
- https://github.com/utags/userscripts/blob/main/find-scripts-for-this-site/README.md
- https://github.com/greasyfork-org/greasyfork
- https://github.com/OpenUserJs/OpenUserJS.org
- https://github.com/scriptscat/scriptcat
- https://github.com/awesome-scripts/awesome-userscripts
- https://github.com/openstyles/stylus
- https://github.com/userstyles-world/userstyles.world
- https://github.com/violentmonkey/violentmonkey
- https://github.com/quoid/userscripts

Platform APIs, specs, and docs:
- https://www.tampermonkey.net/documentation.php
- https://violentmonkey.github.io/api/gm/
- https://violentmonkey.github.io/api/metadata-block/
- https://mozilla.github.io/addons-server/topics/api/addons.html
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
- https://wiki.greasespot.net/Metadata_Block
- https://wiki.greasespot.net/Include_and_exclude_rules
- https://publicsuffix.org/
- https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

Security and community signal:
- https://adguard.com/kb/general/extensions/#userscripts
- https://nvd.nist.gov/vuln/detail/CVE-2005-2455
- https://github.com/violentmonkey/violentmonkey/issues/2403
- https://github.com/violentmonkey/violentmonkey/issues/2410

## Open Questions
None.
