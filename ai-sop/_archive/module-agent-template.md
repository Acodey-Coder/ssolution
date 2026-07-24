# module-agent-template.md — Sub-Agent Context File (Template)

> One copy of this file is generated per module, named `module-agent-<module>.md` (e.g. `module-agent-payments.md`). This is the file attached to bootstrap that module's sub-agent in its OWN context window — it does not need the whole project loaded, only what's linked below.

---

## Identity
- **Module name**: `<module>`
- **Sub-agent name**: `sub-agent-<module>`
- **Owning service/database** (Large tier): `<database or service name>`
- **Reports to**: Master Agent (see `master-agent-standard.md` — loaded only by Master Agent, not required in this sub-agent's own context unless escalating)

## What This Sub-Agent Owns
- All backend code under: `<module path, e.g. src/payments/>`
- All frontend code under: `<module path, e.g. src/frontend/payments/>`
- Database objects: `<tables/collections owned by this module — see linked DB codemap below>`
- Public interfaces this module **exposes** to other modules: `<list, or "see model-context.md Shared Contracts">`
- Public interfaces this module **consumes** from other modules: `<list, or "see model-context.md Shared Contracts">`

## Linked Context Files (load only these — not the full project)
| File | Purpose |
|---|---|
| `backend-standard-<module>.md` | This module's backend conventions |
| `frontend-standard-<module>.md` | This module's frontend conventions |
| `codemap-output-<module>/codemap.json` + `.md` | This module's code structure |
| `codemap-output-<module>/db-codemap.json` + `.md` | This module's DB structure |
| `case-1.md` / `case-2.md` / `case-3.md` | Whichever `ai-workflow.md` Stage 1a selects |
| `model-context.md` | **Only** if the task is Case 3 or touches a shared contract — this sub-agent should not need the full project's `model-context.md` for in-module (Case 1/2) work |

## Scope Boundaries — What This Sub-Agent Can Do Without Escalation
- Modify any file under its own owned paths (above).
- Add/modify tests within its own module.
- Query its own `codemap-output-<module>/` freely via `codemap-tool query <term>`.
- Refresh its own codemap after any change (`post-task-update.md`).

## What Requires Escalation to Master Agent
- Any change to a **public interface/schema/contract** listed under "exposes" above.
- Any change that would require reading another module's owned files or database.
- Any ambiguity about whether a table/file/interface belongs to this module or another.
- Any Case 3 (cross-module) task — this sub-agent implements only its own slice, after the Master Agent has confirmed the shared contract is locked in `model-context.md`.

## Escalation Format
When escalating, state:
1. What was requested.
2. Why it falls outside this module's scope (which boundary above it crosses).
3. What shared contract/module it touches, if known.
Then stop and wait for Master Agent / `model-context.md` resolution — do not implement past the boundary.

## Do Not
- Do not load another module's `backend-standard-*.md`, `frontend-standard-*.md`, or `codemap-output-*/` unless explicitly told this is a Case 3 task.
- Do not modify a shared contract unilaterally, even if the fix seems small.
- Do not assume project-wide conventions beyond what's in `master-agent-standard.md` if that file isn't loaded — ask rather than guess.
