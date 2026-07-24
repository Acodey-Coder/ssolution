# sop-frontend-standard.md — SOP for generating frontend standard file(s)

## Generates
- **Small**: one `context/frontend-standard.md` for the whole codebase.
- **Moderate/Large**: **two levels**:
  1. **Master frontend standard** — one `context/frontend-standard.md` for the whole project: the global frontend conventions every module follows (framework, component structure, state management, styling, API-integration rules). Owned by the master agent.
  2. **Module frontend standard** — one **short** `context/frontend-standard-<module>.md` per module/service that has frontend code: module-specific values ONLY (owned component paths, consumed endpoints, exported shared components, approved deviations). It inherits the master file and must never repeat its content. Generated only for modules that actually exist in the codemap; skipped entirely for modules with no frontend.

## Inputs
- `context/project-standard.md` (global — the master frontend standard refines it, never contradicts it).
- `codemap-output/` (module list, component files per module).
- Observed frontend code (framework, state library, styling approach, data-fetching pattern).

## Inheritance Chain (Moderate/Large)
`project-standard.md` (global, all layers) → `frontend-standard.md` (master, frontend-wide) → `frontend-standard-<module>.md` (module, short). Each level may **tighten** the level above, never loosen or contradict it. Conflicts escalate to the master agent. `project-standard.md` always stays global — there is never a per-module project standard.

---

## Generation Rules

### All tiers
- Fill from observed code first; ask only for genuine decisions; `TBD` over invention.
- Include the codemap rule: before wiring a new API call, run `node ai-sop/codemap-tool/bin/cli.js query <endpoint_or_component>` to confirm the target endpoint/component exists or is planned.
- Reference the testing matrix in `project-standard.md` — do not restate it.

### Small
- Single file, scope = whole project frontend. No contract-rules section. No module files.

### Moderate
- **Master file**: contains ALL project-wide frontend conventions — component structure, state management, styling, naming, API-integration and error/loading-state rules. No module-specific content in it.
- **Module files**: keep them SHORT — only what is owned by or differs for that module:
  - Owned component paths (from the shared codemap, tagged by module).
  - Backend endpoints this module's frontend consumes (from codemap).
  - Shared/exported components or types this module exposes to others.
  - Any approved module-specific deviation or tightening.
  - For everything else the file says: "per master `frontend-standard.md`" — never copy master content in.
- Module contract rule: any change to this module's exported components/shared types used by other modules must be recorded in `model-context.md` and approved by the master agent first.

### Moderate (Multi-Codebase)
- Same two-level structure at codebase granularity, plus:
- The codebase file names which backend this frontend consumes (usually the one shared backend codebase, or another frontend's exported components if any). Consuming a **new** codebase's API/component directly is a new cross-codebase dependency requiring a `model-context.md` Cross-Codebase Connectivity entry first (Case 3 territory) — data reached only through the shared database does not count.
- If a codebase's frontend legitimately uses a different stack (within the `project-standard.md` per-codebase floor), its file states the differing values.

### Large / Microservices
- Same two-level structure at service granularity, plus:
- The service file names which service APIs this frontend consumes, and carries the rule: consuming a **new** service's API is a new cross-service dependency requiring a `model-context.md` Connectivity entry first (Case 3 territory).
- If a service's frontend legitimately uses a different stack (within the `project-standard.md` per-service floor), its service file states the differing values.

---

## Generated File Templates

### 1. Master template — `frontend-standard.md` (Small: the only frontend file; Moderate/Large: the master file)

```markdown
# frontend-standard.md — <project name> (tier: <tier>) [MODERATE/MODERATE-MC/LARGE: — MASTER]

## Scope
[SMALL] Whole project frontend.
[MODERATE/MODERATE-MC/LARGE] Project-wide frontend conventions. Every module's `frontend-standard-<module>.md` inherits this file and may only tighten it. Inherits `project-standard.md`.

## Component Structure
- Framework: <observed>; folder layout: <observed>; naming: <observed>; container/presentational split: <observed/asked>

## State Management
- Library: <observed>; local vs global rules: <observed/asked>; data-fetching pattern: <observed>

## Styling
- Methodology/framework: <observed>; design tokens: <observed>; responsive rules: <observed/asked>

## API Integration
- Error/loading state handling: <observed>; retry/caching: <observed/asked>
- Before wiring a new API call: `node ai-sop/codemap-tool/bin/cli.js query <endpoint_or_component>` to confirm the target exists or is planned.
[MODERATE-MC] - Consuming a NEW codebase's API/component directly = new cross-codebase dependency → requires a `model-context.md` Cross-Codebase Connectivity entry first (Case 3). Data reached only via the shared database does not count.
[LARGE] - Consuming a NEW service's API = new cross-service dependency → requires a `model-context.md` Connectivity entry first (Case 3).

## Testing
Per the testing matrix in `project-standard.md`, using <test tooling observed>.
```

### 2. Module template — `frontend-standard-<module>.md` (Moderate/Large only — keep SHORT)

```markdown
# frontend-standard-<module>.md — <project name> (module: <module>)

> Inherits the master `frontend-standard.md` — everything not stated here follows the master file. This file lists ONLY what is specific to `<module>`.

## Owned
- Frontend paths: <from codemap>
- Backend endpoints consumed: <from codemap[, (MODERATE-MC) which codebase's API] [, (LARGE) which service's API]>
- Exported shared components/types: <from codemap / model-context.md>

## Module-Specific Rules / Deviations
- <only approved deviations or tightenings vs the master file; otherwise "None — per master frontend-standard.md">

## Contract Rules
Any change to this module's exported components/shared types used by other modules must be recorded in `model-context.md` and approved by the master agent before implementation.
```

---

## Regeneration
- Master file: preserve every filled convention; flag conflicts instead of overwriting.
- Module files: update owned paths / consumed endpoints from the current codemap; add files for new frontend modules; mark removed ones deprecated.
- If a module file is found repeating master content, regeneration trims it back to module-specific values only (after confirming nothing unique is lost).
