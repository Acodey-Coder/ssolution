'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Searches the code + DB codemaps together for a term (file path fragment,
 * module name, class/function name, table, or procedure) and prints the
 * relations found: owning module, imports/imported-by, referenced-by,
 * used-in-procedures. Meant for targeted lookups, not bulk loading.
 */
function query(outDir, term) {
  const codemapPath = path.join(outDir, 'codemap.json');
  const dbCodemapPath = path.join(outDir, 'db-codemap.json');
  if (!fs.existsSync(codemapPath)) {
    return { error: `No codemap found at ${codemapPath}. Run "generate" first.` };
  }
  const codemap = JSON.parse(fs.readFileSync(codemapPath, 'utf8'));
  const dbCodemap = fs.existsSync(dbCodemapPath) ? JSON.parse(fs.readFileSync(dbCodemapPath, 'utf8')) : { tables: {}, procedures: {} };

  const needle = term.toLowerCase();
  const result = { term, modules: [], files: [], tables: [], procedures: [] };

  // module match
  for (const [name, m] of Object.entries(codemap.modules)) {
    if (name.toLowerCase().includes(needle)) {
      result.modules.push({ module: name, fileCount: m.fileCount, dependsOn: m.dependsOn, projects: m.projects.map(p => p.name) });
    }
  }

  // file/class/function/route match
  for (const [rel, f] of Object.entries(codemap.files)) {
    const classNames = (f.classes || []).map(c => c.name);
    const functionNames = (f.functions || []).map(fn => fn.name);
    const hay = [rel, ...classNames, ...functionNames, ...(f.routes || [])].join(' ').toLowerCase();
    if (hay.includes(needle)) {
      const ig = codemap.importGraph[rel];
      result.files.push({
        file: rel,
        module: f.module,
        language: f.language,
        classes: classNames,
        functions: functionNames,
        routes: f.routes || [],
        imports: ig ? ig.imports : [],
        importedBy: ig ? ig.importedBy : [],
      });
    }
  }

  // table match
  for (const [name, t] of Object.entries(dbCodemap.tables)) {
    if (name.toLowerCase().includes(needle)) {
      result.tables.push({
        table: name,
        file: t.file,
        columns: t.columns,
        primaryKeys: t.primaryKeys,
        foreignKeys: t.foreignKeys,
        referencedBy: t.referencedBy || [],
        usedInProcedures: t.usedInProcedures || [],
      });
    }
  }

  // procedure match
  for (const [name, p] of Object.entries(dbCodemap.procedures)) {
    if (name.toLowerCase().includes(needle)) {
      result.procedures.push({
        procedure: name,
        file: p.file,
        tablesTouched: p.tablesTouched,
        proceduresCalled: p.proceduresCalled,
      });
    }
  }

  return result;
}

module.exports = { query };
