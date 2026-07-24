# case-3.md — ssolution (tier: Small)

> Attach after `ai-workflow.md` when Stage 1 detects Case 3.

## Covers
Changes to a shared schema, API shape, or type that multiple features/layers depend on (e.g. a shared component's input/output contract used across several pages, or a routing structure change affecting the whole app).

## Who Does the Work
The master agent, directly — contract-first.

## Context to Load
- `master-agent.md`, `project-standard.md`, `frontend-standard.md`; codemap queries for the contract and all dependents.

## Process
1. **Query first, always** — codemap `query <term>` to identify every dependent of the shared contract, before any manual search. Only if the query returns nothing, fall back to direct search/reasoning and say so explicitly (refresh + re-query first if the term should exist).
2. List every dependent touched (found via `query <term>` imported-by/referenced-by data) — explicitly, before implementation.
3. **Lock contracts first**: propose the new shape and get user confirmation before any implementation. No `model-context.md` exists in this tier — the locked shape is stated in-conversation.
4. Update the contract, then update every consumer identified in step 2.
5. Unit tests per layer touched + a contract/integration test covering the shared piece.
6. Run `context/post-task-update.md` before reporting complete.

## Do Not
- Do not let any implementation begin before the new contract shape is confirmed with the user.
