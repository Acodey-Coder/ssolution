# post-task-update.md — Mandatory Context Refresh After Any Code Change

> Referenced by `ai-workflow.md` and all case files (`case-1.md`, `case-2.md`, `case-3.md`). This is a standing rule, not optional cleanup — a task is not considered "done" until this step runs.

## Trigger
Run this immediately after **any** of the following, before telling the user the task is complete:
- New code is written or injected into the repo.
- Existing code is modified or deleted.
- A database table, column, foreign key, or stored procedure/function is added, changed, or removed.
- A schema/migration file is added or changed.
- A module boundary or shared contract changes (Case 3 specifically).

## What To Run
```bash
node codemap-tool/bin/cli.js refresh <path>
```
This single command re-scans and updates **both** outputs together:
- `codemap.json` / `codemap.md` / `codemap.html` (codebase side) — only if source files changed.
- `db-codemap.json` / `db-codemap.md` (DB side) — only if `.sql`/schema files changed.

The tool diffs by content hash, so it only reports/updates what actually changed — it does not need to be told which side (code vs DB) to refresh.

## Tier-Specific Rules
- **Small**: run `refresh` once against the whole repo.
- **Moderate**: run `refresh` once against the whole repo (shared codemap-output).
- **Large/Microservices**: run `refresh` **only for the module(s)/service(s) actually touched** — do not refresh untouched services. If the task was Case 3 (cross-module), refresh every module involved.

## Additional Step for Cross-Module Changes (Case 3 only)
If the change touched a shared contract (schema, API, type used by 2+ modules):
1. Run `refresh` for every module involved.
2. Update `model-context.md`'s **Module Registry** (if a module's owned files/contracts changed) and **Shared Contracts** table (mark it `Locked? = yes` once implemented and stable).
3. Log the change in the **Escalation Log** if it required Master Agent resolution.

## Confirmation Step (required before closing out the task)
The LLM must explicitly confirm in its final response:
- Which command was run (`codemap-tool ... refresh <path>`).
- What changed (file count / tables / procedures, from the tool's own output — not guessed).
- Whether `model-context.md` needed an update, and if so, that it was updated.

If the refresh cannot actually be run (e.g. no execution environment available in the current session), the LLM must say so explicitly and instruct the user to run the command manually before the next task begins — it must never silently skip this step or assume the context is already up to date.

## Do Not
- Do not mark a task complete without running (or explicitly flagging as pending) this refresh step.
- Do not skip refresh because the change "seemed small" — Case 1 tasks still require it.
- Do not refresh modules/services that weren't touched, in Large/Microservices tier — this wastes the incremental-diff benefit and can mask which module actually changed.
