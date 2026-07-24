# sop-project-standard.md — SOP for generating `context/project-standard.md`

## Generates
`context/project-standard.md` — the single source of project-wide conventions that every agent (master and sub-agents) inherits. Layer standards (`backend-standard*.md`, `frontend-standard*.md`) refine these per layer/module; they never contradict them.

## Inputs
- Repo manifests (language/framework versions, lint/format configs, test runner).
- Existing code (observed naming, folder structure, error/logging patterns).
- User decisions for anything the repo cannot answer.

---

## Generation Rules

### All tiers
- Fill every section from **observed repo reality first** (read configs, sample the code), then ask the user for genuine decisions (commit format, error philosophy) if not inferable. Write `TBD — ask before relying on this` rather than inventing.
- Include the testing matrix by case — this is the canonical copy; case files and layer standards reference it rather than redefining it.
- Keep this file free of module-specific detail — that belongs in the per-module standards.

### Small
- Sections apply to the whole codebase directly.

### Moderate
- This file is always **global** — there is never a per-module project standard.
- Add the inheritance chain rule: `project-standard.md` (global) → master layer standards (`backend-standard.md` / `frontend-standard.md`) → short module standards (`backend-standard-<module>.md` / `frontend-standard-<module>.md`). Each level may **tighten** the level above but never loosen or contradict it. Conflicts escalate to the master agent.

### Moderate (Multi-Codebase)
- Same as Moderate, plus: conventions that are per-codebase by nature (e.g. language/framework can differ per codebase, since each is a separate repo) are marked `per-codebase — see the codebase's own standards`, with the project-wide floor stated here. State explicitly that the **database is shared** — this is the one thing that is emphatically NOT per-codebase; every codebase's standards point at the same `db-codemap`.

### Large / Microservices
- Same as Moderate, plus: conventions that are per-service by nature (e.g. language version can differ per service) are marked `per-service — see the service's own standards`, with the project-wide floor stated here (e.g. "every service must have structured logging with a correlation id").

---

## Generated File Template

```markdown
# project-standard.md — <project name> (tier: <tier>)

> Project-wide conventions — this file is always global, never per module. Every agent inherits these. [MODERATE/MODERATE-MC/LARGE: Inheritance chain: this file → master layer standards (`backend-standard.md` / `frontend-standard.md`) → short module standards. Each level may tighten but never loosen the one above; conflicts go to the master agent.]

## Language & Tooling
- Language/framework + version: <from manifests>
- Lint/format: <tools + config file paths>
- Package manager / build: <observed>

## Naming Conventions
- Files: <observed pattern>
- Functions/classes/variables: <observed pattern>
- Database objects: <observed pattern>

## Folder Structure
- <top-level layout, where new code goes>

## Commit & Branch Format
- <format — ask user if not inferable from git history>

## Error Handling Philosophy
- <how errors are represented, propagated, logged; ask user if unclear>

## Logging Strategy
- <format, levels, what must always be logged>
[MODERATE-MC] - Project-wide floor: <e.g. structured logs + correlation id in every codebase>. Details per codebase in its own standards. The database itself is shared — logging/tracing conventions for DB access should be consistent enough that a query can be traced back to the codebase that issued it.
[LARGE] - Project-wide floor: <e.g. structured logs + correlation id in every service>. Details per service in its own standards.

## Testing Matrix (canonical — referenced by all case files and layer standards)
- **Case 1**: unit test covering the changed logic only.
- **Case 2**: unit tests per layer + one <module|service|feature>-level integration test.
- **Case 3**: unit tests per layer per <scope unit> + cross-boundary contract/integration test.
- Test runner & location conventions: <observed>

[MODERATE/MODERATE-MC/LARGE]
## Inheritance Rule
This file is always global — it is never generated per module. The chain is: `project-standard.md` → master `backend-standard.md` / `frontend-standard.md` → short `backend-standard-<module>.md` / `frontend-standard-<module>.md`. Every level (and every `module-agent-*.md`) inherits the level above; a lower level may tighten a rule, never loosen or contradict it. Conflicts escalate to the master agent.
```

---

## Regeneration
- Update tooling/version sections from current manifests.
- **Never** overwrite a filled convention with an inferred one — if observed reality now conflicts with a recorded convention, flag the conflict to the user.
- Resolve any remaining `TBD` items by asking the user again.
