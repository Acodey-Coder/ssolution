# frontend-standard.md

> For Moderate/Large tiers, duplicate this file per module (e.g. `frontend-standard-payments.md`) and fill in module-specific values.

## Scope
Applies to: [module name, or "whole project" for Small tier]

## Component Structure
- [Define: folder layout, component naming, container vs presentational split]

## State Management
- [Define: state library used, when local vs global state is used, data-fetching pattern]

## Styling
- [Define: CSS methodology/framework, design tokens, responsive rules]

## Naming Conventions
- [Define: file naming, component naming, prop naming]

## API Integration
- [Define: how this module's frontend calls its backend, error/loading state handling, retry/caching rules]
- Before wiring a new API call, check `codemap.json`/`codemap.md` (via `codemap query <endpoint_or_component>`) to confirm the target endpoint/component already exists or is being planned.

## Testing Requirements
- Case 1: test covering the changed component/logic only.
- Case 2: component tests + module-level integration test.
- Case 3: component tests + cross-module contract test (shared UI contracts, shared props/types).

## Contract Rules (Moderate/Large only)
- Any change to this module's exported components/shared types must be recorded in `model-context.md` and approved by Master Agent before implementation.
