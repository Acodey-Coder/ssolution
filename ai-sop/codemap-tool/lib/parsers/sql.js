'use strict';
const fs = require('fs');

const CREATE_TABLE_RE = /CREATE\s+TABLE\s+\[?(?:dbo\]?\.)?\[?([\w]+)\]?\s*\(([\s\S]*?)\)\s*(?:ON|GO|;|$)/gi;
const CREATE_PROC_RE = /CREATE\s+(?:OR\s+ALTER\s+)?(?:PROCEDURE|PROC|FUNCTION)\s+\[?(?:dbo\]?\.)?\[?([\w]+)\]?/gi;
const COLUMN_RE = /^\s*\[?(\w+)\]?\s+\[?(\w+(?:\([^)]*\))?)\]?/;
const PK_RE = /PRIMARY\s+KEY[^(]*\(([^)]+)\)/gi;
const FK_RE = /FOREIGN\s+KEY\s*\(\s*\[?(\w+)\]?\s*\)\s*REFERENCES\s+\[?(?:dbo\]?\.)?\[?(\w+)\]?\s*\(\s*\[?(\w+)\]?\s*\)/gi;
const TABLE_TOUCH_RE = /\b(?:FROM|JOIN|INTO|UPDATE)\s+\[?(?:dbo\]?\.)?\[?(\w+)\]?/gi;
const EXEC_RE = /\bEXEC(?:UTE)?\s+\[?(?:dbo\]?\.)?\[?(\w+)\]?/gi;

/**
 * Regex-parses a single .sql file for CREATE TABLE (columns/PK/FK) and
 * CREATE PROCEDURE/FUNCTION definitions (tables touched via FROM/JOIN/INTO/UPDATE,
 * and other procedures called via EXEC). Reads schema/migration files, not a live DB.
 */
function parseSql(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return { tables: [], procedures: [] };
  }

  const tables = [];
  let m;
  CREATE_TABLE_RE.lastIndex = 0;
  while ((m = CREATE_TABLE_RE.exec(content))) {
    const tableName = m[1];
    const body = m[2];
    const columns = [];
    for (const line of body.split(',')) {
      const trimmed = line.trim();
      if (!trimmed || /^(PRIMARY|FOREIGN|CONSTRAINT|UNIQUE|CHECK|INDEX)\b/i.test(trimmed)) continue;
      const colMatch = COLUMN_RE.exec(trimmed);
      if (colMatch) columns.push({ name: colMatch[1], type: colMatch[2] });
    }

    const primaryKeys = [];
    PK_RE.lastIndex = 0;
    let pkm;
    while ((pkm = PK_RE.exec(body))) {
      pkm[1].split(',').forEach(c => primaryKeys.push(c.replace(/\[|\]|ASC|DESC/gi, '').trim()));
    }

    const foreignKeys = [];
    FK_RE.lastIndex = 0;
    let fkm;
    while ((fkm = FK_RE.exec(body))) {
      foreignKeys.push({ column: fkm[1], referencesTable: fkm[2], referencesColumn: fkm[3] });
    }

    tables.push({ name: tableName, columns, primaryKeys, foreignKeys, file: filePath });
  }

  const procedures = [];
  CREATE_PROC_RE.lastIndex = 0;
  while ((m = CREATE_PROC_RE.exec(content))) {
    const procName = m[1];
    // scope table/proc-touch scanning to from this CREATE forward to the next CREATE (or EOF)
    const start = m.index;
    const nextCreate = content.slice(start + m[0].length).search(/CREATE\s+(?:OR\s+ALTER\s+)?(?:PROCEDURE|PROC|FUNCTION|TABLE)/i);
    const end = nextCreate === -1 ? content.length : start + m[0].length + nextCreate;
    const body = content.slice(start, end);

    const tablesTouched = new Set();
    TABLE_TOUCH_RE.lastIndex = 0;
    let ttm;
    while ((ttm = TABLE_TOUCH_RE.exec(body))) tablesTouched.add(ttm[1]);

    const proceduresCalled = new Set();
    EXEC_RE.lastIndex = 0;
    let em;
    while ((em = EXEC_RE.exec(body))) {
      if (em[1] !== procName) proceduresCalled.add(em[1]);
    }

    procedures.push({
      name: procName,
      tablesTouched: [...tablesTouched],
      proceduresCalled: [...proceduresCalled],
      file: filePath,
    });
  }

  return { tables, procedures };
}

module.exports = { parseSql };
