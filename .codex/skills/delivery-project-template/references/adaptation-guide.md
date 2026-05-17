# Adaptation Guide

Use this when copying the template into another repository.

## Keep Stable

Usually keep these parts generic:

- the main workflow in `SKILL.md`
- the proof-before-claims rule
- the delivery mindset
- the data safety posture
- the documentation and handoff expectations

## Customize First

Adjust these first for the target repo:

- trigger description in frontmatter
- startup commands
- build commands
- deployment entrypoints
- release packaging steps
- environment variable names
- auth and secret model
- client matrix

## By Stack

### Java / Spring / Maven

Adapt for:

- `mvn test`
- `mvn package`
- Flyway or Liquibase migrations
- encrypted settings tables
- Spring Security auth flows

Watch for:

- profile-specific behavior
- migration order
- startup validation on production env vars

### Node / React / Vite / Next

Adapt for:

- type-check commands
- build commands
- env prefixes
- client-side versus server-side config boundaries

Watch for:

- admin pages blocked by one optional API
- shared DTO drift
- runtime base URL mismatches

### Mini Program / Mobile Client

Adapt for:

- local config copies
- platform-specific request base URLs
- asset path assumptions
- admin-managed content synchronization

Watch for:

- local shared type copies drifting from backend
- image path incompatibility
- stale configuration reads

### Docker / Compose / Cloud Deploy

Adapt for:

- official deploy wrapper
- health check endpoints
- persistent storage locations
- secret injection method
- revision recording

Watch for:

- env file drift
- deploy script assumptions
- post-deploy checks that assume old auth or data state

## By Delivery Model

### Internal Product

Lean harder on:

- deploy safety
- rollback
- on-call clarity

### Customer Delivery / Handoff

Lean harder on:

- install docs
- release notes
- env templates
- operator-facing guidance
- final acceptance checklist

### Multi-Tenant Or Multi-Environment

Add explicit guidance for:

- naming environments
- isolated compose project names or namespaces
- secrets separation
- per-environment data repair rules

## Final Adaptation Pass

Before considering the copied skill ready:

- remove references that do not apply
- insert the real proving commands
- insert the real deploy path
- insert the real high-risk surfaces
- confirm it matches repo instructions instead of competing with them
