# Changelog

All notable changes to UserScript-Finder will be documented in this file.

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

## [v1.0.0] - %Y->- (HEAD -> main, origin/main, origin/HEAD)

- README: add related tools section differentiating from UserScriptHunt
- Removed: Delete UserScript Finder-1.0.0.user.js
- Removed: Delete LICENSE
- Added: Add files via upload
- Changed: Update UserScript Finder-1.0.0.user.js
- Added: Add files via upload
- Added: Add files via upload
