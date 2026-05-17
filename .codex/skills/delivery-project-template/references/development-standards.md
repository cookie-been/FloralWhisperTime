# Development Standards

## Default Editing Style

- Make the smallest change that fully solves the problem.
- Stay close to existing project conventions.
- Reuse current helpers, DTOs, hooks, mappers, and response shapes before adding new ones.
- Prefer explicit data structures over ad hoc string handling.

## Boundaries

- Keep frontend, backend, and data responsibilities separate.
- Do not hide contract changes inside unrelated refactors.
- If a field is shared across clients, update the contract and every affected client deliberately.

## Admin and Operations Surfaces

Treat these as high-risk:

- login and password flows
- admin settings
- import/export
- uploads and media
- delete and restore actions
- audit or operation logs
- deployment dashboards or ops centers

For those areas:

- favor conservative changes
- keep behavior obvious
- verify happy path and blocked path

## Data Changes

- Prefer application APIs or service-layer logic over direct storage edits.
- Use logical delete where the system is designed around restore/audit.
- If direct data repair is required, keep it narrow and document what changed.

## Frontend Behavior

- Avoid loading failure-prone secondary data in a way that takes down the whole screen unless that dependency is truly mandatory.
- For admin screens, separate critical data from optional enrichments when possible.
- Keep filters, drawers, tables, and forms stable under partial data.

## Backend Behavior

- Keep error messages actionable.
- Distinguish validation failure, authentication failure, authorization failure, and server failure.
- Do not let optional or recoverable configuration issues crash unrelated admin workflows unless there is a deliberate safety reason.
