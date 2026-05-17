# Repository Skills

This directory stores reusable Codex skill templates that can be copied into other repositories.

## Available Template

- `delivery-project-template/`
  - A general-purpose skill for delivery-oriented business projects.
  - Covers development, verification, deployment, operations, documentation, and handoff.

## How To Reuse

1. Copy the whole template directory into the target repository:

```bash
cp -R .codex/skills/delivery-project-template /path/to/target/.codex/skills/<new-skill-name>
```

2. Rename the skill in `SKILL.md` frontmatter:
   - `name`
   - `description`

3. Adjust the reference files under `references/`:
   - remove sections that do not apply
   - add stack-specific commands
   - add repo-specific constraints

4. Keep the structure shallow:
   - `SKILL.md` for trigger conditions and the main workflow
   - `references/` for deeper guidance

## Notes

- Keep the main skill concise enough to scan quickly.
- Put stack-specific or long reference material in `references/`.
- If the target repo already has `AGENTS.md` or equivalent repo instructions, align the copied skill with those files instead of duplicating conflicting guidance.
