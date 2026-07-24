# codemap-tool-spec.md — Codemap Tool (Unified: Codebase + DB)

## Status
**Implemented.** This is a real, working CLI script (Node.js) — not the LLM — that generates project context deterministically. Source lives in `codemap-tool/`. See `codemap-tool/README.md` for full usage.

> Note: earlier drafts of this SOP described a separate "Codebase Codemap Tool" and "DB Codemap Tool." They have been merged into **one tool** (`codemap-tool`) that auto-detects both language and database type and outputs both maps from a single command. `db-codemap-tool-spec.md` is kept only as a historical pointer — this file is the authoritative spec.

## What It Auto-Detects
- **Language(s)**: by counting file extensions across the repo (JavaScript, TypeScript, Python, Java, C#, Go, Ruby, PHP, Rust, Kotlin, C, C++) — no manual input required.
- **Database type**: by scanning `package.json`/`requirements.txt` for known DB driver packages (pg, mysql2, mongoose, sequelize, prisma, psycopg2, pymongo, etc.) and by scanning the repo for `.sql` files, `schema.prisma`, or Mongoose-style schema files. Classifies as `SQL`, `NoSQL`, `Mixed`, or `Unknown`.

## Outputs (per run, written to `codemap-output/`)
- `codemap.json` — modules, files, functions, classes, exports, imports, resolved local imports, imported-by, dependency-per-module list, content hash per file (for refresh diffing).
- `codemap.md` — human-readable module/file summary.
- `codemap.html` — interactive dependency graph (vis.js), color-coded by module.
- `db-codemap.json` — tables (columns, PK flags, foreign keys, referenced-by, used-in-procedures), stored procedures (tables touched), and/or NoSQL collections (fields, references).
- `db-codemap.md` — human-readable table/procedure/collection summary.

## CLI Commands
```bash
node codemap-tool/bin/cli.js generate <path>   # full scan, writes all 5 output files
node codemap-tool/bin/cli.js refresh <path>     # re-scan, reports how many files changed by hash
node codemap-tool/bin/cli.js query <term>       # searches code + DB maps together, prints relations
```
Override output location with `CODEMAP_OUT=/custom/path`.

## Algorithm Summary
1. Walk the repo (skipping `node_modules`, `.git`, `dist`, `build`, etc.).
2. Detect language via extension counts; detect DB via manifest + schema-file scan.
3. Per source file: regex-based extraction of imports/requires, exports, function defs, class defs (heuristic — not a full AST parser, but reliable for standard code patterns).
4. Resolve relative imports to actual file paths to build a real import/imported-by graph.
5. Group files into modules (heuristic: first folder under `src/`, `app/`, or `lib/`), compute module-to-module `dependsOn`.
6. Per `.sql` file: regex-parse `CREATE TABLE` (columns, PK, foreign keys) and `CREATE PROCEDURE/FUNCTION` (tables touched via FROM/JOIN/INTO/UPDATE). Cross-link tables ↔ procedures ↔ referenced-by.
7. Per Mongoose-style schema file: regex-parse `new Schema({...})` fields and `ref:` relations.
8. Render `.md` summaries and an HTML vis.js graph from the same data structures used for `.json`.

## Tier Behavior
- **Small**: run once against the whole repo → single `codemap-output/`.
- **Moderate**: run once against the whole repo → single shared `codemap-output/`; `query` results are already tagged by owning module so sub-agents can filter to their module.
- **Large/Microservices**: run once **per module/service** (point `generate <path>` at each service's own folder) → each module gets its own `codemap-output/`, registered in `model-context.md`.

## Known Limitations (documented, not hidden)
- Regex-based, not a full compiler — unusual/dynamic syntax may be missed.
- SQL parsing works on migration/schema `.sql` files, not a live DB connection. Upgrading to live introspection (querying `information_schema` directly via a DB driver) is the natural next step if needed — not yet implemented.
