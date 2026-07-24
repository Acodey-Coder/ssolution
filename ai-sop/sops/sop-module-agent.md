# sop-module-agent.md — SOP for generating `context/module-agent-<module>.md` (Moderate/Moderate–MC/Large only)

## Generates
One `context/module-agent-<module>.md` **per module (Moderate), codebase (Moderate–MC), or service (Large)** — the single file that bootstraps that module's sub-agent in its **own context window**. It links everything the sub-agent needs, so nothing else has to be attached for Case 1/2 work.

**Not generated for Small tier** — Small has no sub-agents.

## Inputs
- `codemap-output/` — owned paths, files, functions, DB objects per module (Large: the service's own `codemap-output/<service>/`).
- `context/model-context.md` — exposed/consumed interfaces for this module.
- The master `backend-standard.md` / `frontend-standard.md` and the module's short `backend-standard-<module>.md` / `frontend-standard-<module>.md` (all generated before this file).

---

## Generation Rules

### All three tiers (Moderate, Moderate–MC & Large)
- Fill **everything the codemap can answer** — owned paths, DB objects, exposed/consumed interfaces. Placeholders are only allowed where the repo genuinely gives no answer, and must be flagged for the user.
- The file must be self-sufficient for Case 1/2 work: the sub-agent loads this file + the case file + `ai-workflow.md`, nothing else.
- Must define scope boundaries (what the sub-agent may do freely) and escalation triggers (what goes to the master agent), including the escalation format.
- The sub-agent implements; it never routes or governs contracts — that is the master agent's job.

### Moderate specifics
- Codemap reference = the single shared `codemap-output/` (query results are tagged by owning module; the sub-agent filters to its own module).
- Owned DB objects come from the shared DB codemap, attributed by usage.

### Moderate–MC specifics
- Codemap reference for **code** = this codebase's own `codemap-output/<codebase>/` (like Large) — never read another codebase's code or codemap directly.
- DB objects come from the single **shared** `db-codemap.json`/`.md` (like Moderate), attributed by usage rather than owned exclusively. The sub-agent may query the shared DB codemap freely (`query <table>`).
- Escalation differs from Large: a table/procedure this codebase touches that is **also** used by another codebase's code is not a forbidden boundary (the DB is genuinely shared by design) — it's a **shared contract** that must be locked in `model-context.md` before the shape changes. Reading a shared table is always fine; changing its shape, or relying on a shape it doesn't already guarantee, escalates.
- Name the shared database once (same value across every codebase's module-agent file).

### Large specifics
- Codemap reference = this service's own `codemap-output/<service>/` — code AND database.
- Add the owning database/service name and the hard rule: never read another service's code, database, or codemap — cross-service needs go through `model-context.md` contracts and the master agent.

---

## Generated File Template

```markdown
# module-agent-<module>.md — sub-agent bootstrap (<project name>, tier: <tier>)

> Attach this file to bootstrap the `<module>` sub-agent in its OWN context window. For Case 1/2 work, this file + the case file + `ai-workflow.md` is the complete context.

## Identity
- Module/service: `<module>`
- Sub-agent: `sub-agent-<module>`
[MODERATE-MC] - Codebase's own database is N/A — shared database: `<db name>` (same across every codebase)
[LARGE] - Owning service/database: `<service / db name>`
- Reports to: master agent (`master-agent.md` — not needed in this window unless escalating)

## Owns
- Backend code: `<paths from codemap>`
- Frontend code: `<paths from codemap>`
- DB objects: `<tables/collections/procedures from codemap>` [MODERATE-MC: from the shared db-codemap, attributed by usage — not owned exclusively]
- Exposes to other modules: `<from model-context.md Shared Contracts>`
- Consumes from other modules: `<from model-context.md Shared Contracts>`

## Linked Context (everything needed is here — load nothing else)
| File | Purpose |
|---|---|
| `backend-standard.md` (master) | Project-wide backend conventions |
| `backend-standard-<module>.md` | This module's backend specifics — SHORT, inherits the master file |
| `frontend-standard.md` (master) | Project-wide frontend conventions (omit row if module has no frontend) |
| `frontend-standard-<module>.md` | This module's frontend specifics — SHORT, inherits the master file (omit row if no frontend) |
| `project-standard.md` | Global project conventions (always global — never per module) |
| [MODERATE] `codemap-output/` (shared) — filter queries to this module | Code + DB structure |
| [MODERATE-MC] `codemap-output/<codebase>/` (own code) + shared `db-codemap` (DB, same path in every codebase's file) | Code + shared DB structure |
| [LARGE] `codemap-output/<service>/` | This service's own code + DB structure |
| `case-1.md` / `case-2.md` / `case-3.md` | Whichever the master agent assigned |
| `model-context.md` | ONLY for Case 3 / shared-contract tasks |

## Can Do Without Escalation
- Modify any file under its owned paths; add/modify its own tests.
- Query its codemap freely: `node ai-sop/codemap-tool/bin/cli.js query <term>` — this is mandatory before any change, not optional, even when the target seems obvious. Only if the query returns no match, fall back to direct file search and say so explicitly (refresh + re-query first if the term should exist).
- [MODERATE-MC] Query the shared DB codemap freely, including tables/procedures also used by another codebase — reading is always fine.
- Run `post-task-update.md` after every change (mandatory).

## Must Escalate to Master Agent
- Any change to an interface/schema/contract listed under "Exposes".
- Anything requiring another module's files[, database (LARGE),] or codemap.
- [MODERATE-MC] Any change to a DB table/procedure's **shape** that is also used by another codebase's code (found via `query <table>` against the shared DB codemap) — reading it is fine, changing it is not, until locked.
- Ambiguity about which module owns a file/table/interface.
- Any Case 3 task: implement only this module's slice, only after the contract is locked in `model-context.md`.

## Escalation Format
1. What was requested. 2. Which boundary above it crosses. 3. Which contract/module it touches, if known. Then STOP — do not implement past the boundary.

## Do Not
- Do not load another module's module-agent, standards, or codemap unless the task is explicitly Case 3.
- [MODERATE-MC] Do not load another codebase's CODE codemap or files — the shared DB codemap is the only thing held in common.
- Do not modify a shared contract unilaterally, however small the fix seems.
- Do not assume conventions beyond `project-standard.md` + the master layer standards + this module's short standards — ask instead.
```

---

## Regeneration
- Refresh owned paths, DB objects, and exposed/consumed lists from the current codemap + `model-context.md`.
- Generate a new file for every new module; mark files for removed modules deprecated (delete only on user confirmation).
- Preserve any manually added scope notes or escalation history.
