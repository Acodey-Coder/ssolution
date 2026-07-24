'use strict';
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'bin', 'obj', '.vs', '.vscode',
  'packages', 'TestResults', '.angular', 'coverage'
]);

/**
 * Recursively walks a directory, yielding absolute file paths.
 * Skips common build/vcs/dependency directories so scans stay fast on large repos.
 * @param {string} rootDir
 * @param {string[]} [excludeAbsolutePaths] - absolute directory paths to skip entirely
 *   (e.g. the ai-sop package's own tool/output/context folders, so the codemap doesn't
 *   map its own meta-tooling as if it were application code).
 */
function walk(rootDir, excludeAbsolutePaths) {
  const excludes = (excludeAbsolutePaths || []).map(p => path.resolve(p));
  const results = [];
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (excludes.includes(full)) continue;
        stack.push(full);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  }
  return results;
}

module.exports = { walk, SKIP_DIRS };
