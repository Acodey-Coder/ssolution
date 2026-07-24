# master-agent.md — ssolution (tier: Small)

## Role
The master agent is the single agent for this project. It detects the case (via `ai-workflow.md`), loads the case file, and implements directly following `project-standard.md` and `frontend-standard.md`.

## Responsibilities
1. Run `ai-workflow.md` Stage 1 (case detection) before anything else.
2. Implement the task per the selected case file, using `project-standard.md` + `frontend-standard.md` (no `backend-standard.md` exists — this project has no backend).
N. Enforce: no code before the correct case file is loaded; no completion before Stage 2 (`post-task-update.md`).

## Conventions
All project-wide conventions live in `context/project-standard.md` (always global). The master agent enforces them.

## Escalation Path
- Master agent cannot resolve something without user input → ask the user directly. Never guess.

## Do Not
- Do not skip Stage 1 case detection.
