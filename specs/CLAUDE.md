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
4. **Tasks** — Ordered checklist (T1..TN), each with Files, Approach, and Done when
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
| *(no files)* | /spec-quick | reads CLAUDE.md files only |
