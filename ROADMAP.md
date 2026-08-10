# Roadmap

Actionable work only. Historical and completed roadmap material is archived in CHANGELOG.md; blocked work is kept in Roadmap_Blocked.md.

## Actionable Items

- [ ] Related sites: if the script supports youtube.com, suggest it on youtu.be and music.youtube.com

- [ ] Source-code preview with syntax highlighting before install

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
