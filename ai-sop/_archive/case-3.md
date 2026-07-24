# case-3.md

> Attach after `ai-workflow.md` when Stage 1 detects Case 3.

## Covers
Features that touch two or more modules' public interfaces, schemas, or contracts.

## Context to Load
- Master Agent Standard.
- `model-context.md` (mandatory — this defines the shared contracts and module registry).
- Backend AND frontend standard files for **every** module involved.
- Codemap (code + DB) for every module involved.

## Process
1. Identify every module involved and confirm against `model-context.md`'s Module Registry.
2. Identify every shared contract touched (schema, API, type). List them explicitly.
3. **Lock shared contracts first**: propose the contract shape, get it recorded in `model-context.md` with `Locked? = yes`, before any module implementation begins.
4. Once locked, slice work first by module, then by implementation layer within each module (DB → backend → frontend).
5. Implement each module's slice independently once contracts are locked — no module should need to change the contract mid-implementation.
6. Add unit tests per layer, per module, plus a cross-module contract/integration test.
7. Follow `post-task-update.md` before marking this task complete — refresh every module touched, and update `model-context.md`'s Module Registry / Shared Contracts / Escalation Log per its cross-module rules.

## Do Not
- Do not let any module begin implementation before its shared contracts are locked.
- Do not allow a sub-agent to unilaterally change a shared contract — only Master Agent can approve that, recorded in `model-context.md`.
