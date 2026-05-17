---
name: delivery-project-template
description: Use when working on a delivery-oriented software project that spans implementation, verification, deployment, operations, documentation, and customer handoff, especially when the repo contains multiple apps, admin flows, environment setup, or post-launch maintenance concerns.
---

# Delivery Project Template

## Overview

This skill is for practical delivery work, not isolated feature coding.

Use it when the real job includes some mix of:
- code changes
- environment and deployment work
- admin or operations flows
- data safety concerns
- release notes or handoff documentation

The governing rule is simple:

**Do not treat development, deployment, documentation, and operational safety as separate afterthoughts.**

## When to Use

Use this skill when the project has one or more of these traits:

- a web app plus backend, or multiple clients sharing one API
- admin or operator-facing workflows
- environment variables, secrets, storage, uploads, or scheduled tasks
- Docker, Compose, cloud deployment, or release packaging
- customer handoff, implementation delivery, or long-term maintenance concerns
- data repair, migration, logical delete, backup, or restore requirements

Do not use this skill for:

- tiny throwaway scripts with no deployment or delivery surface
- isolated algorithm exercises
- pure research tasks with no codebase or operational responsibility

## Core Workflow

Work in this order:

1. Read the repo instructions first.
2. Map the system before changing it.
3. Change the smallest correct surface.
4. Verify with the real commands that prove the claim.
5. Deploy or package when the user expects a usable result.
6. Update docs when behavior, operations, or handoff expectations changed.
7. Leave behind a system that the next engineer can actually run and maintain.

## Non-Negotiables

- Read `AGENTS.md`, project README files, and deployment docs before making assumptions.
- Prefer existing project patterns over inventing new abstractions.
- Treat admin flows, background jobs, uploads, secrets, and data migrations as higher-risk surfaces.
- Never claim something is fixed, deployed, or safe without direct verification evidence.
- Do not mutate production-like data blindly. Inspect first, back up first, change narrowly, verify after.
- Do not update docs only at the end if the operational model changed during the work.

## Working Areas

Use these references as needed:

- [project-intake.md](references/project-intake.md)
- [development-standards.md](references/development-standards.md)
- [verification-release.md](references/verification-release.md)
- [data-ops-safety.md](references/data-ops-safety.md)
- [delivery-docs.md](references/delivery-docs.md)
- [frontend-backend-mini-guidelines.md](references/frontend-backend-mini-guidelines.md)
- [delivery-checklist.md](references/delivery-checklist.md)
- [example-prompts.md](references/example-prompts.md)
- [adaptation-guide.md](references/adaptation-guide.md)

## Escalation Rules

Escalate the task mentally into a higher-risk mode when any of the following are true:

- the user is blocked from logging in or using the admin
- the issue touches authentication, secrets, encryption keys, billing, uploads, backups, or deletes
- a deployment succeeds technically but the app is not actually usable
- one client works and another client has drifted from the shared contract
- the data model changed and the documentation still describes the old behavior

In those cases:

- inspect the live behavior directly
- capture the failing point exactly
- prefer one narrow corrective action at a time
- verify the repaired path end to end

## Completion Standard

A delivery task is only complete when the relevant subset is true:

- the code change is in place
- the affected apps build or run as required
- the critical user path is verified
- deployment or packaging is handled if the user expected it
- operational fallout is addressed
- docs or runbooks match the new reality
- the final state is clear enough for a different engineer to continue without guesswork
