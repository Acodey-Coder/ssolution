# ai-sop — Per-Project AI SOP Package

This folder is the **master copy** of the AI SOP package. To use it on a project, copy this whole folder into the project root as `ai-sop/`. Everything the AI needs lives inside this one folder: the standards (SOPs), the generated context, the codemap tool, and the codemap output.

## Folder Layout

```
ai-sop/
  sops/               ← the STANDARDS. One SOP per generated context file. Read-only per project — never edit these to fit a project; the generated context in context/ is where project specifics live.
  context/            ← GENERATED per project from sops/, based on the project's tier and actual repo. This is what gets attached to prompts.
  codemap-tool/       ← the codemap CLI tool (copy the tool source here; see sops/sop-codemap-tool.md).
  codemap-output/     ← generated code + DB maps (one folder per codebase for Moderate-Multi-Codebase tier, one per service for Large tier).
```

## Core Principles

1. **SOPs are standards, context is generated.** Each file in `sops/` defines *how* one context file is produced. The SOP is never copied verbatim into a project — context generation reads the SOP's rules for the project's tier, inspects the actual repo/codemap, and writes a project-specific file into `context/`. The SOP itself is never overridden or edited per project.
2. **One SOP per context file.** Every file in `context/` has exactly one SOP in `sops/` that governs it (`context/case-1.md` ← `sops/sop-case-1.md`, etc.).
3. **Tier decides behavior.** Every SOP contains rules for all four tiers — **Small**, **Moderate**, **Moderate (Multi-Codebase)**, **Large/Microservices** — but the generated context file contains **only the current project's tier rules**. The tier is decided once, at init (see `sops/sop-init.md`).
   - **Moderate (Multi-Codebase)** ("Moderate–MC") sits between Moderate and Large: multiple separate codebases/repos, each with its own code codemap and sub-agent (like Large), but all reading/writing **one shared database** — one `db-codemap`, referenced by every codebase, never split per codebase (like Moderate). Use it when the project is more than one repo but still genuinely one database.
4. **Master agent orchestrates, sub-agents implement (Moderate/Moderate–MC/Large).** In these tiers the master agent never writes module code itself — it detects case + scope, routes to the owning sub-agent(s), locks shared contracts, and resolves escalations. Only in Small tier does the master agent implement directly.
5. **Regeneration updates in place.** Re-running context generation on a project that already has `context/` files re-reads the repo and updates only what changed. It never blanks out previously filled project-specific values. See the "Regeneration" section of each SOP.
6. **Optional MCP integrations are detected once, never re-asked.** At init, `sop-init.md` Step 1b checks once whether an Azure DevOps MCP server is connected and records the answer in `ai-workflow.md`. If connected, every prompt's Stage 0 uses it automatically to pull ticket title/description/acceptance criteria when a ticket ID is referenced — the agent never asks permission per task. If not connected, Stage 0 is simply omitted from the generated file.
7. **A codemap refresh isn't always enough — structural changes get flagged, not silently fixed.** `post-task-update.md` distinguishes ordinary changes (refresh + maybe a `model-context.md` update) from structural/dramatic ones (a module/codebase/service added, removed, split, or merged; ownership drift). For the latter it names exactly which `context/` files (module-agent, standards, registry) are now stale and points back to `sop-init.md` for regeneration — it never regenerates them on its own.
8. **`sop-init.md` detects which of three project states applies before doing anything else.** Case A (greenfield: no code, no context) swaps repo inspection for a discovery questionnaire, then builds a **working first version of the described product** (not an empty scaffold) bounded to the confirmed niche/feature set; Case B (existing code, no context yet) runs the original repo-inference + codemap + context generation flow; Case C (already has `context/`) is a regeneration that updates in place and never re-asks discovery or re-decides the tier. See `sop-init.md` Step 0/0a/0b.
9. **Every task queries the codemap first, forcefully.** Whether it's Case 1 scope detection, a Case 1 fix, or finding every dependent of a Case 3 contract, the codemap `query <term>` is mandatory and runs before any manual grep/read/memory-based search — even when the target seems obvious. Falling back to direct search is only allowed when the query genuinely returns nothing, and the agent must say so explicitly rather than silently skipping the query. See `sop-codemap-tool.md` → Usage Rules for Agents.

## How to Initialize a Project

1. Copy this folder into the project as `ai-sop/`.
2. Copy the codemap tool source into `ai-sop/codemap-tool/`.
3. Attach `sops/sop-init.md` to the AI and say "initialize". The AI first detects which of three states applies (Step 0), then proceeds accordingly:
   - **Case A — Greenfield / brand-new project** (no code, no context): runs a discovery questionnaire (niche, scale, tier, stack, database, deployment) instead of inspecting a repo, then builds a **working first version of the described product** + git repo from your answers (Step 0b) — e.g. say "todo app" and it builds a real todo app (task model, CRUD API, minimal UI), not just empty folders — then runs the codemap tool against that real build and generates context as normal.
   - **Case B — Existing codebase, no context yet**: determines the tier from the repo (with your confirmation), runs the codemap tool, generates context — the original init flow.
   - **Case C — Already initialized**: `context/` already has files, so this is a regeneration — it updates in place (Step 4) rather than re-running discovery or re-deciding the tier.
   - In all three cases it finishes by generating every applicable `context/` file from its SOP and outputting the attachment order for future work.
4. Detach `sop-init.md` and work normally using the generated `context/` files — the first real feature prompt goes through the normal case-detection workflow, same as any later task.

## SOP → Generated Context Map

| SOP (in `sops/`) | Generates (in `context/`) | Tiers |
|---|---|---|
| `sop-init.md` | *(drives generation of everything below — generates nothing itself)* | all |
| `sop-ai-workflow.md` | `ai-workflow.md` | all |
| `sop-case-1.md` | `case-1.md` | all |
| `sop-case-2.md` | `case-2.md` | all |
| `sop-case-3.md` | `case-3.md` | all |
| `sop-post-task-update.md` | `post-task-update.md` | all |
| `sop-master-agent.md` | `master-agent.md` | all |
| `sop-project-standard.md` | `project-standard.md` | all |
| `sop-backend-standard.md` | Small: `backend-standard.md`. Moderate/Moderate–MC/Large: master `backend-standard.md` (global) + short `backend-standard-<module>.md` per module/codebase | all |
| `sop-frontend-standard.md` | Small: `frontend-standard.md`. Moderate/Moderate–MC/Large: master `frontend-standard.md` (global) + short `frontend-standard-<module>.md` per module/codebase | all |
| `sop-module-agent.md` | `module-agent-<module>.md` per module/codebase | Moderate/Moderate–MC/Large only |
| `sop-model-context.md` | `model-context.md` | Moderate/Moderate–MC/Large only |
| `sop-codemap-tool.md` | *(tool spec + run rules — output goes to `codemap-output/`, not `context/`)* | all |

## Attachment Order for Normal Work (after init)

**Small tier** (master agent does the work directly):
```
1. context/master-agent.md
2. context/project-standard.md
3. context/backend-standard.md and/or context/frontend-standard.md (whichever layer the task touches)
4. context/case-N.md (whichever ai-workflow Stage 1 selects)
5. context/ai-workflow.md   ← always last
```

**Moderate/Moderate–MC/Large tier — master agent window** (routing only, no implementation):
```
1. context/master-agent.md
2. context/model-context.md
3. context/ai-workflow.md   ← always last
```

**Moderate/Moderate–MC/Large tier — sub-agent window** (does the actual work, own context window):
```
1. context/module-agent-<module>.md   ← bootstraps the sub-agent; already links the master backend/frontend standards + its own short module standards + codemap
   [Moderate–MC: this codemap is the codebase's OWN code codemap, plus the one shared db-codemap for DB objects]
2. context/model-context.md (only if Case 3 / shared contract involved)
3. context/case-N.md (whichever the master agent assigned)
4. context/ai-workflow.md   ← always last
```

Standards layering (Moderate/Moderate–MC/Large): `project-standard.md` (always global, never per module) → master `backend-standard.md` / `frontend-standard.md` (global layer conventions) → short `backend-standard-<module>.md` / `frontend-standard-<module>.md` (module specifics only, inherit the master files). Lower levels may tighten, never contradict.

## Moderate (Multi-Codebase) at a Glance

Use this tier when a project is **more than one repo/codebase but still one database** — e.g. a separate frontend repo + backend repo + admin-panel repo all reading/writing the same Postgres instance. It borrows Large's per-codebase codemap generation and one-sub-agent-per-codebase model, but keeps Moderate's shared-database, lock-don't-forbid governance:

| | Moderate | Moderate (Multi-Codebase) | Large |
|---|---|---|---|
| Code codemap | one shared `codemap-output/` | one `codemap-output/<codebase>/` per codebase | one `codemap-output/<service>/` per service |
| Database | one shared DB, one `db-codemap` | one shared DB, one `db-codemap` (referenced by every codebase) | one DB **per service** |
| Sub-agent granularity | per module (within one repo) | per codebase (separate repos) | per service |
| Touching a table another unit also uses | shared contract → lock in `model-context.md` | shared contract → lock in `model-context.md` | **forbidden** — go through that service's API/events |
| `model-context.md` extra section | — | Cross-Codebase Connectivity (only for *direct* API/event calls, not shared-DB reads) | Cross-Module Connectivity |

If the repo has 2+ codebases **and** 2+ databases, that's Large, not Moderate–MC.
