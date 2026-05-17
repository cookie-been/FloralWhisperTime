# Verification And Release

## Proof Before Claims

Every important claim needs a proving command.

Examples:

- "build passes" -> run the build command
- "login works" -> perform login and inspect the result
- "deployment succeeded" -> check health endpoint and critical UI path
- "admin screen is fixed" -> verify the screen's backing APIs and, if possible, the rendered page

## Verification Layers

Use the smallest set that truly proves the task:

1. static verification
   - type check
   - build
   - targeted tests
2. service verification
   - backend health
   - required API endpoints
3. product verification
   - user path
   - admin path
4. delivery verification
   - deployed URL
   - container/process status
   - post-deploy smoke checks

## Deployment Rules

- If the user expects a deployed result, do not stop at local code changes.
- Reuse the repo's official deployment entrypoint if one exists.
- Prefer deployment flows that preserve the repo's operational model instead of improvising one-off commands.
- When deployment fails, identify the exact failing stage:
  - build
  - container startup
  - health check
  - auth check
  - downstream smoke test

## Release And Push

Before commit or push:

- check working tree
- verify only intended files are included
- run the commands that justify the claims in the final message

Before calling a release done:

- confirm the target environment is running the new version
- confirm the expected URL or entrypoint works
- record the deployed revision if the project supports it

## Rollback Mindset

If the change affects deploy, data, or auth, ask:

- how would this be rolled back?
- is the previous state still recoverable?
- did this task change the documented recovery path?
