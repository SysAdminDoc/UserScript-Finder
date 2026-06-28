# Research - UserScript Finder

## Executive Summary
UserScript Finder is a single-file userscript that opens a Shadow DOM modal from the userscript-manager menu and searches the current site across GreasyFork, SleazyFork, OpenUserJS, Chrome Web Store, Mozilla AMO, catalogs, GitHub Gists, and GitHub. Its strongest shape is context-aware discovery with direct install handoff and dense local filtering; the highest-value direction is to make that discovery trustworthy, exact, and resilient. Priority opportunities: resolve the license mismatch, make match-coverage evaluation spec-faithful, add per-source rate-limit/stale-cache behavior, validate install URLs before handoff, use Public Suffix List-grade domain normalization, add modal accessibility semantics, add adapter fixtures/tests, and expose source health/settings without adding a server.

## Product Map
- Core workflows: open a per-site menu command, search a selected source, filter/sort results, preview match coverage, install or view the result.
- User personas: power users looking for site-specific scripts, users comparing extension alternatives, maintainers checking source reach, privacy-conscious users who want local-only discovery.
- Platforms and distribution: Tampermonkey, Violentmonkey, and Greasemonkey-compatible userscript managers; raw GitHub install and update URLs.
- Key integrations and data flows: `GM_xmlhttpRequest` fetches registry/store/catalog/GitHub data; `GM_setValue` stores settings; `GM_openInTab` hands install/view actions to the browser or userscript manager.

## Competitive Landscape
- Greasy Fork: best moderated registry and by-site discovery baseline. Learn from its script metadata, stats, version history, and code review signals; avoid becoming a siloed single-registry browser.
- Userscript.Zone and Tampermonkey scripts catalog: strongest "enter a URL/domain, get scripts" mental model. Learn from URL-first discovery; avoid opaque ranking with no source breakdown.
- Violentmonkey and Tampermonkey: manager APIs define practical compatibility. Learn from `GM_info`, `GM_*` storage, injection, and metadata behavior; avoid depending on manager-private installed-script state.
- AdGuard userscripts/extensions: good trust framing for unknown scripts and curated recommendations. Learn from source credibility labels and clear warnings; avoid implying third-party scripts are safe merely because they are listed.
- Greasy Fork Search More Sites: useful multi-site toggle precedent. Learn from fallback search engines and source federation; avoid stale/dead catalogs without health indicators.
- Awesome Userscripts: useful curated taxonomy. Learn from category/curation signals; avoid treating curated lists as complete site-specific coverage.
- ScriptCat, quoid/userscripts, and Stay: show userscript-manager UX across browsers/mobile. Learn from import/export and compatibility metadata; avoid building a full manager inside this discovery userscript.
- Chrome Web Store and Mozilla AMO: extension alternatives are valuable when userscripts are weak. Learn from ratings/users/version data and official AMO API; avoid relying on brittle HTML scraping where an API exists.

## Security, Privacy, and Reliability
- Verified: `README.md` and `UserScript-Finder.user.js` claim WTFPL while `LICENSE` is MIT. That is a distribution trust defect and should be fixed before the next release.
- Verified: match preview in `UserScript-Finder.user.js` parses `@match`, `@include`, and `@exclude`, but `_patternCoversHost` only checks host for `scheme://` patterns and ignores scheme/path semantics. Greasespot, Chrome, and MDN document scheme/host/path matching and exclude precedence.
- Verified: source fetch failures are often collapsed to empty arrays in adapter methods, so users can see "No scripts found" when a source is rate-limited, changed, or temporarily down.
- Verified: GitHub Search has low unauthenticated limits; GitHub and Gist adapters need explicit rate-limit messages, backoff, and stale cache reuse.
- Verified: install handoff uses source-provided `code_url`/raw URLs and should enforce per-adapter allowlists plus `.user.js` metadata before opening an install URL.
- Verified: the modal has no `role="dialog"`, `aria-modal`, `aria-live`, focus restoration, or focus containment; WAI-ARIA APG expects those behaviors for modal dialogs.
- Verified: current settings are local only and privacy-friendly, but there is no per-source disablement for adult, store, or GitHub network calls.

## Architecture Assessment
- `UserScript-Finder.user.js` is 2,321 lines with eight adapters and UI in one file; this is acceptable for ship-readable userscript distribution but now needs internal contracts and testable pure helpers.
- Refactor candidates: `HostService.extractRootDomain`, adapter `_fetch` methods, `_patternCoversHost`, source-specific normalization, modal rendering, and error-state rendering.
- Test gaps: no package manifest, lint command, fixture tests, metadata parser tests, source parser samples, or browser smoke checklist.
- Documentation gaps: README install/features are strong, but README/license metadata disagree with `LICENSE`; no compatibility matrix for manager-specific behaviors such as Trusted Types, `@inject-into`, and `GM_xmlhttpRequest` failures.
- Observability gaps: no source-health summary, no copyable diagnostics, and no distinction among empty result, parse failure, blocked CORS/store markup change, and rate limit.

## Rejected Ideas
- Full userscript manager replacement: Tampermonkey, Violentmonkey, ScriptCat, Stay, and quoid/userscripts already own install/edit/update workflows; this project should remain the site-context discovery layer.
- Server-backed trending panel: existing roadmap mentions trending, but without a privacy-preserving public dataset it would require telemetry or a hosted service that conflicts with local-only discovery.
- Default external proxy: useful for CORS, but a fixed proxy would create privacy and availability risk; use optional user-configured proxy only if a future source truly requires it.
- Bundled large source-summary model: trust screening should first use deterministic metadata/grant/source signals; a local model would add size and maintenance cost before core reliability is solved.
- Broad marketplace clone: Chrome Web Store, AMO, Greasy Fork, and OpenUserJS already support general search; UserScript Finder wins by being domain-aware.

## Sources
Project and code:
- https://github.com/SysAdminDoc/UserScript-Finder
- https://github.com/SysAdminDoc/UserScriptHunt

Userscript registries and managers:
- https://github.com/greasyfork-org/greasyfork
- https://github.com/OpenUserJs/OpenUserJS.org
- https://www.tampermonkey.net/
- https://www.tampermonkey.net/documentation.php
- https://www.tampermonkey.net/scripts.php
- https://github.com/Tampermonkey/tampermonkey
- https://violentmonkey.github.io/api/gm/
- https://violentmonkey.github.io/api/metadata-block/
- https://github.com/violentmonkey/violentmonkey
- https://github.com/scriptscat/scriptcat
- https://github.com/quoid/userscripts
- https://github.com/shenruisi/Stay

Discovery competitors and catalogs:
- https://github.com/ish4ra/greasyforksearch
- https://github.com/ChinaGodMan/UserScripts
- https://github.com/awesome-scripts/awesome-userscripts
- https://adguard.com/kb/general/extensions/#userscripts

Platform APIs and standards:
- https://addons-server.readthedocs.io/en/latest/topics/api/addons.html
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
- https://wiki.greasespot.net/Metadata_Block
- https://wiki.greasespot.net/Include_and_exclude_rules
- https://publicsuffix.org/
- https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
- https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

## Open Questions
- Which license should be canonical for the next release: MIT from `LICENSE`, or WTFPL from the userscript metadata and README?
