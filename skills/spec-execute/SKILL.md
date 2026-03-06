---
name: spec-execute
description: Execute a spec by implementing all tasks. Creates branch, makes atomic commits per task, tracks progress in state.md. Supports resume from partial execution.
user-invocable: true
context: fork
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Skill(batch)
---

# /spec-execute

You are executing a spec. The user provides a `<ticket-id>` as the argument.

## Step 1: Load spec and state

1. Read `.specs/<ticket-id>/spec.md` — this is your implementation plan
2. Read `.specs/<ticket-id>/state.md` — this is the current progress
3. Read `.specs/CLAUDE.md` — these are the rules

If any file is missing, stop and tell the user to run `/spec-plan` first.

## Step 2: Determine resume point

Check state.md:
- If `status: draft` → fresh execution, start from T1
- If `status: in-progress` → resume execution
  - Read the Task Log to find the last completed task
  - Scan spec.md checkboxes: find the first unchecked task (`- [ ]`)
  - That's your starting point
- If `status: blocked` → read Blockers section, inform user, ask if they want to retry
- If `status: review` or `status: done` → inform user the spec is already completed/in-review

## Step 3: Set up git branch

```
branch_name = <ticket-id>  (from spec.md frontmatter)
```

1. Ensure main is up to date: `git checkout main && git pull --ff-only`
2. Check if branch exists: `git branch --list <branch_name>`
3. If exists: `git checkout <branch_name>` and rebase onto main if behind: `git rebase main`
4. If not: `git checkout -b <branch_name>` (branches off the now-current main)

Update state.md:
- Set `status: in-progress`
- Set `branch: <branch_name>`
- Set `started: <today>` (only if null)
- Set `updated: <today>`

## Step 4: Read conventions

Before executing tasks, read all relevant CLAUDE.md files to understand project conventions:
- Root CLAUDE.md
- Directory-scoped CLAUDE.md files for directories you'll be working in

These conventions MUST be followed during implementation.

## Step 5: Execute tasks sequentially

For each unchecked task in spec.md (starting from resume point):

### 5a: Update tracking
- Set `current_task: T<N>` in state.md frontmatter
- Set `updated: <today>` in state.md frontmatter

### 5b: Implement
- Read the task's Files and Approach from spec.md
- Read the relevant files in the codebase
- Implement the change following project conventions
- If the task involves creating files, ensure parent directories exist

**Batch mode**: If a task applies the same transformation across many files (e.g., "update all API routes to use new middleware", "rename X to Y across the codebase", "migrate all components from library A to B"), use `/batch` to execute it in parallel. Example: `/batch update all files in src/routes/ to use the new auth middleware`. Only use `/batch` when the transformation is uniform and files are independent — never for tasks requiring sequential logic or cross-file coordination.

### 5c: Validate
- If the task has a **Done when** condition, verify it is satisfied before committing
- If the project has a type checker, run it (e.g., `npx tsc --noEmit`)
- If the task involves tests, run relevant tests
- If linting is configured, run the linter on changed files

### 5d: Commit
- Stage only the files related to this task
- Commit with message: `<ticket-id>: T<N> - <task title>`
- Example: `gh-42: T3 - Add authentication middleware`

### 5e: Update spec and state
- Check off the task in spec.md: `- [ ] T<N>` → `- [x] T<N>`
- Append to Task Log in state.md:

```markdown
### T<N>: <task title>
- **Status**: completed
- **Time**: <timestamp>
- **Commit**: <short hash>
- **Notes**: <brief summary of what was done, any deviations from plan>
```

- Commit the spec/state update: `<ticket-id>: update spec tracking`

### 5f: Handle failures

If implementation fails (tests fail, type errors, etc.):

1. **Attempt 1-3**: Try to fix the issue
2. **After 3 failed attempts**:
   - Set `status: blocked` in state.md
   - Set `current_task: T<N>` (the failing task)
   - Record the blocker in state.md:

```markdown
## Blockers

### T<N>: <task title>
- **Error**: <error message or description>
- **Attempts**: 3
- **Analysis**: <what you think is wrong>
- **Suggested fix**: <what the user might try>
```

   - Commit state: `<ticket-id>: blocked on T<N>`
   - Stop execution and inform the user

## Step 6: Complete execution

After all tasks are done:

1. Run full verification suite from spec.md's Verification > Automated Checks section
2. Update state.md:
   - Set `status: review`
   - Set `current_task: null`
   - Set `updated: <today>`
3. Update Progress section in state.md:

```markdown
## Progress

All tasks completed. Ready for verification.
- Tasks: <N>/<N> completed
- Branch: `<branch_name>`
- Commits: <count>
```

4. Commit: `<ticket-id>: all tasks completed, ready for review`
5. Inform the user: "All tasks completed. Run `/spec-verify <ticket-id>` to verify."

## Important Rules

- **Follow the spec**: The spec is your blueprint. If something in the spec seems wrong, note it in the Decisions section of state.md but implement it as specified unless it would cause errors.
- **One task, one commit**: Each task gets exactly one implementation commit (plus one tracking commit).
- **Never skip tasks**: Execute tasks in order. Don't skip ahead even if a later task seems independent.
- **Conventions first**: Always follow project conventions from CLAUDE.md files.
- **Append-only log**: Never modify previous Task Log entries. Only append new ones.
- **Track decisions**: If you make a judgment call during implementation, record it in the Decisions section.
