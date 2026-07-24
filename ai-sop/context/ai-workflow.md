# ai-workflow.md — ssolution (tier: Small) (Azure DevOps MCP: not connected)

> Attach this file to every prompt, always last.
> It runs Stage 1: case detection. Do not implement until Stage 1 is resolved.

## Stage 1a — Case Detection
Classify the request as:
- **Case 1**: bug fix, field addition, config tweak, or small refactor anywhere in the codebase.
- **Case 2**: a new feature or significant change within the codebase that does not change a shared schema/contract used across many features.
- **Case 3**: a change to a shared schema, API shape, or type that multiple features/layers depend on.
State the detected case and name the case file to attach next (`context/case-N.md`).

## Stage 2 — Post-Task Update (mandatory)
Before reporting any task complete, follow `context/post-task-update.md` in full — Case 1 tasks included.

## Rule
No code is written or modified until: case is detected and the correct case file is loaded. No task is complete until Stage 2 has run or been explicitly flagged pending.
