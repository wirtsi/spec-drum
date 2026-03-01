# spec-drum

Spec-driven development for [Claude Code](https://code.claude.com). Turns tickets into structured specs, executes them task-by-task with atomic commits, and verifies the result.

### Why "spec-drum"?

The name is a triple-layered pun that nobody asked for:

1. **The ZX Spectrum** — The legendary 48K home computer where you had to wait 5 minutes for a tape to load. AI-driven spec execution is about as far from that machine as you can get, which is exactly the point.
2. **Beating the drum** — spec-drum beats the drum for better specs. Someone has to.
3. **The tapas** — *Dátiles con Bacon*: a date wrapped in bacon, because *Speck* is German for bacon. Specs wrapped in automation. It's a stretch, but so is every good tapas menu.

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
