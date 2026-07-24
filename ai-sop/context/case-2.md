# case-2.md — ssolution (tier: Small)

> Attach after `ai-workflow.md` when Stage 1 detects Case 2.

## Covers
New features or significant changes fully contained within this codebase (no shared contract changes).

## Who Does the Work
The master agent, directly.

## Context to Load
- `master-agent.md`, `project-standard.md`, `frontend-standard.md`.
- Codemap scoped to the affected area: `node ai-sop/codemap-tool/bin/cli.js query <term>`.

## Process
1. **Query first, always** — codemap `query <term>` for the feature area, before any manual search, to re-confirm the full scope is contained. Only if it returns nothing, fall back to direct search/reasoning and say so explicitly (refresh + re-query first if the term should exist).
2. Full contract check: confirm no interface/shape used elsewhere in the codebase is affected. If one is found mid-task, STOP and escalate to Case 3.
3. Slice by layer: component structure → styling → routing/wiring, testing each before the next (no backend/DB layer exists in this project).
4. Unit tests per layer + one feature-level integration test.
5. Run `context/post-task-update.md` before reporting complete.

## Do Not
- Do not continue under Case 2 if a shared contract turns out to be affected — escalate.
