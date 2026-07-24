# sop-case-3.md — SOP for generating `context/case-3.md`

## Generates
`context/case-3.md` — the process file for cross-boundary / shared-contract changes. Attached after `ai-workflow.md` detects Case 3.

## Case 3 Definition Per Tier
- **Small**: a change to a **shared schema, API shape, or type** that multiple features/layers of the codebase depend on (e.g. renaming a core table column, changing a response shape used across screens). No sub-agents exist, but the contract-first discipline still applies.
- **Moderate**: a feature/change touching **two or more modules'** public interfaces, schemas, or contracts.
- **Moderate (Multi-Codebase)**: a feature/change touching **two or more codebases' code directly**, OR changing the **shape** of a DB table/procedure that two or more codebases depend on (since the DB is already shared, this is the most common Case 3 trigger at this tier).
- **Large**: a feature/change touching **two or more services'** APIs, events, or databases.

---

## Generation Rules

### All tiers
The generated file must enforce contract-first ordering:
- **Forceful, mandatory query first**: every affected contract (schema, API, type, event) and its dependents (imported-by/referenced-by/used-in-procedures) is found via codemap `query <term>` before any manual search, and **listed explicitly** before any implementation. Fall back to direct search only if the query returns no match, and say so explicitly; `refresh` and re-query first if the term is expected to exist.
- The contract shape is **locked before implementation begins**, and no scope unit changes the contract mid-implementation.
- Tests: unit tests per layer per scope unit, plus a cross-boundary contract/integration test.
- `context/post-task-update.md` runs at the end for **every** scope unit touched.

### Small
- **Who works**: the master agent directly — but it must still separate the task into (a) lock the new contract shape (confirm with the user), (b) update the contract (schema/type/API), (c) update every consumer, found via `node ai-sop/codemap-tool/bin/cli.js query <contract>` (imported-by / referenced-by / used-in-procedures data).
- **Context to load**: `master-agent.md`, `project-standard.md`, both layer standards, codemap queries for the contract and all its dependents.
- No `model-context.md` exists in Small tier — the locked shape is stated in-conversation and confirmed by the user before implementation.

### Moderate
- **Who orchestrates**: the master agent. **Who implements**: each involved module's sub-agent, only its own slice, only after locking.
- Process: identify every module involved (confirm against `context/model-context.md` Module Registry) → list every shared contract touched → **lock contracts first** (proposed shape recorded in `model-context.md` Shared Contracts with `Locked? = yes`) → hand each module's slice to its sub-agent (each bootstraps with its own `module-agent-<module>.md` + `model-context.md` + this case file) → sub-agents implement independently, slicing by layer within their module.
- No sub-agent may change a locked contract; contract changes go back to the master agent and re-lock.

### Moderate (Multi-Codebase)
- **Who orchestrates**: the master agent. **Who implements**: each involved codebase's sub-agent, only its own slice, only after locking.
- Process: identify every codebase involved (confirm against `context/model-context.md` Module Registry) → list every shared contract touched — usually a shared DB table/procedure shape, occasionally a direct cross-codebase API/event call → **lock contracts first** (recorded in `model-context.md` Shared Contracts with `Locked? = yes`; a new direct cross-codebase call also gets added to Cross-Codebase Connectivity) → hand each codebase's slice to its sub-agent (each bootstraps with its own `module-agent-<codebase>.md` + `model-context.md` + this case file) → sub-agents implement independently, slicing by layer within their codebase.
- No sub-agent may change a locked contract; contract changes go back to the master agent and re-lock. This includes shape changes to a shared table even though every codebase can already read it.

### Large / Microservices
- Same as Moderate, at service granularity, plus:
- Any **new cross-service dependency** (A now calls B's API / consumes B's event) must be added to `model-context.md` → Cross-Module Connectivity **before** implementation begins.
- Each sub-agent refreshes its **own** service's codemap at the end; the master agent verifies every involved service ran `context/post-task-update.md`.

---

## Generated File Template

```markdown
# case-3.md — <project name> (tier: <tier>)

> Attach after `ai-workflow.md` when Stage 1 detects Case 3.

## Covers
[SMALL] Changes to a shared schema, API shape, or type that multiple features/layers depend on.
[MODERATE] Features touching two or more modules' public interfaces, schemas, or contracts.
[MODERATE-MC] Features touching two or more codebases' code directly, or changing the shape of a DB table/procedure two or more codebases depend on.
[LARGE] Features touching two or more services' APIs, events, or databases.

## Who Does the Work
[SMALL] The master agent, directly — contract-first.
[MODERATE/MODERATE-MC/LARGE] The master agent orchestrates and locks contracts; each involved <module|codebase|service>'s sub-agent implements only its own slice, in its own context window. The master agent never implements a slice itself.

## Context to Load
[SMALL] - `master-agent.md`, `project-standard.md`, `backend-standard.md`, `frontend-standard.md`; codemap queries for the contract and all dependents.
[MODERATE/MODERATE-MC/LARGE] - Master agent window: `master-agent.md`, `model-context.md`.
[MODERATE/MODERATE-MC/LARGE] - Each sub-agent window: its `module-agent-<module>.md` + `model-context.md` + this file.

## Process
1. **Query first, always** — codemap `query <term>` to identify every <feature area|module|codebase|service> involved, before any manual search [MODERATE/MODERATE-MC/LARGE: confirm against `model-context.md` Module Registry]. Only if the query returns nothing, fall back to direct search/reasoning and say so explicitly (refresh + re-query first if the term should exist).
2. List every shared contract touched (schema, API, type, event) — explicitly, found via `query <term>` for dependents (imported-by/referenced-by/used-in-procedures). [MODERATE-MC] Since the DB is already shared, check the DB codemap for every table/procedure the change touches that is also used by another codebase's code.
3. **Lock contracts first**: [SMALL: propose the shape and get user confirmation] [MODERATE/MODERATE-MC/LARGE: record the shape in `model-context.md` Shared Contracts, `Locked? = yes`] before any implementation.
4. [MODERATE-MC] Add any new *direct* cross-codebase call (not just shared-DB usage) to `model-context.md` → Cross-Codebase Connectivity before implementation.
4. [LARGE] Add any new cross-service dependency to `model-context.md` → Cross-Module Connectivity before implementation.
5. Slice work by <scope unit>, then by layer (DB → backend → frontend) within each.
6. [MODERATE/MODERATE-MC/LARGE] Hand each slice to its sub-agent; slices proceed independently once contracts are locked.
7. Tests: unit tests per layer per <scope unit> + a cross-boundary contract/integration test.
8. Run `context/post-task-update.md` for every <scope unit> touched [MODERATE/MODERATE-MC/LARGE: master agent verifies all ran it; update `model-context.md` per its rules].

## Do Not
- Do not let any implementation begin before its contracts are locked.
- [MODERATE/MODERATE-MC/LARGE] Do not allow a sub-agent to change a locked contract unilaterally — only the master agent re-locks, recorded in `model-context.md`.
```

---

## Regeneration
Structural only — update scope-unit wording and registry references if tier/module list changed; preserve project-specific additions.
