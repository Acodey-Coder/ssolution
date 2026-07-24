'use strict';
const fs = require('fs');
const path = require('path');

const PROJECT_REF_RE = /<ProjectReference\s+Include="([^"]+)"/g;
const TARGET_FRAMEWORK_RE = /<TargetFramework>([^<]+)<\/TargetFramework>/;
const NULLABLE_RE = /<Nullable>([^<]+)<\/Nullable>/;

/**
 * Parses a .csproj for ProjectReference edges (resolved to the referenced project's
 * own basename, since that's what the rest of the graph keys on) plus target framework
 * and nullable-context, which are useful project-standard facts.
 */
function parseCsproj(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const references = [];
  let m;
  PROJECT_REF_RE.lastIndex = 0;
  while ((m = PROJECT_REF_RE.exec(content))) {
    references.push(path.basename(m[1].replace(/\\/g, '/')).replace(/\.csproj$/i, ''));
  }

  const tfMatch = TARGET_FRAMEWORK_RE.exec(content);
  const nullableMatch = NULLABLE_RE.exec(content);

  return {
    projectName: path.basename(filePath).replace(/\.csproj$/i, ''),
    references,
    targetFramework: tfMatch ? tfMatch[1] : null,
    nullable: nullableMatch ? nullableMatch[1] : null,
  };
}

module.exports = { parseCsproj };
