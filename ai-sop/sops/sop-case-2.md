# sop-case-2.md — SOP for generating `context/case-2.md`

## Generates
`context/case-2.md` — the process file for a feature or significant change fully contained within one scope unit. Attached after `ai-workflow.md` detects Case 2.

## Case 2 Definition Per Tier
- **Small**: a new feature or significant change within the single codebase that does **not** change a shared schema/contract used across many features (that would be Case 3).
- **Moderate**: a new feature or significant change fully contained within **one module** — no other module's public interface, schema, or contract is affected.
- **Moderate (Multi-Codebase)**: a new feature or significant change fully contained within **one codebase's code** — no other codebase's code is touched, and no DB table/procedure shared with another codebase changes shape.
- **Large**: a new feature or significant change fully contained within **one service** — no other service's API, events, or database is affected.

---

## Generation Rules

### All tiers
The generated file must enforce:
- **Forceful, mandatory query first**: re-confirm containment at the start (against Stage 1 output) via a codemap `query <term>` for the feature area, before any manual exploration — then a **full contract check**: if any interface/schema outside the scope unit turns out to be affected mid-task, stop and escalate to Case 3 — do not continue under Case 2. Fall back to direct search only if the query returns no match, and say so explicitly; `refresh` and re-query first if the term is expected to exist.
- Layered implementation: DB/schema → backend/API → frontend/UI, testing each layer before moving on.
- Unit tests per layer plus one scope-level integration test (matrix in `context/project-standard.md`).
- `context/post-task-update.md` runs before the task is reported complete.

### Small
- **Who works**: the master agent directly.
- **Context to load**: `master-agent.md`, `project-standard.md`, `backend-standard.md` **and** `frontend-standard.md` (a feature usually spans layers), plus codemap queries for the affected area: `node ai-sop/codemap-tool/bin/cli.js query <feature-area>`.

### Moderate
- **Who works**: the owning module's sub-agent, in its own context window. The master agent routes and does not implement.
- **Context to load (sub-agent window)**: `module-agent-<module>.md` (links that module's backend + frontend standards and the shared codemap). Query the codemap scoped to the module: `query <module>`.
- The sub-agent owns the layer slicing within its module.

### Moderate (Multi-Codebase)
- **Who works**: the owning codebase's sub-agent, in its own context window. The master agent routes and does not implement.
- **Context to load (sub-agent window)**: `module-agent-<codebase>.md` (links this codebase's own code codemap plus the shared DB codemap). Query code with `query <term>` scoped to this codebase; query the DB freely against the shared `db-codemap`.
- The sub-agent owns the layer slicing within its codebase.
- The escalation trigger explicitly includes: needing to change the **shape** of a DB table/procedure also used by another codebase, or needing another codebase's code/API directly — either converts the task to Case 3 and returns it to the master agent for contract locking. Adding a *new* table used only by this codebase, or reading an existing shared table unchanged, stays Case 2.

### Large / Microservices
- Same as Moderate, at service granularity, against the service's own `codemap-output/<service>/`.
- The escalation trigger explicitly includes: needing a new/changed API call, event, or table in **another service** — that converts the task to Case 3 and returns it to the master agent for contract locking.

---

## Generated File Template

```markdown
# case-2.md — <project name> (tier: <tier>)

> Attach after `ai-workflow.md` when Stage 1 detects Case 2.

## Covers
New features or significant changes fully contained within [SMALL: this codebase (no shared contract changes)] [MODERATE: one module] [MODERATE-MC: one codebase's code, no shared-table shape change] [LARGE: one service].

## Who Does the Work
[SMALL] The master agent, directly.
[MODERATE/MODERATE-MC/LARGE] The owning <module|codebase|service>'s sub-agent, bootstrapped by `context/module-agent-<module>.md`, in its own context window. The master agent routes only.

## Context to Load
[SMALL] - `master-agent.md`, `project-standard.md`, `backend-standard.md` AND `frontend-standard.md`.
[MODERATE/MODERATE-MC/LARGE] - `module-agent-<module>.md` only.
[MODERATE-MC] - Code queries scoped to this codebase's own codemap; DB queries against the single shared `db-codemap`.
- Codemap scoped to the affected <area|module|codebase|service>: `node ai-sop/codemap-tool/bin/cli.js query <term>`.

## Process
1. **Query first, always** — codemap `query <term>` for the feature area, before any manual search, to re-confirm the full scope is contained (re-check Stage 1 output). Only if it returns nothing, fall back to direct search/reasoning and say so explicitly (refresh + re-query first if the term should exist).
2. Full contract check: confirm no interface/schema outside this <scope unit> is affected[MODERATE-MC: — for the shared DB specifically, confirm no table/procedure shape used by another codebase is changing]. If one is found mid-task, STOP and escalate to Case 3.
3. Slice by layer: DB/schema → backend/API → frontend/UI.
4. Implement layer by layer, testing each layer before the next.
5. Unit tests per layer + one <module|codebase|service|feature>-level integration test.
6. Run `context/post-task-update.md` before reporting complete.

## Do Not
- Do not continue under Case 2 if a shared contract turns out to be affected — escalate.
- [MODERATE/MODERATE-MC/LARGE] Do not load other <modules'|codebases'|services'> standards, module-agent files, or codemaps[MODERATE-MC: (the shared DB codemap is the one exception — query it freely)].
```

---

## Regeneration
Structural only — update scope-unit wording if tier/module list changed; preserve project-specific additions.
