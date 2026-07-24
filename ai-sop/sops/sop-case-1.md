# sop-case-1.md — SOP for generating `context/case-1.md`

## Generates
`context/case-1.md` — the process file for small, contained changes. Attached after `ai-workflow.md` detects Case 1.

## Case 1 Definition Per Tier
- **Small**: bug fix, field addition, config tweak, or small refactor anywhere in the codebase.
- **Moderate**: the same class of change, contained within **one module** — routed to that module's sub-agent.
- **Moderate (Multi-Codebase)**: the same class of change, contained within **one codebase's code**, that does not change the shape of a DB table/procedure shared with another codebase — routed to that codebase's sub-agent.
- **Large**: the same class of change, contained within **one service** — routed to that service's sub-agent.

---

## Generation Rules

### All tiers
The generated file must enforce:
- **Forceful, mandatory query first**: confirm the exact file(s)/function(s)/table(s) affected via a codemap **query** (`node ai-sop/codemap-tool/bin/cli.js query <term>`) before any other exploration — never bulk-load a codemap for Case 1, and never skip straight to manual grep/read/memory. Fall back to direct search only if the query returns no match, and say so explicitly; if the term is expected to exist, `refresh` first and re-query before falling back.
- Minimal change only; no unrelated refactors; no scope expansion beyond the reported issue.
- A unit test covering the change (testing matrix in `context/project-standard.md`).
- No shared contracts touched — if one turns out to be affected mid-task, stop and escalate to Case 3.
- `context/post-task-update.md` runs before the task is reported complete.

### Small
- **Who works**: the master agent directly.
- **Context to load**: `master-agent.md`, `project-standard.md`, and only the layer standard the change touches (`backend-standard.md` or `frontend-standard.md`).

### Moderate
- **Who works**: the owning module's sub-agent, in its own context window. The master agent only routes.
- **Context to load (sub-agent window)**: `module-agent-<module>.md` (which already links that module's standards + the shared codemap) — nothing else.
- Do not load another module's `module-agent-*.md`, standards, or codemap.

### Moderate (Multi-Codebase)
- **Who works**: the owning codebase's sub-agent, in its own context window. The master agent only routes.
- **Context to load (sub-agent window)**: `module-agent-<codebase>.md` — links this codebase's own code codemap plus the shared DB codemap. Nothing else.
- Do not load another codebase's code, files, or codemap. The shared DB codemap may be queried freely (reading a shared table is fine).
- If the "small fix" turns out to require changing the **shape** of a table/procedure also used by another codebase — stop, that's an escalation to Case 3, not a Case 1.

### Large / Microservices
- Same as Moderate, but the sub-agent queries **its own service's** `codemap-output/<service>/` only.
- If the "small fix" turns out to require reading another service's code or DB, stop — that is an escalation, not a Case 1.

---

## Generated File Template

```markdown
# case-1.md — <project name> (tier: <tier>)

> Attach after `ai-workflow.md` when Stage 1 detects Case 1.

## Covers
Bug fixes, field additions, config tweaks, small refactors [MODERATE/MODERATE-MC/LARGE: contained within one <module|codebase|service>].

## Who Does the Work
[SMALL] The master agent, directly.
[MODERATE/MODERATE-MC/LARGE] The owning <module|codebase|service>'s sub-agent, in its own context window, bootstrapped by `context/module-agent-<module>.md`. The master agent routes only.

## Context to Load
[SMALL] - `master-agent.md`, `project-standard.md`, and the affected layer's standard only.
[MODERATE/MODERATE-MC/LARGE] - `module-agent-<module>.md` only (it links everything the sub-agent needs).
[MODERATE-MC] - Code queries scoped to this codebase's own codemap; DB queries run against the single shared `db-codemap` — do not load the full codemap either way.
- Codemap entry for the specific file(s)/function(s)/table(s): `node ai-sop/codemap-tool/bin/cli.js query <term>` — do not load the full codemap.

## Process
1. **Query first, always** — codemap `query <term>` for the exact target(s), before any manual search. Only if it returns nothing, fall back to direct code search/reasoning and say so explicitly (refresh + re-query first if the term should exist).
2. Make the minimal change required — no unrelated refactors.
3. Add/update a unit test covering the change.
4. Run `context/post-task-update.md` before reporting complete.

## Do Not
- Do not touch shared contracts — if one is affected, stop and escalate to Case 3.
- [MODERATE-MC] Do not change the shape of a DB table/procedure also used by another codebase — reading it is fine, changing it escalates to Case 3.
- Do not expand scope beyond the single reported issue.
- Do not load other <modules'|codebases'|services'> standards, module-agent files, or codemaps.
```

---

## Regeneration
Structural only — update module/service wording if the tier or module list changed; preserve any project-specific additions (e.g. extra checks the team added).
