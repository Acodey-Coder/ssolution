# case-2.md

> Attach after `ai-workflow.md` when Stage 1 detects Case 2.

## Covers
New features or significant changes fully contained within one module.

## Context to Load
- Master Agent Standard.
- Backend AND frontend standard files for the single affected module.
- Full codemap (code + DB) for that module only: `node codemap-tool/bin/cli.js query <module>`.

## Process
1. Confirm the full scope is contained within one module (re-check against Stage 1b result).
2. Slice the work by implementation layer: DB/schema → backend/API → frontend/UI.
3. Full contract check required: confirm no public interface/schema outside this module is affected. If one is found mid-task, stop and escalate to Case 3 / Master Agent.
4. Implement layer by layer, testing each layer before moving to the next.
5. Add unit tests per layer + one module-level integration test.
6. Follow `post-task-update.md` before marking this task complete (run `codemap-tool refresh` for this module, confirm what changed).

## Do Not
- Do not proceed if a shared contract turns out to be affected — escalate instead of continuing under Case 2.
- Do not load other modules' standard files or codemaps.
