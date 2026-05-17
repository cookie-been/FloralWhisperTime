# Delivery Project Skill Template

This repository now includes a reusable Codex skill template under:

[`/.codex/skills/delivery-project-template/`](/workspace/FloralWhisperTime/.codex/skills/delivery-project-template/SKILL.md)

## Purpose

This template is intended for delivery-oriented software projects where implementation work is tightly coupled with:

- verification
- deployment
- environment management
- admin or operations workflows
- documentation
- post-launch maintenance

## What It Includes

- a main `SKILL.md` entry file
- reference guidance for:
  - project intake
  - development standards
  - verification and release
  - data and operations safety
  - delivery documentation
  - multi-client frontend/backend/mobile coordination
  - reusable delivery checklist
  - example prompts
  - stack and project adaptation guide

## How To Reuse In Another Repository

1. Copy the directory:

```bash
cp -R .codex/skills/delivery-project-template /path/to/target/.codex/skills/<new-skill-name>
```

2. Update the frontmatter in `SKILL.md`:

- `name`
- `description`

3. Edit the reference files to match the target stack and workflow.

4. Align the copied skill with the target repository's `AGENTS.md`, `README.md`, and deployment model.

5. Review these optional support references and keep only what helps the target repo:

- `references/delivery-checklist.md`
- `references/example-prompts.md`
- `references/adaptation-guide.md`

## Recommended Adaptation Style

- Keep the main skill generic and stable.
- Put target-repo specifics into reference files.
- Add stack-specific commands only where they help verification or delivery.
- Keep high-risk operational behavior explicit:
  - auth state drift
  - secrets and encryption keys
  - restore and rollback
  - direct data repair

## Repository Note

This template is not limited to the floral project domain. It is meant to be reused for general delivery-oriented business systems.
