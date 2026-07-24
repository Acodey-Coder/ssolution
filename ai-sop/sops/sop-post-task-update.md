# sop-post-task-update.md — SOP for generating `context/post-task-update.md`

## Generates
`context/post-task-update.md` — the mandatory context-refresh rule that runs at the end of every task. Referenced by `ai-workflow.md` (Stage 2) and all three case files.

---

## Generation Rules

### All tiers
The generated file must enforce:
- **Trigger**: runs after *any* code write/modify/delete, any DB object change (table, column, FK, procedure), any schema/migration change, any module-boundary or contract change — before the task is reported complete. Case 1 tasks included; "the change seemed small" is never a reason to skip.
- **Command**: `node ai-sop/codemap-tool/bin/cli.js refresh <path>` — one command refreshes both the code map and DB map; it diffs by content hash and reports only what actually changed.
- **Confirmation step** in the final response: which command ran, what changed (counts from the tool's own output, not guessed), and — Moderate/Large — whether `model-context.md` needed an update and that it was made.
- **No-environment rule**: if the refresh cannot actually be run in the session, say so explicitly and instruct the user to run it before the next task — never silently skip or assume the context is current.

### Small
- Run `refresh` once against the whole repo. Nothing else — no `model-context.md` exists.
- If a Case 3 (shared contract) change was made, additionally re-verify dependents with `query <contract>` and confirm all consumers were updated.

### Moderate
- Run `refresh` once against the whole repo (single shared `codemap-output/`).
- If the task was Case 3 or touched a shared contract: update `model-context.md` — Module Registry (if owned files/contracts changed), Shared Contracts table (`Locked? = yes` once implemented and stable), and Escalation Log (if master-agent resolution was needed).
- The **sub-agent that did the work** runs the refresh; the master agent verifies it happened before closing a Case 3.

### Moderate (Multi-Codebase)
- Run `refresh` **only for the codebase(s) actually touched** (each has its own `codemap-output/<codebase>/`) — never refresh untouched codebases. If a DB table/procedure changed, that refresh also updates the one shared `db-codemap` (run it from whichever codebase owns the schema/migrations, per `sop-codemap-tool.md`); other codebases do not re-run a DB scan of their own.
- Same `model-context.md` update rules as Moderate, plus: any new *direct* cross-codebase call confirmed present in Cross-Codebase Connectivity.
- Each sub-agent refreshes its own codebase's code; the master agent verifies all involved codebases refreshed (and the shared DB refresh ran once) before closing a Case 3.

### Large / Microservices
- Run `refresh` **only for the service(s) actually touched** — never refresh untouched services (it wastes the incremental diff and masks which service actually changed). Case 3: refresh every service involved.
- Same `model-context.md` update rules as Moderate, plus: new cross-service dependencies confirmed present in Cross-Module Connectivity.
- Each sub-agent refreshes its own service; the master agent verifies all involved services refreshed before closing a Case 3.

### Structural / Dramatic Changes (Moderate/Moderate–MC/Large)
A codemap `refresh` + a `model-context.md` update is enough for ordinary work, but **not** when the change is structural rather than incremental. Structural triggers:
- A new module/codebase/service was added, or an existing one was removed.
- A module/codebase was split into two, or two were merged into one.
- DB/code ownership shifted enough that a `module-agent-<module>.md`'s "Owns" section is now wrong, not just incomplete.
- (Moderate–MC/Large) The topology itself changed — e.g. a second, separate database appeared where the project was single-DB, which would actually move the project to a different tier.

When `refresh`'s own diff output shows one of these (a brand-new top-level codemap entry with no matching `module-agent-*.md`, an owner that no longer matches, etc.):
1. Still run the normal tier refresh above — that part doesn't change.
2. **Additionally flag it** in the confirmation step: name exactly which `context/` files are now stale (`module-agent-<x>.md`, `backend-standard-<x>.md` / `frontend-standard-<x>.md`, `model-context.md` Module Registry, or the tier declaration itself).
3. **Never regenerate those files silently.** Full regeneration of stale context files is `sop-init.md` Step 3–5 territory (see its Step 4 "Mid-project trigger") and needs the user's go-ahead — post-task-update's job is to detect and flag, not to run init on its own.

---

## Generated File Template

```markdown
# post-task-update.md — <project name> (tier: <tier>) — Mandatory Context Refresh

> Referenced by `ai-workflow.md` Stage 2 and all case files. A task is not "done" until this runs.

## Trigger
Immediately after any of the following, before reporting the task complete:
- Code written, modified, or deleted.
- A table, column, foreign key, or stored procedure/function added, changed, or removed.
- A schema/migration file added or changed.
- [MODERATE/MODERATE-MC/LARGE] A module/codebase boundary or shared contract changed (Case 3).

## What To Run
[SMALL/MODERATE] `node ai-sop/codemap-tool/bin/cli.js refresh <repo-root>`  (whole repo, once)
[MODERATE-MC] `node ai-sop/codemap-tool/bin/cli.js refresh <codebase-path>` — only for the codebase(s) actually touched; if the change touched the DB, this also refreshes the one shared `db-codemap` (run from the codebase that owns the schema); never refresh untouched codebases or re-scan the DB from more than one codebase.
[LARGE] `node ai-sop/codemap-tool/bin/cli.js refresh <service-path>` — only for the service(s) actually touched; Case 3 → every service involved; never refresh untouched services.

## Additional Steps
[SMALL] If a shared contract changed (Case 3): `query <contract>` and confirm every dependent was updated.
[MODERATE/MODERATE-MC/LARGE] If Case 3 / a shared contract changed: update `model-context.md` — Module Registry, Shared Contracts (`Locked? = yes` once stable), Escalation Log if master-agent resolution occurred[, and (MODERATE-MC) Cross-Codebase Connectivity for any new *direct* cross-codebase call, or (LARGE) Cross-Module Connectivity for any new cross-service dependency].
[MODERATE/MODERATE-MC/LARGE] The sub-agent that did the work runs the refresh; the master agent verifies before closing a Case 3.

[MODERATE/MODERATE-MC/LARGE]
## Structural / Dramatic Change Check
After the refresh, check its diff for: a new/removed module, codebase, or service; a module/codebase split or merge; ownership that no longer matches a `module-agent-<x>.md`'s "Owns" section[, (MODERATE-MC/LARGE) a topology change like a second database appearing]. If any apply:
1. Run the normal refresh above regardless — this check doesn't replace it.
2. Name exactly which `context/` files are now stale in the confirmation step below.
3. Do NOT regenerate those files yourself — flag them and point to `sop-init.md` (full regeneration needs the user's go-ahead).
[END MODERATE/MODERATE-MC/LARGE]

## Confirmation (required in the final response)
- The exact refresh command(s) run.
- What changed, from the tool's own output — file/table/procedure counts, not guesses.
- [MODERATE/MODERATE-MC/LARGE] Whether `model-context.md` needed an update, and that it was made.
- [MODERATE/MODERATE-MC/LARGE] Whether this task was structural (per the check above) and, if so, exactly which `context/` files need regeneration and that the user was told.
- If the refresh could not run in this session: say so explicitly and instruct the user to run it before the next task.

## Do Not
- Do not report a task complete without running (or explicitly flagging as pending) this refresh.
- Do not skip because the change "seemed small" — Case 1 included.
- [MODERATE-MC] Do not refresh codebases that weren't touched; do not re-run the DB scan from more than one codebase.
- [LARGE] Do not refresh services that weren't touched.
- [MODERATE/MODERATE-MC/LARGE] Do not silently regenerate `module-agent-*.md` or standards files after a structural change — flag it and let the user trigger `sop-init.md`.
```

---

## Regeneration
Update paths/service names from the current repo; preserve any project-specific additional steps the team added.
