#!/usr/bin/env node
'use strict';
const path = require('path');

const { generate } = require('../lib/commands/generate');
const { refresh } = require('../lib/commands/refresh');
const { query } = require('../lib/commands/query');

function defaultOutDir() {
  // Ai_sops/codemap-tool/bin/cli.js -> Ai_sops/codemap-output/
  return path.join(__dirname, '..', '..', 'codemap-output');
}

function outDir() {
  return process.env.CODEMAP_OUT ? path.resolve(process.env.CODEMAP_OUT) : defaultOutDir();
}

function printUsage() {
  console.log(`Usage:
  node bin/cli.js generate <path>   # full scan -> codemap.json/.md/.html + db-codemap.json/.md
  node bin/cli.js refresh <path>    # re-scan, reports what changed by content hash
  node bin/cli.js query <term>      # searches code + DB maps together, prints relations

Override output location with CODEMAP_OUT=<path>. Default: ${defaultOutDir()}`);
}

function main() {
  const [, , cmd, arg] = process.argv;
  const out = outDir();

  if (cmd === 'generate') {
    if (!arg) return printUsage(), process.exit(1);
    const { codemap, dbCodemap } = generate(arg, out);
    console.log(`Generated codemap for ${codemap.meta.repoRoot}`);
    console.log(`  Files scanned: ${codemap.meta.fileCount}, parsed: ${codemap.meta.parsedFileCount}`);
    console.log(`  Primary language: ${codemap.meta.primaryLanguage} (${JSON.stringify(codemap.meta.languages)})`);
    console.log(`  Database: ${codemap.meta.dbType}`);
    console.log(`  Modules: ${Object.keys(codemap.modules).length}`);
    console.log(`  Tables: ${Object.keys(dbCodemap.tables).length}, Procedures: ${Object.keys(dbCodemap.procedures).length}`);
    console.log(`  Output written to: ${out}`);
    return;
  }

  if (cmd === 'refresh') {
    if (!arg) return printUsage(), process.exit(1);
    const { diff } = refresh(arg, out);
    console.log(`Refresh complete for ${arg}`);
    console.log(`  Files:      +${diff.files.added.length} added, ~${diff.files.changed.length} changed, -${diff.files.removed.length} removed`);
    console.log(`  Tables:     +${diff.tables.added.length} added, ~${diff.tables.changed.length} changed, -${diff.tables.removed.length} removed`);
    console.log(`  Procedures: +${diff.procedures.added.length} added, ~${diff.procedures.changed.length} changed, -${diff.procedures.removed.length} removed`);
    if (diff.files.added.length) console.log(`  Added files: ${diff.files.added.slice(0, 20).join(', ')}${diff.files.added.length > 20 ? ', ...' : ''}`);
    if (diff.files.changed.length) console.log(`  Changed files: ${diff.files.changed.slice(0, 20).join(', ')}${diff.files.changed.length > 20 ? ', ...' : ''}`);
    if (diff.files.removed.length) console.log(`  Removed files: ${diff.files.removed.slice(0, 20).join(', ')}${diff.files.removed.length > 20 ? ', ...' : ''}`);
    return;
  }

  if (cmd === 'query') {
    if (!arg) return printUsage(), process.exit(1);
    const result = query(out, arg);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printUsage();
  process.exit(cmd ? 1 : 0);
}

main();
