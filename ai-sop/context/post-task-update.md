# post-task-update.md — ssolution (tier: Small) — Mandatory Context Refresh

> Referenced by `ai-workflow.md` Stage 2 and all case files. A task is not "done" until this runs.

## Trigger
Immediately after any of the following, before reporting the task complete:
- Code written, modified, or deleted.

(This project has no database — the table/column/procedure and schema/migration triggers from the general SOP do not apply.)

## What To Run
`node ai-sop/codemap-tool/bin/cli.js refresh .`  (whole repo, once)

## Additional Steps
If a shared contract changed (Case 3): `query <contract>` and confirm every dependent was updated.

## Confirmation (required in the final response)
- The exact refresh command run.
- What changed, from the tool's own output — file counts, not guesses.
- If the refresh could not run in this session: say so explicitly and instruct the user to run it before the next task.

## Do Not
- Do not report a task complete without running (or explicitly flagging as pending) this refresh.
- Do not skip because the change "seemed small" — Case 1 included.
