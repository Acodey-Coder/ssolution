# backend-standard.md

> For Moderate/Large tiers, duplicate this file per module (e.g. `backend-standard-payments.md`) and fill in module-specific values. Keep the structure identical across modules so sub-agents behave consistently.

## Scope
Applies to: [module name, or "whole project" for Small tier]

## API Design
- [Define: REST/GraphQL/RPC convention, versioning strategy, request/response shape, pagination pattern]

## Error Handling
- [Define: error format, status code mapping, logging on error, retry policy]

## Database Access
- [Define: ORM/query builder used, migration strategy, transaction rules, how stored procedures are called]
- This file works together with the DB Codemap Tool — before writing any query touching a table/SP not already known, run:
  `dbmap query <table_or_sp_name>` to confirm relations and dependents before modifying.

## Authentication & Authorization
- [Define: auth mechanism, role/permission checks, where they're enforced]

## Logging & Monitoring
- [Define: log format, log levels, what must always be logged]

## Testing Requirements
- Case 1: unit test covering the changed logic only.
- Case 2: unit tests + module-level integration test.
- Case 3: unit tests + cross-module contract test (shared schema/API).

## Contract Rules (Moderate/Large only)
- Any change to this module's public API/schema that other modules consume must be recorded in `model-context.md` and approved by Master Agent before implementation.
