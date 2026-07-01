const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const testsDir = __dirname;
const tests = fs.readdirSync(testsDir)
  .filter(f => f.endsWith(".test.cjs"))
  .sort();

let passed = 0;
let failed = 0;

for (const test of tests) {
  const testPath = path.join(testsDir, test);
  try {
    execSync(`node "${testPath}"`, { stdio: "pipe", timeout: 120000 });
    console.log(`  PASS  ${test}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${test}`);
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    if (output.trim()) console.error(`        ${output.trim().split("\n").join("\n        ")}`);
    failed++;
  }
}

console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
