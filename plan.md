# spec-drum: Implementation Plan

## What Is spec-drum

A lightweight spec-driven development tool for Claude Code. 4 skills, native CLAUDE.md conventions, 2 files per ticket. No config files, no install scripts, no custom agents, no external dependencies.

Inspired by GSD (context engineering), spec-kit (spec-first), and BMAD (progressive context) -- but strips away the bloat. Everything is built on Claude Code's native primitives: skills, CLAUDE.md, and git.

## Architecture

```
.claude/skills/
  spec-init/SKILL.md          # /spec-init - codebase analysis + scaffold
  spec-plan/SKILL.md          # /spec-plan <ticket> - create spec from ticket
  spec-execute/SKILL.md       # /spec-execute <ticket-id> - implement spec
  spec-verify/SKILL.md        # /spec-verify <ticket-id> - verify against spec

.specs/
  CLAUDE.md                    # spec-drum conventions (how skills interact with specs)
  <ticket-id>/
    spec.md                    # Plan: context, research, requirements, tasks, verification
    state.md                   # Progress: status, task log, decisions, blockers, reports

src/                           # (example)
  CLAUDE.md                    # Conventions discovered by /spec-init
  api/CLAUDE.md                # API-specific conventions
  components/CLAUDE.md         # Component-specific conventions
```

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Format | Markdown + YAML frontmatter | Human-readable, PR-reviewable, machine-parseable |
| Architecture | Skills with `context: fork` | Fresh 200k context windows, no custom agents needed |
| Team flow | Git-native (branch per ticket) | PR = the result. No summary files needed |
| Ticket source | Flexible | GitHub Issues, Jira, Beads, manual -- adapts to any team |
| Memory | 2 files per ticket | spec.md (research embedded) + state.md (verification appended) |
| Conventions | Native CLAUDE.md per directory | Leverages Claude Code's built-in directory-scoped loading |
| Config | None | Conventions over configuration |
| Beads | Optional integration | Can source tickets from `bd ready` but doesn't require Beads |

---

## Skill 1: `/spec-init`

**Purpose**: Analyze existing codebase and scaffold spec-drum infrastructure.

**Runs in**: Main context (interactive, needs user input per file)
**Model**: inherit (default)
**Tools**: Read, Write, Edit, Glob, Grep, Bash(ls/git/mkdir)

### Workflow

1. **Scan project structure** (top 2 directory levels)
   - Use Glob to map the directory tree
   - Identify meaningful directories (src/, lib/, api/, components/, tests/, etc.)
   - Skip: node_modules, .git, dist, build, coverage, __pycache__, .next

2. **Analyze each directory**
   - Read 3-5 representative files per directory
   - Detect patterns: language, framework, naming conventions, import style, error handling, testing patterns
   - Note: existing CLAUDE.md files, package.json, tsconfig, etc.

3. **For each meaningful directory, propose a CLAUDE.md**
   - Show the user the proposed content
   - Wait for approval, edits, or skip
   - If a CLAUDE.md already exists: show what would be added/changed, offer to merge or skip
   - Content should be specific and actionable, not generic advice

4. **Create `.specs/` directory and `.specs/CLAUDE.md`**
   - The conventions file defining how specs work (status lifecycle, commit format, file structure)

5. **Suggest root CLAUDE.md additions**
   - If root CLAUDE.md doesn't mention spec-drum, suggest a block to add

### Example Output for a Next.js Project

**`src/CLAUDE.md`** (proposed):
```markdown
# Source Code

Next.js 14 App Router application with TypeScript strict mode.

## Conventions
- Use `'use client'` directive only when component needs browser APIs or state
- Prefer server components by default
- Imports use `@/` path alias mapped to `src/`
- All files use `.ts`/`.tsx` extensions (no `.js`)

## Error Handling
- API routes return `NextResponse.json({ error: string }, { status: number })`
- Client components use error boundaries at route level
```

**`src/api/CLAUDE.md`** (proposed):
```markdown
# API Routes

RESTful API routes using Next.js App Router route handlers.

## Conventions
- Each route in its own directory: `src/api/<resource>/route.ts`
- Input validation with zod schemas defined inline
- All handlers export named functions: GET, POST, PUT, DELETE
- Authentication via middleware in `src/middleware.ts`
- Database access through Prisma client at `src/lib/db.ts`

## Response Format
- Success: `NextResponse.json({ data: T })`
- Error: `NextResponse.json({ error: string }, { status: 4xx|5xx })`
- Always return proper HTTP status codes
```

### CLAUDE.md Quality Criteria
Each generated CLAUDE.md should include ONLY:
- What the directory contains (brief, 1 line)
- Specific, discovered conventions (not generic advice)
- Patterns that would prevent Claude from making wrong assumptions
- References to key files when relevant

Should NOT include:
- Generic programming advice
- Restating what's obvious from file extensions
- Aspirational conventions that aren't in the code

---

## Skill 2: `/spec-plan <ticket>`

**Purpose**: Create a spec from a ticket (any source).

**Runs in**: Main context (interactive -- may need to ask clarifying questions)
**Model**: `opus` (strongest reasoning for research + decomposition)
**Tools**: Read, Write, Bash(git/gh/ls), Glob, Grep, WebFetch

### Input Parsing

Parse `$ARGUMENTS` to determine ticket source:

| Input | Detection | Ticket ID |
|---|---|---|
| GitHub URL with `/issues/` | URL pattern | `gh-<number>` |
| `#123` or just `123` | Numeric | `gh-<number>` (assumes GitHub) |
| `PROJ-123` | Jira pattern | `proj-123` (lowercase) |
| `bd-a1b2` | Beads pattern | `bd-a1b2` |
| Free text | Fallback | Ask user for kebab-case ID |

**Fetching**:
- GitHub: `gh issue view <num> --json title,body,labels,assignees,comments`
- Jira: Try MCP, fallback to asking user to paste content
- Beads: `bd show <id> --json`
- Manual: use the text directly

### Research Phase (max 10 tool calls)

1. Read root CLAUDE.md and relevant directory CLAUDE.md files
2. Glob/Grep for files related to the ticket's domain
3. Read 3-5 key files to understand existing patterns
4. Check `.specs/` for related/dependent specs

### Spec Creation

Write `.specs/<ticket-id>/spec.md`:

```yaml
---
id: <ticket-id>
title: <title>
source: github|jira|beads|manual
source_ref: <URL or ID if applicable>
created: YYYY-MM-DD
status: draft
priority: P1|P2|P3
depends_on: []
branch: <ticket-id>
---

# <Title>

## Context
Why this work is needed. Problem or opportunity.

## Research Findings

### Relevant Files
- `path/to/file.ts` - why it matters

### Existing Patterns
How similar things are done in this codebase.

### Constraints
Technical or business constraints discovered.

## Requirements

### Must Have
- [ ] FR-001: <requirement>

### Should Have
- [ ] FR-010: <requirement>

### Won't Do (this ticket)
- <explicit scope exclusion>

## Tasks

- [ ] T1: <task description>
  - Files: `path/to/file.ts`
  - Approach: <how, referencing existing patterns>
- [ ] T2: <task description>
  - Files: `path/to/file.ts`
  - Approach: <how>

## Verification

### Automated Checks
- [ ] `<test command>` passes
- [ ] `<build command>` passes

### Manual Checks
- [ ] <what to verify manually>

### Acceptance Criteria
- [ ] AC-001: Given <precondition>, when <action>, then <result>
```

Write `.specs/<ticket-id>/state.md`:

```yaml
---
id: <ticket-id>
status: draft
branch: null
current_task: null
started: null
updated: YYYY-MM-DD
---

# State: <Title>

## Progress
No tasks started yet.

## Task Log

## Decisions

## Blockers
```

### Post-Creation
- Do NOT create a git branch (that's the executor's job)
- Report: spec location, task count, any uncertainties
- Suggest: "Review the spec, then run `/spec-execute <ticket-id>`"

---

## Skill 3: `/spec-execute <ticket-id>`

**Purpose**: Implement a spec by working through its task list.

**Runs in**: `context: fork` (fresh 200k context, isolated from main session)
**Model**: inherit (user controls -- typically sonnet for cost, opus for quality)
**Tools**: Read, Write, Edit, Bash, Glob, Grep (full access)

### Startup

1. Read `.specs/<ticket-id>/spec.md` and `state.md`
2. Read root CLAUDE.md and relevant directory CLAUDE.md files
3. Read `.specs/CLAUDE.md` for conventions

### Resume Detection

| state.md status | Behavior |
|---|---|
| `draft` | Fresh start from T1 |
| `in-progress` | Resume from first incomplete task (check Task Log) |
| `blocked` | Report blocker, stop |
| `review` or `done` | Warn already complete, ask confirmation to re-execute |

### Dependency Check

If `spec.md` has `depends_on: [other-id]`, check that dependency's state.md. Warn if not `done` but don't hard-block (advisory only).

### Branch Setup

1. If no branch exists: `git checkout -b <ticket-id>`
2. If branch exists and resuming: `git checkout <ticket-id>`
3. Update state.md: `status: in-progress`, `branch: <ticket-id>`, `started: <date>`

### Task Loop

For each unchecked task in spec.md:

**Before**:
- Update state.md: `current_task: T<N>`
- Read target files listed in the task

**Execute**:
- Implement changes per the task's Approach
- Follow conventions from CLAUDE.md files
- Keep changes focused (one task = one concern)

**After**:
- Run relevant checks (lint, typecheck, test) if specified in spec
- `git add <specific-files>` then `git commit -m "<ticket-id>: T<N> - <description>"`
- Check off task in spec.md: `- [ ] T<N>` → `- [x] T<N>`
- Append to state.md Task Log: `- [YYYY-MM-DD HH:MM] T<N>: completed - <summary>`

**On Failure**:
- Attempt up to 3 fixes
- If still failing: log `FAILED` in Task Log, set `status: blocked` with reason, commit partial work, stop

### Completion

- Update state.md: `status: review`, `current_task: null`
- Report: tasks completed, files changed, commits made
- Suggest: "Run `/spec-verify <ticket-id>` to validate"

### Commit Message Format

```
<ticket-id>: T<N> - <brief description>
```

Examples:
```
gh-42: T1 - add user model and migration
gh-42: T2 - implement registration endpoint
gh-42: T3 - add integration tests
```

---

## Skill 4: `/spec-verify <ticket-id>`

**Purpose**: Verify implementation matches the spec. Read-only for source code.

**Runs in**: `context: fork` (isolated verification)
**Model**: `sonnet` (cost-effective for structured checking)
**Tools**: Read, Write (state.md only), Bash(git/npm/test runners), Glob, Grep

### Verification Steps

1. **Completeness**: All tasks checked? Commits exist? Files match task lists?
2. **Automated Checks**: Run each command from spec's Verification section
3. **Requirements**: Trace each FR-xxx through the code (MET / PARTIALLY MET / NOT MET)
4. **Acceptance Criteria**: Trace each AC-xxx given/when/then (PASS / FAIL)
5. **Code Quality**: TODOs introduced? Error handling gaps? Naming conventions followed?

### Report

Append to state.md:

```markdown
## Verification Report (YYYY-MM-DD)

### Summary
- **Result**: PASS | FAIL | PARTIAL
- **Tasks**: N/N completed
- **Checks**: N/N passing
- **Requirements**: N/N met
- **Criteria**: N/N validated

### Issues Found
1. <issue + severity>

### Recommendation
APPROVE | REVISE (with specific actions)
```

Update status: PASS → `done`, FAIL → `in-progress` (allows re-execution).

---

## State Lifecycle

```
draft ──→ in-progress ──→ review ──→ done
               │
               └──→ blocked ──→ in-progress (after fix)
```

| Status | Set By | Meaning |
|---|---|---|
| `draft` | /spec-plan | Spec created, not yet executed |
| `in-progress` | /spec-execute | Actively being implemented |
| `blocked` | /spec-execute | Task failed, needs intervention |
| `review` | /spec-execute | All tasks done, ready for verification |
| `done` | /spec-verify | Verified and complete |

---

## Implementation Order

### Phase 1: Foundation
1. Write `.specs/CLAUDE.md` (the conventions file) -- this defines the contract all skills follow
2. Write `/spec-init` SKILL.md -- the entry point that bootstraps everything
3. Update root `CLAUDE.md` with spec-drum reference

### Phase 2: Core Loop
4. Write `/spec-plan` SKILL.md -- spec creation from tickets
5. Write `/spec-execute` SKILL.md -- spec implementation with context:fork
6. Write `/spec-verify` SKILL.md -- spec verification

### Phase 3: Validation
7. Run `/spec-init` on this repo to test codebase analysis
8. Run `/spec-plan "Add a hello world endpoint"` to test spec creation
9. Run `/spec-execute` to test implementation
10. Run `/spec-verify` to test verification
11. Test resume: partially execute, stop, re-run
12. Test failure: spec with impossible task → verify blocked state

## Files to Create

| # | File | Purpose |
|---|---|---|
| 1 | `.specs/CLAUDE.md` | Conventions governing all spec interactions |
| 2 | `.claude/skills/spec-init/SKILL.md` | Codebase analysis + scaffolding skill |
| 3 | `.claude/skills/spec-plan/SKILL.md` | Spec creation skill |
| 4 | `.claude/skills/spec-execute/SKILL.md` | Spec execution skill |
| 5 | `.claude/skills/spec-verify/SKILL.md` | Spec verification skill |
| 6 | `CLAUDE.md` (update) | Add spec-drum reference |

Total: 5 new files + 1 update. That's the entire system.
