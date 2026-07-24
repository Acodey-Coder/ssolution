# sop-codemap-tool.md — Codemap Tool Spec & Run Rules (unified: codebase + DB)

## Status
The tool is a real Node.js CLI — **not the LLM** — that generates context deterministically. Its source must be copied into `ai-sop/codemap-tool/` when this package is set up on a project (see `ai-sop/README.md`). This SOP is the authoritative spec; there is no separate DB-only tool or `dbmap` command (an earlier separate DB tool was merged into this one).

## What It Auto-Detects
- **Language(s)**: by file-extension counts across the repo (JS, TS, Python, Java, C#, Go, Ruby, PHP, Rust, Kotlin, C, C++) — no manual input.
- **Razor views (`.cshtml`)**: when C# is detected, `.cshtml` files are treated as first-class mapped files (ASP.NET MVC / Razor Pages), not skipped as markup.
- **Database type**: by scanning manifests (`package.json`, `requirements.txt`) for DB driver packages (pg, mysql2, mongoose, sequelize, prisma, psycopg2, pymongo, …) and the repo for `.sql` files, `schema.prisma`, or Mongoose-style schemas. Classifies as `SQL`, `NoSQL`, `Mixed`, or `Unknown`.

## Outputs (written to `codemap-output/`)
- `codemap.json` — modules, files, functions, classes, exports, imports (resolved), imported-by, per-module dependency list, content hash per file (for refresh diffing). For ASP.NET projects this includes `.cshtml` Razor views with their model, partial, view-component, and controller/action links.
- `codemap.md` — human-readable module/file summary.
- `codemap.html` — interactive dependency graph (vis.js), color-coded by module.
- `db-codemap.json` — tables (columns, PKs, FKs, referenced-by, used-in-procedures), stored procedures (tables touched), and/or NoSQL collections (fields, references).
- `db-codemap.md` — human-readable table/procedure/collection summary.

## CLI Commands
```bash
node ai-sop/codemap-tool/bin/cli.js generate <path>   # full scan → all 5 outputs
node ai-sop/codemap-tool/bin/cli.js refresh <path>    # re-scan, reports what changed by content hash
node ai-sop/codemap-tool/bin/cli.js query <term>      # searches code + DB maps together, prints relations
```
Override output location with `CODEMAP_OUT=<path>`.

## Run Rules Per Tier
- **Small**: `generate` once against the whole repo → single `codemap-output/`.
- **Moderate**: `generate` once against the whole repo → single shared `codemap-output/`; `query` results are tagged by owning module, so each sub-agent filters to its own module.
- **Moderate (Multi-Codebase / "Moderate–MC")**: `generate` once **per codebase** (point at each codebase's folder) → one `codemap-output/<codebase>/` per codebase, each with its own `codemap.json`/`.md`/`.html`. The database is **shared, not per-codebase**: run `generate` against whichever codebase actually owns the schema/migrations (or a dedicated DB/migrations folder) and treat its `db-codemap.json`/`db-codemap.md` as the one shared DB codemap — reference that same path from every codebase's context instead of regenerating it. The other codebases' own DB scans will typically come back empty/`Unknown`, since they hold no schema files; that's expected, ignore them in favor of the shared one. Register the shared DB codemap's path in `context/model-context.md`.
- **Large/Microservices**: `generate` once **per service** (point at each service's folder) → one `codemap-output/<service>/` per service, registered in `context/model-context.md`. Sub-agents only ever query their own service's output — code AND database.

## Usage Rules for Agents (baked into the generated context files)
- **Query, don't bulk-load**: for Case 1 (and targeted lookups generally), use `query <term>` — never attach a full codemap for a small change.
- **Forceful query, mandatory on every task**: before any other exploration (reading files blind, grepping, or answering from memory/general reasoning), run `query <term>` for the relevant file/function/table/module. This applies to every case, every tier, every task — not just Case 1 — even when the target seems obvious from the prompt. Never skip straight to a manual search.
- **Fallback only on an empty result**: if `query <term>` returns no match, only then fall back to direct code search (grep/read) or general reasoning — and say so explicitly (e.g. "codemap query for X returned nothing, falling back to direct search") so the fallback is visible, not silent. An empty result is not proof the target doesn't exist — the codemap may simply be stale. If the term is expected to exist, run `refresh <path>` first and re-query before falling back.
- **Refresh after every change**: per `context/post-task-update.md` — the tool diffs by content hash and reports only what actually changed; it does not need to be told code-vs-DB.
- **Trust the tool's output over memory**: counts and relations in the post-task confirmation come from the tool's output, never guessed.

## Algorithm Summary
1. Walk the repo (skipping `node_modules`, `.git`, `dist`, `build`, …).
2. Detect language via extension counts; detect DB via manifest + schema-file scan.
3. Per source file: regex-based extraction of imports/requires, exports, functions, classes (heuristic, not a full AST — reliable for standard patterns).
4. Resolve relative imports to real file paths → import/imported-by graph.
5. Group files into modules (heuristic: first folder under `src/`, `app/`, or `lib/`); compute module `dependsOn`.
6. Per `.sql` file: regex-parse `CREATE TABLE` (columns, PKs, FKs) and `CREATE PROCEDURE/FUNCTION` (tables touched via FROM/JOIN/INTO/UPDATE); cross-link tables ↔ procedures ↔ referenced-by.
7. Per `.cshtml` (Razor) file: regex-parse `@model` / `@inherits` (view → model link), `@using`, `Html.Partial(...)` / `Html.RenderPartial(...)` / `<partial name="..." />` (view → view links), `@await Component.InvokeAsync(...)` (view → view-component link), and `asp-controller` / `asp-action` / `Url.Action(...)` / `Html.ActionLink(...)` references (view → controller/action links). Views join the same import/imported-by graph as source files, so `query <view_or_controller>` shows which views a controller/model change affects.
8. Per Mongoose-style schema: parse `new Schema({...})` fields and `ref:` relations.
9. Render `.md` and `.html` from the same data structures as `.json`.

## Known Limitations
- Regex-based, not a compiler — unusual/dynamic syntax may be missed. In Razor views, controller/action references built dynamically at runtime (e.g. action names composed from variables) cannot be resolved statically.
- SQL parsing reads migration/schema files, not a live DB. Live introspection (`information_schema` via a driver) is the natural upgrade path — not yet implemented.
