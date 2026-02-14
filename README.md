<p align="center">
  <img src="img/icon.png" alt="UserScript Finder" width="128" height="128">
</p>

<h1 align="center">UserScript Finder</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-WTFPL-green" alt="License">
  <img src="https://img.shields.io/badge/Tampermonkey-Compatible-00485B?logo=tampermonkey&logoColor=white" alt="Tampermonkey">
  <img src="https://img.shields.io/badge/Violentmonkey-Compatible-a55000" alt="Violentmonkey">
</p>

<p align="center">
  Discover userscripts for any website — searches GreasyFork, SleazyFork, and GitHub from one place.
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
│  ⚙ Find Scripts for reddit.com (GitHub)                 │
│  ⚙ Reset Script Finder Settings                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Scripts for reddit.com                                 │
│  47 scripts found                                       │
│                                                         │
│  [GreasyFork] [SleazyFork] [GitHub]   ← switch tabs     │
│                                                         │
│  🔍 Filter scripts...                                   │
│  Sort by: Daily installs ▾                              │
│                                                         │
│  ┌─ Reddit Enhancement Suite ──────────── [Install] ──┐ │
│  │  Author: honestbleeps  · v5.24.6  · MIT            │ │
│  │  A suite of modules that enhance your browsing...   │ │
│  │  📥 2.1k/day  📊 1.2M  ⭐ 892  🔥 9.2  🔄 3d ago   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Old Reddit Redirect ──────────────── [Install] ──┐ │
│  │  ...                                               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Zero visual footprint.** Nothing appears on the page until you open it from the menu.

## Features

| Feature | Description |
|---------|-------------|
| **Three Sources** | Search GreasyFork, SleazyFork, and GitHub repositories from a single interface |
| **One-Click Install** | Install scripts directly from GreasyFork/SleazyFork without leaving the page |
| **Live Search Filter** | Real-time filtering within results with match count (e.g., `12/47`) |
| **Smart Sorting** | Sort by daily installs, total installs, ratings, fan score, last update, or creation date |
| **GitHub Integration** | Searches repos matching `{domain} userscript/tampermonkey/greasemonkey`, shows stars and forks |
| **Dense Mode** | Toggle compact view — hides descriptions and tightens padding for fast scanning |
| **Relative Timestamps** | Shows `3d ago`, `2mo ago`, `just now` instead of raw ISO dates |
| **Inline Settings** | Gear icon opens settings within the modal — no external menus to navigate |
| **Persistent Preferences** | Remembers your last-used source, sort order, dense mode, and cache duration |
| **Domain-Aware** | Automatically detects the current site and strips `www.`/`m.`/`mobile.` prefixes |
| **Shadow DOM** | Fully encapsulated — styles never leak into or out of the host page |
| **TrustedTypes Safe** | Compatible with strict CSP pages (Google, YouTube, etc.) |

## Data Sources

| Source | API | What's Searched | Badges Shown |
|--------|-----|-----------------|--------------|
| **GreasyFork** | `/scripts/by-site/{domain}.json` with search fallback | Scripts tagged for the current domain | Daily installs, total installs, ratings, fan score |
| **SleazyFork** | Same API, different host | Adult-content scripts for the current domain | Same as GreasyFork |
| **GitHub** | `api.github.com/search/repositories` | Repos matching `{domain} userscript` | Stars, forks, language |

> **Note:** GitHub's unauthenticated API is rate-limited to ~10 requests/minute. Results are cached per your cache duration setting. If you hit the limit, wait a minute and try again.

## Settings

Access via the ⚙ gear icon in the modal header:

| Setting | Options | Default |
|---------|---------|---------|
| Dense Mode | On / Off | Off |
| Default Sort | Daily installs, Total installs, Ratings, Fan score, Last update, Created | Daily installs |
| Cache Duration | 1, 5, 10, 30 minutes | 5 minutes |

## Theme

Dark OLED-only interface using the **Catppuccin Mocha** palette with glassmorphism effects. Each source has its own accent color:

| Source | Accent |
|--------|--------|
| GreasyFork | Green / Teal |
| SleazyFork | Purple / Mauve |
| GitHub | Orange / Peach |

## Color-Coded Fan Scores

| Score | Color | Meaning |
|-------|-------|---------|
| 8.0+ | 🟢 Green | Highly rated |
| 6.0–7.9 | 🟡 Yellow | Average |
| Below 6.0 | 🔴 Red | Low rated |

## Compatibility

| Userscript Manager | Status |
|--------------------|--------|
| Tampermonkey | ✅ Fully supported |
| Violentmonkey | ✅ Fully supported |
| Greasemonkey | ✅ Supported |

Works on all websites (`*://*/*`). Runs at `document-idle` with zero overhead until activated — the UI is built lazily on first menu click.

## FAQ

**Q: Why don't I see an icon or button on the page?**
A: By design. UserScript Finder is menu-only — click your userscript manager icon in the browser toolbar to access it. This keeps pages clean.

**Q: GitHub results seem unrelated?**
A: GitHub search is broader — it finds any repository mentioning the domain alongside userscript-related keywords. Results are sorted by stars to surface the most relevant ones first.

**Q: I'm getting "GitHub rate limit" errors.**
A: The unauthenticated GitHub API allows ~10 searches per minute. Wait a moment and try again. Results are cached so repeat searches for the same domain won't hit the API.

**Q: Can I change the dark theme?**
A: The dark OLED theme is baked in — no light mode. This is intentional.

## License

[WTFPL](http://www.wtfpl.net/) — Do What The F*** You Want To Public License.

## Contributing

Issues and PRs welcome. [Open an issue](https://github.com/SysAdminDoc/UserScript-Finder/issues) for bugs or feature requests.
