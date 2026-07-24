# sop-backend-standard.md — SOP for generating backend standard file(s)

## Generates
- **Small**: one `context/backend-standard.md` for the whole codebase.
- **Moderate/Large**: **two levels**:
  1. **Master backend standard** — one `context/backend-standard.md` for the whole project: the global backend conventions every module follows (API style, error handling, DB access strategy, auth, logging). Owned by the master agent.
  2. **Module backend standard** — one **short** `context/backend-standard-<module>.md` per module/service that has backend code: module-specific values ONLY (owned paths, owned DB objects, module routes/endpoints, approved deviations). It inherits the master file and must never repeat its content. Generated only for modules that actually exist in the codemap — never invented.

## Inputs
- `context/project-standard.md` (global — the master backend standard refines it, never contradicts it).
- `codemap-output/` (module list, files, DB objects per module).
- Observed backend code (framework, API style, ORM, auth pattern).

## Inheritance Chain (Moderate/Large)
`project-standard.md` (global, all layers) → `backend-standard.md` (master, backend-wide) → `backend-standard-<module>.md` (module, short). Each level may **tighten** the level above, never loosen or contradict it. Conflicts escalate to the master agent. `project-standard.md` always stays global — there is never a per-module project standard.

---

## Generation Rules

### All tiers
- Fill from observed code first (API style, ORM/query layer, auth middleware, error shape); ask the user only for genuine decisions; `TBD` over invention.
- Include the codemap rule: before writing any query touching a table/procedure not already known, run `node ai-sop/codemap-tool/bin/cli.js query <table_or_procedure>` to confirm relations and dependents.
- Reference the testing matrix in `project-standard.md` — do not restate it.

### Small
- Single file, scope = whole project. No contract-rules section (shared-contract discipline for Small lives in `case-3.md`). No module files.

### Moderate
- **Master file**: contains ALL project-wide backend conventions — API design, error handling, DB access strategy, auth, logging. No module-specific content in it.
- **Module files**: keep them SHORT — only what is owned by or differs for that module:
  - Owned paths and owned tables/procedures (from the shared codemap, tagged by module).
  - The module's API prefix/routes.
  - Any approved module-specific deviation or tightening.
  - For everything else the file says: "per master `backend-standard.md`" — never copy master content in.
- Module contract rule: any change to this module's public API/schema consumed by other modules must be recorded in `model-context.md` and approved by the master agent before implementation.

### Moderate (Multi-Codebase)
- Same two-level structure at codebase granularity, plus:
- The codebase file's owned tables/procedures come from the single **shared** `db-codemap` (tagged by usage across codebases), not a per-codebase database — unlike Large, there is no "own database" line.
- Hard rule (replaces Large's "never query another service's database"): querying the shared DB codemap and reading any table is always fine; **changing the shape** of a table/procedure also used by another codebase requires a `model-context.md` Shared Contracts lock first, same discipline as Moderate's module contract rule.
- If a codebase legitimately uses a different backend stack (allowed within the per-codebase floor in `project-standard.md`), its file states the differing stack values.

### Large / Microservices
- Same two-level structure at service granularity, plus:
- The service file additionally names the service's **own database** (from `codemap-output/<service>/db-codemap`) and carries the hard rule: never query another service's database directly — cross-service data goes through that service's API/events per `model-context.md`.
- If a service legitimately uses a different stack (allowed within the per-service floor in `project-standard.md`), its service file states the differing stack values — the one case where a module file may grow beyond "short".

---

## Generated File Templates

### 1. Master template — `backend-standard.md` (Small: the only backend file; Moderate/Large: the master file)

```markdown
# backend-standard.md — <project name> (tier: <tier>) [MODERATE/MODERATE-MC/LARGE: — MASTER]

## Scope
[SMALL] Whole project backend.
[MODERATE/MODERATE-MC/LARGE] Project-wide backend conventions. Every module's `backend-standard-<module>.md` inherits this file and may only tighten it. Inherits `project-standard.md`.

## API Design
- Style: <REST/GraphQL/RPC — observed>; versioning: <observed/asked>; request/response shape: <observed>; pagination: <observed>

## Error Handling
- Error format & status mapping: <observed — must align with project-standard.md philosophy>
- Retry policy: <observed/asked>

## Database Access
- ORM/query layer: <observed>; migration strategy: <observed>; transaction rules: <observed/asked>
- Before writing any query touching an unknown table/procedure: `node ai-sop/codemap-tool/bin/cli.js query <name>` to confirm relations and dependents.
[MODERATE-MC] - The database is shared across all codebases (one `db-codemap`, not one per codebase). Reading any table is always fine; changing the shape of a table/procedure also used by another codebase requires a `model-context.md` lock first.
[LARGE] - No service ever queries another service's database directly — cross-service data goes through that service's API/events per `model-context.md`.

## Authentication & Authorization
- Mechanism: <observed>; where enforced: <observed>; role/permission model: <observed/asked>

## Logging & Monitoring
- <observed — must satisfy the project-standard.md floor>

## Testing
Per the testing matrix in `project-standard.md`, using <test runner/location observed>.
```

### 2. Module template — `backend-standard-<module>.md` (Moderate/Large only — keep SHORT)

```markdown
# backend-standard-<module>.md — <project name> (module: <module>)

> Inherits the master `backend-standard.md` — everything not stated here follows the master file. This file lists ONLY what is specific to `<module>`.

## Owned
- Backend paths: <from codemap>
- DB objects: <tables/procedures from codemap[, (MODERATE-MC) from the shared db-codemap, attributed by usage — not an owned database] [, (LARGE) this service's own database: <db>]>
- API prefix/routes: <observed>

## Module-Specific Rules / Deviations
- <only approved deviations or tightenings vs the master file; otherwise "None — per master backend-standard.md">
[MODERATE-MC] - <differing stack values, only if this codebase's stack differs>
[LARGE] - <differing stack values, only if this service's stack differs>

## Contract Rules
Any change to this module's public API/schema consumed by other modules must be recorded in `model-context.md` and approved by the master agent before implementation.
```

---

## Regeneration
- Master file: preserve every filled convention; flag (don't overwrite) conflicts between recorded conventions and observed code.
- Module files: update owned paths / DB objects from the current codemap; add files for new backend modules; mark files for removed modules deprecated.
- If a module file is found repeating master content, regeneration trims it back to module-specific values only (after confirming nothing unique is lost).
