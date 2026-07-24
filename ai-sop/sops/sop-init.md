# sop-init.md — SOP for Context Generation (attach this file to initialize a project)

## Purpose
This SOP drives the generation of every file in `ai-sop/context/` from the other SOPs in `ai-sop/sops/`. It generates **context and structure files only** — never project features or bug fixes. While this file is attached, do not write any project code.

## Inputs
- The project repo (folder structure, manifests, schema files) — **existing projects only**.
- Discovery answers from Step 0a — **greenfield projects only**, used in place of repo inspection for tier, stack, and structure decisions.
- The project tier (Step 1, or Step 0a for greenfield).
- Azure DevOps MCP connection status (Step 1b) — optional, environment-detected.
- `codemap-output/` (produced in Step 2).
- Every other `sop-*.md` file in `ai-sop/sops/`.

---

## Step 0 — Detect Project State (three cases)
Check two independent signals at the project root (the folder containing `ai-sop/`): (1) does `ai-sop/context/` already contain generated files, and (2) does the root contain real project content — source files, manifests, a database schema, etc. — besides `ai-sop/`, `README.md`, `.git/`, `LICENSE`.

- **Case A — Greenfield** (no code, no context): the root has nothing but `ai-sop/` (+ optionally `README.md`/`.git`/`LICENSE`), and `context/` is empty or missing. Run **Step 0a** then **Step 0b** before Step 1 — there is no repo to inspect, so discovery answers stand in for it. Step 1's tier question is answered by Step 0a rather than inferred.
- **Case B — Existing code, no context yet** (first-time init on a live codebase): real project content exists, but `context/` is empty or missing. Skip Step 0a/0b — proceed straight to **Step 1** and infer tier/stack from the actual repo, as the rest of this SOP already describes.
- **Case C — Already initialized** (`context/` already has generated files, regardless of code state): this is a **regeneration** run, not a first-time init. Skip Step 0a/0b and Steps 1–3 entirely — go directly to **Step 4** and update in place. Do not re-run discovery questions or re-decide the tier; Step 4 already governs when a tier change requires confirmation.

If signals conflict (e.g. `context/` has files but they look incomplete or stale from an interrupted run), treat it as Case C — Step 4's update-in-place rules handle partial/stale files without needing a special path.

---

## Step 0a — Discovery Questionnaire (greenfield only)
Ask in this order. Confirm each group before moving to the next — do not front-load every question at once.

1. **Niche & Purpose** — what the product does and who it's for (free text), e.g. "todo app", "e-commerce store for handmade goods", "internal HR portal". This seeds `project-standard.md`'s description and naming conventions **and** directly drives what Step 0b builds. If the description doesn't make the MVP feature set obvious, ask one clarifying follow-up about the core entities/actions before moving on (e.g. for a todo app: just title + done, or also due dates/categories/priority?).
2. **Rough Scale** — expected team size, expected user scale, and whether the user already knows they need multiple deployables or databases.
3. **Propose & Confirm Tier** — from 1+2, state a recommended tier (Small / Moderate / Moderate–MC / Large-Microservices) with a one-line reason, and ask the user to confirm or override. This answer **replaces** Step 1's repo-inference for greenfield; record it the same way Step 1 does — at the top of `context/master-agent.md` and `context/ai-workflow.md`.
4. **Tier-Specific Follow-Ups** — ask only the block matching the confirmed tier:
   - **Small**: backend stack (language/framework), frontend stack (or "API-only / none"), database engine.
   - **Moderate**: same stack questions, plus the initial module/feature breakdown (names only — detail is filled in as each module is scaffolded/built).
   - **Moderate–MC**: how many codebases (e.g. frontend / backend / admin-panel), each one's stack, and the single shared database engine.
   - **Large/Microservices**: the initial set of services, each one's stack **and its own database engine**, and the inter-service communication style (REST / gRPC / events) — this seeds `model-context.md`'s Cross-Module Connectivity section.
5. **Cross-Cutting** (asked once regardless of tier): deployment target, auth approach (if any), package manager, commit/branch convention, and — per `sop-init.md` Step 1b — whether an Azure DevOps MCP server is connected. Recommend a sensible default per the chosen stack and let the user confirm/override in one pass.
6. **Ask, don't guess still applies — more strictly.** There is no repo to fall back on, so every stack/DB/tier decision must be explicitly confirmed before Step 0b generates anything from it. Never scaffold a stack, database, or module breakdown the user hasn't confirmed.

---

## Step 0b — Initial Working Build (greenfield only)
This is the one explicit exception to this SOP's "do not write project code" rule. Unlike a generic empty scaffold, it produces a **working first version of the described product** — if the user said "todo app," this step builds a todo app, not just folders:

- Build the core entity/feature(s) implied by Step 0a's Niche & Purpose answer, end-to-end and runnable: data model → DB schema/migration → backend CRUD/API → minimal frontend UI to exercise it (per the confirmed stack). Example: "todo app" → a `tasks` table/model, create/list/update/delete-task endpoints, and a minimal UI to add/view/complete/delete a task. Not stubs, not TODO comments — a working slice a user could actually run and use.
- **Bounded to what was confirmed** — build only the feature set implied by the niche description and any Step 0a.1 clarifying follow-up. Do not invent adjacent features (auth, sharing, notifications, payments, etc.) the user didn't describe or confirm. If the niche implies more than one must-have entity before anything works end-to-end (e.g. an e-commerce store implies products before checkout), build the minimum needed for one working path, and state explicitly what was included vs deferred.
- Also generate the surrounding project shell: package manifests (`package.json` / `pyproject.toml` / `go.mod` / etc.), lint/format config, `.env.example`, `.gitignore` — alongside the real schema/migration for the entity(ies) above (one DB for Small/Moderate/Moderate–MC, one per service for Large).
- **Moderate–MC/Large**: scaffold one folder per codebase/service, each with its own manifest and entry file; the working build's core flow lives in whichever codebase/service owns it per the discovery answers — the others get shell only, until a real task routes work to them.
- **Initialize a git repository** at the project root (sibling to `ai-sop/`, not inside it) if one doesn't already exist, and make one initial commit containing the working build plus `ai-sop/`. Report the commit message/hash and a one-line list of what was built in the Step 5 summary.
- Anything beyond this first working slice — new features, edge cases, auth, polish — happens after Step 5, through the normal case-detection workflow in `ai-workflow.md`, like any other task.

---

## Step 1 — Determine Project Tier (once, recorded permanently)
**Greenfield**: already decided in Step 0a.3 — skip straight to Step 1b.

Ask the user (if not already stated) which tier applies:

- **Small** — single codebase, no separate modules/sub-agents, one team-sized service. Master agent implements directly.
- **Moderate** — multiple modules/features, each large enough to warrant its own sub-agent, but still one deployable app / one database. Master agent orchestrates; sub-agents implement.
- **Moderate (Multi-Codebase)** — hereafter **Moderate–MC**: multiple separate codebases/repos (e.g. separate frontend, backend, admin-panel repos), each large enough to warrant its own sub-agent, but all reading/writing **one shared database**. Not full microservices — there's one DB, not one-per-service. Master agent orchestrates at codebase granularity; one sub-agent per codebase implements.
- **Large / Microservices** — multiple independent services, each with its own database and module boundary. Master agent orchestrates; one sub-agent per service implements.

If the repo is available, infer the tier from folder structure, number of services, and number of databases — but **confirm with the user before proceeding**. Signal for Moderate–MC specifically: more than one repo/top-level codebase folder, but only one database/schema across all of them — if you see 2+ codebases and 2+ databases, that's Large instead. Record the confirmed tier at the top of `context/master-agent.md` and `context/ai-workflow.md`; every later generation step reads the tier from there.

---

## Step 1b — Detect Optional MCP Integrations (once, recorded permanently)
Check, once, whether an **Azure DevOps MCP server** is connected in this environment (a tool whose name matches a pattern like `mcp__*azure*devops*`, surfaced in the available/deferred tool list). This is a pure environment check — never ask the user to go install or connect one; it's optional tooling, not a project requirement.

- **Connected**: record `Azure DevOps MCP: connected` at the top of `context/ai-workflow.md`, next to the tier. From then on, the generated `ai-workflow.md` includes **Stage 0 — Ticket Context** (see `sop-ai-workflow.md`), which uses the connection automatically whenever a prompt references a ticket/work-item ID — no per-task confirmation, ever, once this is recorded.
- **Not connected**: record `Azure DevOps MCP: not connected`. Stage 0 is omitted from the generated file entirely (not generated as a dead/no-op section) — do not prompt the user about it again.
- Re-check only when the user explicitly says the connection changed, or during a full regeneration (Step 4) — never re-ask on a normal task.

---

## Step 2 — Run the Codemap Tool
Per `sop-codemap-tool.md`:

```bash
node ai-sop/codemap-tool/bin/cli.js generate <path>
```

- **Small / Moderate**: run once against the whole repo → single `codemap-output/`.
- **Moderate–MC**: run once **per codebase** (point at each codebase's folder) → one `codemap-output/<codebase>/` each, but the database is shared — see `sop-codemap-tool.md` for how the single DB codemap is produced once and reused across all codebases.
- **Large**: run once **per service** (point at each service's folder) → one `codemap-output/<service>/` each.
- **Greenfield**: run this against the working build Step 0b just generated, not pre-existing code. Since that build is real, runnable code (not an empty scaffold), this produces a genuine baseline codemap — real modules, files, functions, and DB tables — not placeholder output.

If the tool cannot be run in the current session, say so explicitly, instruct the user to run it, and pause generation of any context file that depends on codemap data (module lists, owned paths, DB objects) until the output exists.

---

## Step 3 — Generate Context Files From SOPs
For each applicable SOP, read its **Generation Rules** for the confirmed tier and its **Generated File Template**, fill the template from the repo + codemap data, and write the result to `context/`. Generate in this order (later files link to earlier ones):

1. `project-standard.md` ← `sop-project-standard.md`
2. `master-agent.md` ← `sop-master-agent.md`
3. Backend/frontend standards ← `sop-backend-standard.md` / `sop-frontend-standard.md`
   - Small: one `backend-standard.md` + one `frontend-standard.md` (whole project).
   - Moderate/Large: first the two **master** files (`backend-standard.md` + `frontend-standard.md` — project-wide layer conventions), then one **short module pair** (`backend-standard-<module>.md` / `frontend-standard-<module>.md`) per module that actually exists in the codemap. Module files carry only module-specific values (owned paths, DB objects, endpoints, approved deviations) and inherit the master files — never repeat master content. Do not invent modules; skip the frontend file for modules with no frontend code (and vice versa).
   - `project-standard.md` is always global — never generated per module.
4. **Moderate/Moderate–MC/Large only**: `model-context.md` ← `sop-model-context.md`
5. **Moderate/Moderate–MC/Large only**: one `module-agent-<module>.md` per module/codebase ← `sop-module-agent.md`. Fill owned paths, DB objects, and exposed/consumed interfaces from the codemap — do not leave placeholders the repo can fill.
6. `case-1.md`, `case-2.md`, `case-3.md` ← `sop-case-1/2/3.md`
7. `post-task-update.md` ← `sop-post-task-update.md`
8. `ai-workflow.md` ← `sop-ai-workflow.md`

**Tier filtering rule:** every generated file contains **only the current tier's rules**. Strip all other tiers' blocks and all tier markers from the output — a generated file must read as if written for this project alone.

**Ask, don't guess:** where a template field is a project decision the repo cannot answer (e.g. commit format, error-handling philosophy), ask the user. If the user defers, write `TBD — ask before relying on this` rather than inventing a value.

---

## Step 4 — Regeneration (running init on a project that already has context/)
Regeneration **updates in place — it never blindly overwrites**:

- Re-read the existing `context/` file before writing.
- **Update** sections derived from the repo/codemap (module lists, owned paths, DB objects, exposed/consumed interfaces) to match current reality.
- **Preserve** every previously filled project decision (conventions, contract entries, escalation log, anything a human or agent wrote). Never replace a filled value with a placeholder.
- **Add** entries for new modules/services; for removed ones, mark the entry `deprecated — removed from repo on <date>` instead of deleting it (delete only when the user confirms).
- If a preserved value now conflicts with repo reality, flag the conflict to the user — do not silently pick a side.
- The tier is not re-decided at regeneration. If the project has genuinely changed tier (e.g. Small has grown modules), stop and confirm with the user; a tier change regenerates all files (still preserving filled values).
- **Mid-project trigger**: this step also runs when `context/post-task-update.md` flags a structural/dramatic change during normal work (new/removed module, codebase, or service; ownership shift stale enough to break a `module-agent-<module>.md`'s "Owns" section) — see its "Structural / Dramatic Changes" section. Regenerate only the flagged files, using the same update-in-place rules above; do not do a full blind regeneration for a localized structural change.

---

## Step 5 — Output Summary
After generating, output:
1. A checklist of every file created/updated in `context/` (and which were skipped, with reason).
2. The attachment order for future work (copy the tier-appropriate block from `ai-sop/README.md`).
3. A reminder to detach `sop-init.md` and use `context/ai-workflow.md` as the always-last attachment going forward.

## Do Not
- Do not write or modify project code while this file is attached — the one exception is Step 0b's greenfield working build, which is bounded strictly to the niche/feature set confirmed in Step 0a (the core entity/flow implied by what the user described), never speculative features beyond that.
- Do not copy any SOP verbatim into `context/` — generation always means: tier-filter + fill from the actual repo.
- Do not edit any file in `sops/` to fit a project — project specifics belong in `context/`.
- Do not invent modules, conventions, or contract entries the repo/user did not provide.
