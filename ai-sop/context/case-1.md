# case-1.md — ssolution (tier: Small)

> Attach after `ai-workflow.md` when Stage 1 detects Case 1.

## Covers
Bug fixes, field additions, config tweaks, small refactors anywhere in the codebase.

## Who Does the Work
The master agent, directly.

## Context to Load
- `master-agent.md`, `project-standard.md`, and `frontend-standard.md` (the only layer standard — there is no backend).
- Codemap entry for the specific file(s)/function(s): `node ai-sop/codemap-tool/bin/cli.js query <term>` — do not load the full codemap.

## Process
1. **Query first, always** — codemap `query <term>` for the exact target(s), before any manual search. Only if it returns nothing, fall back to direct code search/reasoning and say so explicitly (refresh + re-query first if the term should exist).
2. Make the minimal change required — no unrelated refactors.
3. Add/update a unit test covering the change.
4. Run `context/post-task-update.md` before reporting complete.

## Do Not
- Do not touch shared contracts — if one is affected, stop and escalate to Case 3.
- Do not expand scope beyond the single reported issue.
