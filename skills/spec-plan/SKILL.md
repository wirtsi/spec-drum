---
name: spec-plan
description: Create a spec from a ticket. Parses GitHub issues, Jira tickets, or plain text descriptions into a structured spec with research, requirements, and tasks. Use this when the user wants to plan work, break down a feature or bug into tasks, or create an implementation plan from a ticket or description.
user-invocable: true
model: opus
allowed-tools:
  - Read
  - Write
  - Bash(git *)
  - Bash(gh *)
  - Bash(ls *)
  - Glob
  - Grep
  - WebFetch
---

# /spec-plan

You are creating a spec for a ticket. The user provides a ticket source as the argument: a GitHub issue URL, a Jira ID, or a plain text description.

## Step 1: Parse ticket source

Determine the ticket type and extract information:

### GitHub Issue
- Pattern: URL containing `github.com` and `/issues/`
- Run: `gh issue view <number> --repo <owner/repo> --json title,body,labels,assignees,milestone`
- Derive ticket-id: `gh-<number>`

### Jira Ticket
- Pattern: matches `[A-Z]+-[0-9]+` (e.g., `PROJ-123`)
- Ask user to paste the ticket content (or use MCP if available)
- Derive ticket-id: lowercase Jira ID (e.g., `proj-123`)

### Plain Text
- Everything else is treated as a plain text description
- Ask the user for a short ticket-id slug (lowercase, hyphens, e.g., `add-auth`)

## Step 2: Check for existing spec

Check if `.specs/<ticket-id>/` already exists. If it does:
- Show the existing spec's status
- Ask: "Update existing spec or create fresh? (update / fresh)"
- If update: read existing spec.md and state.md as context

## Step 3: Research phase

Gather context to write an informed spec. **Limit to 10 tool calls** for research:

1. **Read conventions**: Read `.specs/CLAUDE.md` and relevant directory-scoped CLAUDE.md files
2. **Scan codebase**: Use Glob and Grep to find files relevant to the ticket
3. **Read key files**: Read the most relevant files (3-5 max) to understand current implementation
4. **Check related specs**: Look for specs in `.specs/` that might overlap or conflict
5. **External context**: If the ticket references external docs/APIs, use WebFetch to gather info

## Step 4: Write spec.md

Create `.specs/<ticket-id>/spec.md` with this structure:

```markdown
---
id: <ticket-id>
title: <title from ticket>
source: github|jira|manual
source_ref: <URL or ID, or "manual">
created: <today's date YYYY-MM-DD>
status: draft
priority: <P1|P2|P3 based on ticket labels/urgency>
depends_on: []
branch: <ticket-id>
---

# <Title>

## Context

<Why this work exists. Background from the ticket. 2-4 sentences.>

## Research Findings

### Relevant Files
<List of files that will be read or modified, with brief description of each>

### Existing Patterns
<Patterns discovered in the codebase that this work should follow>

### Constraints
<Technical constraints, compatibility requirements, performance considerations>

## Requirements

### Must Have
- <Requirement 1>
- <Requirement 2>

### Should Have
- <Nice-to-have 1>

### Won't Do
- <Explicit exclusion 1 — prevents scope creep>

## Tasks

- [ ] T1: <Task title>
  - **Files**: `path/to/file1.ts`, `path/to/file2.ts`
  - **Approach**: <1-2 sentences on how to implement>
  - **Done when**: <observable condition: test passes, export exists, endpoint returns X>

- [ ] T2: <Task title>
  - **Files**: `path/to/file3.ts`
  - **Approach**: <1-2 sentences>
  - **Done when**: <observable condition>

<Continue for all tasks. Order matters — dependencies first.>

## Verification

### Automated Checks
- <e.g., `npm test`, `npm run lint`, `npm run typecheck`>

### Manual Checks
- <e.g., "Visit /api/health and verify 200 response">

### Acceptance Criteria
- [ ] <Criterion 1 — maps to a Must Have requirement>
- [ ] <Criterion 2>
```

### Diagrams

- Use **ASCII diagrams** where a visual makes structure clearer (e.g., directory layouts, data models, component relationships)
- Use **Mermaid flowcharts** to describe conditional flows, state machines, or decision logic (if-this-then-that). Wrap in a ` ```mermaid ` fenced code block.

Only add diagrams when they genuinely aid understanding — don't add them for decoration.

### Task decomposition guidelines

- Each task should be **one logical change** that results in a single commit
- Tasks are ordered by dependency (foundational changes first)
- Each task lists the specific files it will touch
- Each task has a concrete approach (not "implement the feature")
- Aim for 3-10 tasks. If more than 10, the ticket should be split
- Include a testing task if the project has tests

## Step 5: Validate spec integrity

Before presenting the spec, run a cross-artifact integrity check. Catching drift between requirements and tasks now is cheap; catching it after commits exist is not.

### Requirement coverage
For each **Must Have** requirement, identify which task(s) address it. If a Must Have has no corresponding task, flag it as **UNCOVERED**.

### Task justification
For each task, identify which Must Have or Should Have requirement(s) it serves. If a task doesn't map to any requirement, flag it as **ORPHAN** (potential scope creep).

### Criteria traceability
For each acceptance criterion, confirm it maps to at least one Must Have. If not, flag it as **UNANCHORED**.

### Won't Do boundary
If any task could reasonably be interpreted as implementing something listed in Won't Do, flag it as a **BOUNDARY VIOLATION**.

### Resolution
If any issues are found:
1. Fix obvious gaps yourself — add a missing task, tighten a task description, anchor a dangling criterion
2. For ambiguous cases, ask the user to decide
3. Update spec.md with any fixes

Only proceed to Step 6 once the integrity check passes (or the user explicitly accepts the remaining issues).

## Step 6: Write state.md

Create `.specs/<ticket-id>/state.md`:

```markdown
---
id: <ticket-id>
status: draft
branch: null
current_task: null
started: null
updated: <today's date YYYY-MM-DD>
---

# State: <Title>

## Progress

Spec created. Ready for execution.

## Task Log

<empty — entries appended by /spec-execute>

## Decisions

<empty — entries appended during execution>

## Blockers

None.

## Verification Report(s)

<empty — appended by /spec-verify>
```

## Step 7: Present to user

Show the user:
1. A summary of the spec (title, task count, key files)
2. The full spec.md content
3. Ask: "Ready to execute? Run `/spec-execute <ticket-id>`"

Do NOT create a git branch. That's the executor's job.
