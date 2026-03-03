---
name: spec-steer
description: Manage steering documents for this project. On first run, analyzes the codebase and creates directory-scoped CLAUDE.md convention files. On subsequent runs, detects drift between the codebase and existing steering documents and proposes updates.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash(mkdir *)
  - Bash(ls *)
  - Bash(git *)
---

# /spec-steer

You are managing steering documents for this project. Steering documents are directory-scoped CLAUDE.md files that capture *discovered* project conventions — the actual patterns in the codebase, not generic advice. They are living documents: created on first run, updated as the codebase evolves.

## Step 1: Determine mode

Check whether steering documents already exist:
- If `.specs/CLAUDE.md` does **not** exist → **Bootstrap mode** (first run)
- If `.specs/CLAUDE.md` exists → **Sync mode** (subsequent run)

Tell the user which mode you're running in.

---

## Bootstrap mode

### Step B1: Analyze the codebase

Scan the project to understand its structure and conventions:

1. **Directory scan**: Use Glob to map the top 2 directory levels. Ignore `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`, `__pycache__`, `.venv`, `vendor`.
2. **Representative file sampling**: For each meaningful directory, read 3-5 representative files to detect:
   - Language and framework (imports, package.json, go.mod, Cargo.toml, etc.)
   - Naming conventions (camelCase, snake_case, kebab-case for files/functions/classes)
   - Code patterns (error handling, logging, testing patterns)
   - Project structure patterns (barrel exports, co-located tests, etc.)
   - Existing linting/formatting config (.eslintrc, .prettierrc, rustfmt.toml, etc.)
3. **Existing docs**: Read any existing CLAUDE.md files, README, CONTRIBUTING.md, or similar.

### Step B2: Propose steering documents

For each meaningful subdirectory (src/, lib/, api/, components/, tests/, etc.), propose a CLAUDE.md file containing **discovered conventions only** — not generic advice.

Good convention examples:
- "Components use default exports with named type exports"
- "Tests use vitest with `describe/it` blocks, co-located as `*.test.ts`"
- "Error handling uses custom AppError class from `src/errors.ts`"
- "API routes follow REST conventions: `GET /api/<resource>`, `POST /api/<resource>`"

Bad convention examples (too generic, do NOT write these):
- "Write clean code"
- "Follow best practices"
- "Use meaningful variable names"

### Step B3: Interactive creation

For EACH proposed steering document:

1. Show the user the full proposed content with the target path
2. Ask: "Create this file? (yes / edit / skip)"
3. If the user wants edits, incorporate their feedback
4. If a CLAUDE.md already exists at that path, show a diff and offer to merge/replace/skip

### Step B4: Create .specs/CLAUDE.md

Create the `.specs/CLAUDE.md` conventions file with the following content:

```markdown
# Spec Conventions

This directory contains spec-drum specifications. Each subdirectory is a ticket.

## Directory Structure

```
.specs/
  CLAUDE.md              # This file
  <ticket-id>/
    spec.md              # The plan: context, research, requirements, tasks, verification
    state.md             # Progress: status, task log, decisions, blockers, verification reports
```

## Spec Lifecycle

`draft` → `in-progress` → `review` → `done`

Escape hatch: any status can transition to `blocked` (with reason in state.md).

## Spec Format (spec.md)

YAML frontmatter fields:
- `id`: ticket identifier (e.g., `gh-42`, `proj-123`, `add-auth`)
- `title`: human-readable title
- `source`: `github` | `jira` | `manual`
- `source_ref`: URL or ID of the source ticket
- `created`: ISO date
- `status`: lifecycle status
- `priority`: `P1` | `P2` | `P3`
- `depends_on`: list of other ticket IDs (advisory, not blocking)
- `branch`: git branch name (equals ticket-id)

Sections:
1. **Context** — Why this work exists, background
2. **Research Findings** — Relevant Files, Existing Patterns, Constraints discovered during planning
3. **Requirements** — Must Have, Should Have, Won't Do
4. **Tasks** — Ordered checklist (T1..TN), each with Files + Approach
5. **Verification** — Automated Checks, Manual Checks, Acceptance Criteria

## State Format (state.md)

YAML frontmatter fields:
- `id`: ticket identifier (matches spec.md)
- `status`: lifecycle status
- `branch`: git branch name (null until execution starts)
- `current_task`: current task number or null
- `started`: ISO date or null
- `updated`: ISO date

Sections:
1. **Progress** — Summary of current state
2. **Task Log** — Append-only log of task execution (timestamp, task, outcome)
3. **Decisions** — Architectural or implementation decisions made during execution
4. **Blockers** — Current blockers (if status is `blocked`)
5. **Verification Report(s)** — Appended by /spec-verify

## Rules

- **Append-only Task Log**: Never delete or modify previous Task Log entries. Only append.
- **Commit format**: `<ticket-id>: T<N> - <description>`
- **One branch per ticket**: Branch name equals ticket-id.
- **Spec is the contract**: Executor follows the spec. If the spec is wrong, update the spec first.
- **State tracks truth**: state.md is the single source of truth for progress.

## Skill Contract

| File | Written by | Read by |
|---|---|---|
| spec.md | /spec-plan | /spec-execute, /spec-verify |
| state.md (create) | /spec-plan | /spec-execute, /spec-verify |
| state.md (update) | /spec-execute, /spec-verify | /spec-execute, /spec-verify |
| CLAUDE.md (steering) | /spec-steer | all skills |
```

### Step B5: Suggest root CLAUDE.md additions

Show the user suggested additions to the root `CLAUDE.md` file for spec-drum awareness:

```markdown
## spec-drum

This project uses spec-drum for spec-driven development. Specs live in `.specs/`.

### Workflow
1. `/spec-steer` — Manage steering documents (create on first run, sync on subsequent runs)
2. `/spec-plan <ticket>` — Create a spec from a ticket (GitHub issue URL, Jira ID, or description)
3. `/spec-execute <ticket-id>` — Execute the spec (creates branch, implements tasks, commits)
4. `/spec-verify <ticket-id>` — Verify the implementation against the spec

### Conventions
- Directory-scoped CLAUDE.md files are steering documents capturing discovered conventions
- `.specs/CLAUDE.md` defines spec format and rules
- One git branch per ticket, commit format: `<ticket-id>: T<N> - <description>`
```

Ask the user if they want to append this to their root CLAUDE.md.

### Step B6: Summary

Print a summary of what was created:
- Number of steering documents created/updated
- `.specs/` directory status
- Next steps: "Run `/spec-plan <ticket>` to create your first spec"

---

## Sync mode

Re-analyze the codebase and detect drift between actual patterns and existing steering documents.

### Step S1: Identify steering documents

Find all CLAUDE.md files in the project using Glob, excluding `.specs/CLAUDE.md`. These are your steering documents.

### Step S2: Re-analyze each directory

For each steering document (e.g., `src/components/CLAUDE.md`):

1. Re-sample 3-5 representative files in that directory using the same approach as Bootstrap mode
2. Identify three categories of drift:
   - **New patterns**: conventions observed in the code but not yet in the steering document
   - **Stale patterns**: rules in the steering document that no longer reflect what the code actually does
   - **Changed patterns**: rules that are partially right but need updating

### Step S3: Show drift report and propose updates

For each steering document with detected drift:

1. Show the current content
2. Show proposed changes as a clear diff (additions marked `+`, removals marked `-`)
3. Ask: "Apply these changes? (yes / edit / skip)"

Rules for proposals:
- **Always propose additions** for new patterns found in the code
- **Flag stale patterns explicitly** — mark them as "no longer observed in codebase"
- **Never silently delete** — every removal must be explicitly confirmed by the user

### Step S4: Summary

Print a summary:
- N steering documents checked
- N updated, N unchanged, N skipped
- If anything was updated: "Steering documents are current. Run `/spec-plan <ticket>` to use them."
