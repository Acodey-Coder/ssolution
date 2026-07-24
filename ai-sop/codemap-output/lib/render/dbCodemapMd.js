'use strict';

function renderDbCodemapMd(dbCodemap) {
  const { meta, tables, procedures } = dbCodemap;
  const lines = [];
  lines.push(`# DB Codemap — ${meta.repoRoot}`);
  lines.push('');
  lines.push(`Generated: ${meta.generatedAt}`);
  lines.push(`Database: **${meta.dbType}** — ${meta.dbEvidence.join('; ') || 'no evidence found'}`);
  lines.push(`Tables: ${Object.keys(tables).length}, Procedures: ${Object.keys(procedures).length}`);
  lines.push('');
  lines.push('## Tables');
  lines.push('');
  for (const [name, t] of Object.entries(tables).sort()) {
    lines.push(`### ${name}`);
    lines.push(`- File: \`${t.file}\``);
    lines.push(`- Columns: ${t.columns.map(c => `${c.name} (${c.type})`).join(', ') || '—'}`);
    lines.push(`- Primary keys: ${t.primaryKeys.join(', ') || '—'}`);
    lines.push(`- Foreign keys: ${t.foreignKeys.map(fk => `${fk.column} -> ${fk.referencesTable}.${fk.referencesColumn}`).join(', ') || '—'}`);
    lines.push(`- Referenced by (FK from): ${(t.referencedBy || []).join(', ') || '—'}`);
    lines.push(`- Used in procedures: ${(t.usedInProcedures || []).join(', ') || '—'}`);
    lines.push(`- Used by modules (via those procedures' C# call sites): ${(t.usedByModules || []).join(', ') || '—'}`);
    lines.push('');
  }
  lines.push('## Procedures');
  lines.push('');
  for (const [name, p] of Object.entries(procedures).sort()) {
    lines.push(`### ${name}`);
    lines.push(`- File: \`${p.file}\``);
    lines.push(`- Tables touched: ${p.tablesTouched.join(', ') || '—'}`);
    lines.push(`- Procedures called: ${p.proceduresCalled.join(', ') || '—'}`);
    lines.push(`- Called by modules (Dapper call sites): ${(p.calledByModules || []).join(', ') || '—'}`);
    lines.push('');
  }
  return lines.join('\n');
}

module.exports = { renderDbCodemapMd };
