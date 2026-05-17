# Delivery Documentation

## Update Docs When Reality Changes

Documentation must be updated when any of these change:

- startup commands
- build commands
- deployment steps
- environment variables
- password or auth behavior
- backup, restore, rollback, or recovery process
- admin workflows
- cross-client shared fields

## Minimum Delivery Set

For a delivery-oriented project, keep these understandable:

- quick start
- environment variables
- deployment process
- rollback or recovery process
- admin access expectations
- data safety notes
- current release notes or recent operational changes

## Write For The Next Operator

Assume the next person:

- did not build the system
- may not know the tech stack deeply
- needs to recover service quickly
- needs to know which passwords, keys, and URLs matter

Prefer:

- exact commands
- exact file paths
- exact environment variable names
- exact verification endpoints

## Release Notes Should Mention

- user-visible changes
- admin-visible changes
- operational changes
- security-sensitive changes
- environment or secret changes
- migration or repair actions performed
