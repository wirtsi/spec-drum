# CLAUDE.md

spec-drum is a spec-driven development tool for Claude Code. It is loosely
based on the ideas of <https://github.com/gsd-build/get-shit-done>, <https://github.com/github/spec-kit>
and <https://github.com/bmad-code-org/BMAD-METHOD> but utilises the latest Claude Code features.

## Repo Structure

- `skills/` — Source skill files (published to npm, copied by the installer)
- `specs/` — Source spec conventions file
- `bin/install.js` — CLI installer (`npx spec-drum`)
- `package.json` — npm package config

## spec-drum Skills

### Workflow
1. `/spec-init` — Scaffold spec-drum: analyze codebase, create directory-scoped CLAUDE.md files, set up `.specs/`
2. `/spec-plan <ticket>` — Create a spec from a ticket (GitHub issue URL, Jira ID, or description)
3. `/spec-execute <ticket-id>` — Execute the spec (creates branch, implements tasks, commits)
4. `/spec-verify <ticket-id>` — Verify the implementation against the spec

### Conventions
- Directory-scoped CLAUDE.md files contain codebase conventions
- `.specs/CLAUDE.md` defines spec format and rules
- One git branch per ticket, commit format: `<ticket-id>: T<N> - <description>`
