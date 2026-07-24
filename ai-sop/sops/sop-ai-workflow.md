# sop-ai-workflow.md — SOP for generating `context/ai-workflow.md`

## Generates
`context/ai-workflow.md` — the always-attached-last routing file for every coding prompt. It runs Stage 0 (optional ticket context), Stage 1 (case + scope detection), and enforces Stage 2 (post-task update).

## Inputs
- Project tier (from init).
- Azure DevOps MCP connection status (from init, Step 1b) — determines whether Stage 0 is included at all.
- Module/service list from `codemap-output/` (Moderate/Large — used in the scope-detection wording).

---

## Generation Rules

### All tiers
The generated file must:
- Declare the project tier at the top, and the Azure DevOps MCP connection status next to it.
- Include **Stage 0 — Ticket Context** only if `sop-init.md` Step 1b recorded the MCP connection as `connected`; omit it entirely (not as a dead section) if `not connected`.
- Contain Stage 1a (case detection) classifying every request as Case 1 / 2 / 3, with the tier-specific case definitions taken from `sop-case-1/2/3.md`.
- Name the exact next file(s) to attach once the case is detected.
- Contain the Stage 2 rule: no task is complete until `context/post-task-update.md` has run or been explicitly flagged pending, including its structural-change check.
- Contain the hard rule: **no code is written or modified until case (and scope, where applicable) is resolved and the correct case file is loaded.**
- Contain only the current tier's stages — strip the other tiers' blocks entirely.

### Stage 0 — Ticket Context (only if Azure DevOps MCP is connected)
- **Trigger**: the prompt references a ticket/work-item ID (e.g. `#1234`, `AB#1234`, "work item 1234") or pastes an Azure DevOps work-item URL.
- **Action**: before Stage 1a, call the Azure DevOps MCP tool(s) to fetch that work item's title, description, acceptance criteria, and any linked PRs/commits.
- **No per-task permission ask**: the connection was already confirmed once at init (`sop-init.md` Step 1b) — never ask the user "should I use Azure DevOps for this?" again; just use it when the trigger fires.
- Feed the fetched description/acceptance criteria into Stage 1a case detection and Stage 1b scope detection as extra signal (e.g. a description naming a table or module helps confirm scope) — it does not replace either stage, it informs them.
- **No ticket ID referenced** → skip Stage 0 silently, go straight to Stage 1a. Do not fetch anything speculatively.
- If the MCP call itself fails or the item isn't found, say so and fall back to Stage 1a using only the prompt text — never block on it.

### Small
- **No Stage 1b (scope detection)** — there are no modules or sub-agents. Stage 1a routes straight to the case file, and the master agent implements directly.
- Context load per case is decided by the case file (layer standards only, codemap queried not bulk-loaded).

### Stage 1b — Scope Detection (structure, all tiers that have it)
Generate Stage 1b as separate sub-headings, not a flat list — it's re-read on every prompt, so it needs to be scannable:
- **1b.1 — Identify Touched Scope**: a codemap `query <term>` is mandatory here, every time, even when the prompt names the module/codebase/service explicitly — never rely on the prompt's wording alone. Only if the query returns no match may scope be inferred from the prompt text alone or by asking the user; say so explicitly when falling back, and `refresh` + re-query first if the term is expected to exist.
- **1b.2 — Scope Is Clear**: what the master agent states back and which file it hands off to.
- **1b.3 — Scope Is Ambiguous**: the ask-the-user rule.
- **1b.4 — Tier-Specific Rules**: only the current tier's escalation-to-Case-3 triggers (Moderate–MC's shared-DB nuance, or Large's cross-service rule) — omit this sub-heading entirely for plain Moderate, which has no extra tier-specific trigger beyond Case 3's own definition.

### Moderate
- 1b.1: infer which module(s) the task touches via explicit names in the prompt and `node ai-sop/codemap-tool/bin/cli.js query <term>` against the single shared codemap (results are tagged by owning module).
- 1b.2: state scope back to the user, name the sub-agent and its bootstrap file `context/module-agent-<module>.md`, and hand off — **the master agent does not implement**.
- 1b.3: ask the user which module(s) apply. Never guess; never default to loading everything. The user may pre-specify scope in the prompt to skip confirmation.
- 1b.4: not generated for plain Moderate (no extra tier-specific trigger).

### Moderate (Multi-Codebase)
- 1b.1: infer which **codebase(s)** the task touches via explicit names in the prompt or `query <term>`. Code queries run against that codebase's own `codemap-output/<codebase>/`; DB-related queries (`query <table>`) run against the single **shared** `db-codemap` regardless of which codebase is asking — it's the same DB for every codebase.
- 1b.2: name the sub-agent and its bootstrap file `context/module-agent-<codebase>.md`, and hand off.
- 1b.3: same ask-the-user rule as Moderate.
- 1b.4: a task touching a DB table/procedure also used by another codebase is **not automatically Case 3** — the DB is shared by design. It's Case 3 only if the task changes that table/procedure's shape, or otherwise turns shared usage into a genuine shared-contract change (per `context/case-3.md`). A task touching two or more codebases' *code* directly (not just the shared DB) is Case 3 by definition.

### Large / Microservices
- 1b.1: scope resolution names the owning **service** and its own `codemap-output/<service>/`; queries run against that service's codemap, not a global one.
- 1b.2/1b.3: same shape as Moderate, at service granularity.
- 1b.4: any task whose scope spans two or more services is Case 3 by definition and stays with the master agent for contract-locking (per `context/case-3.md`) before any sub-agent starts.

---

## Generated File Template
(Fill per tier; keep only the current tier's blocks; replace `<...>` from repo/codemap data.)

```markdown
# ai-workflow.md — <project name> (tier: <Small|Moderate|Moderate–MC|Large>) (Azure DevOps MCP: <connected|not connected>)

> Attach this file to every prompt, always last.
> It runs [STAGE 0: Stage 0 (ticket context), then] Stage 1: case detection [MODERATE/MODERATE-MC/LARGE: + scope detection]. Do not implement until Stage 1 is resolved.

[STAGE 0 — only if Azure DevOps MCP: connected]
## Stage 0 — Ticket Context
If the prompt references a ticket/work-item ID (e.g. `#1234`, `AB#1234`) or an Azure DevOps work-item URL: use the Azure DevOps MCP connection to fetch that item's title, description, acceptance criteria, and linked PRs/commits — before Stage 1a. Feed this into Stage 1a/1b as extra signal; it does not replace them.
- Never ask the user for permission to use the connection — it was confirmed once at init.
- No ticket ID referenced → skip this stage silently.
- MCP call fails or item not found → say so, fall back to the prompt text alone, do not block.
[END STAGE 0]

## Stage 1a — Case Detection
Classify the request as:
- **Case 1**: <tier-specific definition from sop-case-1.md>
- **Case 2**: <tier-specific definition from sop-case-2.md>
- **Case 3**: <tier-specific definition from sop-case-3.md>
State the detected case and name the case file to attach next (`context/case-N.md`).

[MODERATE/MODERATE-MC/LARGE ONLY]
## Stage 1b — Scope Detection

### 1b.1 — Identify Touched Scope
**Query first, always** — `node ai-sop/codemap-tool/bin/cli.js query <term>` is mandatory before scope is treated as resolved, even when the prompt names the module/codebase/service explicitly. Only if the query returns nothing, fall back to the prompt's wording alone or ask the user, and say so explicitly (refresh + re-query first if the term should exist).
Known modules: <module list from codemap>.

### 1b.2 — Scope Is Clear
State it back to the user, name `context/module-agent-<module>.md` as the sub-agent bootstrap, and hand off. The master agent routes only — it does not implement.

### 1b.3 — Scope Is Ambiguous
Ask the user which module(s)/codebase(s)/service(s) apply. Do not guess. Do not load everything. The user may pre-specify scope in the prompt to skip this.

[MODERATE-MC ONLY]
### 1b.4 — Moderate–MC Rules
Code queries run against the named codebase's own codemap; DB queries (`query <table>`) always run against the single shared `db-codemap`, regardless of codebase. A table/procedure shared with another codebase is fine to read; changing its shape is Case 3. Two or more codebases' *code* in scope → Case 3.
[END MODERATE-MC ONLY]

[LARGE ONLY]
### 1b.4 — Large Rules
Two or more services in scope → Case 3; master agent locks contracts in `context/model-context.md` before any sub-agent starts.
[END LARGE ONLY]
[END MODERATE/MODERATE-MC/LARGE]

## Stage 2 — Post-Task Update (mandatory)
Before reporting any task complete, follow `context/post-task-update.md` in full — Case 1 tasks included. If the change was structural (new/removed module, codebase, or service — see `post-task-update.md` → Structural / Dramatic Changes), do not close the task until that has been flagged to the user.

## Rule
No code is written or modified until: case is detected[, scope is resolved,] and the correct case file plus only the scope-relevant context files are loaded. No task is complete until Stage 2 has run or been explicitly flagged pending.
```

---

## Regeneration
- Update the known-module list from the current codemap; preserve any project-specific routing notes previously added.
- If the tier changed, this file is regenerated as part of the full tier-change regeneration (see `sop-init.md` Step 4).
- Re-check Azure DevOps MCP connection status only if the user says it changed; otherwise carry the previously recorded value forward as-is (do not silently flip Stage 0 on/off).
