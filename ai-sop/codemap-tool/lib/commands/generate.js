'use strict';
const fs = require('fs');
const path = require('path');

const { walk } = require('../walk');
const { contentHash } = require('../hash');
const { detectLanguages } = require('../detectLanguage');
const { detectDb } = require('../detectDb');
const { parseCsharp } = require('../parsers/csharp');
const { parseCsproj } = require('../parsers/csproj');
const { parseSql } = require('../parsers/sql');
const { parseCshtml } = require('../parsers/cshtml');
const { parseJsTs } = require('../parsers/jsts');
const { moduleFromProjectName, buildModuleIndex } = require('../moduleGrouping');
const { renderCodemapMd } = require('../render/codemapMd');
const { renderDbCodemapMd } = require('../render/dbCodemapMd');
const { renderCodemapHtml } = require('../render/codemapHtml');

function resolveRelativeImport(fromFile, spec, allFilesSet) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`,
    path.join(base, 'index.ts'), path.join(base, 'index.js')];
  for (const c of candidates) {
    if (allFilesSet.has(c)) return c;
  }
  return null;
}

// This file lives at Ai_sops/codemap-tool/lib/commands/generate.js - derive the ai-sop
// package's own meta folders so a scan of the repo doesn't map the tool/output/context
// as if they were application code.
const AI_SOP_DIR = path.resolve(__dirname, '..', '..', '..');
const SELF_EXCLUDE_DIRS = ['codemap-tool', 'codemap-output', 'context', '_archive'].map(d => path.join(AI_SOP_DIR, d));

function generate(repoRoot, outDir) {
  const startedAt = Date.now();
  repoRoot = path.resolve(repoRoot);
  const allFiles = walk(repoRoot, SELF_EXCLUDE_DIRS);
  const allFilesSet = new Set(allFiles);

  const languages = detectLanguages(allFiles);
  const db = detectDb(allFiles);

  // --- .csproj discovery + module resolution ---
  const csprojFiles = allFiles.filter(f => f.toLowerCase().endsWith('.csproj'));
  const csprojByDir = new Map(); // absolute project dir -> { module, projectName, references, targetFramework, nullable }
  const csprojByProjectName = new Map(); // lowercased projectName -> module (case-insensitive: this repo mixes "GreenZone"/"Greenzone" casing between the project's own file and how other projects reference it)
  for (const f of csprojFiles) {
    const parsed = parseCsproj(f);
    if (!parsed) continue;
    const module = moduleFromProjectName(parsed.projectName);
    csprojByDir.set(path.dirname(f), { ...parsed, module });
    csprojByProjectName.set(parsed.projectName.toLowerCase(), module);
  }

  // --- package.json discovery (non-.NET projects, e.g. Angular), skip nested node_modules ones ---
  const packageJsonDirs = allFiles
    .filter(f => path.basename(f) === 'package.json' && !f.includes(`${path.sep}node_modules${path.sep}`))
    .map(f => path.dirname(f));

  const { moduleForFile } = buildModuleIndex(repoRoot, csprojByDir, packageJsonDirs);

  // --- module-level dependsOn from ProjectReference edges ---
  const modules = {}; // moduleName -> { files: [], dependsOn: Set, projects: [] }
  function ensureModule(name) {
    if (!modules[name]) modules[name] = { files: [], dependsOn: new Set(), projects: [] };
    return modules[name];
  }
  for (const [dir, info] of csprojByDir) {
    const mod = ensureModule(info.module);
    mod.projects.push({ name: info.projectName, targetFramework: info.targetFramework, nullable: info.nullable });
    for (const ref of info.references) {
      const refModule = csprojByProjectName.get(ref.toLowerCase());
      if (refModule && refModule !== info.module) mod.dependsOn.add(refModule);
    }
  }

  // --- per-file parsing ---
  const files = {};
  const controllersByName = new Map(); // "FooController" -> relPath
  const sqlTables = {};
  const sqlProcedures = {};
  const importGraph = {}; // relPath -> { imports: [relPath...], importedBy: [] }

  for (const f of allFiles) {
    const ext = path.extname(f).toLowerCase();
    const rel = path.relative(repoRoot, f).replace(/\\/g, '/');
    const module = moduleForFile(f);
    const hash = contentHash(f);

    if (ext === '.cs') {
      const parsed = parseCsharp(f);
      if (!parsed) continue;
      files[rel] = { module, language: 'C#', contentHash: hash, ...parsed };
      ensureModule(module).files.push(rel);
      if (parsed.isController) {
        for (const c of parsed.classes) {
          if (c.kind === 'class' && /Controller$/.test(c.name)) controllersByName.set(c.name, rel);
        }
      }
    } else if (ext === '.sql') {
      const parsed = parseSql(f);
      for (const t of parsed.tables) sqlTables[t.name] = { ...t, file: rel };
      for (const p of parsed.procedures) sqlProcedures[p.name] = { ...p, file: rel };
      files[rel] = { module, language: 'SQL', contentHash: hash, tables: parsed.tables.map(t => t.name), procedures: parsed.procedures.map(p => p.name) };
      ensureModule(module).files.push(rel);
    } else if (ext === '.cshtml') {
      const parsed = parseCshtml(f);
      if (!parsed) continue;
      files[rel] = { module, language: 'Razor', contentHash: hash, ...parsed };
      ensureModule(module).files.push(rel);
    } else if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
      if (f.includes(`${path.sep}node_modules${path.sep}`)) continue;
      const parsed = parseJsTs(f);
      if (!parsed) continue;
      files[rel] = { module, language: ext.startsWith('.ts') ? 'TypeScript' : 'JavaScript', contentHash: hash, ...parsed };
      ensureModule(module).files.push(rel);
      importGraph[rel] = importGraph[rel] || { imports: [], importedBy: [] };
      for (const spec of parsed.imports) {
        const resolved = resolveRelativeImport(f, spec, allFilesSet);
        if (resolved) {
          const resolvedRel = path.relative(repoRoot, resolved).replace(/\\/g, '/');
          importGraph[rel].imports.push(resolvedRel);
          importGraph[resolvedRel] = importGraph[resolvedRel] || { imports: [], importedBy: [] };
          importGraph[resolvedRel].importedBy.push(rel);
        }
      }
    } else {
      const { EXT_TO_LANG } = require('../detectLanguage');
      if (EXT_TO_LANG[ext]) {
        files[rel] = { module, language: EXT_TO_LANG[ext], contentHash: hash };
        ensureModule(module).files.push(rel);
      }
    }
  }

  // --- resolve Razor view -> controller/action links against discovered controllers ---
  for (const [rel, f] of Object.entries(files)) {
    if (f.language !== 'Razor') continue;
    const controllerNames = new Set(
      f.controllerActionLinks.filter(l => l.controller).map(l => `${l.controller}Controller`)
    );
    f.resolvedControllers = [...controllerNames]
      .filter(name => controllersByName.has(name))
      .map(name => controllersByName.get(name));
  }

  // --- DB cross-linking: which module's C# code actually calls each procedure (Dapper call sites) ---
  const procedureCalledByModules = {}; // procName -> Set<moduleName>
  for (const f of Object.values(files)) {
    if (!f.calledProcedures) continue;
    for (const procName of f.calledProcedures) {
      procedureCalledByModules[procName] = procedureCalledByModules[procName] || new Set();
      procedureCalledByModules[procName].add(f.module);
    }
  }
  for (const [name, proc] of Object.entries(sqlProcedures)) {
    proc.calledByModules = [...(procedureCalledByModules[name] || [])];
  }

  // --- DB cross-linking: referencedBy (FK) + usedInProcedures (+ usedByModules, transitively via those procedures) ---
  for (const [name, proc] of Object.entries(sqlProcedures)) {
    for (const tableName of proc.tablesTouched) {
      const t = sqlTables[tableName];
      if (t) {
        t.usedInProcedures = t.usedInProcedures || [];
        t.usedInProcedures.push(name);
        t.usedByModules = t.usedByModules || new Set();
        for (const mod of proc.calledByModules) t.usedByModules.add(mod);
      }
    }
  }
  for (const [name, t] of Object.entries(sqlTables)) {
    t.usedByModules = [...(t.usedByModules || [])];
    t.referencedBy = t.referencedBy || [];
  }
  for (const [name, t] of Object.entries(sqlTables)) {
    for (const fk of t.foreignKeys) {
      const target = sqlTables[fk.referencesTable];
      if (target) target.referencedBy.push(name);
    }
  }

  // finalize module dependsOn as arrays
  const modulesOut = {};
  for (const [name, m] of Object.entries(modules)) {
    modulesOut[name] = { projects: m.projects, fileCount: m.files.length, files: m.files, dependsOn: [...m.dependsOn] };
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    repoRoot,
    tool: 'ai-sop-codemap-tool',
    languages: languages.counts,
    primaryLanguage: languages.primary,
    dbType: db.type,
    dbEvidence: db.evidence,
    fileCount: allFiles.length,
    parsedFileCount: Object.keys(files).length,
    durationMs: Date.now() - startedAt,
  };

  const codemap = { meta, modules: modulesOut, files, importGraph };
  const dbCodemap = { meta, tables: sqlTables, procedures: sqlProcedures };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'codemap.json'), JSON.stringify(codemap, null, 2));
  fs.writeFileSync(path.join(outDir, 'db-codemap.json'), JSON.stringify(dbCodemap, null, 2));
  fs.writeFileSync(path.join(outDir, 'codemap.md'), renderCodemapMd(codemap));
  fs.writeFileSync(path.join(outDir, 'db-codemap.md'), renderDbCodemapMd(dbCodemap));
  fs.writeFileSync(path.join(outDir, 'codemap.html'), renderCodemapHtml(codemap));

  return { codemap, dbCodemap, outDir };
}

module.exports = { generate };
