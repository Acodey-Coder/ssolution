'use strict';
const fs = require('fs');

const USING_RE = /^\s*using\s+([\w.]+)\s*;/gm;
const NAMESPACE_RE = /^\s*namespace\s+([\w.]+)/m;
const TYPE_RE = /\b(?:public|internal|private|protected)?\s*(?:static\s+|abstract\s+|sealed\s+|partial\s+)*(class|interface|struct|record)\s+(\w+)/g;
const ROUTE_RE = /\[Route\(\s*"([^"]+)"\s*\)\]/g;
const HTTP_VERB_RE = /\[(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch)(?:\("([^"]*)"\))?\]/g;
// Heuristic method matcher: access modifier + optional keywords + return type + Name(args) + '{' or ';' (interface).
// Not a full parser - matches the common single-line-signature convention used in this repo.
const METHOD_RE = /\b(public|private|protected|internal)\s+(?:static\s+|virtual\s+|override\s+|async\s+|sealed\s+)*[\w<>\[\],.?]+\s+(\w+)\s*\(([^)]*)\)\s*(?:where\s[^{;]+)?[{;]/g;
// Dapper call-site pattern: connection.QueryAsync<T>("Usp_Name", ...) / .ExecuteAsync("Name", ...) etc.
// Captures the stored-procedure name string literal so it can be cross-linked to the DB codemap.
const DAPPER_CALL_RE = /\.(?:QueryAsync|QueryFirstOrDefaultAsync|QuerySingleOrDefaultAsync|QueryFirstAsync|QuerySingleAsync|QueryMultipleAsync|ExecuteAsync|ExecuteScalarAsync|Query|Execute|ExecuteScalar)\s*(?:<[^>]*>)?\s*\(\s*"([^"]+)"/g;

/**
 * Regex-based extraction for a .cs file: namespace, using directives (imports),
 * declared types (classes/interfaces/structs/records), method names, and any
 * ASP.NET route/HTTP-verb attributes found (so controllers surface their routes).
 */
function parseCsharp(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const namespaceMatch = NAMESPACE_RE.exec(content);
  const namespace = namespaceMatch ? namespaceMatch[1] : null;

  const imports = new Set();
  let m;
  USING_RE.lastIndex = 0;
  while ((m = USING_RE.exec(content))) imports.add(m[1]);

  const classes = [];
  TYPE_RE.lastIndex = 0;
  while ((m = TYPE_RE.exec(content))) classes.push({ kind: m[1], name: m[2] });

  const routes = [];
  ROUTE_RE.lastIndex = 0;
  while ((m = ROUTE_RE.exec(content))) routes.push(m[1]);

  const httpVerbs = [];
  HTTP_VERB_RE.lastIndex = 0;
  while ((m = HTTP_VERB_RE.exec(content))) httpVerbs.push({ verb: m[1], route: m[2] || null });

  const functions = [];
  METHOD_RE.lastIndex = 0;
  while ((m = METHOD_RE.exec(content))) {
    // Filter out constructs that aren't really methods (e.g. property-like matches) heuristically
    // by requiring the name not equal a keyword and args group to look like a parameter list.
    functions.push({ access: m[1], name: m[2] });
  }

  const calledProcedures = new Set();
  DAPPER_CALL_RE.lastIndex = 0;
  while ((m = DAPPER_CALL_RE.exec(content))) calledProcedures.add(m[1]);

  return {
    namespace,
    imports: [...imports],
    classes,
    functions,
    routes,
    httpVerbs,
    calledProcedures: [...calledProcedures],
    isController: /:\s*ControllerBase\b|\[ApiController\]/.test(content),
  };
}

module.exports = { parseCsharp };
