'use strict';

function renderCodemapMd(codemap) {
  const { meta, modules, files } = codemap;
  const lines = [];
  lines.push(`# Codemap — ${meta.repoRoot}`);
  lines.push('');
  lines.push(`Generated: ${meta.generatedAt} (${meta.durationMs}ms, ${meta.parsedFileCount}/${meta.fileCount} files parsed)`);
  lines.push(`Primary language: **${meta.primaryLanguage}** — ${Object.entries(meta.languages).map(([l, n]) => `${l}: ${n}`).join(', ')}`);
  lines.push(`Database: **${meta.dbType}** — ${meta.dbEvidence.join('; ') || 'no evidence found'}`);
  lines.push('');
  lines.push('## Modules');
  lines.push('');
  lines.push('| Module | Files | Depends On | Projects |');
  lines.push('|---|---|---|---|');
  for (const [name, m] of Object.entries(modules).sort()) {
    const projectNames = m.projects.map(p => p.name).join(', ') || '—';
    lines.push(`| ${name} | ${m.fileCount} | ${m.dependsOn.join(', ') || '—'} | ${projectNames} |`);
  }
  lines.push('');
  lines.push('## Files by Module');
  lines.push('');
  for (const [name, m] of Object.entries(modules).sort()) {
    lines.push(`### ${name}`);
    for (const rel of m.files) {
      const f = files[rel];
      const bits = [];
      if (f.classes && f.classes.length) bits.push(`classes: ${f.classes.map(c => c.name).join(', ')}`);
      if (f.functions && f.functions.length) bits.push(`functions: ${f.functions.length}`);
      if (f.routes && f.routes.length) bits.push(`routes: ${f.routes.join(', ')}`);
      if (f.tables && f.tables.length) bits.push(`tables: ${f.tables.join(', ')}`);
      if (f.procedures && f.procedures.length) bits.push(`procedures: ${f.procedures.length}`);
      lines.push(`- \`${rel}\`${bits.length ? ' — ' + bits.join('; ') : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

module.exports = { renderCodemapMd };
