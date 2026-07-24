# init.md — Attach This File to Start Context Generation

## Purpose
This is the only file you attach to begin. When this file is attached, the LLM must generate the full SOP context for this project by walking through the steps below, in order. Do not skip steps. Do not generate any project code yet — this file only generates **context and structure files**, not features.

---

## Step 1 — Determine Project Tier
Ask the user (if not already stated in the prompt) which tier applies:

- **Small** — single codebase, no separate modules/sub-agents, one team-sized service.
- **Moderate** — multiple modules/features, each large enough to warrant its own sub-agent, but still one deployable app/one database.
- **Large / Microservices** — multiple independent services, each with its own database and its own module boundary.

If the repo is already available, you may inspect folder structure, number of services, and number of databases to infer the tier — but confirm with the user before proceeding.

---

## Step 2 — Generate Standard Files
Always generate:
- `master-agent-standard.md`
- `backend-standard.md`
- `frontend-standard.md`

If tier is **Moderate** or **Large**, also generate:
- `model-context.md`
- One backend-standard + frontend-standard pair **per module**, only for modules that actually exist in the repo (do not invent modules).
- One `module-agent-<module>.md` **per module**, using `module-agent-template.md` as the base — this is the file a sub-agent's own (separate) context window loads to bootstrap itself, so it must be filled in completely: owned paths, exposed/consumed interfaces, and links to that module's own standard files + codemap-output folder. Do not leave placeholders unfilled if the repo gives enough info to fill them.

---

## Step 3 — Generate Workflow Files
Always generate:
- `ai-workflow.md`
- `case-1.md`
- `case-2.md`
- `case-3.md`

---

## Step 4 — Run the Codemap Tool
This project uses one real CLI tool (`codemap-tool`, see `codemap-tool-spec.md`) — not the LLM — to generate context. It auto-detects the project's language(s) and database type, and produces both the codebase map and the DB map in a single run.

Run:
```bash
node codemap-tool/bin/cli.js generate <path-to-repo>
```
This produces, in `codemap-output/`:
- `codemap.json`, `codemap.md`, `codemap.html` — codebase structure, modules, functions, classes, imports/exports, dependency graph.
- `db-codemap.json`, `db-codemap.md` — tables, columns, foreign keys, stored procedures, and/or NoSQL collections.

Tier-specific rules:
- **Small**: one `codemap-output/` for the whole codebase (covers both code + DB).
- **Moderate**: one shared `codemap-output/` for the whole codebase, connected to all sub-agents.
- **Large/Microservices**: run the tool **once per module/service**, pointing it at each service's own folder/repo, so each module gets its own `codemap-output/` (code map + DB map together), linked to its owning sub-agent in `model-context.md`.

Do this now (if the repo is attached/available) to produce the actual output files, not just the spec.

---

## Step 5 — Wire Up Selective Loading (Moderate/Large only)
Confirm `ai-workflow.md` includes Stage 1a (case detection) and Stage 1b (scope detection), so future sessions load only the sub-agent, standard files, and codemap(s) relevant to the task — not the entire project context every time.

---

## Step 6 — Output Summary
After generating everything, output a checklist of what was created, and tell the user the final attachment order to use for all future coding prompts.

**Small tier** (no sub-agents, everything through Master Agent):
```
1. master-agent-standard.md
2. backend-standard.md / frontend-standard.md
3. codemap.md / codemap.json / db-codemap.md / db-codemap.json
4. case-1.md / case-2.md / case-3.md (whichever Stage 1 selects)
5. ai-workflow.md (always last)
```

**Moderate/Large tier** (sub-agent runs in its own context window):
```
1. module-agent-<module>.md   ← bootstraps the sub-agent's own context; already links to its standard files + codemap-output
2. model-context.md (only if Case 3 or a shared contract is involved)
3. case-1.md / case-2.md / case-3.md (whichever Stage 1 selects)
4. ai-workflow.md (always last — triggers Stage 1a + Stage 1b)
```
Note: `master-agent-standard.md`, `backend-standard-<module>.md`, and `frontend-standard-<module>.md` do not need to be attached separately for Moderate/Large — they're already linked from inside `module-agent-<module>.md`, which is the one file that bootstraps that sub-agent's context.

---

## Rule
Do not proceed to any actual feature/bug work while this file is attached. This file's only job is producing the SOP context files and running the two tools once. Once context generation is complete, tell the user to detach `init.md` and begin normal work using `ai-workflow.md` as the last-attached file going forward.
