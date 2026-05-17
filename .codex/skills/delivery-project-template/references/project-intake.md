# Project Intake

Start here when entering an unfamiliar delivery-oriented repository.

## First Pass

Read, in order:

1. repo root `AGENTS.md`
2. repo root `README.md`
3. subproject `AGENTS.md` files
4. deployment and operations docs
5. environment variable references

## Build a Working Map

Identify and write down:

- apps in the repo
- who serves whom
- local run commands
- build commands
- deployment entrypoints
- auth model
- storage locations
- shared types or contracts
- public routes and admin routes
- where uploads and generated files live

## Questions To Answer Early

- Which app is user-facing?
- Which app is admin-facing?
- What is the source of truth for shared data contracts?
- What command actually proves the main app still works?
- What environment variables are mandatory in non-local environments?
- What operational actions are code-driven versus data-driven?

## Risk Inventory

Mark these early if they exist:

- direct database access
- encryption or secret storage
- file uploads
- background jobs
- destructive actions
- soft delete versus hard delete
- deployment scripts that mutate environment files

## Output

Before editing, you should be able to explain:

- how the system is started
- how a user reaches the failing or targeted feature
- what must be verified before you can call the task complete
