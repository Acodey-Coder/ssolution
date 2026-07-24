'use strict';
const fs = require('fs');
const path = require('path');

const SQL_DRIVER_PACKAGES = ['pg', 'mysql2', 'mysql', 'mssql', 'tedious', 'sqlite3', 'better-sqlite3'];
const NOSQL_DRIVER_PACKAGES = ['mongoose', 'mongodb'];
const ORM_PACKAGES = ['prisma', 'sequelize', 'typeorm', 'knex'];

/**
 * Classifies the repo's database type as SQL, NoSQL, Mixed, or Unknown by scanning
 * manifests (package.json, requirements.txt) for driver packages and the repo for
 * .sql files / schema.prisma / Mongoose-style schemas.
 */
function detectDb(files) {
  let hasSql = false;
  let hasNoSql = false;
  const evidence = [];

  const sqlFiles = files.filter(f => path.extname(f).toLowerCase() === '.sql');
  if (sqlFiles.length) {
    hasSql = true;
    evidence.push(`${sqlFiles.length} .sql file(s)`);
  }

  const prismaSchemas = files.filter(f => f.endsWith('schema.prisma'));
  if (prismaSchemas.length) {
    hasSql = true;
    evidence.push('schema.prisma present (Prisma - typically SQL)');
  }

  for (const f of files) {
    const base = path.basename(f);
    if (base === 'package.json') {
      try {
        const pkg = JSON.parse(fs.readFileSync(f, 'utf8'));
        const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
        for (const dep of SQL_DRIVER_PACKAGES) {
          if (deps[dep]) { hasSql = true; evidence.push(`package.json dependency: ${dep}`); }
        }
        for (const dep of NOSQL_DRIVER_PACKAGES) {
          if (deps[dep]) { hasNoSql = true; evidence.push(`package.json dependency: ${dep}`); }
        }
        for (const dep of ORM_PACKAGES) {
          if (deps[dep]) { hasSql = true; evidence.push(`package.json dependency: ${dep}`); }
        }
      } catch { /* ignore unparsable manifest */ }
    }
    if (base === 'requirements.txt') {
      let content = '';
      try { content = fs.readFileSync(f, 'utf8').toLowerCase(); } catch { /* ignore */ }
      if (/psycopg2|pymysql|pyodbc|sqlalchemy/.test(content)) { hasSql = true; evidence.push('requirements.txt: SQL driver/ORM'); }
      if (/pymongo/.test(content)) { hasNoSql = true; evidence.push('requirements.txt: pymongo'); }
    }
    if (base.endsWith('.csproj')) {
      let content = '';
      try { content = fs.readFileSync(f, 'utf8'); } catch { /* ignore */ }
      if (/System\.Data\.SqlClient|Microsoft\.Data\.SqlClient|Dapper|EntityFramework/i.test(content)) {
        hasSql = true;
        evidence.push(`${path.basename(f)}: SQL Server client/Dapper/EF package reference`);
      }
    }
  }

  let type = 'Unknown';
  if (hasSql && hasNoSql) type = 'Mixed';
  else if (hasSql) type = 'SQL';
  else if (hasNoSql) type = 'NoSQL';

  return { type, evidence: [...new Set(evidence)] };
}

module.exports = { detectDb };
