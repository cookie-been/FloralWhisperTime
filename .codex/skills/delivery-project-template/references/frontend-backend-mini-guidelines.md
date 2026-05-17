# Frontend, Backend, And Mini-App Guidelines

Use this when the delivery project spans multiple clients sharing one backend.

## Shared Contract Discipline

- Treat shared types, DTOs, and field names as explicit contracts.
- If a field changes meaning, update every consumer deliberately.
- Do not assume one client can drift because "it is only an admin tool" or "it is only the mini app".

## Typical Multi-Client Failure Modes

- backend returns a new field but one client still assumes the old shape
- admin writes config that the public app uses, but one client never consumes the new field
- optional settings endpoint fails and takes down an unrelated admin page
- mobile or mini-app keeps a local copy of types or constants and falls out of sync

## Configuration Surfaces

If an admin page edits values used by multiple clients:

- identify every consumer
- verify at least one read path per client
- document whether the setting is immediate, cached, or requires redeploy/restart

## Media And Uploads

- keep media URL strategy consistent across clients
- do not introduce one client-specific path scheme unless the backend explicitly supports it
- verify upload, preview, and public render separately

## Admin Gating

If the system enforces states such as:

- first login must change password
- expired token
- disabled feature flag
- deleted record visibility

then verify both:

- the intended blocked experience
- the normal post-recovery experience

## Screen Resilience

Admin screens often compose several APIs. Avoid making one optional endpoint failure destroy the whole page unless the page truly cannot function without it.

Prefer:

- isolate optional panels
- distinguish partial load from full failure
- return clear backend errors when a setting is unreadable or inconsistent
