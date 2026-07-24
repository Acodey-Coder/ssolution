# codemap-tool/ — Codemap CLI

Zero-runtime-dependency Node.js CLI (built-ins only — `fs`, `path`, `crypto`) that generates
a deterministic code + DB map of a repo, per `../sops/sop-codemap-tool.md`.

```bash
node ai-sop/codemap-tool/bin/cli.js generate <path>   # full scan -> all 5 outputs
node ai-sop/codemap-tool/bin/cli.js refresh <path>    # re-scan, reports what changed
node ai-sop/codemap-tool/bin/cli.js query <term>      # searches code + DB maps together
```

Override output location with `CODEMAP_OUT=<path>` (default: `../codemap-output/`, a sibling
of this folder).

## What it does for this repo
- Detects C# as the primary language, SQL Server as the DB (via `Dapper`/`Microsoft.Data.SqlClient`
  references in `.csproj` files and `.sql` files under `src/Database/`).
- Groups files into **domain modules** (CM, FM, SM, FW, ...) by parsing each `.csproj`'s project
  name and stripping the org prefix (`TD.GreenZone`), a leading layer token (`API`/`Repository`/
  `DomainModels`/`UI`/`Function`), and trailing suffix tokens (`Core`/`Application`/`Translations`/
  `Test`/...) — this correctly groups a layer-folder-then-per-module-project solution layout,
  not just the top-level folder.
- Builds module-level `dependsOn` from `<ProjectReference>` edges.
- Parses `.sql` files for `CREATE TABLE` (columns/PK/FK) and `CREATE PROCEDURE`/`FUNCTION`
  (tables touched, procedures called), cross-linking tables ↔ procedures ↔ referenced-by.
- Parses `.cshtml` Razor views (`@model`, partials, view components, `asp-controller`/`asp-action`)
  and links them to controller classes found in `.cs` files.
- Parses `.ts`/`.js` imports/exports (used for the one Angular app in this repo) and resolves
  relative imports to real files for a genuine import/imported-by graph.

## Known limitations
Regex-based, not a compiler/AST — see `../sops/sop-codemap-tool.md` "Known Limitations".
C# cross-file resolution relies on `.csproj` `ProjectReference` edges (project-level), not
`using`-namespace resolution to individual files — reliable for module-level `dependsOn`, not
for file-level "who calls this method" questions within the same module.
