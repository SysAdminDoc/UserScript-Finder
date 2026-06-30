// ==UserScript==
// @name         UserScript Finder
// @namespace    http://tampermonkey.net/
// @version      1.16.0
// @description  Finds userscripts and extension alternatives for the current domain
// @author       SysAdminDoc
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @icon         https://raw.githubusercontent.com/SysAdminDoc/UserScript-Finder/main/img/icon.png
// @connect      greasyfork.org
// @connect      update.greasyfork.org
// @connect      sleazyfork.org
// @connect      openuserjs.org
// @connect      chromewebstore.google.com
// @connect      addons.mozilla.org
// @connect      www.tampermonkey.net
// @connect      gist.github.com
// @connect      gist.githubusercontent.com
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @license      MIT
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/SysAdminDoc/UserScript-Finder/main/UserScript-Finder.user.js
// @updateURL    https://raw.githubusercontent.com/SysAdminDoc/UserScript-Finder/main/UserScript-Finder.user.js
// @homepageURL  https://github.com/SysAdminDoc/UserScript-Finder
// @supportURL   https://github.com/SysAdminDoc/UserScript-Finder/issues
// ==/UserScript==

(function() {
  "use strict";

  try { if (window.self !== window.top) return; } catch(e) { return; }

  // ── TrustedHTML policy ──────────────────────────────────────────────
  const _ttPolicy = (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy)
    ? trustedTypes.createPolicy('gf-script-finder', { createHTML: s => s })
    : { createHTML: s => s };
  function _safeHTML(el, html) { el.innerHTML = _ttPolicy.createHTML(html); }

  const SOURCE_META = {
    greasyfork: { label: "GreasyFork", tab: "GreasyFork", menuKind: "Scripts", menuName: "GreasyFork", footerUrl: "https://greasyfork.org", unit: "script" },
    sleazyfork: { label: "SleazyFork", tab: "SleazyFork", menuKind: "Scripts", menuName: "SleazyFork", footerUrl: "https://sleazyfork.org", unit: "script" },
    openuserjs: { label: "OpenUserJS", tab: "OpenUserJS", menuKind: "Scripts", menuName: "OpenUserJS", footerUrl: "https://openuserjs.org", unit: "script" },
    chromewebstore: { label: "Chrome Web Store", tab: "Chrome", menuKind: "Extensions", menuName: "Chrome Web Store", footerUrl: "https://chromewebstore.google.com", unit: "extension" },
    mozillaaddons: { label: "Mozilla Add-ons", tab: "Firefox", menuKind: "Extensions", menuName: "Mozilla AMO", footerUrl: "https://addons.mozilla.org", unit: "extension" },
    catalogs: { label: "Script Catalogs", tab: "Catalogs", menuKind: "Catalogs", menuName: "Awesome/Tampermonkey", footerUrl: "https://github.com/awesome-scripts/awesome-userscripts", unit: "catalog result" },
    githubgist: { label: "GitHub Gists", tab: "Gists", menuKind: "Scripts", menuName: "GitHub Gists", footerUrl: "https://gist.github.com", unit: "gist" },
    github: { label: "GitHub", tab: "GitHub", menuKind: "Scripts", menuName: "GitHub", footerUrl: "https://github.com", unit: "repo" }
  };
  const SOURCE_ORDER = Object.keys(SOURCE_META);
  const DEFAULT_SOURCE_SETTINGS = SOURCE_ORDER.reduce((settings, source) => {
    settings[source] = true;
    return settings;
  }, {});
  const DEFAULT_SENSITIVE_HOST_PATTERNS = [
    "localhost",
    "*.localhost",
    "127.*",
    "10.*",
    "192.168.*",
    "172.16.*",
    "172.17.*",
    "172.18.*",
    "172.19.*",
    "172.20.*",
    "172.21.*",
    "172.22.*",
    "172.23.*",
    "172.24.*",
    "172.25.*",
    "172.26.*",
    "172.27.*",
    "172.28.*",
    "172.29.*",
    "172.30.*",
    "172.31.*",
    "*.local",
    "*.lan",
    "*.home",
    "*.internal",
    "*.intranet",
    "*.corp",
    "*.gov",
    "*.gov.*",
    "*.mil",
    "*.mil.*",
    "*bank*",
    "*creditunion*",
    "login.*",
    "*.login.*",
    "auth.*",
    "*.auth.*",
    "sso.*",
    "*.sso.*",
    "identity.*",
    "*.identity.*",
    "admin.*",
    "*.admin.*",
    "router.*",
    "*.router.*",
    "gateway.*",
    "*.gateway.*",
    "firewall.*",
    "*.firewall.*"
  ];

  // ── Default Settings ────────────────────────────────────────────────
  const DEFAULT_SETTINGS = {
    cacheDuration: 5 * 60 * 1000,
    defaultSort: "daily",
    denseMode: false,
    lastService: "greasyfork",
    sources: DEFAULT_SOURCE_SETTINGS,
    sensitiveHostProtection: true,
    sensitiveHostPatterns: "",
    sensitiveHostOverrides: []
  };

  // ── Catppuccin Mocha + OLED palette ─────────────────────────────────
  const THEME = {
    base:     '#0a0a0f',
    mantle:   '#0f0f17',
    crust:    '#06060a',
    surface0: '#14141f',
    surface1: '#1a1a2a',
    surface2: '#232336',
    overlay0: '#2e2e44',
    overlay1: '#3a3a55',
    text:     '#cdd6f4',
    subtext1: '#bac2de',
    subtext0: '#a6adc8',
    overlay:  '#7f849c',
    green:    '#a6e3a1',
    greenDim: '#40b65e',
    teal:     '#94e2d5',
    purple:   '#cba6f7',
    purpleDim:'#a855c7',
    mauve:    '#b4befe',
    red:      '#f38ba8',
    peach:    '#fab387',
    yellow:   '#f9e2af',
    blue:     '#89b4fa',
    sky:      '#89dceb',
    flamingo: '#f2cdcd',
    rosewater:'#f5e0dc',
    glass:    'rgba(14, 14, 22, 0.82)',
    glassBorder: 'rgba(255, 255, 255, 0.06)',
    glassHover: 'rgba(255, 255, 255, 0.03)',
    glow:     'rgba(166, 227, 161, 0.15)',
    glowPurple: 'rgba(203, 166, 247, 0.15)',
    openuserjs: '#89b4fa',
    openuserjsDim: '#4f7fd8',
    glowOpenUserJS: 'rgba(137, 180, 250, 0.15)',
    chromewebstore: '#f9e2af',
    chromewebstoreDim: '#fbbc04',
    glowChromeWebStore: 'rgba(249, 226, 175, 0.15)',
    mozillaaddons: '#ff8a3d',
    mozillaaddonsDim: '#e66000',
    glowMozillaAddons: 'rgba(255, 138, 61, 0.15)',
    catalogs: '#89dceb',
    catalogsDim: '#3db9b7',
    glowCatalogs: 'rgba(137, 220, 235, 0.15)',
    githubgist: '#f2cdcd',
    githubgistDim: '#e78284',
    glowGitHubGist: 'rgba(242, 205, 205, 0.15)',
    github:     '#f0883e',
    githubDim:  '#d2691e',
    glowGithub: 'rgba(240, 136, 62, 0.15)',
    shadow:   'rgba(0, 0, 0, 0.5)'
  };

  // ── Icons (Phosphor) ────────────────────────────────────────────────
  const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23Z"></path></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>',
    scales: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M239.43,133l-32-80h0a8,8,0,0,0-9.16-4.84L136,62V40a8,8,0,0,0-16,0V65.58L54.26,80.19A8,8,0,0,0,48.57,85h0v.06L16.57,165a7.92,7.92,0,0,0-.57,3c0,23.31,24.54,32,40,32s40-8.69,40-32a7.92,7.92,0,0,0-.57-3L66.92,93.77,120,82V208H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16H136V78.42L187,67.1,160.57,133a7.92,7.92,0,0,0-.57,3c0,23.31,24.54,32,40,32s40-8.69,40-32A7.92,7.92,0,0,0,239.43,133Z"></path></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path></svg>',
    gitBranch: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M232,64a32,32,0,1,0-40,31v17a8,8,0,0,1-8,8H96a23.84,23.84,0,0,0-8,1.38V95a32,32,0,1,0-16,0v66a32,32,0,1,0,16,0V144a8,8,0,0,1,8-8h88a24,24,0,0,0,24-24V95A32.06,32.06,0,0,0,232,64Z"></path></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path></svg>',
    chartBar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"></path></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"></path></svg>',
    flame: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48Z"></path></svg>',
    clockwise: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78,8,8,0,0,1,11,11.63A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z"></path></svg>',
    calendarPlus: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V96H208V208Zm-48-56a8,8,0,0,1-8,8H136v16a8,8,0,0,1-16,0V160H104a8,8,0,0,1,0-16h16V128a8,8,0,0,1,16,0v16h16A8,8,0,0,1,160,152Z"></path></svg>',
    install: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm37.66-101.66a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L120,132.69V80a8,8,0,0,1,16,0v52.69l18.34-18.35A8,8,0,0,1,165.66,114.34ZM168,168a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z"></path></svg>',
    gear: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Z"></path></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>',
    eyeSlash: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M53.92,34.62A8,8,0,1,0,42.08,45.38L61.32,66.55C25,88.84,9.38,123.2,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208a127.11,127.11,0,0,0,52.07-10.83l22,24.21a8,8,0,1,0,11.85-10.76Zm47.17,75.39,28.48,31.33a32,32,0,0,1-28.48-31.33ZM128,192c-30.78,0-57.67-11.19-79.93-33.29A133.47,133.47,0,0,1,25,128c4.69-8.79,19.66-33.39,47.35-49.38l18,19.75A48,48,0,0,0,131.7,145l21.82,24A111.37,111.37,0,0,1,128,192Zm119.31-60.76a8,8,0,0,1-3.08,4.42l-11.07-12.17A134.05,134.05,0,0,0,231,128a133.15,133.15,0,0,0-23.07-30.71C185.67,75.19,158.78,64,128,64a118.48,118.48,0,0,0-19.77,1.63L96.36,52.75A127.06,127.06,0,0,1,128,48c34.88,0,66.57,13.26,91.66,38.35,18.83,18.83,27.3,37.62,27.65,38.41A8,8,0,0,1,247.31,131.24Z"></path></svg>',
    arrowsHorizontal: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M237.66,133.66l-32,32a8,8,0,0,1-11.32-11.32L212.69,136H43.31l18.35,18.34a8,8,0,0,1-11.32,11.32l-32-32a8,8,0,0,1,0-11.32l32-32a8,8,0,0,1,11.32,11.32L43.31,120H212.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,237.66,133.66Z"></path></svg>',
    rows: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M208,136H48a16,16,0,0,0-16,16v40a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V152A16,16,0,0,0,208,136Zm0,56H48V152H208v40Zm0-144H48A16,16,0,0,0,32,64v40a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V64A16,16,0,0,0,208,48Zm0,56H48V64H208v40Z"></path></svg>',
    undo: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a96,96,0,0,1-96,96H48a8,8,0,0,1,0-16h80a80,80,0,0,0,0-160H67.31l18.35,18.34A8,8,0,0,1,74.34,77.66l-32-32a8,8,0,0,1,0-11.32l32-32A8,8,0,0,1,85.66,13.66L67.31,32H128A96.11,96.11,0,0,1,224,128Z"></path></svg>',
    githubLogo: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24,40,40,0,0,0-40-40,8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48A8,8,0,0,0,80,73.55a43.82,43.82,0,0,1,.79-33.58,43.86,43.86,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.86,43.86,0,0,1,32.32-20.06A43.82,43.82,0,0,1,192,73.55a8,8,0,0,0,1.13,7.92A41.74,41.74,0,0,1,200,104Z"></path></svg>',
    gitFork: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,64a32,32,0,1,0-40,31v17a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V95a32,32,0,1,0-16,0v17a24,24,0,0,0,24,24h40v25a32,32,0,1,0,16,0V136h40a24,24,0,0,0,24-24V95A32.06,32.06,0,0,0,224,64ZM48,64A16,16,0,1,1,64,80,16,16,0,0,1,48,64Zm96,128a16,16,0,1,1-16-16A16,16,0,0,1,144,192ZM192,80a16,16,0,1,1,16-16A16,16,0,0,1,192,80Z"></path></svg>'
  };

  function getIcon(name) { return ICONS[name] || ''; }

  // ── Utility ─────────────────────────────────────────────────────────
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  function relativeTime(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  function formatNumber(num) {
    if (num === null || num === undefined || num === "") return null;
    const n = Number(num);
    if (!Number.isFinite(n)) return null;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return n.toString();
  }

  function reputationScore(script) {
    const installs = Number(script?.total_installs) || 0;
    const ratings = Number(script?.good_ratings ?? script?._rating_count ?? script?._stars) || 0;
    const quality = Number(script?.fan_score ?? script?._rating) || 0;
    const stars = Number(script?._stars) || 0;
    const forks = Number(script?._forks) || 0;
    const curated = script?._catalog_source === "Awesome Userscripts" ? 100000 : script?._catalog_source ? 30000 : 0;
    return curated + (Math.log10(installs + 1) * 1000) + (ratings * 10) + (quality * 250) + (stars * 15) + (forks * 25);
  }

  function normalizedRating(script) {
    if (script?._rating != null) return Number(script._rating);
    if (script?.fan_score != null) return Number(script.fan_score) / 2;
    return null;
  }

  function looksEnglish(script) {
    const locale = String(script?.locale || script?._locale || "").toLowerCase();
    if (locale) return locale.startsWith("en");
    const text = `${script?.name || ""} ${script?.description || ""}`;
    if (!text.trim()) return true;
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    const nonLatin = (text.match(/[^\x00-\x7F]/g) || []).length;
    return nonLatin === 0 || latin / Math.max(latin + nonLatin, 1) >= 0.8;
  }

  const MatchCoverage = {
    evaluate(source, displayHost, currentUrl) {
      const meta = this.extractUserScriptMetadata(source);
      const coverage = [
        ...meta.match.map(pattern => ({ type: "match", pattern })),
        ...meta.include.map(pattern => ({ type: "include", pattern }))
      ];
      const matching = coverage.filter(entry => this.patternCoversUrl(entry.pattern, currentUrl, entry.type));
      const excluded = meta.exclude.filter(pattern => this.patternCoversUrl(pattern, currentUrl, "exclude"));

      if (!coverage.length) {
        return { status: "warn", title: "No match metadata found", detail: "This script has no @match or @include lines in the metadata block.", patterns: [] };
      }
      if (excluded.length) {
        return { status: "bad", title: `Excluded on ${displayHost}`, detail: "An @exclude pattern matches this page.", patterns: excluded.slice(0, 3) };
      }
      if (matching.length) {
        return { status: "good", title: `Covers ${displayHost}`, detail: "At least one @match or @include entry applies to this page.", patterns: matching.map(entry => entry.pattern).slice(0, 3) };
      }
      return { status: "bad", title: `No match for ${displayHost}`, detail: "The metadata block did not include a pattern that applies to this page.", patterns: coverage.map(entry => entry.pattern).slice(0, 3) };
    },

    extractUserScriptMetadata(source) {
      const meta = { match: [], include: [], exclude: [] };
      const lines = String(source || "").split(/\r?\n/).slice(0, 400);
      for (const line of lines) {
        if (/==\/UserScript==/.test(line)) break;
        const found = line.match(/^\s*\/\/\s*@(match|include|exclude)\s+(.+?)\s*$/i);
        if (found) meta[found[1].toLowerCase()].push(found[2].trim());
      }
      return meta;
    },

    patternCoversUrl(pattern, currentUrl, type = "include") {
      const trimmed = String(pattern || "").trim();
      if (!trimmed) return false;
      if (trimmed === "<all_urls>") return true;

      const url = this.parseUrl(currentUrl);
      if (!url) return false;
      if (type === "match") return this.matchBrowserPattern(trimmed, url);
      return this.matchIncludePattern(trimmed, url);
    },

    parseUrl(currentUrl) {
      try { return new URL(currentUrl); }
      catch { return null; }
    },

    matchBrowserPattern(pattern, url) {
      const found = String(pattern || "").match(/^(\*|https?|file|ftp):\/\/([^/]*)(\/.*)?$/i);
      if (!found) return false;

      const [, rawScheme, rawHost, rawPath] = found;
      const scheme = rawScheme.toLowerCase();
      const urlScheme = url.protocol.replace(/:$/, "").toLowerCase();
      if (scheme === "*" ? !["http", "https"].includes(urlScheme) : scheme !== urlScheme) return false;
      if (urlScheme !== "file" && !this.hostMatchesPattern(url.hostname, rawHost)) return false;
      return this.wildcardMatches(rawPath || "/", this.urlPath(url));
    },

    matchIncludePattern(pattern, url) {
      if (/^\/.+\/[a-z]*$/i.test(pattern)) {
        const lastSlash = pattern.lastIndexOf("/");
        try { return new RegExp(pattern.slice(1, lastSlash), pattern.slice(lastSlash + 1)).test(url.href); }
        catch { return false; }
      }
      return this.wildcardMatches(pattern, url.href);
    },

    hostMatchesPattern(host, pattern) {
      const current = String(host || "").toLowerCase();
      const candidate = String(pattern || "").toLowerCase();
      if (candidate === "*" || candidate === current) return true;
      if (candidate.startsWith("*.")) {
        const root = candidate.slice(2);
        return current === root || current.endsWith(`.${root}`);
      }
      if (candidate.startsWith("*")) return current.endsWith(candidate.slice(1));
      return false;
    },

    wildcardMatches(pattern, value) {
      const regex = "^" + String(pattern || "").split("*").map(part => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$";
      try { return new RegExp(regex, "i").test(String(value || "")); }
      catch { return false; }
    },

    urlPath(url) {
      return `${url.pathname || "/"}${url.search || ""}${url.hash || ""}`;
    }
  };

  if (typeof window !== "undefined" && window.__SF_TEST_HOOKS__) {
    window.__SF_TEST_HOOKS__.MatchCoverage = MatchCoverage;
  }

  const SourceRuntime = {
    timeoutMs: 12000,
    sourceLabels: SOURCE_ORDER.reduce((labels, source) => {
      labels[source] = SOURCE_META[source].label;
      return labels;
    }, {}),

    label(service) {
      return this.sourceLabels[service?.serviceName] || service?.serviceName || "Source";
    },

    freshCache(service, cacheKey, settings) {
      const cacheDuration = settings.get("cacheDuration");
      const cached = service.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) return {
        cached,
        data: this.withHealth(cached.data, {
          type: "cached",
          title: `${this.label(service)} cache hit`,
          detail: `Using cached results from ${this.ageLabel(cached.timestamp)}.`,
          checkedAt: Date.now(),
          cachedAt: cached.timestamp
        })
      };
      return { cached, data: null };
    },

    backoffFallback(service, cacheKey, cached) {
      const until = service._sfBackoff?.get(cacheKey) || 0;
      if (until <= Date.now()) return null;
      const seconds = Math.max(1, Math.ceil((until - Date.now()) / 1000));
      if (cached) return this.withStatus(cached.data, {
        type: "stale",
        title: `${this.label(service)} is backing off`,
        detail: `Showing cached results from ${this.ageLabel(cached.timestamp)}. Retry opens in ${seconds}s.`,
        checkedAt: Date.now(),
        cachedAt: cached.timestamp
      });
      throw this.error(this.label(service), `Waiting ${seconds}s before retrying after a source failure.`, "backoff");
    },

    saveCache(service, cacheKey, data) {
      const clean = Array.isArray(data) ? data.slice() : data;
      const timestamp = Date.now();
      service.cache.set(cacheKey, { data: clean, timestamp });
      return this.withHealth(data, {
        type: "ok",
        title: `${this.label(service)} loaded`,
        detail: "Fresh source results loaded.",
        checkedAt: timestamp,
        cachedAt: timestamp
      });
    },

    staleOrThrow(service, cacheKey, cached, err) {
      this.noteBackoff(service, cacheKey, err);
      if (cached) return this.withStatus(cached.data, {
        type: "stale",
        title: `${this.label(service)} unavailable`,
        detail: `Showing cached results from ${this.ageLabel(cached.timestamp)} because ${this.cleanMessage(err)}.`,
        checkedAt: Date.now(),
        cachedAt: cached.timestamp
      });
      throw err;
    },

    noteBackoff(service, cacheKey, err) {
      const retryMs = err?.retryMs || (err?.kind === "rate-limit" ? 60000 : err?.kind === "timeout" ? 20000 : 10000);
      if (!service._sfBackoff) service._sfBackoff = new Map();
      service._sfBackoff.set(cacheKey, Date.now() + retryMs);
    },

    withStatus(data, status) {
      if (!Array.isArray(data)) return data;
      const copy = data.slice();
      Object.defineProperty(copy, "_sfStatus", { value: status, enumerable: false });
      Object.defineProperty(copy, "_sfHealth", { value: status, enumerable: false });
      return copy;
    },

    withHealth(data, health) {
      if (!Array.isArray(data)) return data;
      const copy = data.slice();
      Object.defineProperty(copy, "_sfHealth", { value: health, enumerable: false });
      return copy;
    },

    ageLabel(timestamp) {
      const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    },

    cleanMessage(err) {
      return String(err?.message || "the source request failed").replace(/\.$/, "");
    },

    error(source, message, kind = "network", retryMs = null) {
      const err = new Error(`${source}: ${message}`);
      err.kind = kind;
      if (retryMs) err.retryMs = retryMs;
      return err;
    },

    httpError(source, status) {
      if (status === 403 || status === 429) return this.error(source, `rate limited (HTTP ${status})`, "rate-limit", 60000);
      if (status >= 500) return this.error(source, `temporary server error (HTTP ${status})`, "server", 20000);
      return this.error(source, `HTTP ${status}`, "http", 10000);
    },

    requestText(url, { source, headers = {}, notFound = "" } = {}) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const done = (fn, value) => {
          if (settled) return;
          settled = true;
          fn(value);
        };
        GM_xmlhttpRequest({
          method: "GET",
          url,
          headers,
          timeout: this.timeoutMs,
          onload: r => {
            if (r.status >= 200 && r.status < 300) done(resolve, r.responseText || "");
            else if (r.status === 404) done(resolve, notFound);
            else done(reject, this.httpError(source, r.status));
          },
          onerror: () => done(reject, this.error(source, "network request failed", "network", 10000)),
          ontimeout: () => done(reject, this.error(source, `timed out after ${Math.round(this.timeoutMs / 1000)}s`, "timeout", 20000))
        });
      });
    },

    async requestJson(url, options = {}) {
      const text = await this.requestText(url, options);
      if (typeof text !== "string") return text;
      try { return JSON.parse(text || "null"); }
      catch(e) { throw this.error(options.source, `invalid JSON (${e.message})`, "parse", 10000); }
    }
  };

  if (typeof window !== "undefined" && window.__SF_TEST_HOOKS__) {
    window.__SF_TEST_HOOKS__.SourceRuntime = SourceRuntime;
    window.__SF_TEST_HOOKS__.SOURCE_META = SOURCE_META;
    window.__SF_TEST_HOOKS__.SOURCE_ORDER = SOURCE_ORDER;
  }

  const InstallSafety = {
    allowlists: {
      greasyfork: ["https://update.greasyfork.org", "https://greasyfork.org"],
      sleazyfork: ["https://update.greasyfork.org", "https://sleazyfork.org"],
      openuserjs: ["https://openuserjs.org"],
      catalogs: [
        "https://update.greasyfork.org",
        "https://greasyfork.org",
        "https://sleazyfork.org",
        "https://openuserjs.org",
        "https://raw.githubusercontent.com",
        "https://gist.githubusercontent.com"
      ],
      githubgist: ["https://gist.githubusercontent.com"]
    },

    validateInstallUrl(script, rawUrl) {
      if (!rawUrl) return { ok: false, reason: "Missing install URL." };
      let url;
      try { url = new URL(rawUrl); }
      catch { return { ok: false, reason: "Install URL is not a valid URL." }; }

      if (url.protocol !== "https:") return { ok: false, reason: "Install URL must use HTTPS." };
      const source = script?._source || "greasyfork";
      const allowed = this.allowlists[source] || [];
      if (!allowed.includes(url.origin)) return { ok: false, reason: `Install origin ${url.origin} is not trusted for ${SourceRuntime.sourceLabels[source] || source}.` };
      if (!this.looksLikeUserScriptUrl(url)) return { ok: false, reason: "Install URL does not point to a .user.js payload." };

      return { ok: true, url: url.href };
    },

    looksLikeUserScriptUrl(url) {
      const path = decodeURIComponent(url.pathname || "");
      return /\.user\.js$/i.test(path);
    },

    hasUserScriptMetadata(source) {
      const text = String(source || "");
      const block = text.match(/==UserScript==([\s\S]{0,12000}?)==\/UserScript==/i);
      return !!(block && /\/\/\s*@name\s+\S+/i.test(block[1]));
    }
  };

  if (typeof window !== "undefined" && window.__SF_TEST_HOOKS__) {
    window.__SF_TEST_HOOKS__.InstallSafety = InstallSafety;
  }

  // ── Settings Service ────────────────────────────────────────────────
  class SettingsService {
    constructor() { this.settings = this.loadSettings(); }
    loadSettings() {
      const saved = GM_getValue("sf_settings_v4", {}) || {};
      const settings = { ...DEFAULT_SETTINGS, ...saved };
      settings.sources = this.normalizeSources(saved.sources);
      settings.sensitiveHostProtection = saved.sensitiveHostProtection !== false;
      settings.sensitiveHostPatterns = typeof saved.sensitiveHostPatterns === "string" ? saved.sensitiveHostPatterns : "";
      settings.sensitiveHostOverrides = this.normalizeHostList(saved.sensitiveHostOverrides);
      const sourceChanged = SOURCE_ORDER.some(source => saved.sources?.[source] !== settings.sources[source]);
      const hostSettingsChanged = settings.sensitiveHostProtection !== saved.sensitiveHostProtection ||
        settings.sensitiveHostPatterns !== saved.sensitiveHostPatterns ||
        JSON.stringify(settings.sensitiveHostOverrides) !== JSON.stringify(saved.sensitiveHostOverrides || []);
      let serviceChanged = false;
      if (!settings.sources[settings.lastService]) {
        settings.lastService = SOURCE_ORDER.find(source => settings.sources[source]) || "greasyfork";
        serviceChanged = true;
      }
      if (sourceChanged || serviceChanged || hostSettingsChanged) GM_setValue("sf_settings_v4", settings);
      return settings;
    }
    normalizeSources(savedSources = {}) {
      const safeSources = savedSources && typeof savedSources === "object" ? savedSources : {};
      const normalized = {};
      SOURCE_ORDER.forEach(source => { normalized[source] = safeSources[source] !== false; });
      if (!SOURCE_ORDER.some(source => normalized[source])) normalized.greasyfork = true;
      return normalized;
    }
    normalizeHostList(value) {
      if (!Array.isArray(value)) return [];
      return [...new Set(value.map(host => HostService.normalizeHost(host)).filter(Boolean))];
    }
    saveSettings() { GM_setValue("sf_settings_v4", this.settings); }
    get(key) { return this.settings[key]; }
    set(key, value) { this.settings[key] = value; this.saveSettings(); }
  }

  // ── Host Service ────────────────────────────────────────────────────
  class HostService {
    static publicSuffixes = new Set([
      "ac.uk", "co.uk", "gov.uk", "ltd.uk", "me.uk", "net.uk", "nhs.uk", "org.uk", "plc.uk", "sch.uk",
      "com.au", "net.au", "org.au", "edu.au", "gov.au", "asn.au", "id.au",
      "co.jp", "ne.jp", "or.jp", "ac.jp", "go.jp",
      "com.br", "net.br", "org.br", "gov.br",
      "com.cn", "net.cn", "org.cn", "gov.cn",
      "co.nz", "net.nz", "org.nz", "ac.nz", "govt.nz",
      "co.in", "firm.in", "net.in", "org.in", "gen.in", "ind.in",
      "com.mx", "org.mx", "gob.mx", "edu.mx", "net.mx",
      "com.tr", "net.tr", "org.tr", "gov.tr",
      "github.io", "gitlab.io", "pages.dev", "netlify.app", "vercel.app", "herokuapp.com",
      "blogspot.com", "wordpress.com", "firebaseapp.com", "web.app", "azurewebsites.net", "cloudfront.net"
    ]);

    static getCurrentHost() { return this.normalizeHost(window.location.hostname); }

    static normalizeHost(host) {
      let value = String(host || "").trim().toLowerCase().replace(/\.$/, "");
      if (!value) return "";
      if (value.startsWith("[") && value.endsWith("]")) return value.slice(1, -1);
      if (this.isIpAddress(value) || value === "localhost") return value;
      return value.replace(/^(www\.|m\.|mobile\.)/, "");
    }

    static extractRootDomain(host) {
      const normalized = this.normalizeHost(host);
      if (!normalized || normalized === "localhost" || this.isIpAddress(normalized)) return normalized;

      const parts = normalized.split(".").filter(Boolean);
      if (parts.length <= 2) return normalized;

      const suffixLength = this.publicSuffixLength(parts);
      const rootLength = Math.min(parts.length, suffixLength + 1);
      return parts.slice(-rootLength).join(".");
    }

    static publicSuffixLength(parts) {
      for (let len = Math.min(parts.length, 3); len >= 2; len--) {
        if (this.publicSuffixes.has(parts.slice(-len).join("."))) return len;
      }
      return 1;
    }

    static isIpAddress(host) {
      return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || /^[0-9a-f:]+$/i.test(host);
    }

    static patternList(value) {
      return String(value || "")
        .split(/[\n,]+/)
        .map(pattern => this.normalizePattern(pattern))
        .filter(Boolean);
    }

    static normalizePattern(pattern) {
      let value = String(pattern || "").trim().toLowerCase();
      if (!value || value.startsWith("#")) return "";
      value = value.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].replace(/\.$/, "");
      if (value.startsWith(".")) value = `*${value}`;
      return value;
    }

    static patternMatches(host, pattern) {
      const normalizedHost = this.normalizeHost(host);
      const normalizedPattern = this.normalizePattern(pattern);
      if (!normalizedHost || !normalizedPattern) return false;
      if (!normalizedPattern.includes("*")) {
        return normalizedHost === normalizedPattern || normalizedHost.endsWith(`.${normalizedPattern}`);
      }
      const escaped = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      return new RegExp(`^${escaped}$`).test(normalizedHost);
    }

    static isHostOverridden(host, settings) {
      const overrides = Array.isArray(settings?.get?.("sensitiveHostOverrides"))
        ? settings.get("sensitiveHostOverrides")
        : [];
      return overrides.some(pattern => this.patternMatches(host, pattern));
    }

    static sensitiveHostMatch(host, settings) {
      const normalizedHost = this.normalizeHost(host);
      if (!normalizedHost || settings?.get?.("sensitiveHostProtection") === false) return null;
      if (this.isHostOverridden(normalizedHost, settings)) return null;
      const userPatterns = this.patternList(settings?.get?.("sensitiveHostPatterns"));
      const patterns = [...DEFAULT_SENSITIVE_HOST_PATTERNS, ...userPatterns];
      const pattern = patterns.find(candidate => this.patternMatches(normalizedHost, candidate));
      return pattern ? { host: normalizedHost, pattern } : null;
    }
  }

  if (typeof window !== "undefined" && window.__SF_TEST_HOOKS__) {
    window.__SF_TEST_HOOKS__.HostService = HostService;
  }

  // ── Script Service ──────────────────────────────────────────────────
  class ScriptService {
    constructor(baseUrl, serviceName) {
      this.baseUrl = baseUrl;
      this.serviceName = serviceName;
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      let scripts = await this._searchWithDomain(host, settings);
      if (scripts.length === 0) {
        const root = HostService.extractRootDomain(host);
        if (root !== host) scripts = await this._searchWithDomain(root, settings);
      }
      return scripts;
    }

    async _searchWithDomain(domain, settings) {
      const cacheKey = `${this.serviceName}_${domain}`;
      const { cached, data } = SourceRuntime.freshCache(this, cacheKey, settings);
      if (data) return data;
      const backoff = SourceRuntime.backoffFallback(this, cacheKey, cached);
      if (backoff) return backoff;

      let scripts = [];
      try {
        scripts = await this._fetchBySite(domain);
      } catch(err) {
        try {
          scripts = await this._fetchSearch(domain);
        } catch(searchErr) {
          return SourceRuntime.staleOrThrow(this, cacheKey, cached, searchErr || err);
        }
      }

      const filtered = this._filter(scripts, domain);
      return SourceRuntime.saveCache(this, cacheKey, filtered);
    }

    _fetch(url) {
      return SourceRuntime.requestJson(url, {
        source: SourceRuntime.label(this),
        headers: { Accept: "application/json" },
        notFound: "[]"
      });
    }

    _fetchBySite(domain) { return this._fetch(`${this.baseUrl}/scripts/by-site/${domain}.json`); }
    _fetchSearch(domain) { return this._fetch(`${this.baseUrl}/scripts.json?q=${encodeURIComponent(domain)}&sort=updated`); }

    _filter(scripts, domain) {
      const root = HostService.extractRootDomain(domain);
      return scripts.filter(s => {
        if (!s.domains) return true;
        return s.domains.some(d =>
          d === domain || d === `*.${domain}` ||
          d === root || d === `*.${root}` ||
          domain.includes(d.replace('*.','')) ||
          d.replace('*.','').includes(domain)
        );
      }).slice(0, 200);
    }

    getDirectSearchUrl(domain) { return `${this.baseUrl}/scripts/by-site/${domain}`; }
  }

  // OpenUserJS search is HTML-only; parse its script table into the shared result shape.
  class OpenUserJSScriptService {
    constructor() {
      this.serviceName = "openuserjs";
      this.baseUrl = "https://openuserjs.org";
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      let scripts = await this._searchWithDomain(host, settings);
      if (scripts.length === 0) {
        const root = HostService.extractRootDomain(host);
        if (root !== host) scripts = await this._searchWithDomain(root, settings);
      }
      return scripts;
    }

    async _searchWithDomain(domain, settings) {
      const cacheKey = `openuserjs_${domain}`;
      const { cached, data } = SourceRuntime.freshCache(this, cacheKey, settings);
      if (data) return data;
      const backoff = SourceRuntime.backoffFallback(this, cacheKey, cached);
      if (backoff) return backoff;

      let scripts = [];
      try {
        const html = await this._fetchSearch(domain);
        scripts = this._parseSearchResults(html);
      } catch(err) {
        return SourceRuntime.staleOrThrow(this, cacheKey, cached, err);
      }

      const filtered = this._filter(scripts, domain);
      return SourceRuntime.saveCache(this, cacheKey, filtered);
    }

    _fetchSearch(domain) {
      return this._fetch(`${this.baseUrl}/?q=${encodeURIComponent(domain)}&orderBy=updated&orderDir=desc`);
    }

    _fetch(url) {
      return SourceRuntime.requestText(url, {
        source: SourceRuntime.label(this),
        headers: { Accept: "text/html,application/xhtml+xml" },
        notFound: ""
      });
    }

    _parseSearchResults(html) {
      if (!html || typeof DOMParser !== "function") return [];
      const doc = new DOMParser().parseFromString(html, "text/html");
      const rows = Array.from(doc.querySelectorAll("tbody tr.tr-link"));
      const seen = new Set();

      return rows.map(row => this._normalizeRow(row)).filter(script => {
        if (!script || seen.has(script.url)) return false;
        seen.add(script.url);
        return true;
      }).slice(0, 100);
    }

    _normalizeRow(row) {
      const link = row.querySelector('a.tr-link-a[href^="/scripts/"]') ||
        row.querySelector('a[href^="/scripts/"]');
      if (!link) return null;

      const pagePath = link.getAttribute("href");
      const cells = Array.from(row.querySelectorAll("td"));
      const infoCell = cells[0] || row;
      const authorLink = infoCell.querySelector('span.inline-block a[href^="/users/"]') ||
        infoCell.querySelector('a[href^="/users/"]');
      const versionEl = infoCell.querySelector(".script-version");
      const descEl = infoCell.querySelector("p");
      const updatedEl = row.querySelector("time[datetime]");
      const authorFromPath = this._decodePathSegment(pagePath.split("/")[2]);
      const installPath = pagePath.replace(/^\/scripts\//, "/install/") + ".user.js";

      return {
        _source: "openuserjs",
        name: this._cleanText(link.textContent) || "Untitled",
        description: this._cleanText(descEl?.textContent) || "",
        url: this.baseUrl + pagePath,
        code_url: this.baseUrl + installPath,
        version: this._cleanText(versionEl?.textContent) || null,
        license: null,
        users: [{ name: this._cleanText(authorLink?.textContent) || authorFromPath || null }],
        daily_installs: null,
        total_installs: this._parseNumber(cells[1]?.textContent),
        good_ratings: this._parseNumber(cells[2]?.textContent),
        fan_score: null,
        code_updated_at: updatedEl?.getAttribute("datetime") || null,
        created_at: null,
        _full_name: pagePath.replace(/^\/scripts\//, ""),
        _topics: []
      };
    }

    _filter(scripts) {
      return scripts.slice(0, 100);
    }

    _parseNumber(text) {
      const cleaned = String(text || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
      return cleaned ? Number(cleaned[0]) : null;
    }

    _decodePathSegment(segment) {
      if (!segment) return null;
      try { return decodeURIComponent(segment.replace(/\+/g, "%20")); }
      catch { return segment; }
    }

    _cleanText(text) { return String(text || "").replace(/\s+/g, " ").trim(); }

    getDirectSearchUrl(domain) {
      return `${this.baseUrl}/?q=${encodeURIComponent(domain)}`;
    }
  }

  // Chrome Web Store has no public search API; parse embedded extension result records.
  class ChromeWebStoreService {
    constructor() {
      this.serviceName = "chromewebstore";
      this.baseUrl = "https://chromewebstore.google.com";
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      let extensions = await this._searchWithDomain(host, settings);
      if (extensions.length === 0) {
        const root = HostService.extractRootDomain(host);
        if (root !== host) extensions = await this._searchWithDomain(root, settings);
      }
      return extensions;
    }

    async _searchWithDomain(domain, settings) {
      const cacheKey = `chromewebstore_${domain}`;
      const { cached, data } = SourceRuntime.freshCache(this, cacheKey, settings);
      if (data) return data;
      const backoff = SourceRuntime.backoffFallback(this, cacheKey, cached);
      if (backoff) return backoff;

      let extensions = [];
      try {
        const html = await this._fetchSearch(domain);
        extensions = this._parseSearchResults(html);
      } catch(err) {
        return SourceRuntime.staleOrThrow(this, cacheKey, cached, err);
      }

      return SourceRuntime.saveCache(this, cacheKey, extensions);
    }

    _fetchSearch(domain) {
      return this._fetch(this.getDirectSearchUrl(domain));
    }

    _fetch(url) {
      return SourceRuntime.requestText(url, {
        source: SourceRuntime.label(this),
        headers: { Accept: "text/html,application/xhtml+xml" },
        notFound: ""
      });
    }

    _parseSearchResults(html) {
      const records = this._extractExtensionRecords(html);
      return records.map(record => this._normalize(record)).filter(Boolean).slice(0, 25);
    }

    _extractExtensionRecords(html) {
      if (!html) return [];
      const records = [];
      const seen = new Set();
      const re = /\[\[\["([a-p]{32})",/g;
      let match;

      while ((match = re.exec(html)) && records.length < 30) {
        const start = match.index + 2;
        const text = this._extractBalancedArray(html, start);
        if (!text) continue;

        try {
          const record = JSON.parse(text);
          if (record?.[0] && !seen.has(record[0])) {
            seen.add(record[0]);
            records.push(record);
          }
        } catch { /* Ignore malformed embedded records. */ }
      }

      return records;
    }

    _extractBalancedArray(text, start) {
      let depth = 0;
      let inString = false;
      let escape = false;

      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
          if (escape) escape = false;
          else if (ch === "\\") escape = true;
          else if (ch === '"') inString = false;
          continue;
        }

        if (ch === '"') inString = true;
        else if (ch === "[") depth++;
        else if (ch === "]") {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }

      return null;
    }

    _normalize(record) {
      const id = record[0];
      const name = this._cleanText(record[2] || record[19]);
      if (!id || !name) return null;

      const manifest = this._parseManifest(record[18]);
      const updated = Array.isArray(record[17]) && Number.isFinite(record[17][0])
        ? new Date((record[17][0] * 1000) + Math.round((record[17][1] || 0) / 1000000)).toISOString()
        : null;

      return {
        _source: "chromewebstore",
        name,
        description: this._cleanText(record[6] || manifest.description) || "",
        url: `${this.baseUrl}/detail/${this._slugify(name)}/${id}`,
        code_url: null,
        version: manifest.version || null,
        license: null,
        users: [{ name: manifest.author || null }],
        daily_installs: null,
        total_installs: Number.isFinite(record[14]) ? record[14] : null,
        good_ratings: Number.isFinite(record[3]) ? record[3] : null,
        fan_score: null,
        code_updated_at: updated,
        created_at: null,
        _rating: Number.isFinite(record[3]) ? record[3] : null,
        _rating_count: Number.isFinite(record[4]) ? record[4] : null,
        _category: Array.isArray(record[11]) ? record[11][0] : null,
        _image: record[1] || null,
        _full_name: id,
        _topics: []
      };
    }

    _parseManifest(text) {
      if (!text) return {};
      try { return JSON.parse(text); }
      catch { return {}; }
    }

    _slugify(text) {
      return this._cleanText(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "extension";
    }

    _cleanText(text) { return String(text || "").replace(/\s+/g, " ").trim(); }

    getDirectSearchUrl(domain) {
      return `${this.baseUrl}/search/${encodeURIComponent(domain)}?hl=en`;
    }
  }

  class MozillaAddonsService {
    constructor() {
      this.serviceName = "mozillaaddons";
      this.baseUrl = "https://addons.mozilla.org";
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      let extensions = await this._searchWithDomain(host, settings);
      if (extensions.length === 0) {
        const root = HostService.extractRootDomain(host);
        if (root !== host) extensions = await this._searchWithDomain(root, settings);
      }
      return extensions;
    }

    async _searchWithDomain(domain, settings) {
      const cacheKey = `mozillaaddons_${domain}`;
      const { cached, data } = SourceRuntime.freshCache(this, cacheKey, settings);
      if (data) return data;
      const backoff = SourceRuntime.backoffFallback(this, cacheKey, cached);
      if (backoff) return backoff;

      let extensions = [];
      try {
        const data = await this._fetchSearch(domain);
        extensions = (data?.results || []).map(addon => this._normalize(addon)).filter(Boolean).slice(0, 25);
      } catch(err) {
        return SourceRuntime.staleOrThrow(this, cacheKey, cached, err);
      }

      return SourceRuntime.saveCache(this, cacheKey, extensions);
    }

    _fetchSearch(domain) {
      return this._fetch(`${this.baseUrl}/api/v5/addons/search/?q=${encodeURIComponent(domain)}&type=extension&page_size=25`);
    }

    _fetch(url) {
      return SourceRuntime.requestJson(url, {
        source: SourceRuntime.label(this),
        headers: { Accept: "application/json" },
        notFound: "{\"results\":[]}"
      });
    }

    _normalize(addon) {
      const name = this._localized(addon.name, addon.default_locale);
      if (!name || !addon.url) return null;

      const rating = Number(addon.ratings?.average);
      const ratingCount = Number(addon.ratings?.count);
      const users = Number(addon.average_daily_users);
      const weeklyDownloads = Number(addon.weekly_downloads);
      const author = addon.authors?.[0]?.name || addon.authors?.[0]?.username || null;
      const license = addon.current_version?.license;

      return {
        _source: "mozillaaddons",
        name,
        description: this._stripHtml(this._localized(addon.summary, addon.default_locale) || this._localized(addon.description, addon.default_locale)),
        url: addon.url,
        code_url: null,
        version: addon.current_version?.version || null,
        license: this._localized(license?.name, addon.default_locale) || license?.slug || null,
        users: [{ name: author }],
        daily_installs: null,
        total_installs: Number.isFinite(users) ? users : null,
        good_ratings: Number.isFinite(rating) ? rating : null,
        fan_score: null,
        code_updated_at: addon.last_updated || addon.current_version?.reviewed || null,
        created_at: addon.created || null,
        _rating: Number.isFinite(rating) ? rating : null,
        _rating_count: Number.isFinite(ratingCount) ? ratingCount : null,
        _weekly_downloads: Number.isFinite(weeklyDownloads) ? weeklyDownloads : null,
        _category: addon.categories?.[0] || null,
        _image: addon.icon_url || null,
        _full_name: addon.slug || String(addon.id || ""),
        _topics: [...(addon.tags || []), ...(addon.categories || [])]
      };
    }

    _localized(value, locale) {
      if (!value) return "";
      if (typeof value === "string") return value;
      return value["en-US"] || value[locale] || value[Object.keys(value)[0]] || "";
    }

    _stripHtml(value) {
      const doc = new DOMParser().parseFromString(String(value || ""), "text/html");
      return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
    }

    getDirectSearchUrl(domain) {
      return `${this.baseUrl}/en-US/firefox/search/?q=${encodeURIComponent(domain)}&type=extension`;
    }
  }

  // ── GitHub Script Service ───────────────────────────────────────────
  class GitHubScriptService {
    constructor() {
      this.serviceName = "github";
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      const cacheKey = `github_${host}`;
      const { cached, data } = SourceRuntime.freshCache(this, cacheKey, settings);
      if (data) return data;
      const backoff = SourceRuntime.backoffFallback(this, cacheKey, cached);
      if (backoff) return backoff;

      let results = [];
      const errors = [];
      const queries = [
        `${host} userscript`,
        `${host} tampermonkey`,
        `${host} greasemonkey`
      ];
      const seen = new Set();
      for (const q of queries) {
        try {
          const data = await this._fetchAPI(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}+language:javascript&sort=stars&per_page=20`
          );
          if (data?.items) {
            for (const repo of data.items) {
              if (!seen.has(repo.full_name)) {
                seen.add(repo.full_name);
                results.push(this._normalize(repo));
              }
            }
          }
        } catch(err) {
          errors.push(err);
          if (err?.kind === "rate-limit") break;
        }
      }

      if (!results.length && errors.length) return SourceRuntime.staleOrThrow(this, cacheKey, cached, errors[0]);

      const saved = SourceRuntime.saveCache(this, cacheKey, results);
      if (errors.length) return SourceRuntime.withStatus(saved, {
        type: "partial",
        title: "GitHub partially loaded",
        detail: `${errors.length} search ${errors.length === 1 ? "query" : "queries"} failed; showing successful repository matches.`,
        checkedAt: Date.now(),
        cachedAt: Date.now()
      });
      return saved;
    }

    _fetchAPI(url) {
      return SourceRuntime.requestJson(url, {
        source: SourceRuntime.label(this),
        headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "ScriptFinder/4" },
        notFound: "{\"items\":[]}"
      });
    }

    _normalize(repo) {
      return {
        _source: "github",
        name: repo.name,
        description: repo.description || "",
        url: repo.html_url,
        code_url: null,
        version: null,
        license: repo.license?.spdx_id || null,
        users: [{ name: repo.owner?.login }],
        daily_installs: null,
        total_installs: null,
        good_ratings: repo.stargazers_count || 0,
        fan_score: null,
        code_updated_at: repo.updated_at,
        created_at: repo.created_at,
        _stars: repo.stargazers_count || 0,
        _forks: repo.forks_count || 0,
        _language: repo.language,
        _topics: repo.topics || [],
        _owner: repo.owner?.login,
        _full_name: repo.full_name
      };
    }

    getDirectSearchUrl(domain) {
      return `https://github.com/search?q=${encodeURIComponent(domain + ' userscript')}&type=repositories&l=JavaScript`;
    }
  }

  // ── Toast Service ───────────────────────────────────────────────────
  class CatalogScriptService {
    constructor() {
      this.serviceName = "catalogs";
      this.awesomeUrl = "https://raw.githubusercontent.com/awesome-scripts/awesome-userscripts/master/README.md";
      this.tampermonkeyUrl = "https://www.tampermonkey.net/scripts.php?locale=en";
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      const domain = HostService.extractRootDomain(host);
      const cacheKey = `catalogs_${domain}`;
      const { cached, data } = SourceRuntime.freshCache(this, cacheKey, settings);
      if (data) return data;
      const backoff = SourceRuntime.backoffFallback(this, cacheKey, cached);
      if (backoff) return backoff;

      const results = [];
      const seen = new Set();
      const errors = [];
      try {
        const html = await this._fetchText(this.tampermonkeyUrl);
        for (const item of this._parseTampermonkeyCatalog(html, domain)) {
          if (!seen.has(item._full_name)) {
            seen.add(item._full_name);
            results.push(item);
          }
        }
      } catch(err) { errors.push(err); }

      try {
        const markdown = await this._fetchText(this.awesomeUrl);
        for (const item of this._parseAwesomeUserscripts(markdown, domain)) {
          if (!seen.has(item._full_name)) {
            seen.add(item._full_name);
            results.push(item);
          }
        }
      } catch(err) { errors.push(err); }

      if (!results.length && errors.length) return SourceRuntime.staleOrThrow(this, cacheKey, cached, errors[0]);

      const saved = SourceRuntime.saveCache(this, cacheKey, results);
      if (errors.length) return SourceRuntime.withStatus(saved, {
        type: "partial",
        title: "Catalogs partially loaded",
        detail: `${errors.length} catalog ${errors.length === 1 ? "source" : "sources"} failed; showing the catalog results that loaded.`,
        checkedAt: Date.now(),
        cachedAt: Date.now()
      });
      return saved;
    }

    _fetchText(url) {
      return SourceRuntime.requestText(url, {
        source: SourceRuntime.label(this),
        headers: { Accept: "text/plain,text/html,application/xhtml+xml" },
        notFound: ""
      });
    }

    _parseTampermonkeyCatalog(html, domain) {
      if (!html || !/userscript\.zone/i.test(html)) return [];
      const searchUrl = this._userscriptZoneUrl(domain);
      return [{
        _source: "catalogs",
        name: `Userscript.Zone search for ${domain}`,
        description: "Tampermonkey's catalog handoff for finding matching userscripts by domain, URL, or keyword.",
        url: searchUrl,
        code_url: null,
        version: null,
        license: null,
        users: [{ name: "Tampermonkey" }],
        daily_installs: null,
        total_installs: null,
        good_ratings: null,
        fan_score: null,
        code_updated_at: null,
        created_at: null,
        _catalog_source: "Tampermonkey",
        _category: "Search portal",
        _full_name: `tampermonkey/userscript-zone/${domain}`,
        _topics: ["tampermonkey", "userscript.zone", domain]
      }];
    }

    _parseAwesomeUserscripts(markdown, domain) {
      if (!markdown || typeof DOMParser !== "function") return [];
      const siteKey = this._siteKey(domain);
      const detailMatches = Array.from(markdown.matchAll(/<details\b[\s\S]*?<\/details>/gi));
      const results = [];

      for (const match of detailMatches) {
        const block = match[0];
        const category = this._categoryBefore(markdown, match.index || 0);
        const categoryMatch = this._textMatches(category, domain, siteKey);
        if (!categoryMatch && !this._strongAwesomeMatch(block, domain, siteKey)) continue;

        const item = this._normalizeAwesomeBlock(block, category, siteKey);
        if (item) results.push(item);
      }
      return results.slice(0, 80);
    }

    _normalizeAwesomeBlock(block, category, siteKey) {
      const doc = new DOMParser().parseFromString(`<div>${block}</div>`, "text/html");
      const summary = doc.querySelector("summary");
      const mainLink = summary?.querySelector("a[href]");
      if (!summary || !mainLink) return null;

      const name = this._cleanText(mainLink.textContent) || "Curated userscript";
      const summaryText = this._cleanText(summary.textContent);
      const description = this._descriptionFromSummary(summaryText, name);
      const installLink = Array.from(doc.querySelectorAll("a[href]")).find(link => {
        const href = link.getAttribute("href") || "";
        return /\.user\.js(?:[?#].*)?$/i.test(href) || /update\.greasyfork\.org\/scripts\//i.test(href);
      });
      const pageUrl = this._absoluteUrl(mainLink.getAttribute("href"));
      const installUrl = installLink ? this._absoluteUrl(installLink.getAttribute("href")) : null;
      const fullName = installUrl || pageUrl || `${category}/${name}`;

      return {
        _source: "catalogs",
        name,
        description,
        url: pageUrl,
        code_url: installUrl,
        version: null,
        license: null,
        users: [{ name: category ? `Awesome: ${category}` : "Awesome Userscripts" }],
        daily_installs: null,
        total_installs: null,
        good_ratings: null,
        fan_score: null,
        code_updated_at: null,
        created_at: null,
        _catalog_source: "Awesome Userscripts",
        _category: category || (siteKey ? siteKey[0].toUpperCase() + siteKey.slice(1) : "Curated"),
        _full_name: fullName,
        _topics: ["awesome", category, siteKey].filter(Boolean)
      };
    }

    _categoryBefore(markdown, index) {
      const before = markdown.slice(0, index);
      const headings = before.match(/^###\s+.*$/gmi);
      if (!headings?.length) return null;
      return this._cleanText(headings[headings.length - 1].replace(/^###\s+/, "").replace(/<[^>]*>/g, " "));
    }

    _strongAwesomeMatch(block, domain, siteKey) {
      const doc = new DOMParser().parseFromString(`<div>${block}</div>`, "text/html");
      const summaryTitle = this._cleanText(doc.querySelector("summary a[href]")?.textContent);
      const hrefs = Array.from(doc.querySelectorAll("a[href]")).map(link => link.getAttribute("href") || "").join(" ");
      return this._textMatches(`${summaryTitle} ${hrefs}`, domain, siteKey);
    }

    _textMatches(text, domain, siteKey) {
      const haystack = String(text || "").toLowerCase();
      return haystack.includes(String(domain || "").toLowerCase()) || (siteKey && haystack.includes(siteKey));
    }

    _descriptionFromSummary(summaryText, name) {
      const withoutName = summaryText.replace(name, "").replace(/^\s*[-–—]\s*/, "");
      return withoutName || "Curated userscript entry from Awesome Userscripts.";
    }

    _siteKey(domain) {
      const label = String(domain || "").split(".").find(part => part && !["www", "com", "net", "org", "io", "co"].includes(part));
      return label ? label.toLowerCase() : null;
    }

    _userscriptZoneUrl(domain) {
      return `https://www.userscript.zone/search?q=${encodeURIComponent(domain)}&utm_source=tm.net&utm_medium=search`;
    }

    _absoluteUrl(href) {
      try { return new URL(href, "https://github.com/awesome-scripts/awesome-userscripts/").href; }
      catch { return href || null; }
    }

    _cleanText(text) { return String(text || "").replace(/\s+/g, " ").trim(); }

    getDirectSearchUrl(domain) {
      return this._userscriptZoneUrl(domain);
    }
  }

  class GitHubGistService {
    constructor() {
      this.serviceName = "githubgist";
      this.baseUrl = "https://gist.github.com";
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      let scripts = await this._searchWithDomain(host, settings);
      if (scripts.length === 0) {
        const root = HostService.extractRootDomain(host);
        if (root !== host) scripts = await this._searchWithDomain(root, settings);
      }
      return scripts;
    }

    async _searchWithDomain(domain, settings) {
      const cacheKey = `githubgist_${domain}`;
      const { cached, data } = SourceRuntime.freshCache(this, cacheKey, settings);
      if (data) return data;
      const backoff = SourceRuntime.backoffFallback(this, cacheKey, cached);
      if (backoff) return backoff;

      const queries = [
        `${domain} userscript`,
        `${domain} tampermonkey`,
        `${domain} greasemonkey`
      ];
      const results = [];
      const seen = new Set();
      const errors = [];

      for (const query of queries) {
        try {
          const html = await this._fetchSearch(query);
          for (const script of this._parseSearchResults(html)) {
            const key = script._full_name;
            if (!seen.has(key)) {
              seen.add(key);
              results.push(script);
            }
          }
        } catch(err) {
          errors.push(err);
          if (err?.kind === "rate-limit") break;
        }
      }

      if (!results.length && errors.length) return SourceRuntime.staleOrThrow(this, cacheKey, cached, errors[0]);

      const saved = SourceRuntime.saveCache(this, cacheKey, results);
      if (errors.length) return SourceRuntime.withStatus(saved, {
        type: "partial",
        title: "GitHub Gists partially loaded",
        detail: `${errors.length} gist search ${errors.length === 1 ? "query" : "queries"} failed; showing successful gist matches.`,
        checkedAt: Date.now(),
        cachedAt: Date.now()
      });
      return saved;
    }

    _fetchSearch(query) {
      return this._fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    }

    _fetch(url) {
      return SourceRuntime.requestText(url, {
        source: SourceRuntime.label(this),
        headers: { Accept: "text/html,application/xhtml+xml" },
        notFound: ""
      });
    }

    _parseSearchResults(html) {
      if (!html || typeof DOMParser !== "function") return [];
      const doc = new DOMParser().parseFromString(html, "text/html");
      const snippets = Array.from(doc.querySelectorAll(".gist-snippet"));
      const seen = new Set();

      return snippets.map(snippet => this._normalizeSnippet(snippet)).filter(script => {
        if (!script || seen.has(script._full_name)) return false;
        seen.add(script._full_name);
        return true;
      }).slice(0, 100);
    }

    _normalizeSnippet(snippet) {
      const fileLink = Array.from(snippet.querySelectorAll('a[href]')).find(link => {
        const href = link.getAttribute("href") || "";
        return /^\/[^/]+\/[a-f0-9]{32}$/i.test(href) && link.querySelector(".css-truncate-target");
      });
      if (!fileLink) return null;

      const path = fileLink.getAttribute("href");
      const match = path.match(/^\/([^/]+)\/([a-f0-9]{32})$/i);
      if (!match) return null;

      const owner = this._decodePathSegment(match[1]);
      const id = match[2];
      const fileName = this._cleanText(fileLink.querySelector(".css-truncate-target")?.textContent) || id;
      const updatedEl = snippet.querySelector("relative-time[datetime]");
      const descEl = snippet.querySelector(".gist-snippet-meta span.f6.color-fg-muted");
      const fileCount = this._parseStat(snippet, /files?/i);
      const description = this._cleanText(descEl?.textContent) ||
        this._extractMetadata(snippet, "description") ||
        `${this._fileLabel(fileCount)} on GitHub Gist`;
      const isUserScript = /\.user\.js$/i.test(fileName);

      return {
        _source: "githubgist",
        name: fileName,
        description,
        url: this.baseUrl + path,
        code_url: isUserScript ? this._rawUrl(owner, id, fileName) : null,
        version: this._extractMetadata(snippet, "version"),
        license: null,
        users: [{ name: owner }],
        daily_installs: null,
        total_installs: null,
        good_ratings: this._parseStat(snippet, /stars?/i),
        fan_score: null,
        code_updated_at: updatedEl?.getAttribute("datetime") || null,
        created_at: null,
        _stars: this._parseStat(snippet, /stars?/i),
        _forks: this._parseStat(snippet, /forks?/i),
        _comments: this._parseStat(snippet, /comments?/i),
        _files: fileCount,
        _owner: owner,
        _full_name: `${owner}/${id}`,
        _topics: [fileName, "gist"].filter(Boolean)
      };
    }

    _extractMetadata(snippet, key) {
      const matcher = new RegExp(`@${key}\\s+([^\\n\\r<]+)`, "i");
      const text = Array.from(snippet.querySelectorAll(".blob-code-inner, .blob-code"))
        .map(el => this._cleanText(el.textContent))
        .join("\n");
      const match = text.match(matcher);
      return match ? this._cleanText(match[1]) : null;
    }

    _parseStat(snippet, labelPattern) {
      const stat = Array.from(snippet.querySelectorAll(".gist-snippet-meta li")).find(li =>
        labelPattern.test(this._cleanText(li.textContent))
      );
      return this._parseNumber(stat?.textContent);
    }

    _parseNumber(text) {
      const match = String(text || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*([kKmM])?/);
      if (!match) return null;
      const multiplier = match[2]?.toLowerCase() === "m" ? 1000000 : match[2]?.toLowerCase() === "k" ? 1000 : 1;
      return Number(match[1]) * multiplier;
    }

    _fileLabel(count) {
      if (!count) return "Gist";
      return `${count} ${count === 1 ? "file" : "files"}`;
    }

    _rawUrl(owner, id, fileName) {
      return `https://gist.githubusercontent.com/${encodeURIComponent(owner)}/${id}/raw/${encodeURIComponent(fileName)}`;
    }

    _decodePathSegment(segment) {
      if (!segment) return null;
      try { return decodeURIComponent(segment.replace(/\+/g, "%20")); }
      catch { return segment; }
    }

    _cleanText(text) { return String(text || "").replace(/\s+/g, " ").trim(); }

    getDirectSearchUrl(domain) {
      return `${this.baseUrl}/search?q=${encodeURIComponent(domain + ' userscript')}`;
    }
  }

  if (typeof window !== "undefined" && window.__SF_TEST_HOOKS__) {
    Object.assign(window.__SF_TEST_HOOKS__, {
      ScriptService,
      OpenUserJSScriptService,
      ChromeWebStoreService,
      MozillaAddonsService,
      GitHubScriptService,
      CatalogScriptService,
      GitHubGistService,
      reputationScore,
      normalizedRating,
      looksEnglish
    });
  }

  class ToastService {
    constructor(shadowRoot) { this.root = shadowRoot; this.el = null; this.timer = null; this.undoCallback = null; }

    show(message, undoCallback = null) {
      this.hide();
      this.undoCallback = undoCallback;
      this.el = document.createElement("div");
      this.el.className = "sf-toast";

      const msgSpan = document.createElement("span");
      msgSpan.textContent = message;
      this.el.appendChild(msgSpan);

      if (undoCallback) {
        const btn = document.createElement("button");
        btn.className = "sf-toast-undo";
        btn.textContent = "Undo";
        btn.addEventListener("click", () => { undoCallback(); this.hide(); });
        this.el.appendChild(btn);
      }

      this.root.appendChild(this.el);
      requestAnimationFrame(() => requestAnimationFrame(() => this.el.classList.add("show")));
      this.timer = setTimeout(() => this.hide(), undoCallback ? 5000 : 3000);
    }

    hide() {
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      if (this.el) {
        this.el.classList.remove("show");
        const old = this.el;
        setTimeout(() => old.remove(), 350);
        this.el = null;
      }
    }
  }

  // ── CSS ─────────────────────────────────────────────────────────────
  const CSS = `
/* ── HOST ── */
:host {
  all: initial !important;
  display: block !important;
  position: fixed !important;
  bottom: 0 !important;
  right: 0 !important;
  z-index: 2147483647 !important;
  font-family: -apple-system,BlinkMacSystemFont,system-ui,sans-serif !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
  overflow: visible !important;
}

/* ── ANIMATIONS ── */
@keyframes sfSpin { to { transform: rotate(360deg); } }
@keyframes sfSlideUp {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes sfFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sfShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes sfModalIn {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes sfModalOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(10px) scale(0.97); }
}

/* ── TOAST ── */
.sf-toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-20px);
  background: ${THEME.surface1}; color: ${THEME.text};
  padding: 12px 20px; border-radius: 12px; font: 600 13px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  box-shadow: 0 12px 40px ${THEME.shadow}; border: 1px solid ${THEME.glassBorder};
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  opacity: 0; transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
  z-index: 2147483647; pointer-events: auto; display: flex; align-items: center; gap: 12px;
  max-width: 440px; width: max-content;
}
.sf-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.sf-toast-undo {
  background: ${THEME.green}; color: ${THEME.base}; border: none; padding: 4px 12px;
  border-radius: 6px; font: 700 12px/1 inherit; cursor: pointer;
  transition: all 0.15s ease; white-space: nowrap;
}
.sf-toast-undo:hover { filter: brightness(1.1); transform: scale(1.04); }

/* ── MODAL ── */
.sf-modal {
  position: fixed; bottom: 14px; right: 14px; width: min(500px, calc(100vw - 24px));
  max-height: min(84vh, 800px);
  background: ${THEME.base}; border-radius: 16px;
  border: 1px solid ${THEME.glassBorder};
  box-shadow: 0 32px 80px ${THEME.shadow}, 0 0 0 1px rgba(255,255,255,0.02);
  overflow: hidden; display: flex; flex-direction: column;
  opacity: 0; pointer-events: none;
  transform: translateY(10px) scale(0.97);
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.sf-modal.visible {
  opacity: 1; pointer-events: auto; transform: translateY(0) scale(1);
}

/* Header */
.sf-modal-header {
  padding: 16px 20px; position: relative;
  background: linear-gradient(180deg, ${THEME.surface0} 0%, ${THEME.base} 100%);
  border-bottom: 1px solid ${THEME.glassBorder};
}
.sf-modal-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, ${THEME.green}, ${THEME.teal});
  transition: background 0.3s ease;
}
.sf-modal-header.sleazyfork::before { background: linear-gradient(90deg, ${THEME.purple}, ${THEME.mauve}); }
.sf-modal-header.openuserjs::before { background: linear-gradient(90deg, ${THEME.openuserjsDim}, ${THEME.openuserjs}); }
.sf-modal-header.chromewebstore::before { background: linear-gradient(90deg, ${THEME.chromewebstoreDim}, ${THEME.chromewebstore}); }
.sf-modal-header.mozillaaddons::before { background: linear-gradient(90deg, ${THEME.mozillaaddonsDim}, ${THEME.mozillaaddons}); }
.sf-modal-header.catalogs::before { background: linear-gradient(90deg, ${THEME.catalogsDim}, ${THEME.catalogs}); }
.sf-modal-header.githubgist::before { background: linear-gradient(90deg, ${THEME.githubgistDim}, ${THEME.githubgist}); }
.sf-modal-header.github::before { background: linear-gradient(90deg, ${THEME.github}, ${THEME.peach}); }

.sf-header-row { display: flex; align-items: center; gap: 12px; }
.sf-header-left { flex: 1; min-width: 0; }
.sf-modal-title {
  font: 700 16px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  color: ${THEME.text}; margin: 0 0 4px 0; letter-spacing: -0.3px;
  background: linear-gradient(90deg, ${THEME.text}, ${THEME.subtext1}, ${THEME.text});
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  animation: sfShimmer 4s linear infinite;
}
.sf-modal-subtitle {
  font: 600 12px/1 inherit; color: ${THEME.subtext0}; margin: 0;
  display: flex; align-items: center; gap: 6px;
}
.sf-subtitle-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 6px;
  background: ${THEME.surface2}; border-radius: 6px;
  font: 700 11px/1 inherit; color: ${THEME.text};
}

.sf-header-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${THEME.glassBorder};
  cursor: pointer; background: ${THEME.surface1}; color: ${THEME.subtext0};
  display: grid; place-items: center; transition: all 0.2s ease; flex-shrink: 0;
}
.sf-header-btn:hover { background: ${THEME.surface2}; color: ${THEME.text}; transform: scale(1.06); }
.sf-header-btn:active { transform: scale(0.94); }
.sf-header-btn svg { width: 14px; height: 14px; }

/* Search bar */
.sf-search-wrap {
  padding: 0 20px 12px; background: transparent; margin-top: -2px;
}
.sf-search-box {
  display: flex; align-items: center; gap: 8px;
  background: ${THEME.surface0}; border: 1px solid ${THEME.glassBorder};
  border-radius: 10px; padding: 0 12px; height: 36px;
  transition: all 0.2s ease;
}
.sf-search-box:focus-within { border-color: ${THEME.green}33; box-shadow: 0 0 0 3px ${THEME.green}11; }
.sf-search-box.sleazyfork:focus-within { border-color: ${THEME.purple}33; box-shadow: 0 0 0 3px ${THEME.purple}11; }
.sf-search-box.openuserjs:focus-within { border-color: ${THEME.openuserjs}33; box-shadow: 0 0 0 3px ${THEME.openuserjs}11; }
.sf-search-box.chromewebstore:focus-within { border-color: ${THEME.chromewebstore}44; box-shadow: 0 0 0 3px ${THEME.chromewebstore}11; }
.sf-search-box.mozillaaddons:focus-within { border-color: ${THEME.mozillaaddons}44; box-shadow: 0 0 0 3px ${THEME.mozillaaddons}11; }
.sf-search-box.catalogs:focus-within { border-color: ${THEME.catalogs}44; box-shadow: 0 0 0 3px ${THEME.catalogs}11; }
.sf-search-box.githubgist:focus-within { border-color: ${THEME.githubgist}44; box-shadow: 0 0 0 3px ${THEME.githubgist}11; }
.sf-search-box.github:focus-within { border-color: ${THEME.github}33; box-shadow: 0 0 0 3px ${THEME.github}11; }
.sf-search-box svg { width: 14px; height: 14px; color: ${THEME.overlay}; flex-shrink: 0; }
.sf-search-input {
  flex: 1; border: none; background: transparent; outline: none;
  font: 500 13px/1 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  color: ${THEME.text}; padding: 0;
}
.sf-search-input::placeholder { color: ${THEME.overlay}; }
.sf-search-count { font: 600 11px/1 inherit; color: ${THEME.overlay}; white-space: nowrap; }

/* Tabs */
.sf-tabs {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px;
  padding: 10px 20px; background: ${THEME.surface0}44;
  border-bottom: 1px solid ${THEME.glassBorder};
}
.sf-tab {
  padding: 9px 10px; border: 1px solid ${THEME.glassBorder}; border-radius: 8px;
  cursor: pointer; background: ${THEME.surface0}; font: 600 12px/1 inherit;
  color: ${THEME.subtext0}; transition: all 0.2s ease; position: relative;
  text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sf-tab:hover { background: ${THEME.surface1}; color: ${THEME.text}; }
.sf-tab[data-health-label]:not([data-health-label=""]) { padding-right: 42px; }
.sf-tab[data-health-label]:not([data-health-label=""])::after {
  content: attr(data-health-label); position: absolute; top: 3px; right: 5px;
  font: 800 8px/1 inherit; letter-spacing: 0; opacity: 0.9;
}
.sf-tab.health-ok::after { color: ${THEME.green}; }
.sf-tab.health-cached::after, .sf-tab.health-stale::after, .sf-tab.health-partial::after { color: ${THEME.yellow}; }
.sf-tab.health-rate-limited::after, .sf-tab.health-failed::after { color: ${THEME.red}; }
.sf-tab.active {
  background: linear-gradient(135deg, ${THEME.greenDim}, ${THEME.green}33);
  color: ${THEME.green}; border-color: ${THEME.green}33;
  box-shadow: 0 0 16px ${THEME.glow};
}
.sf-tab.sleazyfork.active {
  background: linear-gradient(135deg, ${THEME.purpleDim}44, ${THEME.purple}22);
  color: ${THEME.purple}; border-color: ${THEME.purple}33;
  box-shadow: 0 0 16px ${THEME.glowPurple};
}
.sf-tab.openuserjs.active {
  background: linear-gradient(135deg, ${THEME.openuserjsDim}44, ${THEME.openuserjs}22);
  color: ${THEME.openuserjs}; border-color: ${THEME.openuserjs}33;
  box-shadow: 0 0 16px ${THEME.glowOpenUserJS};
}
.sf-tab.chromewebstore.active {
  background: linear-gradient(135deg, ${THEME.chromewebstoreDim}44, ${THEME.chromewebstore}22);
  color: ${THEME.chromewebstore}; border-color: ${THEME.chromewebstore}44;
  box-shadow: 0 0 16px ${THEME.glowChromeWebStore};
}
.sf-tab.mozillaaddons.active {
  background: linear-gradient(135deg, ${THEME.mozillaaddonsDim}44, ${THEME.mozillaaddons}22);
  color: ${THEME.mozillaaddons}; border-color: ${THEME.mozillaaddons}44;
  box-shadow: 0 0 16px ${THEME.glowMozillaAddons};
}
.sf-tab.catalogs.active {
  background: linear-gradient(135deg, ${THEME.catalogsDim}44, ${THEME.catalogs}22);
  color: ${THEME.catalogs}; border-color: ${THEME.catalogs}44;
  box-shadow: 0 0 16px ${THEME.glowCatalogs};
}
.sf-tab.githubgist.active {
  background: linear-gradient(135deg, ${THEME.githubgistDim}44, ${THEME.githubgist}22);
  color: ${THEME.githubgist}; border-color: ${THEME.githubgist}44;
  box-shadow: 0 0 16px ${THEME.glowGitHubGist};
}
.sf-tab.github.active {
  background: linear-gradient(135deg, ${THEME.githubDim}44, ${THEME.github}22);
  color: ${THEME.github}; border-color: ${THEME.github}33;
  box-shadow: 0 0 16px ${THEME.glowGithub};
}

/* Sort bar */
.sf-sort-bar {
  padding: 10px 20px; background: ${THEME.surface0}22;
  border-bottom: 1px solid ${THEME.glassBorder};
  display: flex; align-items: center; gap: 10px;
}
.sf-filter-bar {
  padding: 10px 20px; background: ${THEME.surface0}18;
  border-bottom: 1px solid ${THEME.glassBorder};
  display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center; gap: 8px;
}
.sf-sort-label { font: 600 12px/1 inherit; color: ${THEME.subtext0}; flex-shrink: 0; }
.sf-sort-select {
  flex: 1; padding: 7px 10px; border-radius: 8px;
  border: 1px solid ${THEME.glassBorder}; background: ${THEME.surface0};
  color: ${THEME.text}; font: 500 12px/1 inherit; cursor: pointer; outline: none;
  transition: border-color 0.2s ease;
}
.sf-filter-select, .sf-filter-toggle {
  min-width: 0; padding: 7px 9px; border-radius: 8px;
  border: 1px solid ${THEME.glassBorder}; background: ${THEME.surface0};
  color: ${THEME.text}; font: 600 11px/1 inherit; cursor: pointer; outline: none;
}
.sf-filter-toggle.active {
  background: ${THEME.green}22; color: ${THEME.green}; border-color: ${THEME.green}44;
}
.sf-sort-select option { background: ${THEME.surface1}; color: ${THEME.text}; }
.sf-filter-select option { background: ${THEME.surface1}; color: ${THEME.text}; }
.sf-sort-select:focus { border-color: ${THEME.green}44; }
.sf-sort-select.sleazyfork:focus { border-color: ${THEME.purple}44; }
.sf-sort-select.openuserjs:focus { border-color: ${THEME.openuserjs}44; }
.sf-sort-select.chromewebstore:focus { border-color: ${THEME.chromewebstore}44; }
.sf-sort-select.mozillaaddons:focus { border-color: ${THEME.mozillaaddons}44; }
.sf-sort-select.catalogs:focus { border-color: ${THEME.catalogs}44; }
.sf-sort-select.githubgist:focus { border-color: ${THEME.githubgist}44; }
.sf-sort-select.github:focus { border-color: ${THEME.github}44; }

/* Content */
.sf-content {
  flex: 1; overflow-y: auto; background: ${THEME.base};
  scrollbar-width: thin; scrollbar-color: ${THEME.surface2} transparent;
}
.sf-content::-webkit-scrollbar { width: 6px; }
.sf-content::-webkit-scrollbar-track { background: transparent; }
.sf-content::-webkit-scrollbar-thumb { background: ${THEME.surface2}; border-radius: 3px; }
.sf-content::-webkit-scrollbar-thumb:hover { background: ${THEME.overlay0}; }

/* Script items */
.sf-item {
  padding: 14px 20px; border-bottom: 1px solid ${THEME.glassBorder};
  cursor: pointer; position: relative; background: transparent;
  transition: all 0.2s ease;
  animation: sfFadeIn 0.3s ease both;
}
.sf-item:hover { background: ${THEME.glassHover}; transform: translateY(-1px); }
.sf-item:hover::after {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: linear-gradient(180deg, ${THEME.green}, ${THEME.teal});
}
.sf-item.sleazyfork:hover::after { background: linear-gradient(180deg, ${THEME.purple}, ${THEME.mauve}); }
.sf-item.openuserjs:hover::after { background: linear-gradient(180deg, ${THEME.openuserjsDim}, ${THEME.openuserjs}); }
.sf-item.chromewebstore:hover::after { background: linear-gradient(180deg, ${THEME.chromewebstoreDim}, ${THEME.chromewebstore}); }
.sf-item.mozillaaddons:hover::after { background: linear-gradient(180deg, ${THEME.mozillaaddonsDim}, ${THEME.mozillaaddons}); }
.sf-item.catalogs:hover::after { background: linear-gradient(180deg, ${THEME.catalogsDim}, ${THEME.catalogs}); }
.sf-item.githubgist:hover::after { background: linear-gradient(180deg, ${THEME.githubgistDim}, ${THEME.githubgist}); }
.sf-item.github:hover::after { background: linear-gradient(180deg, ${THEME.github}, ${THEME.peach}); }
.sf-item:last-child { border-bottom: none; }

/* Dense mode */
:host(.dense) .sf-item { padding: 10px 20px; }
:host(.dense) .sf-script-title { font-size: 13px; }
:host(.dense) .sf-script-desc { display: none; }
:host(.dense) .sf-script-meta { gap: 4px; }
:host(.dense) .sf-badge { padding: 3px 7px; font-size: 10px; }

.sf-script-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.sf-script-info { flex: 1; min-width: 0; }
.sf-script-title {
  display: block; text-decoration: none; color: ${THEME.text};
  font: 700 14px/1.4 inherit; transition: color 0.15s ease;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sf-script-title:hover { color: ${THEME.green}; }
.sf-item.sleazyfork .sf-script-title:hover { color: ${THEME.purple}; }
.sf-item.openuserjs .sf-script-title:hover { color: ${THEME.openuserjs}; }
.sf-item.chromewebstore .sf-script-title:hover { color: ${THEME.chromewebstore}; }
.sf-item.mozillaaddons .sf-script-title:hover { color: ${THEME.mozillaaddons}; }
.sf-item.catalogs .sf-script-title:hover { color: ${THEME.catalogs}; }
.sf-item.githubgist .sf-script-title:hover { color: ${THEME.githubgist}; }
.sf-item.github .sf-script-title:hover { color: ${THEME.github}; }

.sf-script-sub {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  font: 500 11px/1.2 inherit; color: ${THEME.overlay}; margin-top: 3px;
}
.sf-script-sub svg { width: 12px; height: 12px; margin-right: 2px; vertical-align: -1px; }
.sf-dot { opacity: 0.3; font-size: 8px; }

.sf-script-actions { flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
.sf-install-btn, .sf-preview-btn {
  flex-shrink: 0; display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border-radius: 8px; border: none;
  background: ${THEME.green}22; color: ${THEME.green};
  font: 700 11px/1 inherit; cursor: pointer;
  transition: all 0.2s ease; white-space: nowrap;
}
.sf-install-btn:hover, .sf-preview-btn:hover { background: ${THEME.green}44; transform: scale(1.04); }
.sf-install-btn:active, .sf-preview-btn:active { transform: scale(0.96); }
.sf-install-btn svg, .sf-preview-btn svg { width: 14px; height: 14px; }
.sf-item.sleazyfork .sf-install-btn { background: ${THEME.purple}22; color: ${THEME.purple}; }
.sf-item.sleazyfork .sf-install-btn:hover { background: ${THEME.purple}44; }
.sf-item.openuserjs .sf-install-btn { background: ${THEME.openuserjs}22; color: ${THEME.openuserjs}; }
.sf-item.openuserjs .sf-install-btn:hover { background: ${THEME.openuserjs}44; }
.sf-item.chromewebstore .sf-install-btn { background: ${THEME.chromewebstore}22; color: ${THEME.chromewebstore}; }
.sf-item.chromewebstore .sf-install-btn:hover { background: ${THEME.chromewebstore}44; }
.sf-item.mozillaaddons .sf-install-btn { background: ${THEME.mozillaaddons}22; color: ${THEME.mozillaaddons}; }
.sf-item.mozillaaddons .sf-install-btn:hover { background: ${THEME.mozillaaddons}44; }
.sf-item.catalogs .sf-install-btn { background: ${THEME.catalogs}22; color: ${THEME.catalogs}; }
.sf-item.catalogs .sf-install-btn:hover { background: ${THEME.catalogs}44; }
.sf-item.githubgist .sf-install-btn { background: ${THEME.githubgist}22; color: ${THEME.githubgist}; }
.sf-item.githubgist .sf-install-btn:hover { background: ${THEME.githubgist}44; }
.sf-item.github .sf-install-btn { background: ${THEME.github}22; color: ${THEME.github}; }
.sf-item.github .sf-install-btn:hover { background: ${THEME.github}44; }
.sf-preview-btn { background: ${THEME.surface1}; color: ${THEME.subtext1}; border: 1px solid ${THEME.glassBorder}; }
.sf-preview-btn:hover { background: ${THEME.surface2}; color: ${THEME.text}; }
.sf-match-preview {
  margin-top: 10px; padding: 10px 12px; border-radius: 8px;
  background: ${THEME.surface0}; border: 1px solid ${THEME.glassBorder};
  color: ${THEME.subtext1}; font: 500 11px/1.45 inherit;
}
.sf-match-preview.hidden { display: none; }
.sf-match-preview.good { border-color: ${THEME.green}33; color: ${THEME.green}; }
.sf-match-preview.warn { border-color: ${THEME.yellow}33; color: ${THEME.yellow}; }
.sf-match-preview.bad { border-color: ${THEME.red}33; color: ${THEME.red}; }
.sf-match-preview-title { font-weight: 800; margin-bottom: 4px; color: ${THEME.text}; }
.sf-match-preview code { color: ${THEME.subtext1}; word-break: break-all; }
.sf-install-warning {
  margin-top: 8px; color: ${THEME.yellow}; font: 700 11px/1.4 inherit;
}

.sf-script-desc {
  color: ${THEME.subtext0}; font: 400 12px/1.5 inherit;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; margin-bottom: 8px;
}
.sf-script-meta { display: flex; flex-wrap: wrap; gap: 5px; }
.sf-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-radius: 6px; font: 700 10px/1 inherit;
  background: ${THEME.surface1}; color: ${THEME.subtext1};
  border: 1px solid ${THEME.glassBorder}; transition: all 0.15s ease;
}
.sf-badge svg { width: 12px; height: 12px; }
.sf-badge:hover { background: ${THEME.surface2}; border-color: ${THEME.overlay0}; }
.sf-badge.score-high { background: ${THEME.green}18; color: ${THEME.green}; border-color: ${THEME.green}33; }
.sf-badge.score-mid { background: ${THEME.yellow}18; color: ${THEME.yellow}; border-color: ${THEME.yellow}33; }
.sf-badge.score-low { background: ${THEME.red}18; color: ${THEME.red}; border-color: ${THEME.red}33; }

/* Loading / empty / error */
.sf-loading { padding: 50px 20px; text-align: center; display: grid; gap: 14px; place-items: center; }
.sf-spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid ${THEME.surface2}; border-top-color: ${THEME.green};
  animation: sfSpin 0.7s linear infinite;
}
.sf-spinner.sleazyfork { border-top-color: ${THEME.purple}; }
.sf-spinner.openuserjs { border-top-color: ${THEME.openuserjs}; }
.sf-spinner.chromewebstore { border-top-color: ${THEME.chromewebstore}; }
.sf-spinner.mozillaaddons { border-top-color: ${THEME.mozillaaddons}; }
.sf-spinner.catalogs { border-top-color: ${THEME.catalogs}; }
.sf-spinner.githubgist { border-top-color: ${THEME.githubgist}; }
.sf-spinner.github { border-top-color: ${THEME.github}; }
.sf-loading-text { font: 500 13px/1 inherit; color: ${THEME.subtext0}; }

.sf-empty, .sf-error { padding: 50px 28px; text-align: center; }
.sf-empty-title, .sf-error-title { font: 700 15px/1.3 inherit; color: ${THEME.text}; margin-bottom: 8px; }
.sf-error-title { color: ${THEME.red}; }
.sf-empty-text, .sf-error-text { color: ${THEME.subtext0}; font: 400 13px/1.5 inherit; margin-bottom: 18px; }
.sf-source-notice {
  margin: 12px 20px; padding: 12px 14px; border-radius: 10px;
  background: ${THEME.surface0}; border: 1px solid ${THEME.glassBorder};
  color: ${THEME.subtext1}; font: 500 12px/1.45 inherit;
}
.sf-source-notice.warn { border-color: ${THEME.yellow}44; color: ${THEME.yellow}; }
.sf-source-notice.bad { border-color: ${THEME.red}44; color: ${THEME.red}; }
.sf-source-notice-title { color: ${THEME.text}; font-weight: 800; margin-bottom: 4px; }
.sf-source-notice a { color: inherit; font-weight: 800; text-decoration: underline; }
.sf-error-actions { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
.sf-action-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 18px; border-radius: 10px;
  background: linear-gradient(135deg, ${THEME.greenDim}, ${THEME.green}88);
  color: ${THEME.base}; font: 700 13px/1 inherit; border: none;
  cursor: pointer; transition: all 0.2s ease; text-decoration: none;
}
.sf-action-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
.sf-action-btn.sleazyfork { background: linear-gradient(135deg, ${THEME.purpleDim}, ${THEME.purple}88); }
.sf-action-btn.openuserjs { background: linear-gradient(135deg, ${THEME.openuserjsDim}, ${THEME.openuserjs}88); }
.sf-action-btn.chromewebstore { background: linear-gradient(135deg, ${THEME.chromewebstoreDim}, ${THEME.chromewebstore}88); }
.sf-action-btn.mozillaaddons { background: linear-gradient(135deg, ${THEME.mozillaaddonsDim}, ${THEME.mozillaaddons}88); }
.sf-action-btn.catalogs { background: linear-gradient(135deg, ${THEME.catalogsDim}, ${THEME.catalogs}88); }
.sf-action-btn.githubgist { background: linear-gradient(135deg, ${THEME.githubgistDim}, ${THEME.githubgist}88); }
.sf-action-btn.github { background: linear-gradient(135deg, ${THEME.githubDim}, ${THEME.github}88); }

/* Footer */
.sf-footer {
  padding: 12px 20px; border-top: 1px solid ${THEME.glassBorder};
  background: ${THEME.surface0}44;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  font: 600 11px/1 inherit;
}
.sf-footer-text { color: ${THEME.overlay}; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-width: 0; }
.sf-footer a { color: ${THEME.green}; text-decoration: none; font-weight: 700; }
.sf-footer a:hover { text-decoration: underline; }
.sf-footer a.sleazyfork { color: ${THEME.purple}; }
.sf-footer a.openuserjs { color: ${THEME.openuserjs}; }
.sf-footer a.chromewebstore { color: ${THEME.chromewebstore}; }
.sf-footer a.mozillaaddons { color: ${THEME.mozillaaddons}; }
.sf-footer a.catalogs { color: ${THEME.catalogs}; }
.sf-footer a.githubgist { color: ${THEME.githubgist}; }
.sf-footer a.github { color: ${THEME.github}; }
.sf-health-pill {
  display: inline-flex; align-items: center; padding: 3px 7px; border-radius: 6px;
  background: ${THEME.surface1}; color: ${THEME.subtext1}; border: 1px solid ${THEME.glassBorder};
  font: 800 10px/1 inherit; white-space: nowrap;
}
.sf-health-pill.ok { color: ${THEME.green}; border-color: ${THEME.green}33; }
.sf-health-pill.cached, .sf-health-pill.stale, .sf-health-pill.partial { color: ${THEME.yellow}; border-color: ${THEME.yellow}33; }
.sf-health-pill.rate-limited, .sf-health-pill.failed { color: ${THEME.red}; border-color: ${THEME.red}33; }
.sf-diagnostics-btn {
  border: 1px solid ${THEME.glassBorder}; background: ${THEME.surface1}; color: ${THEME.subtext1};
  border-radius: 7px; padding: 5px 9px; font: 800 10px/1 inherit; cursor: pointer; flex-shrink: 0;
}
.sf-diagnostics-btn:hover { color: ${THEME.text}; background: ${THEME.surface2}; }

/* Settings panel */
.sf-settings {
  display: none; padding: 16px 20px; border-top: 1px solid ${THEME.glassBorder};
  background: ${THEME.surface0}44;
}
.sf-settings.visible {
  display: block; max-height: min(36vh, 330px); overflow-y: auto; flex-shrink: 0;
}
.sf-settings::-webkit-scrollbar { width: 6px; }
.sf-settings::-webkit-scrollbar-track { background: transparent; }
.sf-settings::-webkit-scrollbar-thumb { background: ${THEME.surface2}; border-radius: 3px; }
.sf-settings-title { font: 700 13px/1 inherit; color: ${THEME.text}; margin-bottom: 12px; }
.sf-settings-subtitle {
  font: 800 10px/1 inherit; color: ${THEME.overlay}; text-transform: uppercase;
  margin: 14px 0 6px; letter-spacing: 0;
}
.sf-setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid ${THEME.glassBorder};
}
.sf-setting-block {
  display: grid; gap: 8px; padding: 8px 0; border-bottom: 1px solid ${THEME.glassBorder};
}
.sf-source-setting-row { padding: 6px 0; }
.sf-setting-row:last-child { border-bottom: none; }
.sf-setting-label { font: 500 12px/1.3 inherit; color: ${THEME.subtext1}; }
.sf-setting-help { color: ${THEME.overlay}; font: 500 11px/1.35 inherit; }
.sf-setting-textarea {
  min-height: 64px; resize: vertical; padding: 8px 9px; border-radius: 7px;
  border: 1px solid ${THEME.glassBorder}; background: ${THEME.surface0};
  color: ${THEME.text}; font: 500 12px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace;
  outline: none;
}
.sf-setting-mini-btn {
  border: 1px solid ${THEME.glassBorder}; background: ${THEME.surface1};
  color: ${THEME.subtext1}; border-radius: 7px; padding: 6px 10px;
  font: 800 10px/1 inherit; cursor: pointer;
}
.sf-setting-mini-btn:hover { color: ${THEME.text}; background: ${THEME.surface2}; }
.sf-toggle {
  position: relative; width: 36px; height: 20px; border-radius: 10px;
  background: ${THEME.surface2}; cursor: pointer; transition: background 0.2s ease;
  border: none; padding: 0;
}
.sf-toggle::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: ${THEME.subtext0}; transition: all 0.2s ease;
}
.sf-toggle.on { background: ${THEME.green}55; }
.sf-toggle.on::after { left: 18px; background: ${THEME.green}; }
.sf-setting-select {
  padding: 4px 8px; border-radius: 6px; border: 1px solid ${THEME.glassBorder};
  background: ${THEME.surface0}; color: ${THEME.text}; font: 500 12px/1 inherit;
  cursor: pointer; outline: none;
}
.sf-setting-select option { background: ${THEME.surface1}; }

/* Responsive */
@media (max-width: 520px) {
  .sf-modal { width: calc(100vw - 24px); right: 12px; max-height: min(88vh, 700px); }
  .sf-modal-header { padding: 14px 16px; }
  .sf-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 8px 16px; }
  .sf-sort-bar, .sf-search-wrap { padding-left: 16px; padding-right: 16px; }
  .sf-filter-bar { grid-template-columns: 1fr 1fr; padding-left: 16px; padding-right: 16px; }
  .sf-filter-bar .sf-sort-label { display: none; }
  .sf-item { padding: 12px 16px; }
  .sf-footer { padding: 10px 16px; flex-wrap: wrap; justify-content: center; }
}
  `;

  // ── Main Controller ─────────────────────────────────────────────────
  class ScriptFinder {
    constructor() {
      this.settings = new SettingsService();
      this.services = {
        greasyfork: new ScriptService("https://greasyfork.org", "greasyfork"),
        sleazyfork: new ScriptService("https://sleazyfork.org", "sleazyfork"),
        openuserjs: new OpenUserJSScriptService(),
        chromewebstore: new ChromeWebStoreService(),
        mozillaaddons: new MozillaAddonsService(),
        catalogs: new CatalogScriptService(),
        githubgist: new GitHubGistService(),
        github: new GitHubScriptService()
      };
      this.currentService = this._firstEnabledSource(this.settings.get("lastService") || "greasyfork");
      this.currentSort = this.settings.get("defaultSort");
      this.filters = { updatedMonths: "any", minRating: "any", englishOnly: false };
      this.currentDomain = HostService.getCurrentHost();
      this.isOpen = false;
      this.isLoading = false;
      this.allScripts = [];
      this.sourceStatus = null;
      this.sourceHealth = {};
      this.searchQuery = "";
      this.settingsOpen = false;
      this.previousFocus = null;
      this.uiBuilt = false;
    }

    init() {
      this._setupMenuCommands();
    }

    _ensureUI() {
      if (this.uiBuilt) return;
      this._buildUI();
      this._setupEvents();
      this.uiBuilt = true;
    }

    _serviceClass(serviceName) {
      return serviceName === "greasyfork" ? "" : serviceName;
    }

    _isSourceEnabled(serviceName) {
      return this.settings.get("sources")?.[serviceName] !== false;
    }

    _enabledSourceNames() {
      return SOURCE_ORDER.filter(source => this.services[source] && this._isSourceEnabled(source));
    }

    _currentHostBlock() {
      return HostService.sensitiveHostMatch(HostService.getCurrentHost(), this.settings);
    }

    _currentHostOverridden() {
      return HostService.isHostOverridden(HostService.getCurrentHost(), this.settings);
    }

    _firstEnabledSource(preferred = null) {
      if (preferred && this.services[preferred] && this._isSourceEnabled(preferred)) return preferred;
      return this._enabledSourceNames()[0] || "greasyfork";
    }

    _ensureCurrentSource() {
      const next = this._firstEnabledSource(this.currentService);
      if (next !== this.currentService) {
        this.currentService = next;
        this.settings.set("lastService", next);
      }
      return next;
    }

    _tabsHtml() {
      if (this._currentHostBlock()) return "";
      this._ensureCurrentSource();
      return this._enabledSourceNames().map(source => {
        const active = source === this.currentService;
        const cls = ["sf-tab", this._serviceClass(source), active ? "active" : ""].filter(Boolean).join(" ");
        return `<button class="${cls}" role="tab" aria-selected="${active}" data-service="${source}">${escapeHtml(SOURCE_META[source].tab)}</button>`;
      }).join("");
    }

    _sourceSettingsHtml() {
      return SOURCE_ORDER.map(source => {
        const enabled = this._isSourceEnabled(source);
        return `
          <div class="sf-setting-row sf-source-setting-row">
            <span class="sf-setting-label">${escapeHtml(SOURCE_META[source].label)}</span>
            <button class="sf-toggle sf-source-toggle ${enabled ? 'on' : ''}" data-source="${source}" aria-label="Enable ${escapeHtml(SOURCE_META[source].label)} source" aria-pressed="${enabled}"></button>
          </div>
        `;
      }).join("");
    }

    _privacySettingsHtml() {
      const protectedHost = this._currentHostBlock();
      const overridden = this._currentHostOverridden();
      const host = HostService.getCurrentHost() || "this host";
      const overrideLabel = overridden ? "Block this host again" : "Allow this host";
      const overrideHelp = protectedHost
        ? `Blocked by ${protectedHost.pattern}. Allowing this host enables source menus and searches here only.`
        : (overridden ? "This host is currently allowed even if it matches a sensitive-host rule." : "Current host does not match the sensitive-host rules.");
      return `
        <div class="sf-settings-subtitle">Host privacy</div>
        <div class="sf-setting-row">
          <span class="sf-setting-label">Sensitive host protection</span>
          <button class="sf-toggle ${this.settings.get('sensitiveHostProtection') ? 'on' : ''}" data-key="sensitiveHostProtection" aria-label="Sensitive host protection" aria-pressed="${this.settings.get('sensitiveHostProtection') ? 'true' : 'false'}"></button>
        </div>
        <div class="sf-setting-block">
          <label class="sf-setting-label" for="sf-sensitive-hosts">Extra blocked hosts</label>
          <textarea id="sf-sensitive-hosts" class="sf-setting-textarea" data-key="sensitiveHostPatterns" spellcheck="false" placeholder="example.com&#10;*.admin.example.com">${escapeHtml(this.settings.get('sensitiveHostPatterns') || '')}</textarea>
          <div class="sf-setting-help">One host or wildcard pattern per line. Built-in rules already cover banks, government, identity, admin, and local network hosts.</div>
        </div>
        <div class="sf-setting-row">
          <span class="sf-setting-label">${escapeHtml(host)}</span>
          <button class="sf-setting-mini-btn sf-host-override-btn" type="button">${escapeHtml(overrideLabel)}</button>
        </div>
        <div class="sf-setting-help sf-host-override-help">${escapeHtml(overrideHelp)}</div>
      `;
    }

    _renderTabs() {
      if (!this.modal) return;
      const tabs = this.modal.querySelector(".sf-tabs");
      if (tabs) _safeHTML(tabs, this._tabsHtml());
    }

    _syncSourceControls() {
      if (!this.modal) return;
      this.modal.querySelectorAll(".sf-source-toggle").forEach(btn => {
        const enabled = this._isSourceEnabled(btn.dataset.source);
        btn.classList.toggle("on", enabled);
        btn.setAttribute("aria-pressed", String(enabled));
      });
    }

    _setSourceEnabled(source, enabled) {
      if (!SOURCE_META[source]) return;
      const sources = { ...this.settings.get("sources"), [source]: enabled };
      if (!SOURCE_ORDER.some(name => sources[name])) {
        this.toast?.show("At least one source must stay enabled");
        this._syncSourceControls();
        return;
      }
      this.settings.set("sources", sources);
      let shouldLoad = false;
      if (!enabled && source === this.currentService) {
        this.currentService = this._firstEnabledSource();
        this.settings.set("lastService", this.currentService);
        shouldLoad = this.isOpen;
      }
      this._renderTabs();
      this._syncSourceControls();
      this._setupMenuCommands();
      this._updateTabs();
      if (shouldLoad) this._loadScripts();
    }

    _setCurrentHostOverride(allowed) {
      const host = HostService.normalizeHost(HostService.getCurrentHost());
      if (!host) return;
      const overrides = new Set(this.settings.get("sensitiveHostOverrides") || []);
      if (allowed) overrides.add(host);
      else overrides.delete(host);
      this.settings.set("sensitiveHostOverrides", [...overrides]);
      this._syncHostPrivacyControls();
      this._refreshHostProtection();
    }

    _syncHostPrivacyControls() {
      if (!this.modal) return;
      const protection = this.settings.get("sensitiveHostProtection") !== false;
      const protectionBtn = this.modal.querySelector('.sf-toggle[data-key="sensitiveHostProtection"]');
      if (protectionBtn) {
        protectionBtn.classList.toggle("on", protection);
        protectionBtn.setAttribute("aria-pressed", String(protection));
      }
      const block = this._currentHostBlock();
      const overridden = this._currentHostOverridden();
      const btn = this.modal.querySelector(".sf-host-override-btn");
      if (btn) btn.textContent = overridden ? "Block this host again" : "Allow this host";
      const help = this.modal.querySelector(".sf-host-override-help");
      if (help) {
        help.textContent = block
          ? `Blocked by ${block.pattern}. Allowing this host enables source menus and searches here only.`
          : (overridden ? "This host is currently allowed even if it matches a sensitive-host rule." : "Current host does not match the sensitive-host rules.");
      }
    }

    _refreshHostProtection() {
      this._setupMenuCommands();
      this._renderTabs();
      this._updateTabs();
      if (this.isOpen) this._loadScripts();
    }

    // ── UI Build ────────────────────────────────────────────────────
    _buildUI() {
      this.host = document.createElement("div");
      this.shadow = this.host.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = CSS;
      this.shadow.appendChild(style);

      this.toast = new ToastService(this.shadow);

      // Modal
      this.modal = document.createElement("div");
      this.modal.className = "sf-modal";
      this.modal.setAttribute("role", "dialog");
      this.modal.setAttribute("aria-modal", "true");
      this.modal.setAttribute("aria-labelledby", "sf-modal-title");
      this.modal.setAttribute("aria-describedby", "sf-modal-subtitle");
      this.modal.setAttribute("tabindex", "-1");
      _safeHTML(this.modal, `
        <div class="sf-modal-header">
          <div class="sf-header-row">
            <div class="sf-header-left">
              <h2 class="sf-modal-title" id="sf-modal-title">Scripts for this site</h2>
              <p class="sf-modal-subtitle" id="sf-modal-subtitle" aria-live="polite">
                <span class="sf-subtitle-count">0</span>
                <span class="sf-subtitle-text">scripts found</span>
              </p>
            </div>
            <button class="sf-header-btn sf-btn-settings" title="Settings" aria-label="Settings">${getIcon('gear')}</button>
            <button class="sf-header-btn sf-btn-close" title="Close" aria-label="Close">${getIcon('x')}</button>
          </div>
        </div>
        <div class="sf-search-wrap">
          <div class="sf-search-box">
            ${getIcon('search')}
            <input class="sf-search-input" type="text" placeholder="Filter scripts..." spellcheck="false" aria-label="Filter results" />
            <span class="sf-search-count"></span>
          </div>
        </div>
        <div class="sf-tabs" role="tablist" aria-label="Result sources">
          ${this._tabsHtml()}
        </div>
        <div class="sf-sort-bar">
          <span class="sf-sort-label">Sort by</span>
          <select class="sf-sort-select" aria-label="Sort results">
            <option value="daily">Daily installs</option>
            <option value="total">Total installs</option>
            <option value="good">Ratings</option>
            <option value="fanscore">Fan score</option>
            <option value="authorrep">Author reputation</option>
            <option value="updatedate">Last update</option>
            <option value="createdate">Created</option>
          </select>
        </div>
        <div class="sf-filter-bar">
          <span class="sf-sort-label">Filters</span>
          <select class="sf-filter-select" data-filter="updatedMonths" title="Updated within" aria-label="Updated within">
            <option value="any">Any update</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
          <select class="sf-filter-select" data-filter="minRating" title="Minimum rating" aria-label="Minimum rating">
            <option value="any">Any rating</option>
            <option value="3">3+ rating</option>
            <option value="4">4+ rating</option>
            <option value="4.5">4.5+ rating</option>
          </select>
          <button class="sf-filter-toggle" data-filter="englishOnly" title="English-looking names and descriptions" aria-label="Toggle English-looking filter" aria-pressed="false">English</button>
        </div>
        <div class="sf-content" aria-live="polite" aria-busy="false">
          <div class="sf-loading">
            <div class="sf-spinner"></div>
            <div class="sf-loading-text">Searching...</div>
          </div>
        </div>
        <div class="sf-settings">
          <div class="sf-settings-title">Settings</div>
          <div class="sf-setting-row">
            <span class="sf-setting-label">Dense mode</span>
            <button class="sf-toggle ${this.settings.get('denseMode') ? 'on' : ''}" data-key="denseMode"></button>
          </div>
          <div class="sf-setting-row">
            <span class="sf-setting-label">Default sort</span>
            <select class="sf-setting-select" data-key="defaultSort">
              <option value="daily" ${this.settings.get('defaultSort')==='daily'?'selected':''}>Daily installs</option>
              <option value="total" ${this.settings.get('defaultSort')==='total'?'selected':''}>Total installs</option>
              <option value="good" ${this.settings.get('defaultSort')==='good'?'selected':''}>Ratings</option>
              <option value="fanscore" ${this.settings.get('defaultSort')==='fanscore'?'selected':''}>Fan score</option>
              <option value="authorrep" ${this.settings.get('defaultSort')==='authorrep'?'selected':''}>Author reputation</option>
              <option value="updatedate" ${this.settings.get('defaultSort')==='updatedate'?'selected':''}>Last update</option>
              <option value="createdate" ${this.settings.get('defaultSort')==='createdate'?'selected':''}>Created</option>
            </select>
          </div>
          <div class="sf-setting-row">
            <span class="sf-setting-label">Cache (minutes)</span>
            <select class="sf-setting-select" data-key="cacheDuration">
              <option value="60000" ${this.settings.get('cacheDuration')===60000?'selected':''}>1</option>
              <option value="300000" ${this.settings.get('cacheDuration')===300000?'selected':''}>5</option>
              <option value="600000" ${this.settings.get('cacheDuration')===600000?'selected':''}>10</option>
              <option value="1800000" ${this.settings.get('cacheDuration')===1800000?'selected':''}>30</option>
            </select>
          </div>
          ${this._privacySettingsHtml()}
          <div class="sf-settings-subtitle">Sources</div>
          ${this._sourceSettingsHtml()}
        </div>
        <div class="sf-footer">
          <div class="sf-footer-text">Data from <a href="https://greasyfork.org" target="_blank">GreasyFork</a><span class="sf-health-pill">Not checked</span></div>
          <button class="sf-diagnostics-btn" type="button" title="Copy source diagnostics" aria-label="Copy source diagnostics">Diagnostics</button>
        </div>
      `);
      this.shadow.appendChild(this.modal);

      // Refs
      this.content = this.modal.querySelector(".sf-content");
      this.searchInput = this.modal.querySelector(".sf-search-input");
      this.searchCount = this.modal.querySelector(".sf-search-count");
      this.searchBox = this.modal.querySelector(".sf-search-box");
      this.sortSelect = this.modal.querySelector(".sf-sort-select");
      this.filterBar = this.modal.querySelector(".sf-filter-bar");

      if (this.settings.get("denseMode")) this.host.classList.add("dense");

      document.body.appendChild(this.host);
    }

    // ── Events ──────────────────────────────────────────────────────
    _setupEvents() {
      // Modal buttons
      this.modal.querySelector(".sf-btn-close").addEventListener("click", () => this._close());
      this.modal.querySelector(".sf-btn-settings").addEventListener("click", () => this._toggleSettings());
      this.modal.querySelector(".sf-diagnostics-btn").addEventListener("click", () => this._copyDiagnostics());

      // Tabs
      this.modal.querySelector(".sf-tabs").addEventListener("click", e => {
        const tab = e.target.closest(".sf-tab");
        if (!tab) return;
        const svc = tab.dataset.service;
        if (svc !== this.currentService && this._isSourceEnabled(svc)) {
          this.currentService = svc;
          this.settings.set("lastService", svc);
          this._updateTabs();
          this._loadScripts();
        }
      });

      // Sort
      this.sortSelect.addEventListener("change", e => {
        this.currentSort = e.target.value;
        this._displayScripts();
      });

      this.modal.querySelectorAll(".sf-filter-select").forEach(sel => {
        sel.addEventListener("change", () => {
          this.filters[sel.dataset.filter] = sel.value;
          this._displayScripts();
        });
      });

      this.modal.querySelector(".sf-filter-toggle").addEventListener("click", e => {
        this.filters.englishOnly = !this.filters.englishOnly;
        e.currentTarget.classList.toggle("active", this.filters.englishOnly);
        e.currentTarget.setAttribute("aria-pressed", String(this.filters.englishOnly));
        this._displayScripts();
      });

      // Search filter
      this.searchInput.addEventListener("input", e => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this._displayScripts();
      });

      // Settings toggles
      this.modal.querySelectorAll(".sf-toggle[data-key]").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          const val = !this.settings.get(key);
          this.settings.set(key, val);
          btn.classList.toggle("on", val);
          btn.setAttribute("aria-pressed", String(val));
          if (key === "denseMode") this.host.classList.toggle("dense", val);
          if (key === "sensitiveHostProtection") this._refreshHostProtection();
        });
      });

      this.modal.querySelectorAll(".sf-source-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
          this._setSourceEnabled(btn.dataset.source, !this._isSourceEnabled(btn.dataset.source));
        });
      });

      this.modal.querySelector(".sf-setting-textarea[data-key='sensitiveHostPatterns']")?.addEventListener("change", e => {
        this.settings.set("sensitiveHostPatterns", e.target.value);
        this._syncHostPrivacyControls();
        this._refreshHostProtection();
      });

      this.modal.querySelector(".sf-host-override-btn")?.addEventListener("click", () => {
        this._setCurrentHostOverride(!this._currentHostOverridden());
      });

      // Settings selects
      this.modal.querySelectorAll(".sf-setting-select").forEach(sel => {
        sel.addEventListener("change", () => {
          const key = sel.dataset.key;
          let val = sel.value;
          if (key === "cacheDuration") val = parseInt(val);
          this.settings.set(key, val);
          if (key === "defaultSort") { this.currentSort = val; this.sortSelect.value = val; this._displayScripts(); }
        });
      });

      // Outside click / Escape
      document.addEventListener("click", e => { if (this.isOpen && !this.host.contains(e.target)) this._close(); });
      document.addEventListener("keydown", e => {
        if (!this.isOpen) return;
        if (e.key === "Escape") this._close();
        else if (e.key === "Tab") this._trapFocus(e);
      });
    }

    // ── Menu commands ───────────────────────────────────────────────
    _setupMenuCommands() {
      if (typeof GM_registerMenuCommand !== "function") return;
      if (window._sfMenuIds) window._sfMenuIds.forEach(id => { try { GM_unregisterMenuCommand(id); } catch {} });
      window._sfMenuIds = [];

      this._ensureCurrentSource();
      const domain = HostService.extractRootDomain(this.currentDomain);
      const hostBlock = this._currentHostBlock();

      if (hostBlock) {
        window._sfMenuIds.push(GM_registerMenuCommand(`Script Finder blocked on ${hostBlock.host} (Settings)`, () => {
          this._ensureUI();
          this._open();
        }));
        window._sfMenuIds.push(GM_registerMenuCommand("Reset Script Finder Settings", () => {
          GM_deleteValue("sf_settings_v4"); location.reload();
        }));
        return;
      }

      this._enabledSourceNames().forEach(source => {
        const meta = SOURCE_META[source];
        window._sfMenuIds.push(GM_registerMenuCommand(`Find ${meta.menuKind} for ${domain} (${meta.menuName})`, () => {
          this._ensureUI();
          if (this._isSourceEnabled(source)) this.currentService = source;
          this._open();
        }));
      });

      window._sfMenuIds.push(GM_registerMenuCommand("Reset Script Finder Settings", () => {
        GM_deleteValue("sf_settings_v4"); location.reload();
      }));
    }

    _focusableElements() {
      return Array.from(this.modal.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && el.getAttribute("aria-hidden") !== "true" && el.offsetParent !== null);
    }

    _trapFocus(event) {
      const focusable = this._focusableElements();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = this.shadow.activeElement || document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!focusable.includes(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    // ── Modal control ───────────────────────────────────────────────
    _open() {
      this.isOpen = true;
      this.previousFocus = document.activeElement;
      this._ensureCurrentSource();
      this._renderTabs();
      this._updateTabs();
      this._updateServiceColors();
      this.sortSelect.value = this.currentSort;
      this.modal.classList.add("visible");
      this.searchInput.value = "";
      this.searchQuery = "";
      requestAnimationFrame(() => this.searchInput.focus({ preventScroll: true }));
      const hostBlock = this._currentHostBlock();
      if (hostBlock) {
        this._showHostBlocked(hostBlock);
        return;
      }
      this._loadScripts();
    }

    _close() {
      this.isOpen = false;
      this.settingsOpen = false;
      this.modal.querySelector(".sf-settings").classList.remove("visible");
      this.modal.classList.remove("visible");
      if (this.previousFocus && typeof this.previousFocus.focus === "function") {
        this.previousFocus.focus({ preventScroll: true });
      }
    }

    _toggleSettings() {
      this.settingsOpen = !this.settingsOpen;
      this.modal.querySelector(".sf-settings").classList.toggle("visible", this.settingsOpen);
    }

    // ── Tab/color updates ───────────────────────────────────────────
    _updateTabs() {
      this.modal.querySelectorAll(".sf-tab").forEach(t => {
        const active = t.dataset.service === this.currentService;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", String(active));
      });
      this._updateServiceColors();
    }

    _updateServiceColors() {
      const svc = this.currentService;
      const svcNames = SOURCE_ORDER;
      const header = this.modal.querySelector(".sf-modal-header");
      svcNames.forEach(s => header.classList.toggle(s, s === svc));
      svcNames.forEach(s => this.sortSelect.classList.toggle(s, s === svc));
      svcNames.forEach(s => this.searchBox.classList.toggle(s, s === svc));

      const footerLink = this.modal.querySelector(".sf-footer a");
      if (footerLink) {
        svcNames.forEach(s => footerLink.classList.toggle(s, s === svc));
        footerLink.textContent = SOURCE_META[svc]?.label || svc;
        footerLink.href = SOURCE_META[svc]?.footerUrl || "#";
      }
      this._updateHealthUi();
    }

    _setResultCount(count) {
      const countEl = this.modal.querySelector(".sf-subtitle-count");
      const textEl = this.modal.querySelector(".sf-subtitle-text");
      const unit = SOURCE_META[this.currentService]?.unit || "script";
      if (countEl) countEl.textContent = count || 0;
      if (textEl) textEl.textContent = count === 1 ? `${unit} found` : `${unit}s found`;
    }

    _sourceNoticeHtml() {
      if (!this.sourceStatus) return "";
      const status = this.sourceStatus;
      const cls = status.type === "stale" || status.type === "partial" ? "warn" : "bad";
      const directUrl = this.services[this.currentService].getDirectSearchUrl(this.currentDomain);
      return `
        <div class="sf-source-notice ${cls}">
          <div class="sf-source-notice-title">${escapeHtml(status.title || "Source status")}</div>
          <div>${escapeHtml(status.detail || "The source returned a degraded result.")} <a href="${escapeHtml(directUrl)}" target="_blank">Search manually</a></div>
        </div>
      `;
    }

    _sourceErrorTitle(err, label) {
      if (err?.kind === "rate-limit") return `${label} rate limit`;
      if (err?.kind === "timeout") return `${label} timed out`;
      if (err?.kind === "backoff") return `${label} is backing off`;
      if (err?.kind === "parse") return `${label} changed its response`;
      return `${label} unavailable`;
    }

    _showHostBlocked(hostBlock) {
      const host = hostBlock?.host || HostService.getCurrentHost() || "this host";
      this.allScripts = [];
      this.sourceStatus = null;
      this._setResultCount(0);
      this.content.setAttribute("aria-busy", "false");
      _safeHTML(this.content, `
        <div class="sf-empty sf-host-blocked">
          <div class="sf-empty-title">Search disabled on sensitive host</div>
          <div class="sf-empty-text">No source requests will run on <strong>${escapeHtml(host)}</strong>. Matched rule: ${escapeHtml(hostBlock?.pattern || "sensitive host")}.</div>
          <div class="sf-error-actions">
            <button class="sf-action-btn sf-host-allow-btn" type="button">Allow this host</button>
            <button class="sf-action-btn sf-host-settings-btn" type="button">Settings</button>
          </div>
        </div>
      `);
      this.content.querySelector(".sf-host-allow-btn")?.addEventListener("click", () => this._setCurrentHostOverride(true));
      this.content.querySelector(".sf-host-settings-btn")?.addEventListener("click", () => {
        this.settingsOpen = true;
        this.modal.querySelector(".sf-settings").classList.add("visible");
      });
      this._syncHostPrivacyControls();
    }

    _recordSourceHealth(serviceName, health) {
      const normalized = {
        type: health?.type || "ok",
        title: health?.title || "Source checked",
        detail: health?.detail || "",
        checkedAt: health?.checkedAt || Date.now(),
        cachedAt: health?.cachedAt || null
      };
      if (normalized.type === "rate-limit") normalized.type = "rate-limited";
      this.sourceHealth[serviceName] = normalized;
      this._updateHealthUi();
    }

    _healthLabel(health) {
      const labels = {
        ok: "OK",
        cached: "CACHE",
        stale: "STALE",
        partial: "PARTIAL",
        "rate-limited": "RATE",
        failed: "FAIL"
      };
      return labels[health?.type] || "CHECK";
    }

    _healthClass(health) {
      return ["ok", "cached", "stale", "partial", "rate-limited", "failed"].includes(health?.type) ? health.type : "failed";
    }

    _healthTitle(serviceName, health) {
      if (!health) return "Source has not been checked yet.";
      const checked = new Date(health.checkedAt).toISOString();
      const cacheAge = health.cachedAt ? SourceRuntime.ageLabel(health.cachedAt) : "none";
      return `${SourceRuntime.sourceLabels[serviceName] || serviceName}: ${this._healthLabel(health)}. Last checked ${checked}. Cache age ${cacheAge}. ${health.detail || ""}`.trim();
    }

    _updateHealthUi() {
      if (!this.modal) return;
      this.modal.querySelectorAll(".sf-tab").forEach(tab => {
        const health = this.sourceHealth[tab.dataset.service];
        ["ok", "cached", "stale", "partial", "rate-limited", "failed"].forEach(cls => tab.classList.remove(`health-${cls}`));
        tab.dataset.healthLabel = health ? this._healthLabel(health) : "";
        if (health) tab.classList.add(`health-${this._healthClass(health)}`);
        tab.title = this._healthTitle(tab.dataset.service, health);
      });

      const health = this.sourceHealth[this.currentService];
      const pill = this.modal.querySelector(".sf-health-pill");
      if (pill) {
        const cls = health ? this._healthClass(health) : "";
        pill.className = `sf-health-pill ${cls}`;
        pill.textContent = health ? `${this._healthLabel(health)} ${SourceRuntime.ageLabel(health.checkedAt)}` : "Not checked";
        pill.title = this._healthTitle(this.currentService, health);
      }
    }

    _diagnosticString() {
      const health = this.sourceHealth[this.currentService] || { type: "unchecked", checkedAt: Date.now() };
      const rootHost = HostService.extractRootDomain(this.currentDomain || HostService.getCurrentHost());
      const cacheAge = health.cachedAt ? SourceRuntime.ageLabel(health.cachedAt) : "none";
      return [
        "UserScript Finder source diagnostic",
        `source=${this.currentService}`,
        `host=${rootHost}`,
        `status=${health.type}`,
        `checkedAt=${new Date(health.checkedAt).toISOString()}`,
        `cacheAge=${cacheAge}`,
        `resultCount=${Array.isArray(this.allScripts) ? this.allScripts.length : 0}`
      ].join("\n");
    }

    async _copyDiagnostics() {
      const diagnostic = this._diagnosticString();
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(diagnostic);
        this.toast.show("Diagnostics copied");
      } catch(err) {
        console.info("[Script Finder diagnostics]", diagnostic);
        this.toast.show("Diagnostics written to console");
      }
    }

    // ── Data ────────────────────────────────────────────────────────
    async _loadScripts() {
      const hostBlock = this._currentHostBlock();
      if (hostBlock) {
        this._showHostBlocked(hostBlock);
        return;
      }
      if (this.isLoading) return;
      this._ensureCurrentSource();
      if (!this._isSourceEnabled(this.currentService)) {
        this.allScripts = [];
        this.sourceStatus = null;
        this._setResultCount(0);
        _safeHTML(this.content, `<div class="sf-empty"><div class="sf-empty-title">Source disabled</div><div class="sf-empty-text">Enable this source in settings to search it.</div></div>`);
        return;
      }
      this.isLoading = true;
      const activeService = this.currentService;
      const svc = this.services[activeService];
      const svcClass = this._serviceClass(activeService);
      const svcLabel = SOURCE_META[activeService]?.label || "Source";

      this.content.setAttribute("aria-busy", "true");
      _safeHTML(this.content, `<div class="sf-loading"><div class="sf-spinner ${svcClass}"></div><div class="sf-loading-text">Searching ${svcLabel}...</div></div>`);

      try {
        const host = HostService.getCurrentHost();
        this.currentDomain = host;
        const scripts = await svc.searchScriptsByHost(this.currentDomain, this.settings);
        const activeHostBlock = this._currentHostBlock();
        if (activeHostBlock) {
          this._showHostBlocked(activeHostBlock);
          return;
        }
        if (activeService !== this.currentService || !this._isSourceEnabled(activeService)) return;
        this.allScripts = scripts;
        this.sourceStatus = this.allScripts?._sfStatus || null;
        this._recordSourceHealth(activeService, this.allScripts?._sfHealth || {
          type: "ok",
          title: `${svcLabel} loaded`,
          detail: "Fresh source results loaded.",
          checkedAt: Date.now()
        });
        this._setResultCount(this.allScripts.length);
        this._displayScripts();
      } catch(err) {
        if (activeService !== this.currentService || !this._isSourceEnabled(activeService)) return;
        this.sourceStatus = null;
        this.allScripts = [];
        this._recordSourceHealth(activeService, {
          type: err?.kind === "rate-limit" ? "rate-limited" : "failed",
          title: this._sourceErrorTitle(err, svcLabel),
          detail: err?.message || "Unknown error",
          checkedAt: Date.now()
        });
        this._setResultCount(0);
        const directUrl = svc.getDirectSearchUrl(this.currentDomain);
        _safeHTML(this.content, `
          <div class="sf-error">
            <div class="sf-error-title">${escapeHtml(this._sourceErrorTitle(err, svcLabel))}</div>
            <div class="sf-error-text">${escapeHtml(err?.message || 'Unknown error')}</div>
            <div class="sf-error-actions">
              <button class="sf-action-btn ${svcClass}">Try again</button>
              <a href="${escapeHtml(directUrl)}" target="_blank" class="sf-action-btn ${svcClass}">Search manually</a>
            </div>
          </div>
        `);
        this.content.querySelector(".sf-action-btn")?.addEventListener("click", () => this._loadScripts());
      } finally {
        this.isLoading = false;
        this.content.setAttribute("aria-busy", "false");
        if (this.isOpen && activeService !== this.currentService && this._isSourceEnabled(this.currentService)) this._loadScripts();
      }
    }

    _sortScripts(scripts) {
      const copy = [...scripts];
      switch (this.currentSort) {
        case "daily": return copy.sort((a,b) => (b.daily_installs || b.total_installs || b._stars || 0) - (a.daily_installs || a.total_installs || a._stars || 0));
        case "total": return copy.sort((a,b) => (b.total_installs || b._stars || 0) - (a.total_installs || a._stars || 0));
        case "good": return copy.sort((a,b) => (b.good_ratings || b._rating || 0) - (a.good_ratings || a._rating || 0));
        case "fanscore": return copy.sort((a,b) => (b.fan_score || b._forks || 0) - (a.fan_score || a._forks || 0));
        case "authorrep": return copy.sort((a,b) => reputationScore(b) - reputationScore(a));
        case "updatedate": return copy.sort((a,b) => new Date(b.code_updated_at||0) - new Date(a.code_updated_at||0));
        case "createdate": return copy.sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
        default: return copy.sort((a,b) => (b.daily_installs || b.total_installs || b._stars || 0) - (a.daily_installs || a.total_installs || a._stars || 0));
      }
    }

    _displayScripts() {
      let scripts = this.allScripts || [];
      const svcClass = this._serviceClass(this.currentService);
      const svcLabel = SOURCE_META[this.currentService]?.label || "Source";
      const displayHost = HostService.extractRootDomain(this.currentDomain);
      const noticeHtml = this._sourceNoticeHtml();

      // Update title
      const titleType = this.currentService === "catalogs" ? "Catalogs" : this.currentService === "githubgist" ? "Gists" : ["chromewebstore", "mozillaaddons"].includes(this.currentService) ? "Extensions" : "Scripts";
      this.modal.querySelector(".sf-modal-title").textContent = `${titleType} for ${displayHost}`;

      // Filter by search
      if (this.searchQuery) {
        scripts = scripts.filter(s =>
          (s.name || "").toLowerCase().includes(this.searchQuery) ||
          (s.description || "").toLowerCase().includes(this.searchQuery) ||
          (s.users?.[0]?.name || "").toLowerCase().includes(this.searchQuery) ||
          (s._full_name || "").toLowerCase().includes(this.searchQuery) ||
          (s._catalog_source || "").toLowerCase().includes(this.searchQuery) ||
          (s._category || "").toLowerCase().includes(this.searchQuery) ||
          (s._topics || []).some(t => t.toLowerCase().includes(this.searchQuery))
        );
      }
      scripts = this._applyFilters(scripts);
      const constrained = this.searchQuery || this._hasActiveFilters();
      this.searchCount.textContent = constrained ? `${scripts.length}/${this.allScripts.length}` : "";

      if (!scripts.length) {
        const directUrl = this.services[this.currentService].getDirectSearchUrl(this.currentDomain);
        if (this.searchQuery) {
          _safeHTML(this.content, `${noticeHtml}<div class="sf-empty"><div class="sf-empty-title">No matches</div><div class="sf-empty-text">No scripts match "${escapeHtml(this.searchQuery)}"</div></div>`);
        } else if (this._hasActiveFilters()) {
          _safeHTML(this.content, `${noticeHtml}<div class="sf-empty"><div class="sf-empty-title">No matches</div><div class="sf-empty-text">No scripts match the active filters.</div></div>`);
        } else {
          _safeHTML(this.content, `
            ${noticeHtml}
            <div class="sf-empty">
              <div class="sf-empty-title">No scripts found</div>
              <div class="sf-empty-text">Nothing matched <strong>${escapeHtml(displayHost)}</strong> on ${svcLabel}.</div>
              <a href="${escapeHtml(directUrl)}" target="_blank" class="sf-action-btn ${svcClass}">Search manually</a>
            </div>
          `);
        }
        this._setResultCount(this.allScripts.length);
        return;
      }

      const sorted = this._sortScripts(scripts);
      this._setResultCount(this.allScripts.length);

      // Build items
      _safeHTML(this.content, noticeHtml);
      sorted.forEach((script, i) => {
        const item = this._createScriptItem(script, svcClass, i);
        this.content.appendChild(item);
      });
    }

    _hasActiveFilters() {
      return this.filters.updatedMonths !== "any" || this.filters.minRating !== "any" || this.filters.englishOnly;
    }

    _applyFilters(scripts) {
      const updatedMonths = this.filters.updatedMonths;
      const minRating = this.filters.minRating;
      const cutoff = updatedMonths === "any" ? null : Date.now() - (Number(updatedMonths) * 30 * 24 * 60 * 60 * 1000);
      const ratingFloor = minRating === "any" ? null : Number(minRating);

      return scripts.filter(script => {
        if (cutoff) {
          const updated = new Date(script.code_updated_at || 0).getTime();
          if (!Number.isFinite(updated) || updated < cutoff) return false;
        }
        if (ratingFloor != null) {
          const rating = normalizedRating(script);
          if (rating == null || rating < ratingFloor) return false;
        }
        if (this.filters.englishOnly && !looksEnglish(script)) return false;
        return true;
      });
    }

    async _toggleMatchPreview(script, pane, button) {
      if (!pane.classList.contains("hidden")) {
        pane.classList.add("hidden");
        return;
      }

      pane.className = "sf-match-preview";
      _safeHTML(pane, `<div class="sf-match-preview-title">Checking match coverage...</div>`);
      button.disabled = true;

      try {
        if (!script._matchPreview) {
          const source = await this._fetchPreviewSource(script.code_url, script);
          script._matchPreview = this._parseMatchCoverage(source, HostService.getCurrentHost(), window.location.href);
        }
        const preview = script._matchPreview;
        pane.className = `sf-match-preview ${preview.status}`;
        _safeHTML(pane, `
          <div class="sf-match-preview-title">${escapeHtml(preview.title)}</div>
          <div>${escapeHtml(preview.detail)}</div>
          ${preview.patterns.length ? `<div>Metadata: ${preview.patterns.map(p => `<code>${escapeHtml(p)}</code>`).join(", ")}</div>` : ""}
        `);
      } catch(err) {
        pane.className = "sf-match-preview warn";
        _safeHTML(pane, `
          <div class="sf-match-preview-title">Coverage unavailable</div>
          <div>${escapeHtml(err?.message || "Could not load script metadata.")}</div>
        `);
      } finally {
        button.disabled = false;
      }
    }

    _fetchPreviewSource(url, script = null) {
      const validation = InstallSafety.validateInstallUrl(script || { _source: this.currentService }, url);
      if (!validation.ok) return Promise.reject(new Error(`Preview blocked: ${validation.reason}`));
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET", url: validation.url,
          headers: { Accept: "text/plain,*/*" },
          onload: r => {
            if (r.status >= 200 && r.status < 300) resolve(r.responseText || "");
            else reject(new Error(`Preview HTTP ${r.status}`));
          },
          onerror: reject
        });
      });
    }

    _parseMatchCoverage(source, host, currentUrl) {
      return MatchCoverage.evaluate(source, host, currentUrl);
    }

    _extractUserScriptMetadata(source) {
      return MatchCoverage.extractUserScriptMetadata(source);
    }

    _patternCoversHost(pattern, host, currentUrl) {
      return MatchCoverage.patternCoversUrl(pattern, currentUrl, String(pattern || "").includes("://") ? "match" : "include");
    }

    _hostMatchesPattern(host, pattern) {
      return MatchCoverage.hostMatchesPattern(host, pattern);
    }

    async _openInstallTarget(script, button) {
      const validation = InstallSafety.validateInstallUrl(script, button.dataset.url || script.code_url);
      if (!validation.ok) {
        this.toast.show(`Install blocked: ${validation.reason}`);
        return;
      }

      const oldHtml = button.innerHTML;
      button.disabled = true;
      button.textContent = "Checking...";
      try {
        const source = await this._fetchPreviewSource(validation.url, script);
        if (!InstallSafety.hasUserScriptMetadata(source)) {
          this.toast.show("Install blocked: .user.js metadata block missing.");
          return;
        }
        GM_openInTab(validation.url, { active: true });
      } catch(err) {
        this.toast.show(`Install check failed: ${err?.message || "could not load metadata"}`);
      } finally {
        button.disabled = false;
        _safeHTML(button, oldHtml);
      }
    }

    _createScriptItem(script, svcClass, index) {
      const item = document.createElement("div");
      item.className = `sf-item ${svcClass}`;
      item.style.animationDelay = `${Math.min(index * 30, 300)}ms`;

      const isGH = script._source === "github";
      const isCWS = script._source === "chromewebstore";
      const isAMO = script._source === "mozillaaddons";
      const isCatalog = script._source === "catalogs";
      const isGist = script._source === "githubgist";
      const daily = formatNumber(script.daily_installs);
      const total = formatNumber(script.total_installs);
      const good = formatNumber(script.good_ratings);
      const fanScore = script.fan_score != null ? Number(script.fan_score) : null;
      const fanText = Number.isFinite(fanScore) ? fanScore.toFixed(1) : null;
      const updated = relativeTime(script.code_updated_at);
      const created = relativeTime(script.created_at);
      const author = script.users?.[0]?.name || null;
      const baseUrls = { sleazyfork: "https://sleazyfork.org", greasyfork: "https://greasyfork.org", openuserjs: "https://openuserjs.org" };
      const scriptUrl = (isGH || isGist || isCatalog) ? script.url : (script.url?.startsWith("http") ? script.url : (baseUrls[svcClass] || baseUrls.greasyfork) + (script.url || ""));
      const installUrl = script.code_url || null;
      const installValidation = installUrl ? InstallSafety.validateInstallUrl(script, installUrl) : null;
      const safeInstallUrl = installValidation?.ok ? installValidation.url : null;
      const installWarning = installValidation && !installValidation.ok ? `Install blocked: ${installValidation.reason}` : "";

      const fanClass = fanScore >= 8 ? "score-high" : fanScore >= 6 ? "score-mid" : fanScore >= 0 ? "score-low" : "";

      const badge = (icon, text, title, cls = "") => {
        if (!text) return "";
        return `<span class="sf-badge ${cls}" title="${escapeHtml(title)}">${getIcon(icon)} ${escapeHtml(text)}</span>`;
      };

      // GitHub: show stars + forks; Chrome Web Store: show users + rating; script registries show install stats.
      let metaHtml;
      if (isGH) {
        const stars = formatNumber(script._stars);
        const forks = formatNumber(script._forks);
        const lang = script._language;
        metaHtml = `
          ${badge("star", stars, "Stars")}
          ${badge("gitFork", forks, "Forks")}
          ${lang ? badge("gitBranch", lang, "Language") : ""}
          ${badge("clockwise", updated, "Updated")}
          ${badge("calendarPlus", created, "Created")}
        `;
      } else if (isGist) {
        const stars = formatNumber(script._stars);
        const forks = formatNumber(script._forks);
        const files = script._files ? `${script._files} ${script._files === 1 ? "file" : "files"}` : null;
        metaHtml = `
          ${badge("gitBranch", files, "Files")}
          ${badge("star", stars, "Stars")}
          ${badge("gitFork", forks, "Forks")}
          ${badge("clockwise", updated, "Last active")}
        `;
      } else if (isCatalog) {
        metaHtml = `
          ${badge("search", script._catalog_source, "Catalog source")}
          ${badge("gitBranch", script._category, "Category")}
          ${badge("clockwise", updated, "Updated")}
        `;
      } else if (isCWS || isAMO) {
        const totalUsers = formatNumber(script.total_installs);
        const rating = script._rating != null ? Number(script._rating).toFixed(1) : null;
        const ratingCount = formatNumber(script._rating_count);
        metaHtml = `
          ${badge("chartBar", totalUsers, "Users")}
          ${badge("star", rating, "Average rating")}
          ${badge("user", ratingCount, "Rating count")}
          ${badge("clockwise", updated, "Updated")}
        `;
      } else {
        metaHtml = `
          ${badge("download", daily ? `${daily}/day` : null, "Daily installs")}
          ${badge("chartBar", total, "Total installs")}
          ${badge("star", good, "Ratings")}
          ${badge("flame", fanText, "Fan score", fanText ? fanClass : "")}
          ${badge("clockwise", updated, "Updated")}
          ${badge("calendarPlus", created, "Created")}
        `;
      }

      // Non-userscript sources get a "View" button; script registries get "Install".
      let actionBtn;
      if (isGH || isCWS || isAMO || !safeInstallUrl) {
        const icon = (isGH || isGist) ? "githubLogo" : "search";
        const title = isGH ? "View repository" : isGist ? "View gist" : isCatalog ? "Open catalog result" : isCWS || isAMO ? "View extension" : "View script page";
        actionBtn = `<button class="sf-install-btn" data-url="${escapeHtml(scriptUrl)}" title="${title}">${getIcon(icon)} View</button>`;
      } else if (safeInstallUrl) {
        actionBtn = `<button class="sf-install-btn" data-action="install" data-url="${escapeHtml(safeInstallUrl)}" title="Install script">${getIcon('install')} Install</button>`;
      } else {
        actionBtn = "";
      }
      const previewBtn = safeInstallUrl ? `<button class="sf-preview-btn" data-url="${escapeHtml(safeInstallUrl)}" title="Preview match coverage">${getIcon('search')} Coverage</button>` : "";
      const actionsHtml = actionBtn || previewBtn ? `<div class="sf-script-actions">${actionBtn}${previewBtn}</div>` : "";

      _safeHTML(item, `
        <div class="sf-script-top">
          <div class="sf-script-info">
            <a href="${escapeHtml(scriptUrl)}" target="_blank" class="sf-script-title" title="${escapeHtml(script.name || '')}">${escapeHtml(script.name || "Untitled")}</a>
            <div class="sf-script-sub">
              ${author ? `<span title="${isGH || isGist ? 'Owner' : isCatalog ? 'Catalog' : 'Author'}">${getIcon('user')} ${escapeHtml(author)}</span>` : ""}
              ${author && script.version ? `<span class="sf-dot">&bull;</span>` : ""}
              ${script.version ? `<span title="Version">${getIcon('gitBranch')} v${escapeHtml(script.version)}</span>` : ""}
              ${(author || script.version) && script.license ? `<span class="sf-dot">&bull;</span>` : ""}
              ${script.license ? `<span title="License">${getIcon('scales')} ${escapeHtml(script.license)}</span>` : ""}
            </div>
          </div>
          ${actionsHtml}
        </div>
        ${installWarning ? `<div class="sf-install-warning">${escapeHtml(installWarning)}</div>` : ""}
        <div class="sf-script-desc" title="${escapeHtml(script.description || '')}">${escapeHtml(script.description || "No description")}</div>
        <div class="sf-script-meta">${metaHtml}</div>
        <div class="sf-match-preview hidden"></div>
      `);

      // Action button handler
      const actionEl = item.querySelector(".sf-install-btn");
      if (actionEl) {
        actionEl.addEventListener("click", (e) => {
          e.stopPropagation();
          if (actionEl.dataset.action === "install") this._openInstallTarget(script, actionEl);
          else GM_openInTab(actionEl.dataset.url, { active: true });
        });
      }
      const previewEl = item.querySelector(".sf-preview-btn");
      const previewPane = item.querySelector(".sf-match-preview");
      if (previewEl && previewPane) {
        previewEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this._toggleMatchPreview(script, previewPane, previewEl);
        });
      }

      // Click-to-open script page
      item.addEventListener("click", (e) => {
        if (e.target.closest("a") || e.target.closest(".sf-install-btn")) return;
        GM_openInTab(scriptUrl, { active: true });
      });

      return item;
    }
  }

  // ── Init ────────────────────────────────────────────────────────────
  function boot() {
    try { new ScriptFinder().init(); }
    catch(e) { console.error("[Script Finder v4]", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 50);
})();
