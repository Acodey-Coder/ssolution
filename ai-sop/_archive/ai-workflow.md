# ai-workflow.md

> Attach this file to every prompt. Always attach it last.
> It runs Stage 1 only: case detection + scope detection + context load order.
> After Stage 1, the AI will tell you which case file to attach and which module/sub-agent files to load.
> Do not proceed to implementation until case + scope are resolved.

---

## Stage 1a — Case Detection
Read the user's request and classify it as one of:

- **Case 1**: bug fix, field addition, config tweak, small refactor.
- **Case 2**: new feature or significant change fully contained within one module.
- **Case 3**: feature touches two or more modules' public interfaces, schemas, or contracts.

State the detected case back to the user. Then tell the user which case file to attach next (`case-1.md`, `case-2.md`, or `case-3.md`).

---

## Stage 1b — Scope Detection (Moderate/Large tiers only — skip for Small)
1. Infer which module(s) the task touches, using:
   - Explicit module names in the prompt.
   - Keyword/entity matching against the codemap(s) — run `node codemap-tool/bin/cli.js query <term>` to resolve which module owns the relevant file/function/table/procedure. This single command searches both the codebase map and the DB map at once.
2. **If scope is clear**: state it back to the user (e.g. "This only touches the `payments` module — the payments sub-agent should load `module-agent-payments.md` in its own context window. Confirm or correct?") and name exactly which file bootstraps that work:
   - `module-agent-<module>.md` — this single file already links to that module's own backend/frontend standard and codemap-output, so the sub-agent's context window only needs this one file plus the case file (and `model-context.md` if Case 3/shared contract).
   - Do not load another module's `module-agent-*.md` unless the task is genuinely Case 3.
3. **If scope is ambiguous**: ask the user which module(s)/sub-agent(s) apply. Do not guess. Do not default to loading everything.
4. The user may pre-specify scope in the prompt to skip confirmation (e.g. "this only affects the auth module").

---

## Stage 2 — Post-Task Update (mandatory, runs at the end of every task)
Before telling the user the task is complete, follow `post-task-update.md` in full. In short: run `node codemap-tool/bin/cli.js refresh <path>` for every module actually touched, confirm what changed using the tool's own output, and update `model-context.md` if a shared contract or module boundary changed. Do not skip this for small changes — Case 1 tasks require it too.

---

## Rule
Do not write or modify any code until:
- Case is detected (Stage 1a), AND
- Scope is resolved (Stage 1b, if applicable), AND
- The correct case file is attached and loaded, AND
- Only the relevant standard/codemap files (per Stage 1b) are loaded — not the whole project context.

Do not mark any task complete until Stage 2 (post-task update) has run or been explicitly flagged as pending.
