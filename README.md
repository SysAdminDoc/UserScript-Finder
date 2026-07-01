<p align="center">
  <img src="img/icon.png" alt="UserScript Finder" width="128" height="128">
</p>

<h1 align="center">UserScript Finder</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.22.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Tampermonkey-Compatible-00485B?logo=tampermonkey&logoColor=white" alt="Tampermonkey">
  <img src="https://img.shields.io/badge/Violentmonkey-Compatible-a55000" alt="Violentmonkey">
</p>

<p align="center">
  Discover userscripts and extension alternatives for any website — searches GreasyFork, SleazyFork, OpenUserJS, Chrome Web Store, Mozilla AMO, curated catalogs, GitHub Gists, and GitHub from one place.
</p>

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)
2. **[Click here to install UserScript Finder](https://raw.githubusercontent.com/SysAdminDoc/UserScript-Finder/main/UserScript-Finder.user.js)**
3. Confirm installation when prompted

## How It Works

Click your userscript manager icon on any website and pick a source to search:

```
┌─────────────────────────────────────────────────────────┐
│  Tampermonkey / Violentmonkey Menu                      │
│                                                         │
│  ⚙ Find Scripts for reddit.com (GreasyFork)             │
│  ⚙ Find Scripts for reddit.com (SleazyFork)             │
│  ⚙ Find Scripts for reddit.com (OpenUserJS)             │
│  ⚙ Find Extensions for reddit.com (Chrome Web Store)    │
│  ⚙ Find Extensions for reddit.com (Mozilla AMO)          │
│  ⚙ Find Catalogs for reddit.com (Awesome/Tampermonkey)   │
│  ⚙ Find Scripts for reddit.com (GitHub Gists)            │
│  ⚙ Find Scripts for reddit.com (GitHub)                 │
│  ⚙ Reset Script Finder Settings                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Scripts for reddit.com                                 │
│  47 scripts found                                       │
│                                                         │
│  [GreasyFork] [SleazyFork] [OpenUserJS]                  │
│  [Chrome]    [Firefox]    [Catalogs]                     │
│  [Gists]     [GitHub]                                    │
│                                                         │
│  🔍 Filter scripts...                                   │
│  Sort by: Daily installs ▾                              │
│                                                         │
│  ┌─ Reddit Enhancement Suite ──────────── [Install] ──┐ │
│  │  Author: honestbleeps  · v5.24.6  · MIT            │ │
│  │  A suite of modules that enhance your browsing...   │ │
│  │  📥 2.1k/day  📊 1.2M  ⭐ 892  🔥 9.2  🔄 3d ago   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Zero visual footprint.** Nothing appears on the page until you open it from the menu.

## Features

| Feature | Description |
|---------|-------------|
| **Eight Sources** | Search GreasyFork, SleazyFork, OpenUserJS, Chrome Web Store, Mozilla AMO, curated catalogs, GitHub Gists, and GitHub from a single interface |
| **One-Click Install** | Install scripts directly from registries and `.user.js` Gists without leaving the page |
| **Install Safety** | Validates install origins, `.user.js` metadata, and dangerous `@grant` requests before opening a userscript-manager install handoff; unsafe candidates become View actions with inline warnings |
| **Stale Script Warning** | Flags userscript, GitHub, and Gist results with a red "Stale" badge when last updated more than 2 years ago |
| **Live Search Filter** | Real-time filtering within results with match count (e.g., `12/47`) |
| **Result Filters** | Narrow results by recent update window, normalized minimum rating, and language (Any, Browser, or English) |
| **Fielded Search** | Search with `author:`, `license:`, `source:`, `name:`, or `url:` prefixes that combine with plain text and filter controls |
| **Source Resilience** | Adds per-source timeouts, rate-limit/backoff classification, stale-cache fallback, degraded-result notices, retry controls, and manual-search escape hatches |
| **Source Health Diagnostics** | Shows per-source OK/cache/stale/partial/rate-limit/failure badges, footer health age, and copyable diagnostics limited to source, host, status, timestamps, cache age, and count |
| **Source Privacy Controls** | Lets users disable individual sources so those sources disappear from menus/tabs and make no network requests until re-enabled |
| **Sensitive Host Protection** | Blocks source menus and network searches on built-in sensitive hosts such as banks, government, identity, admin, localhost, and local-network pages, with per-host override controls |
| **Match Coverage Preview** | Fetches raw userscript metadata and compares `@match` / `@include` / `@exclude` rules against the current page, including scheme, host, path, wildcard, and exclude precedence |
| **Root Fallback Coverage Labels** | When GreasyFork/SleazyFork fall back from exact host to root domain, installable results are labeled Exact host, Broad/root match, or Coverage uncertain from raw metadata |
| **Extension Trust Badges** | Chrome Web Store and Mozilla AMO results show permission counts, host-access warnings, privacy policy signals, data-collection flags, promoted status, and stale-update warnings when metadata exposes them |
| **Smart Sorting** | Sort by daily installs, total installs, ratings, fan score, author reputation, last update, or creation date |
| **Curated Catalogs** | Searches Awesome Userscripts and Tampermonkey's Userscript.Zone handoff for domain-matched recommendations |
| **GitHub Integration** | Searches repos and Gists matching `{domain} userscript/tampermonkey/greasemonkey`, shows stars and forks |
| **Dense Mode** | Toggle compact view — hides descriptions and tightens padding for fast scanning |
| **Relative Timestamps** | Shows `3d ago`, `2mo ago`, `just now` instead of raw ISO dates |
| **Inline Settings** | Gear icon opens settings within the modal — no external menus to navigate |
| **Accessible Modal** | Uses dialog semantics, live result announcements, accessible control names, focus entry/restoration, and contained Tab navigation |
| **First-Run Network Disclosure** | On first use (or when new sources are enabled), shows which external hosts each source will contact and lets users disable sources before any fetch starts |
| **Manager Compatibility Checks** | Detects missing GM menu, network, storage, tab, and Trusted Types capabilities at runtime and shows an actionable degraded-mode report instead of failing silently |
| **Cross-Tab Settings Sync** | Settings changes propagate to other open tabs via `GM_addValueChangeListener` with polling fallback |
| **Persistent Preferences** | Remembers your last-used source, sort order, dense mode, and cache duration |
| **Domain-Aware** | Automatically detects the current site and strips `www.`/`m.`/`mobile.` prefixes |
| **Public-Suffix Aware Matching** | Normalizes common multi-label and hosted suffixes such as `co.uk`, `com.au`, `github.io`, `pages.dev`, and `netlify.app` before root-domain fallback |
| **Shadow DOM** | Fully encapsulated — styles never leak into or out of the host page |
| **TrustedTypes Safe** | Compatible with strict CSP pages (Google, YouTube, etc.) |

## Data Sources

| Source | API | What's Searched | Badges Shown |
|--------|-----|-----------------|--------------|
| **GreasyFork** | `/scripts/by-site/{domain}.json` with search fallback | Scripts tagged for the current domain | Daily installs, total installs, ratings, fan score |
| **SleazyFork** | Same API, different host | Adult-content scripts for the current domain | Same as GreasyFork |
| **OpenUserJS** | `/?q={domain}` HTML search | OpenUserJS scripts matching the current domain | Installs, ratings, last update |
| **Chrome Web Store** | `/search/{domain}` embedded result data | Chrome extensions matching the current domain | Users, rating, rating count, last update, permissions, host access, privacy/data flags |
| **Mozilla AMO** | `/api/v5/addons/search/` | Firefox extensions matching the current domain | Users, rating, rating count, last update, permissions, host access, privacy/data flags, promoted status |
| **Catalogs** | Awesome Userscripts README + Tampermonkey `scripts.php` | Curated userscripts and Userscript.Zone handoff for the current domain | Catalog source, category |
| **GitHub Gists** | `gist.github.com/search` HTML search | Gists matching `{domain} userscript` | Files, stars, forks, last active |
| **GitHub** | `api.github.com/search/repositories` | Repos matching `{domain} userscript` | Stars, forks, language |

> **Note:** GitHub's unauthenticated API is rate-limited to ~10 requests/minute. Results are cached per your cache duration setting. If you hit the limit, wait a minute and try again.

## Settings

Access via the ⚙ gear icon in the modal header:

| Setting | Options | Default |
|---------|---------|---------|
| Dense Mode | On / Off | Off |
| Default Sort | Daily installs, Total installs, Ratings, Fan score, Author reputation, Last update, Created | Daily installs |
| Cache Duration | 1, 5, 10, 30 minutes | 5 minutes |
| Sources | Per-source On / Off toggles | All sources on |
| Sensitive Host Protection | On / Off plus extra blocked host patterns and per-host override | On |
| Export / Import | Download settings as JSON or import from a file | — |

## Theme

Dark OLED-only interface using the **Catppuccin Mocha** palette with glassmorphism effects. Each source has its own accent color:

| Source | Accent |
|--------|--------|
| GreasyFork | Green / Teal |
| SleazyFork | Purple / Mauve |
| OpenUserJS | Blue |
| Chrome Web Store | Yellow |
| Mozilla AMO | Orange |
| Catalogs | Cyan |
| GitHub Gists | Flamingo |
| GitHub | Orange / Peach |

## Color-Coded Fan Scores

| Score | Color | Meaning |
|-------|-------|---------|
| 8.0+ | Green | Highly rated |
| 6.0–7.9 | Yellow | Average |
| Below 6.0 | Red | Low rated |

## Compatibility

| Userscript Manager | Status |
|--------------------|--------|
| Tampermonkey | Supported; runtime checks validate menu, network, storage, tab-open, and Trusted Types behavior |
| Violentmonkey | Supported; runtime checks validate the same GM API surface |
| Greasemonkey / partial managers | Degraded; if required `GM_registerMenuCommand` or `GM_xmlhttpRequest` is missing, Script Finder shows a compatibility report instead of running source fetches |

Works on all websites (`*://*/*`). Runs at `document-idle` with zero overhead until activated — the UI is built lazily on first menu click.

If non-critical APIs such as storage, tab opening, menu unregistering, or Trusted Types policy creation are unavailable, the modal shows a degraded-mode notice and diagnostics include the exact missing capability.

## Related Tools

> **UserScript Finder** is context-aware — it detects which site you're on and finds scripts made specifically for that domain. No separate window needed.
>
> If you want a standalone search engine to browse scripts by keyword across all repositories (with ratings, installs, and cross-source deduplication), use the companion web app instead:

**[ScriptHunt](https://github.com/SysAdminDoc/UserScriptHunt)** — A single-file HTML web app (also hosted on GitHub Pages) that searches Greasy Fork, Sleazy Fork, GitHub, and OpenUserJS in parallel with a full results grid. No Tampermonkey required. Also useful for browsing when you're not in a browser with Tampermonkey installed.

| Tool | Use When |
|------|----------|
| **UserScript Finder** (this repo) | You're on a website and want scripts for that specific site, without leaving the page |
| **ScriptHunt** | You want to search any keyword, compare installs/ratings, or browse without Tampermonkey |

## FAQ

**Q: Why don't I see an icon or button on the page?**
A: By design. UserScript Finder is menu-only — click your userscript manager icon in the browser toolbar to access it.

**Q: GitHub results seem unrelated?**
A: GitHub search finds any repository mentioning the domain alongside userscript-related keywords. Results are sorted by stars to surface the most relevant ones first.

**Q: I'm getting "GitHub rate limit" errors.**
A: The unauthenticated GitHub API allows ~10 searches per minute. Wait a moment and try again. Results are cached so repeat searches for the same domain won't hit the API.

**Q: Can I change the dark theme?**
A: The dark OLED theme is baked in — no light mode. This is intentional.

## License

[MIT](LICENSE) — permissive open-source license.

## Verification

```bash
npm install
npm test
```

Runs 13 tests covering adapter contracts, install safety, match coverage, host normalization, accessibility markup, diagnostics markup, source privacy, sensitive host protection, network disclosure, manager compatibility, root fallback coverage, source runtime, and `@connect` allowlist consistency.

## Contributing

Issues and PRs welcome. [Open an issue](https://github.com/SysAdminDoc/UserScript-Finder/issues) for bugs or feature requests.
