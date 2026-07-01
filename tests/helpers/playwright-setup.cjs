const path = require("node:path");
const Module = require("node:module");

function resolvePlaywright() {
  try {
    return require("playwright");
  } catch {}

  const fallbackPaths = [
    "C:/Users/--/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
  ];

  for (const base of fallbackPaths) {
    process.env.NODE_PATH = [
      base,
      `${base}/.pnpm/node_modules`,
      `${base}/playwright/node_modules`,
      process.env.NODE_PATH || ""
    ].filter(Boolean).join(path.delimiter);
    Module._initPaths();
    try {
      return require("playwright");
    } catch {}
  }

  throw new Error("Playwright not found. Run: npm install");
}

module.exports = { resolvePlaywright };
