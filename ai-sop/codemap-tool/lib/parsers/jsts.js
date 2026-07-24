'use strict';
const fs = require('fs');

const IMPORT_RE = /import\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g;
const REQUIRE_RE = /require\(\s*["']([^"']+)["']\s*\)/g;
const EXPORT_NAMED_RE = /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g;
const EXPORT_DEFAULT_RE = /export\s+default\s+(?:class\s+)?(\w+)?/g;
const CLASS_RE = /\bclass\s+(\w+)/g;
const FUNCTION_RE = /\bfunction\s+(\w+)\s*\(/g;
const ARROW_EXPORT_RE = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
const NG_SCHEMA_RE = /new\s+Schema\(\s*\{([\s\S]*?)\}\s*\)/g;
const NG_REF_RE = /ref\s*:\s*["']([^"']+)["']/g;

/**
 * Regex-based extraction for a .js/.ts file: imports/requires (raw specifiers,
 * resolved to real paths by the caller for relative ones), exports, functions,
 * classes. Also opportunistically parses Mongoose-style `new Schema({...})` blocks
 * for field/ref data, in repos that use it.
 */
function parseJsTs(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const imports = new Set();
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(content))) imports.add(m[1]);
  REQUIRE_RE.lastIndex = 0;
  while ((m = REQUIRE_RE.exec(content))) imports.add(m[1]);

  const exports = [];
  EXPORT_NAMED_RE.lastIndex = 0;
  while ((m = EXPORT_NAMED_RE.exec(content))) exports.push(m[1]);
  ARROW_EXPORT_RE.lastIndex = 0;
  while ((m = ARROW_EXPORT_RE.exec(content))) exports.push(m[1]);
  EXPORT_DEFAULT_RE.lastIndex = 0;
  while ((m = EXPORT_DEFAULT_RE.exec(content))) if (m[1]) exports.push(`default:${m[1]}`);

  const classes = [];
  CLASS_RE.lastIndex = 0;
  while ((m = CLASS_RE.exec(content))) classes.push(m[1]);

  const functions = [];
  FUNCTION_RE.lastIndex = 0;
  while ((m = FUNCTION_RE.exec(content))) functions.push(m[1]);

  const mongooseSchemas = [];
  NG_SCHEMA_RE.lastIndex = 0;
  while ((m = NG_SCHEMA_RE.exec(content))) {
    const body = m[1];
    const refs = [];
    let rm;
    NG_REF_RE.lastIndex = 0;
    while ((rm = NG_REF_RE.exec(body))) refs.push(rm[1]);
    if (refs.length) mongooseSchemas.push({ refs });
  }

  return { imports: [...imports], exports, classes, functions, mongooseSchemas };
}

module.exports = { parseJsTs };
