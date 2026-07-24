# sop-model-context.md — SOP for generating `context/model-context.md` (Moderate/Moderate–MC/Large only)

## Generates
`context/model-context.md` — the module registry, shared-contract ledger, and (Moderate–MC/Large) cross-boundary connectivity map. The master agent owns this file; sub-agents load it **only** for Case 3 / shared-contract work.

**Not generated for Small tier.**

## Inputs
- `codemap-output/` — the actual module/service list, dependency graph (`dependsOn`), imported-by/referenced-by data.
- Generated per-module files (module-agent, standards) — the registry links to them.

---

## Generation Rules

### All three tiers (Moderate, Moderate–MC & Large)
- **Module Registry**: one row per module/codebase that exists in the codemap — module, sub-agent, module-agent file, backend/frontend standard files, codemap reference, database. Never invent rows.
- **Shared Contracts**: seed from the codemap's cross-module data (module A imports from module B; a table referenced by procedures/code in 2+ modules/codebases). Each seeded row starts as `Status: observed, Locked?: no` — the master agent + user confirm and lock. Rule stated in the file: **no module implements against a shared contract until `Locked? = yes`.**
- **Escalation Log**: empty table at generation (date, modules, conflict, master-agent decision) — filled during work, never by generation.

### Moderate specifics
- All registry rows reference the single shared `codemap-output/` and the single shared database.

### Moderate–MC specifics
- Each registry row references its own `codemap-output/<codebase>/` for **code** (like Large) but every row names the **same shared database** and the **same shared `db-codemap` path** (like Moderate) — the DB is never split per codebase. Do not regenerate the DB codemap per row; point every row at the one path from `sop-codemap-tool.md`.
- **Shared Contracts** here are usually DB-shaped by construction: any table/procedure referenced by code in 2+ codebases is a shared contract — seed it as `observed`, lock it in `model-context.md` before either codebase implements against it (schema change) or reads it in a new way that assumes a shape the other codebase doesn't guarantee.
- **Cross-Codebase Connectivity** (optional section, add only if used): include it only when codebases call each other directly — API call, event, queue — not merely because they share the database. Sharing the DB alone does not require this section; it's covered by Shared Contracts instead.

### Large specifics
- Each registry row references its own `codemap-output/<service>/` and names the service's own, separate database.
- Add the **Cross-Module Connectivity** section: how requests/data cross service boundaries (A calls B's API, A consumes B's event) — seeded from observed API clients/event usage in the codemap, confirmed by the user. Rule: any **new** cross-service dependency must be added here before implementation begins.

---

## Generated File Template

```markdown
# model-context.md — <project name> (tier: <Moderate|Moderate–MC|Large>)

> Owned by the master agent. Sub-agents load this ONLY for Case 3 / shared-contract tasks.

## Module Registry
| Module | Sub-Agent | Module-Agent File | Backend Standard | Frontend Standard | Codemap | Database |
|---|---|---|---|---|---|---|
| <module> | sub-agent-<module> | module-agent-<module>.md | backend-standard-<module>.md | frontend-standard-<module>.md | [MODERATE: shared codemap-output/] [MODERATE-MC: codemap-output/<codebase>/ (own code)] [LARGE: codemap-output/<service>/ (own code)] | [MODERATE/MODERATE-MC: shared — <db name>, one db-codemap for all rows] [LARGE: own — <db name>] |

## Shared Contracts
| Contract | Owning Module | Consuming Module(s) | Status | Locked? |
|---|---|---|---|---|
| <name — schema/API/type/event/table> | <module> | <modules> | observed/draft/approved | yes/no |

Rule: no module implements against a shared contract until `Locked? = yes` (Case 3 workflow). Only the master agent locks or re-locks, with user confirmation.

[MODERATE-MC — only if codebases call each other directly, not just via the shared DB]
## Cross-Codebase Connectivity
| From | To | Mechanism (API call / event) | Contract |
|---|---|---|---|
| <codebase> | <codebase> | <mechanism> | <contract row above> |

Rule: any new direct cross-codebase call is added here BEFORE implementation begins (master-agent approval required). Data sharing that only goes through the shared database does not need a row here — that's covered by Shared Contracts.

[LARGE]
## Cross-Module Connectivity
| From | To | Mechanism (API call / event / queue) | Contract |
|---|---|---|---|
| <service> | <service> | <mechanism> | <contract row above> |

Rule: any new cross-service dependency is added here BEFORE implementation begins (master-agent approval required).

## Escalation Log
| Date | Modules | Conflict | Master-Agent Decision |
|---|---|---|---|
```

---

## Regeneration
- **Registry**: add rows for new modules/codebases; mark removed ones `deprecated` (never silently delete). Moderate–MC: never let regeneration duplicate the DB codemap per codebase — re-point every row at the one shared path.
- **Shared Contracts / Connectivity**: add newly observed cross-module/cross-codebase relationships as `observed / Locked?: no`; **never** change an existing row's `Status`/`Locked?` — only the master agent does that during work.
- **Escalation Log**: never touched by regeneration.
