'use strict';
const fs = require('fs');
const path = require('path');
const { generate } = require('./generate');

/**
 * Re-runs generate, then diffs the new codemap.json against the previous one
 * (if present) by per-file content hash, and by table/procedure name for the
 * DB codemap. Reports only what actually changed.
 */
function refresh(repoRoot, outDir) {
  const prevCodemapPath = path.join(outDir, 'codemap.json');
  const prevDbCodemapPath = path.join(outDir, 'db-codemap.json');

  let prevCodemap = null, prevDbCodemap = null;
  if (fs.existsSync(prevCodemapPath)) {
    try { prevCodemap = JSON.parse(fs.readFileSync(prevCodemapPath, 'utf8')); } catch { /* ignore corrupt previous output */ }
  }
  if (fs.existsSync(prevDbCodemapPath)) {
    try { prevDbCodemap = JSON.parse(fs.readFileSync(prevDbCodemapPath, 'utf8')); } catch { /* ignore corrupt previous output */ }
  }

  const { codemap, dbCodemap } = generate(repoRoot, outDir);

  const diff = { files: { added: [], changed: [], removed: [] }, tables: { added: [], changed: [], removed: [] }, procedures: { added: [], changed: [], removed: [] } };

  const prevFiles = prevCodemap ? prevCodemap.files : {};
  const newFiles = codemap.files;
  for (const [rel, f] of Object.entries(newFiles)) {
    if (!prevFiles[rel]) diff.files.added.push(rel);
    else if (prevFiles[rel].contentHash !== f.contentHash) diff.files.changed.push(rel);
  }
  for (const rel of Object.keys(prevFiles)) {
    if (!newFiles[rel]) diff.files.removed.push(rel);
  }

  const prevTables = prevDbCodemap ? prevDbCodemap.tables : {};
  const newTables = dbCodemap.tables;
  for (const name of Object.keys(newTables)) {
    if (!prevTables[name]) diff.tables.added.push(name);
    else if (JSON.stringify(prevTables[name].columns) !== JSON.stringify(newTables[name].columns)) diff.tables.changed.push(name);
  }
  for (const name of Object.keys(prevTables)) {
    if (!newTables[name]) diff.tables.removed.push(name);
  }

  const prevProcs = prevDbCodemap ? prevDbCodemap.procedures : {};
  const newProcs = dbCodemap.procedures;
  for (const name of Object.keys(newProcs)) {
    if (!prevProcs[name]) diff.procedures.added.push(name);
    else if (JSON.stringify(prevProcs[name].tablesTouched) !== JSON.stringify(newProcs[name].tablesTouched)) diff.procedures.changed.push(name);
  }
  for (const name of Object.keys(prevProcs)) {
    if (!newProcs[name]) diff.procedures.removed.push(name);
  }

  return { diff, codemap, dbCodemap };
}

module.exports = { refresh };
