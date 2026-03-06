---
name: spec-quick
description: Execute an ad-hoc task with solid planning and atomic commits, without creating spec files. Ideal for small, well-scoped tasks.
user-invocable: true
argument-hint: "<description> [--branch <name>] [--verify]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /spec-quick

You execute small, well-scoped tasks with a solid ephemeral plan and atomic commits — no `.specs/` files created. The plan lives only in the conversation.

## Step 1: Parse arguments

From `$ARGUMENTS`:
- **description**: Everything that is not a flag. This is what to build.
- **`--branch <name>`**: Optional. Create and switch to this branch before executing.
- **`--verify`**: Optional. Run automated checks after all tasks complete.

If no description is provided, ask the user what they want to do.

Derive a short slug from the description (lowercase, hyphens, max 4 words):
- "add dark mode toggle to settings" → `add-dark-mode`
- "fix null pointer in auth middleware" → `fix-auth-null`
- "refactor user service to use repository pattern" → `refactor-user-service`

Commit prefix: `quick/<slug>`

## Step 2: Quick research (max 5 tool calls)

Read relevant CLAUDE.md files first (these count toward the limit):
1. Root CLAUDE.md (if exists)
2. `.specs/CLAUDE.md` (if exists)
3. Directory-scoped CLAUDE.md for the area you'll be working in

Then use remaining tool calls to understand what you'll be changing:
- Glob to find relevant files
- Grep to locate specific patterns or symbols
- Read the most relevant file(s)

**Stop at 5 tool calls.** If you need more context, ask the user rather than over-researching.

## Step 3: Build and present the ephemeral plan

Construct a task list in memory. Present it to the user as:

```
## Plan: <description>

**Slug**: quick/<slug>
**Branch**: <branch name, or "current branch">
**Tasks**: <N>

---

T1: <task title>
  Files: `path/to/file.ts`
  Approach: <1-2 sentences on what to do and why>
  Done when: <observable condition>

T2: <task title>
  Files: `path/to/other.ts`
  Approach: <1-2 sentences>
  Done when: <observable condition>

---

Proceed? (yes / adjust / cancel)
```

Keep it short. If the task is truly one-shot (only one file, obvious change), a single task is fine.

**Task decomposition rules**:
- Each task = one logical change = one commit
- Tasks ordered by dependency (foundational first)
- Aim for 1-5 tasks. If you need more than 5, the task should use `/spec-plan` instead — tell the user this.
- Each task touches a small set of related files

Wait for user confirmation before proceeding to execution.

## Step 4: Set up branch (if --branch)

If `--branch <name>` was provided:
1. `git checkout -b <name>` (or `git checkout <name>` if it exists)
2. Confirm to the user which branch you're on.

If no `--branch`, proceed on the current branch.

## Step 5: Execute tasks

For each task in order:

### 5a: Implement

Read the relevant files if not already read. Implement the change following conventions from CLAUDE.md files read in Step 2.

### 5b: Validate

- If the task has a **Done when** condition, verify it is satisfied.
- If the project has a type checker configured (`tsc`, `pyright`, etc.), run it on changed files.
- If tests exist for the area you changed, run them.

If validation fails:
- Attempt to fix up to 3 times.
- After 3 failures: stop, tell the user what's failing and what you tried, ask how to proceed.

### 5c: Commit

Stage only the files changed in this task. Commit:
```
quick/<slug>: T<N> - <task title>
```

Example: `quick/add-dark-mode: T1 - Add theme toggle to settings component`

### 5d: Confirm progress

After each commit, show a single line:
```
✓ T<N>: <task title> — committed <short-hash>
```

## Step 6: Run checks (if --verify)

If `--verify` was passed, run the project's automated checks (detect from package.json, Makefile, etc.):
- `npm test` / `bun test` / `pytest` / `cargo test` / `go test ./...`
- `npm run lint` / `npm run typecheck`

Report results. If any check fails, tell the user which check failed and the relevant output.

## Step 7: Done

Show a brief summary:

```
Done: <N> tasks completed, <N> commits on <branch>.

T1 ✓ <short hash> — <task title>
T2 ✓ <short hash> — <task title>
```

If `--verify` was run, include the check results.

No spec files are created. This task lives only in git history.
