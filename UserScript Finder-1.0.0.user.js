// ==UserScript==
// @name         UserScript Finder
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Finds GreasyFork/SleazyFork/GitHub scripts for the current domain
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
// @icon         https://raw.githubusercontent.com/SysAdminDoc/UserScript-Finder/refs/heads/main/img/icon.png
// @connect      greasyfork.org
// @connect      sleazyfork.org
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @license      WTFPL
// @run-at       document-idle
// @downloadURL  https://update.greasyfork.org/scripts/565312/GreasyForkSleazyFork%20Script%20Finder.user.js
// @updateURL    https://update.greasyfork.org/scripts/565312/GreasyForkSleazyFork%20Script%20Finder.meta.js
// ==/UserScript==

(function() {
  "use strict";

  try { if (window.self !== window.top) return; } catch(e) { return; }

  // ── TrustedHTML policy ──────────────────────────────────────────────
  const _ttPolicy = (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy)
    ? trustedTypes.createPolicy('gf-script-finder', { createHTML: s => s })
    : { createHTML: s => s };
  function _safeHTML(el, html) { el.innerHTML = _ttPolicy.createHTML(html); }

  // ── Default Settings ────────────────────────────────────────────────
  const DEFAULT_SETTINGS = {
    cacheDuration: 5 * 60 * 1000,
    defaultSort: "daily",
    denseMode: false,
    lastService: "greasyfork"
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
    flamingo: '#f2cdcd',
    rosewater:'#f5e0dc',
    glass:    'rgba(14, 14, 22, 0.82)',
    glassBorder: 'rgba(255, 255, 255, 0.06)',
    glassHover: 'rgba(255, 255, 255, 0.03)',
    glow:     'rgba(166, 227, 161, 0.15)',
    glowPurple: 'rgba(203, 166, 247, 0.15)',
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
    const n = Number(num);
    if (!Number.isFinite(n)) return null;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return n.toString();
  }

  // ── Settings Service ────────────────────────────────────────────────
  class SettingsService {
    constructor() { this.settings = this.loadSettings(); }
    loadSettings() { return { ...DEFAULT_SETTINGS, ...GM_getValue("sf_settings_v4", {}) }; }
    saveSettings() { GM_setValue("sf_settings_v4", this.settings); }
    get(key) { return this.settings[key]; }
    set(key, value) { this.settings[key] = value; this.saveSettings(); }
  }

  // ── Host Service ────────────────────────────────────────────────────
  class HostService {
    static getCurrentHost() { return window.location.hostname.replace(/^(www\.|m\.|mobile\.)/, ""); }
    static extractRootDomain(host) {
      const parts = host.split('.');
      if (parts.length <= 2) return host;
      const ccTLDs = ['com','net','org','edu','gov','mil','co','ac'];
      if (ccTLDs.includes(parts[parts.length - 2])) return parts.slice(-3).join('.');
      return parts.slice(-2).join('.');
    }
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
      const cacheDuration = settings.get("cacheDuration");
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) return cached.data;

      let scripts = [];
      try {
        scripts = await this._fetchBySite(domain);
      } catch {
        try { scripts = await this._fetchSearch(domain); } catch { scripts = []; }
      }

      const filtered = this._filter(scripts, domain);
      this.cache.set(cacheKey, { data: filtered, timestamp: Date.now() });
      return filtered;
    }

    _fetch(url) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET", url, headers: { Accept: "application/json" },
          onload: r => {
            if (r.status === 200) { try { resolve(JSON.parse(r.responseText)); } catch(e) { reject(e); } }
            else if (r.status === 404) resolve([]);
            else reject(new Error(`HTTP ${r.status}`));
          },
          onerror: reject
        });
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

  // ── GitHub Script Service ───────────────────────────────────────────
  class GitHubScriptService {
    constructor() {
      this.serviceName = "github";
      this.cache = new Map();
    }

    async searchScriptsByHost(host, settings) {
      const cacheKey = `github_${host}`;
      const cacheDuration = settings.get("cacheDuration");
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) return cached.data;

      let results = [];
      try {
        // Search repos mentioning the domain + userscript keywords
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
          } catch { /* rate limit or network — continue */ }
        }
      } catch { results = []; }

      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
      return results;
    }

    _fetchAPI(url) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET", url,
          headers: { Accept: "application/vnd.github.v3+json", 'User-Agent': 'ScriptFinder/4' },
          onload: r => {
            if (r.status === 200) { try { resolve(JSON.parse(r.responseText)); } catch(e) { reject(e); } }
            else if (r.status === 403) reject(new Error("GitHub rate limit — try again in a minute"))
            else reject(new Error(`GitHub API ${r.status}`));
          },
          onerror: reject
        });
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
  position: fixed; bottom: 14px; right: 14px; width: 500px;
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
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;
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
.sf-sort-label { font: 600 12px/1 inherit; color: ${THEME.subtext0}; flex-shrink: 0; }
.sf-sort-select {
  flex: 1; padding: 7px 10px; border-radius: 8px;
  border: 1px solid ${THEME.glassBorder}; background: ${THEME.surface0};
  color: ${THEME.text}; font: 500 12px/1 inherit; cursor: pointer; outline: none;
  transition: border-color 0.2s ease;
}
.sf-sort-select option { background: ${THEME.surface1}; color: ${THEME.text}; }
.sf-sort-select:focus { border-color: ${THEME.green}44; }
.sf-sort-select.sleazyfork:focus { border-color: ${THEME.purple}44; }
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
.sf-item.github .sf-script-title:hover { color: ${THEME.github}; }

.sf-script-sub {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  font: 500 11px/1.2 inherit; color: ${THEME.overlay}; margin-top: 3px;
}
.sf-script-sub svg { width: 12px; height: 12px; margin-right: 2px; vertical-align: -1px; }
.sf-dot { opacity: 0.3; font-size: 8px; }

.sf-install-btn {
  flex-shrink: 0; display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border-radius: 8px; border: none;
  background: ${THEME.green}22; color: ${THEME.green};
  font: 700 11px/1 inherit; cursor: pointer;
  transition: all 0.2s ease; white-space: nowrap;
}
.sf-install-btn:hover { background: ${THEME.green}44; transform: scale(1.04); }
.sf-install-btn:active { transform: scale(0.96); }
.sf-install-btn svg { width: 14px; height: 14px; }
.sf-item.sleazyfork .sf-install-btn { background: ${THEME.purple}22; color: ${THEME.purple}; }
.sf-item.sleazyfork .sf-install-btn:hover { background: ${THEME.purple}44; }
.sf-item.github .sf-install-btn { background: ${THEME.github}22; color: ${THEME.github}; }
.sf-item.github .sf-install-btn:hover { background: ${THEME.github}44; }

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
.sf-spinner.github { border-top-color: ${THEME.github}; }
.sf-loading-text { font: 500 13px/1 inherit; color: ${THEME.subtext0}; }

.sf-empty, .sf-error { padding: 50px 28px; text-align: center; }
.sf-empty-title, .sf-error-title { font: 700 15px/1.3 inherit; color: ${THEME.text}; margin-bottom: 8px; }
.sf-error-title { color: ${THEME.red}; }
.sf-empty-text, .sf-error-text { color: ${THEME.subtext0}; font: 400 13px/1.5 inherit; margin-bottom: 18px; }
.sf-action-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 18px; border-radius: 10px;
  background: linear-gradient(135deg, ${THEME.greenDim}, ${THEME.green}88);
  color: ${THEME.base}; font: 700 13px/1 inherit; border: none;
  cursor: pointer; transition: all 0.2s ease;
}
.sf-action-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
.sf-action-btn.sleazyfork { background: linear-gradient(135deg, ${THEME.purpleDim}, ${THEME.purple}88); }
.sf-action-btn.github { background: linear-gradient(135deg, ${THEME.githubDim}, ${THEME.github}88); }

/* Footer */
.sf-footer {
  padding: 12px 20px; border-top: 1px solid ${THEME.glassBorder};
  background: ${THEME.surface0}44;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  font: 600 11px/1 inherit;
}
.sf-footer-text { color: ${THEME.overlay}; }
.sf-footer a { color: ${THEME.green}; text-decoration: none; font-weight: 700; }
.sf-footer a:hover { text-decoration: underline; }
.sf-footer a.sleazyfork { color: ${THEME.purple}; }
.sf-footer a.github { color: ${THEME.github}; }

/* Settings panel */
.sf-settings {
  display: none; padding: 16px 20px; border-top: 1px solid ${THEME.glassBorder};
  background: ${THEME.surface0}44;
}
.sf-settings.visible { display: block; }
.sf-settings-title { font: 700 13px/1 inherit; color: ${THEME.text}; margin-bottom: 12px; }
.sf-setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid ${THEME.glassBorder};
}
.sf-setting-row:last-child { border-bottom: none; }
.sf-setting-label { font: 500 12px/1.3 inherit; color: ${THEME.subtext1}; }
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
  .sf-tabs { padding: 8px 16px; }
  .sf-sort-bar, .sf-search-wrap { padding-left: 16px; padding-right: 16px; }
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
        github: new GitHubScriptService()
      };
      this.currentService = this.settings.get("lastService") || "greasyfork";
      this.currentSort = this.settings.get("defaultSort");
      this.currentDomain = HostService.extractRootDomain(HostService.getCurrentHost());
      this.isOpen = false;
      this.isLoading = false;
      this.allScripts = [];
      this.searchQuery = "";
      this.settingsOpen = false;
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
      _safeHTML(this.modal, `
        <div class="sf-modal-header">
          <div class="sf-header-row">
            <div class="sf-header-left">
              <h2 class="sf-modal-title">Scripts for this site</h2>
              <p class="sf-modal-subtitle">
                <span class="sf-subtitle-count">0</span>
                <span class="sf-subtitle-text">scripts found</span>
              </p>
            </div>
            <button class="sf-header-btn sf-btn-settings" title="Settings">${getIcon('gear')}</button>
            <button class="sf-header-btn sf-btn-close" title="Close">${getIcon('x')}</button>
          </div>
        </div>
        <div class="sf-search-wrap">
          <div class="sf-search-box">
            ${getIcon('search')}
            <input class="sf-search-input" type="text" placeholder="Filter scripts..." spellcheck="false" />
            <span class="sf-search-count"></span>
          </div>
        </div>
        <div class="sf-tabs">
          <button class="sf-tab active" data-service="greasyfork">GreasyFork</button>
          <button class="sf-tab sleazyfork" data-service="sleazyfork">SleazyFork</button>
          <button class="sf-tab github" data-service="github">GitHub</button>
        </div>
        <div class="sf-sort-bar">
          <span class="sf-sort-label">Sort by</span>
          <select class="sf-sort-select">
            <option value="daily">Daily installs</option>
            <option value="total">Total installs</option>
            <option value="good">Ratings</option>
            <option value="fanscore">Fan score</option>
            <option value="updatedate">Last update</option>
            <option value="createdate">Created</option>
          </select>
        </div>
        <div class="sf-content">
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
        </div>
        <div class="sf-footer">
          <div class="sf-footer-text">Data from <a href="https://greasyfork.org" target="_blank">GreasyFork</a></div>
        </div>
      `);
      this.shadow.appendChild(this.modal);

      // Refs
      this.content = this.modal.querySelector(".sf-content");
      this.searchInput = this.modal.querySelector(".sf-search-input");
      this.searchCount = this.modal.querySelector(".sf-search-count");
      this.searchBox = this.modal.querySelector(".sf-search-box");
      this.sortSelect = this.modal.querySelector(".sf-sort-select");

      if (this.settings.get("denseMode")) this.host.classList.add("dense");

      document.body.appendChild(this.host);
    }

    // ── Events ──────────────────────────────────────────────────────
    _setupEvents() {
      // Modal buttons
      this.modal.querySelector(".sf-btn-close").addEventListener("click", () => this._close());
      this.modal.querySelector(".sf-btn-settings").addEventListener("click", () => this._toggleSettings());

      // Tabs
      this.modal.querySelectorAll(".sf-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          const svc = tab.dataset.service;
          if (svc !== this.currentService) {
            this.currentService = svc;
            this.settings.set("lastService", svc);
            this._updateTabs();
            this._loadScripts();
          }
        });
      });

      // Sort
      this.sortSelect.addEventListener("change", e => {
        this.currentSort = e.target.value;
        this._displayScripts();
      });

      // Search filter
      this.searchInput.addEventListener("input", e => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this._displayScripts();
      });

      // Settings toggles
      this.modal.querySelectorAll(".sf-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          const val = !this.settings.get(key);
          this.settings.set(key, val);
          btn.classList.toggle("on", val);
          if (key === "denseMode") this.host.classList.toggle("dense", val);
        });
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
      document.addEventListener("keydown", e => { if (e.key === "Escape" && this.isOpen) this._close(); });
    }

    // ── Menu commands ───────────────────────────────────────────────
    _setupMenuCommands() {
      if (typeof GM_registerMenuCommand !== "function") return;
      if (window._sfMenuIds) window._sfMenuIds.forEach(id => { try { GM_unregisterMenuCommand(id); } catch {} });
      window._sfMenuIds = [];

      const domain = HostService.extractRootDomain(this.currentDomain);

      window._sfMenuIds.push(GM_registerMenuCommand(`Find Scripts for ${domain} (GreasyFork)`, () => {
        this._ensureUI(); this.currentService = "greasyfork"; this._open();
      }));
      window._sfMenuIds.push(GM_registerMenuCommand(`Find Scripts for ${domain} (SleazyFork)`, () => {
        this._ensureUI(); this.currentService = "sleazyfork"; this._open();
      }));
      window._sfMenuIds.push(GM_registerMenuCommand(`Find Scripts for ${domain} (GitHub)`, () => {
        this._ensureUI(); this.currentService = "github"; this._open();
      }));

      window._sfMenuIds.push(GM_registerMenuCommand("Reset Script Finder Settings", () => {
        GM_deleteValue("sf_settings_v4"); location.reload();
      }));
    }

    // ── Modal control ───────────────────────────────────────────────
    _open() {
      this.isOpen = true;
      this._updateTabs();
      this._updateServiceColors();
      this.sortSelect.value = this.currentSort;
      this.modal.classList.add("visible");
      this.searchInput.value = "";
      this.searchQuery = "";
      this._loadScripts();
    }

    _close() {
      this.isOpen = false;
      this.settingsOpen = false;
      this.modal.querySelector(".sf-settings").classList.remove("visible");
      this.modal.classList.remove("visible");
    }

    _toggleSettings() {
      this.settingsOpen = !this.settingsOpen;
      this.modal.querySelector(".sf-settings").classList.toggle("visible", this.settingsOpen);
    }

    // ── Tab/color updates ───────────────────────────────────────────
    _updateTabs() {
      this.modal.querySelectorAll(".sf-tab").forEach(t => t.classList.toggle("active", t.dataset.service === this.currentService));
      this._updateServiceColors();
    }

    _updateServiceColors() {
      const svc = this.currentService;
      const svcNames = ["greasyfork", "sleazyfork", "github"];
      const header = this.modal.querySelector(".sf-modal-header");
      svcNames.forEach(s => header.classList.toggle(s, s === svc));
      svcNames.forEach(s => this.sortSelect.classList.toggle(s, s === svc));
      svcNames.forEach(s => this.searchBox.classList.toggle(s, s === svc));

      const footerLink = this.modal.querySelector(".sf-footer a");
      if (footerLink) {
        svcNames.forEach(s => footerLink.classList.toggle(s, s === svc));
        const labels = { greasyfork: "GreasyFork", sleazyfork: "SleazyFork", github: "GitHub" };
        const urls = { greasyfork: "https://greasyfork.org", sleazyfork: "https://sleazyfork.org", github: "https://github.com" };
        footerLink.textContent = labels[svc];
        footerLink.href = urls[svc];
      }
    }

    _setResultCount(count) {
      const countEl = this.modal.querySelector(".sf-subtitle-count");
      const textEl = this.modal.querySelector(".sf-subtitle-text");
      const isGH = this.currentService === "github";
      const unit = isGH ? "repo" : "script";
      if (countEl) countEl.textContent = count || 0;
      if (textEl) textEl.textContent = count === 1 ? `${unit} found` : `${unit}s found`;
    }

    // ── Data ────────────────────────────────────────────────────────
    async _loadScripts() {
      if (this.isLoading) return;
      this.isLoading = true;
      const svc = this.services[this.currentService];
      const svcClass = this.currentService === "greasyfork" ? "" : this.currentService;
      const svcLabels = { greasyfork: "GreasyFork", sleazyfork: "SleazyFork", github: "GitHub" };
      const svcLabel = svcLabels[this.currentService];

      _safeHTML(this.content, `<div class="sf-loading"><div class="sf-spinner ${svcClass}"></div><div class="sf-loading-text">Searching ${svcLabel}...</div></div>`);

      try {
        const host = HostService.getCurrentHost();
        this.currentDomain = HostService.extractRootDomain(host);
        this.allScripts = await svc.searchScriptsByHost(this.currentDomain, this.settings);
        this._setResultCount(this.allScripts.length);
        this._displayScripts();
      } catch(err) {
        this._setResultCount(0);
        _safeHTML(this.content, `
          <div class="sf-error">
            <div class="sf-error-title">Something went wrong</div>
            <div class="sf-error-text">${escapeHtml(err?.message || 'Unknown error')}</div>
            <button class="sf-action-btn ${svcClass}">Try again</button>
          </div>
        `);
        this.content.querySelector(".sf-action-btn")?.addEventListener("click", () => this._loadScripts());
      } finally {
        this.isLoading = false;
      }
    }

    _sortScripts(scripts) {
      const copy = [...scripts];
      switch (this.currentSort) {
        case "daily": return copy.sort((a,b) => (b.daily_installs || b._stars || 0) - (a.daily_installs || a._stars || 0));
        case "total": return copy.sort((a,b) => (b.total_installs || b._stars || 0) - (a.total_installs || a._stars || 0));
        case "good": return copy.sort((a,b) => (b.good_ratings || 0) - (a.good_ratings || 0));
        case "fanscore": return copy.sort((a,b) => (b.fan_score || b._forks || 0) - (a.fan_score || a._forks || 0));
        case "updatedate": return copy.sort((a,b) => new Date(b.code_updated_at||0) - new Date(a.code_updated_at||0));
        case "createdate": return copy.sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
        default: return copy.sort((a,b) => (b.daily_installs || b._stars || 0) - (a.daily_installs || a._stars || 0));
      }
    }

    _displayScripts() {
      let scripts = this.allScripts || [];
      const svcClass = this.currentService === "greasyfork" ? "" : this.currentService;
      const svcLabels = { greasyfork: "GreasyFork", sleazyfork: "SleazyFork", github: "GitHub" };
      const svcLabel = svcLabels[this.currentService];
      const displayHost = HostService.extractRootDomain(this.currentDomain);

      // Update title
      this.modal.querySelector(".sf-modal-title").textContent = `Scripts for ${displayHost}`;

      // Filter by search
      if (this.searchQuery) {
        scripts = scripts.filter(s =>
          (s.name || "").toLowerCase().includes(this.searchQuery) ||
          (s.description || "").toLowerCase().includes(this.searchQuery) ||
          (s.users?.[0]?.name || "").toLowerCase().includes(this.searchQuery) ||
          (s._full_name || "").toLowerCase().includes(this.searchQuery) ||
          (s._topics || []).some(t => t.toLowerCase().includes(this.searchQuery))
        );
      }
      this.searchCount.textContent = this.searchQuery ? `${scripts.length}/${this.allScripts.length}` : "";

      if (!scripts.length) {
        const directUrl = this.services[this.currentService].getDirectSearchUrl(this.currentDomain);
        if (this.searchQuery) {
          _safeHTML(this.content, `<div class="sf-empty"><div class="sf-empty-title">No matches</div><div class="sf-empty-text">No scripts match "${escapeHtml(this.searchQuery)}"</div></div>`);
        } else {
          _safeHTML(this.content, `
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
      _safeHTML(this.content, "");
      sorted.forEach((script, i) => {
        const item = this._createScriptItem(script, svcClass, i);
        this.content.appendChild(item);
      });
    }

    _createScriptItem(script, svcClass, index) {
      const item = document.createElement("div");
      item.className = `sf-item ${svcClass}`;
      item.style.animationDelay = `${Math.min(index * 30, 300)}ms`;

      const isGH = script._source === "github";
      const daily = formatNumber(script.daily_installs);
      const total = formatNumber(script.total_installs);
      const good = formatNumber(script.good_ratings);
      const fanScore = script.fan_score != null ? Number(script.fan_score) : null;
      const fanText = Number.isFinite(fanScore) ? fanScore.toFixed(1) : null;
      const updated = relativeTime(script.code_updated_at);
      const created = relativeTime(script.created_at);
      const author = script.users?.[0]?.name || null;
      const baseUrls = { sleazyfork: "https://sleazyfork.org", greasyfork: "https://greasyfork.org" };
      const scriptUrl = isGH ? script.url : (script.url?.startsWith("http") ? script.url : (baseUrls[svcClass] || baseUrls.greasyfork) + (script.url || ""));
      const installUrl = script.code_url || null;

      const fanClass = fanScore >= 8 ? "score-high" : fanScore >= 6 ? "score-mid" : fanScore >= 0 ? "score-low" : "";

      const badge = (icon, text, title, cls = "") => {
        if (!text) return "";
        return `<span class="sf-badge ${cls}" title="${escapeHtml(title)}">${getIcon(icon)} ${escapeHtml(text)}</span>`;
      };

      // GitHub: show stars + forks; GreasyFork/SleazyFork: show installs + ratings
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

      // GitHub repos get a "View" button; GreasyFork/SleazyFork get "Install"
      let actionBtn;
      if (isGH) {
        actionBtn = `<button class="sf-install-btn" data-url="${escapeHtml(scriptUrl)}" title="View repository">${getIcon('githubLogo')} View</button>`;
      } else if (installUrl) {
        actionBtn = `<button class="sf-install-btn" data-url="${escapeHtml(installUrl)}" title="Install script">${getIcon('install')} Install</button>`;
      } else {
        actionBtn = "";
      }

      _safeHTML(item, `
        <div class="sf-script-top">
          <div class="sf-script-info">
            <a href="${escapeHtml(scriptUrl)}" target="_blank" class="sf-script-title" title="${escapeHtml(script.name || '')}">${escapeHtml(script.name || "Untitled")}</a>
            <div class="sf-script-sub">
              ${author ? `<span title="${isGH ? 'Owner' : 'Author'}">${getIcon('user')} ${escapeHtml(author)}</span>` : ""}
              ${author && script.version ? `<span class="sf-dot">&bull;</span>` : ""}
              ${script.version ? `<span title="Version">${getIcon('gitBranch')} v${escapeHtml(script.version)}</span>` : ""}
              ${(author || script.version) && script.license ? `<span class="sf-dot">&bull;</span>` : ""}
              ${script.license ? `<span title="License">${getIcon('scales')} ${escapeHtml(script.license)}</span>` : ""}
            </div>
          </div>
          ${actionBtn}
        </div>
        <div class="sf-script-desc" title="${escapeHtml(script.description || '')}">${escapeHtml(script.description || "No description")}</div>
        <div class="sf-script-meta">${metaHtml}</div>
      `);

      // Action button handler
      const actionEl = item.querySelector(".sf-install-btn");
      if (actionEl) {
        actionEl.addEventListener("click", (e) => {
          e.stopPropagation();
          GM_openInTab(actionEl.dataset.url, { active: true });
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