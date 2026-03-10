---
name: spec-list
description: Show status of all specs in this project. Lists every ticket in .specs/ with its current status, branch, and progress. Use this when the user wants to see what's in progress, blocked, or done, or needs an overview of all planned and active work.
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Bash(git branch --list *)
---

# /spec-list

You are showing the user a dashboard of all specs in this project.

## Step 1: Find all specs

Use Glob to find all `state.md` files: `.specs/*/state.md`

If no specs are found, tell the user: "No specs found. Run `/spec-plan <ticket>` to create one."

## Step 2: Read each state file

For each `state.md`, read the YAML frontmatter to extract:
- `id`
- `status`
- `branch`
- `current_task`
- `started`
- `updated`

Also read the corresponding `spec.md` frontmatter to get:
- `title`
- `priority`

## Step 3: Check branch existence

Run `git branch --list` once to get all local branches. Match against each spec's branch to determine if the branch exists locally.

## Step 4: Present the dashboard

Group specs by status and display as a table:

```
## Specs

| ID | Title | Status | Priority | Branch | Current Task | Updated |
|----|-------|--------|----------|--------|--------------|---------|
| gh-42 | Add auth middleware | in-progress | P1 | gh-42 | T3 | 2025-01-15 |
| gh-38 | Fix login redirect | blocked | P2 | gh-38 | T2 | 2025-01-14 |
| add-cache | Add Redis caching | draft | P2 | — | — | 2025-01-13 |
| gh-35 | Update user model | done | P3 | gh-35 | — | 2025-01-10 |
```

Display order: `blocked` first (needs attention), then `in-progress`, `review`, `draft`, `done` last.

If a spec is **blocked**, append the blocker summary from `state.md` beneath the table.

## Step 5: Summary line

End with a one-line count:

```
5 specs: 1 blocked, 1 in-progress, 1 review, 1 draft, 1 done
```
