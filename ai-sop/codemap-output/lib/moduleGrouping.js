'use strict';
const fs = require('fs');
const path = require('path');

const ORG_PREFIX_TOKENS = new Set(['TD', 'GreenZone', 'Greenzone']);
const LEADING_LAYER_TOKENS = new Set(['API', 'Repository', 'DomainModels', 'UI', 'Function']);
const TRAILING_SUFFIX_TOKENS = new Set(['Core', 'Application', 'Translations', 'Test', 'Tests', 'UnitTests', 'Engine', 'Host', 'Angular', 'Web']);
// Known repo-specific aliases so the same domain module isn't split across differently-named
// projects (e.g. the API/Repository/DomainModels "FW" projects and the "Formworks" UI/Engine
// projects are the same Formworks module).
const ALIASES = { Formworks: 'FW', UM: 'UserManagement' };

/**
 * Derives a domain-module name from a .csproj project name by stripping the
 * org prefix (TD.GreenZone[.]), a single leading layer token (API/Repository/...),
 * and any trailing suffix tokens (Core/Application/Translations/Test/...), while
 * never stripping down to nothing. This groups a solution laid out as
 * "layer-folder > per-module project" (very common in .NET) by its actual domain
 * module, not just its top-level folder.
 */
function moduleFromProjectName(projectName) {
  let tokens = projectName.split('.');
  while (tokens.length > 1 && ORG_PREFIX_TOKENS.has(tokens[0])) tokens.shift();
  while (tokens.length > 1 && LEADING_LAYER_TOKENS.has(tokens[0])) tokens.shift();
  while (tokens.length > 1 && TRAILING_SUFFIX_TOKENS.has(tokens[tokens.length - 1])) tokens.pop();
  const raw = tokens.join('.') || projectName;
  return ALIASES[raw] || raw;
}

/**
 * Derives a module name for a project directory that has no .csproj (e.g. an
 * Angular app identified by package.json) using the same stripping rules applied
 * to the directory's basename.
 */
function moduleFromDirName(dirName) {
  return moduleFromProjectName(dirName);
}

/**
 * Fallback for files under no recognized project: first folder under src/, app/,
 * or lib/, per the generic codemap-tool heuristic.
 */
function moduleFromPathFallback(relativePath) {
  const segments = relativePath.split(path.sep).filter(Boolean);
  const idx = segments.findIndex(s => ['src', 'app', 'lib'].includes(s.toLowerCase()));
  if (idx !== -1 && segments[idx + 1]) return segments[idx + 1];
  return segments[0] || 'root';
}

// A directory whose name looks like a .NET project name (e.g. "TD.GreenZone.API.SM.Core.Test")
// even though it has no .csproj of its own (orphaned project folder) - still worth grouping
// by the same convention rather than falling all the way back to the generic path heuristic.
const PROJECT_LIKE_DIR_RE = /^(TD|GreenZone|Greenzone)\.[\w.]+$/;

/**
 * Builds an index of directory -> module name by walking up from each source file
 * to the nearest ancestor directory containing a .csproj or package.json, then a
 * project-name-shaped ancestor folder (for orphaned project directories missing
 * their .csproj), then the generic src/app/lib fallback.
 */
function buildModuleIndex(repoRoot, csprojByPath, packageJsonDirs) {
  // csprojByPath: Map<absoluteCsprojDir, parsedCsprojResult> (module already resolved on parsed result)
  const csprojDirs = [...csprojByPath.keys()].sort((a, b) => b.length - a.length);
  const pkgDirs = [...packageJsonDirs].sort((a, b) => b.length - a.length);

  function moduleForFile(filePath) {
    const fileDir = path.dirname(filePath);
    for (const dir of csprojDirs) {
      if (fileDir === dir || fileDir.startsWith(dir + path.sep)) {
        return csprojByPath.get(dir).module;
      }
    }
    for (const dir of pkgDirs) {
      if (fileDir === dir || fileDir.startsWith(dir + path.sep)) {
        return moduleFromDirName(path.basename(dir));
      }
    }
    let dir = fileDir;
    while (dir.length >= repoRoot.length) {
      const base = path.basename(dir);
      if (PROJECT_LIKE_DIR_RE.test(base)) return moduleFromDirName(base);
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return moduleFromPathFallback(path.relative(repoRoot, filePath));
  }

  return { moduleForFile };
}

module.exports = { moduleFromProjectName, moduleFromDirName, moduleFromPathFallback, buildModuleIndex };
