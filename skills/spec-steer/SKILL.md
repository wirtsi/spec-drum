---
name: spec-steer
description: Manage steering documents for this project. On first run, analyzes the codebase and creates directory-scoped CLAUDE.md convention files. On subsequent runs, detects drift between the codebase and existing steering documents and proposes updates. Use this whenever the user wants to set up project conventions, initialize CLAUDE.md files, or sync steering docs after codebase changes.
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

**Specificity rule**: Each CLAUDE.md must only document conventions for files *within that directory*. If a convention applies project-wide or to files outside the directory, it belongs in the root CLAUDE.md, not the sub-document.

Good convention examples:
- "Components use default exports with named type exports"
- "Tests use vitest with `describe/it` blocks, co-located as `*.test.ts`"
- "Error handling uses custom AppError class from `src/errors.ts`"
- "API routes follow REST conventions: `GET /api/<resource>`, `POST /api/<resource>`"

Bad convention examples (too generic, do NOT write these):
- "Write clean code"
- "Follow best practices"
- "Use meaningful variable names"

### Step B2.5: Deduplication pass

Before presenting any files to the user, audit all proposed steering documents together for shared or misplaced content:

1. **Exact duplicate detection**: Find any rule, sentence, or section that appears in two or more proposed documents verbatim or near-verbatim.
2. **Semantic duplicate detection**: Find rules that express the same convention in different words across documents (e.g., the same import alias convention mentioned in both `src/` and `src/utils/`).
3. **Scope check**: For each rule in each sub-document, ask: "Does this rule apply *specifically* to files in this directory, or is it project-wide?" Rules that apply across multiple directories or the whole project must be moved to the root CLAUDE.md.

**Consolidation actions**:
- Move duplicates and project-wide rules into root CLAUDE.md (create a proposed root section if needed)
- Remove the moved content from sub-documents — do not leave copies in both places
- If a rule is nearly but not exactly shared (e.g., slightly different patterns), keep the more-specific variant in the sub-document and hoist only the shared core to root

Show the user a **consolidation summary** before proceeding to B3:
```
Consolidation plan:
  → Root CLAUDE.md  [N rules moved here]
    + "<hoisted rule 1>"
    + "<hoisted rule 2>"

  src/components/CLAUDE.md  [N rules removed as duplicates]
    - "<removed rule>"

  src/api/CLAUDE.md  [unchanged]
```
Ask: "Proceed with this consolidation? (yes / adjust / skip consolidation)"

### Step B3: Interactive creation

For EACH proposed steering document:

1. Show the user the full proposed content with the target path
2. Ask: "Create this file? (yes / edit / skip)"
3. If the user wants edits, incorporate their feedback
4. If a CLAUDE.md already exists at that path, show a diff and offer to merge/replace/skip

### Step B4: Create .specs/CLAUDE.md

<!-- Keep in sync with specs/CLAUDE.md in the spec-drum source repo -->
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
| *(no files)* | /spec-quick | reads CLAUDE.md files only |
| *(no files)* | /spec-list | reads spec.md + state.md (read-only) |
```

### Step B5: Suggest root CLAUDE.md additions

Show the user suggested additions to the root `CLAUDE.md` file for spec-drum awareness:

```markdown
## spec-drum

This project uses spec-drum for spec-driven development. Specs live in `.specs/`.

### Workflow
1. `/spec-steer` — Manage steering documents (create on first run, sync on subsequent runs)
2. `/spec-quick <description>` — Ad-hoc tasks: ephemeral plan + atomic commits, no spec files
3. `/spec-plan <ticket>` — Create a spec from a ticket (GitHub issue URL, Jira ID, or description)
4. `/spec-execute <ticket-id>` — Execute the spec (creates branch, implements tasks, commits)
5. `/spec-verify <ticket-id>` — Verify the implementation against the spec
6. `/spec-list` — Show status dashboard of all specs

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

### Step S2.5: Cross-file deduplication check

After re-analyzing all directories, read all steering documents together (including root CLAUDE.md) and check for:

1. **Duplicate content**: Any rule, sentence, or section that appears in two or more files verbatim or near-verbatim. Flag each occurrence with the files where it appears.
2. **Misplaced content**: Rules in a sub-document that are not specific to that directory — i.e., they describe conventions used across the whole project or in sibling/parent directories.
3. **Missing root coverage**: Content that was previously unique to one sub-document but is now also present in other directories (the codebase has generalised the pattern).

**Proposed consolidation**: For each issue found, propose one of:
- **Hoist to root**: Move the rule to root CLAUDE.md, remove from sub-document(s)
- **Remove duplicate**: Keep the most-specific version, delete copies elsewhere
- **Narrow the rule**: Reword a too-broad rule in the sub-document so it only describes what is specific to that directory

Show the user a **cross-file diff** before S3:
```
Cross-file issues found:

  DUPLICATE across src/components/ and src/pages/:
    "<shared rule>"
    → Propose: hoist to root CLAUDE.md, remove from both sub-docs

  MISPLACED in src/utils/CLAUDE.md (applies project-wide):
    "<too-broad rule>"
    → Propose: move to root CLAUDE.md

  DUPLICATE in src/api/CLAUDE.md (already in root CLAUDE.md):
    "<repeated rule>"
    → Propose: remove from src/api/CLAUDE.md
```
Ask: "Apply consolidation? (yes / adjust / skip)" before proceeding to per-file drift updates.

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
