# spec-drum

Spec-driven development for [Claude Code](https://code.claude.com). Turns tickets into structured specs, executes them task-by-task with atomic commits, and verifies the result.

Requires **Claude Code >= 2.1.63** (for `/batch` and `/simplify` support).

## Install

```bash
npx spec-drum
```

You'll be prompted to install locally (this project) or globally (`~/.claude/`).

### Non-interactive

```bash
npx spec-drum --local   # install to .claude/ and .specs/
npx spec-drum --global  # install to ~/.claude/
```

## Workflow

1. **`/spec-init`** — Scaffold spec-drum: analyze your codebase, create directory-scoped CLAUDE.md convention files, set up `.specs/`
2. **`/spec-plan <ticket>`** — Create a spec from a GitHub issue URL, Jira ID, or plain text description
3. **`/spec-execute <ticket-id>`** — Execute the spec: creates a branch, implements tasks with atomic commits, tracks progress
4. **`/spec-verify <ticket-id>`** — Verify the implementation against the spec's requirements and acceptance criteria

## What gets installed

### Local (`--local`)

```
.claude/skills/
  spec-init/SKILL.md
  spec-plan/SKILL.md
  spec-execute/SKILL.md
  spec-verify/SKILL.md
.specs/
  CLAUDE.md              # Spec conventions
```

### Global (`--global`)

```
~/.claude/skills/
  spec-init/SKILL.md
  spec-plan/SKILL.md
  spec-execute/SKILL.md
  spec-verify/SKILL.md
```

## Updating

Run `npx spec-drum` again. Unchanged files are skipped. Modified files prompt you to overwrite, skip, or backup.

## License

Apache-2.0
