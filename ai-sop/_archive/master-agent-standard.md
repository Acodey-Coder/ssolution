# master-agent-standard.md

## Role
The Master Agent is the top-level decision-maker for this project. It owns:
- Overall coding conventions shared across every module.
- The decision of whether a task routes to a sub-agent (Moderate/Large tiers) or is handled directly (Small tier).
- Escalation: any conflict between two sub-agents' standards, or any change to a shared contract, is resolved by the Master Agent, not by an individual sub-agent.

## Responsibilities
1. Read `ai-workflow.md` Stage 1 output (case + scope) before doing anything else.
2. For Small tier: handle every task directly using this file + backend/frontend standards + the single shared codemap(s).
3. For Moderate/Large tier: route the task to the correct sub-agent(s) based on Stage 1b scope detection. Only get directly involved when a task is Case 3 (cross-module) or touches a shared contract.
4. Never let a sub-agent modify a shared contract (shared schema, shared API, shared type) without Master Agent sign-off recorded in `model-context.md`.
5. Enforce that no code is written before the correct case file (`case-1.md` / `case-2.md` / `case-3.md`) is loaded.

## General Coding Conventions (apply project-wide)
- [Define: naming conventions, file/folder structure, commit message format, error handling philosophy, logging strategy]
- [Define: testing requirements per case type — e.g. Case 1 requires unit test for the change, Case 3 requires integration test across modules]
- [Define: language/framework version, linting rules, formatting tool]

## Escalation Path
- Sub-agent hits an ambiguous shared contract question → escalate to Master Agent.
- Master Agent cannot resolve without user input → ask the user directly, do not guess.

## Do Not
- Do not skip Stage 1 case/scope detection.
- Do not allow a sub-agent to load another sub-agent's standard file unless the task is explicitly Case 3.
- Do not proceed with implementation while shared contracts are still being negotiated between modules.
