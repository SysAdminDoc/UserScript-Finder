function resolvePlaywright() {
  try {
    return require("playwright");
  } catch {}
  throw new Error("Playwright not found. Run: npm install");
}

module.exports = { resolvePlaywright };
