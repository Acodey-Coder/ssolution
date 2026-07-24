# sop-master-agent.md — SOP for generating `context/master-agent.md`

## Generates
`context/master-agent.md` — the master agent's role definition. What the master agent *is* differs sharply by tier, and the generated file must contain only the current tier's role.

---

## Generation Rules

### All tiers
The generated file must:
- Record the project tier at the top (this is the tier of record, set at init).
- Make the master agent the enforcer of the workflow: no code before Stage 1 resolution, no completion before Stage 2.
- Defer all project-wide conventions to `context/project-standard.md` (the master agent enforces them; it does not define them inline).
- Define the escalation terminus: if the master agent cannot resolve something without user input, it asks the user — it never guesses.

### Small
- The master agent is the **only** agent: it detects the case (Stage 1a), loads the case file, and **implements directly** using the layer standards.
- No routing, no sub-agents, no `model-context.md`.

### Moderate
- The master agent is an **orchestrator, not an implementer**. It owns:
  - Stage 1 (case + scope detection) and routing each task to the owning module's sub-agent.
  - Shared-contract governance: no contract changes without master-agent sign-off recorded in `model-context.md`.
  - Escalation resolution between sub-agents.
  - Case 3 coordination: locking contracts first, then dispatching slices, then verifying every module ran post-task-update.
- **Hard rule**: the master agent never writes module code itself. If a task looks too small to route, it is still routed — Case 1 in Moderate tier is sub-agent work.

### Moderate (Multi-Codebase)
- Same orchestrator role as Moderate, at codebase granularity, plus:
  - Governs the single shared database as a shared resource: any table/procedure touched by 2+ codebases is a shared contract requiring a lock in `model-context.md`, the same discipline as any other Moderate shared contract — **not** a hard "different database" boundary the way Large treats cross-service DB access.
  - Ensures sub-agents query only their own codebase's **code** codemap (`codemap-output/<codebase>/`), but may query the shared DB codemap freely.
  - Owns the (optional) Cross-Codebase Connectivity map for any direct API/event calls between codebases — approves any new one before implementation.

### Large / Microservices
- Same orchestrator role as Moderate, at service granularity, plus:
  - Owns the routing map between services (`model-context.md` → Cross-Module Connectivity); approves any new cross-service dependency before implementation.
  - Ensures sub-agents only ever query their own service's `codemap-output/<service>/`.

---

## Generated File Template

```markdown
# master-agent.md — <project name> (tier: <tier>)

## Role
[SMALL] The master agent is the single agent for this project. It detects the case (via `ai-workflow.md`), loads the case file, and implements directly following `project-standard.md` and the layer standards.
[MODERATE/MODERATE-MC/LARGE] The master agent is the orchestrator for this project. It routes, governs contracts, and resolves escalations. **It does not implement — all implementation is done by <module|service> sub-agents in their own context windows.**

## Responsibilities
1. Run `ai-workflow.md` Stage 0 (if the project has an Azure DevOps MCP connection and the prompt references a ticket — never ask permission, the connection was already confirmed at init), then Stage 1 (case [MODERATE/MODERATE-MC/LARGE: + scope] detection) before anything else.
[SMALL] 2. Implement the task per the selected case file, using `project-standard.md` + the relevant layer standard(s).
[MODERATE/MODERATE-MC/LARGE] 2. Route every task — including Case 1 — to the owning sub-agent via its `module-agent-<module>.md`. Never implement module code directly.
[MODERATE/MODERATE-MC/LARGE] 3. Govern shared contracts: no sub-agent modifies a shared schema/API/type/event without master-agent sign-off recorded in `model-context.md`.
[MODERATE/MODERATE-MC/LARGE] 4. Coordinate Case 3: lock every contract in `model-context.md` first, dispatch slices to sub-agents, verify each ran `post-task-update.md`.
[MODERATE-MC] 5. Govern the shared database as a shared resource: a table/procedure touched by 2+ codebases is a shared contract to lock, not a forbidden boundary; own the optional Cross-Codebase Connectivity map for direct API/event calls between codebases.
[LARGE] 5. Own the cross-service routing map (`model-context.md` → Cross-Module Connectivity); approve new cross-service dependencies before implementation.
N. Enforce: no code before the correct case file is loaded; no completion before Stage 2.

## Conventions
All project-wide conventions live in `context/project-standard.md` (always global — never per module)[MODERATE/MODERATE-MC/LARGE: , refined by the master layer standards `backend-standard.md` / `frontend-standard.md` (also global, owned by the master agent), which each module's short `backend-standard-<module>.md` / `frontend-standard-<module>.md` inherits]. The master agent enforces them[; sub-agents inherit them via their module-agent files].

## Escalation Path
[MODERATE/MODERATE-MC/LARGE] - Sub-agent hits a shared-contract question or a boundary ambiguity → escalates to the master agent (format defined in the module-agent file).
- Master agent cannot resolve without user input → ask the user directly. Never guess.

## Do Not
- Do not skip Stage 1 case[/scope] detection.
[MODERATE/MODERATE-MC/LARGE] - Do not implement module code in the master agent's window — route it.
[MODERATE/MODERATE-MC/LARGE] - Do not let a sub-agent load another sub-agent's files unless the task is explicitly Case 3.
[MODERATE/MODERATE-MC/LARGE] - Do not proceed while shared contracts are still being negotiated.
```

---

## Regeneration
Preserve any project-specific responsibilities or escalation entries added; update module/service references from the current registry.
