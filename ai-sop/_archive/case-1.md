# case-1.md

> Attach after `ai-workflow.md` when Stage 1 detects Case 1.

## Covers
Bug fixes, field additions, config tweaks, small refactors.

## Context to Load
- Master Agent Standard.
- Backend or frontend standard for the affected module only (whichever layer the change touches).
- Codemap entry for the specific file(s)/function(s)/table(s) affected — query directly, do not load the full codemap: `node codemap-tool/bin/cli.js query <file_or_function_or_table>`.

## Process
1. Confirm the exact file(s)/function(s)/table(s) being changed via a codemap query.
2. Make the minimal change required — no unrelated refactors.
3. Add/update a unit test covering the change.
4. Follow `post-task-update.md` before marking this task complete (run `codemap-tool refresh`, confirm what changed).

## Do Not
- Do not touch shared contracts.
- Do not expand scope beyond the single reported issue.
- Do not load other modules' standard files or codemaps.
