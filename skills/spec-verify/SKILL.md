---
name: spec-verify
description: Verify a completed spec against its requirements. Runs automated checks, validates acceptance criteria, and produces a verification report. Use this after spec execution to review code quality, check test results, and confirm all requirements are met.
user-invocable: true
context: fork
model: sonnet
allowed-tools:
  - Read
  - Write
  - Bash(git *)
  - Bash(npm *)
  - Bash(npx *)
  - Bash(yarn *)
  - Bash(pnpm *)
  - Bash(bun *)
  - Bash(cargo *)
  - Bash(go *)
  - Bash(make *)
  - Bash(pytest *)
  - Bash(python *)
  - Bash(ls *)
  - Bash(diff *)
  - Glob
  - Grep
  - Skill(simplify)
---

# /spec-verify

You are verifying a completed spec. The user provides a `<ticket-id>` as the argument.

## Step 1: Load spec and state

1. Read `.specs/<ticket-id>/spec.md`
2. Read `.specs/<ticket-id>/state.md`
3. Read `.specs/CLAUDE.md`

Verify preconditions:
- If `status: draft` → "Spec hasn't been executed yet. Run `/spec-execute <ticket-id>` first."
- If `status: in-progress` → "Spec is still being executed. Wait for completion or check for issues."
- If `status: blocked` → "Spec is blocked. Resolve blockers before verifying."
- Proceed if `status: review` or `status: done`

## Step 2: Completeness check

### Task completion
- Parse spec.md tasks: count checked `- [x]` vs unchecked `- [ ]`
- ALL tasks must be checked. If any are unchecked, flag as INCOMPLETE.

### Commit verification
- Check git log on the spec's branch for expected commits
- Each task should have a commit matching `<ticket-id>: T<N> - *`
- Report any missing commits

### File verification
- For each task, verify the listed files exist and were modified
- Use `git diff main...<branch>` (or appropriate base) to see all changes

## Step 3: Run automated checks

Execute each command from spec.md > Verification > Automated Checks:

For each check:
1. Run the command
2. Capture output and exit code
3. Record as PASS (exit 0) or FAIL (non-zero)

Common checks:
- `npm test` / `yarn test` / `pnpm test`
- `npm run lint` / `npm run typecheck`
- `cargo test` / `go test ./...`
- `pytest`

If a check fails, capture the relevant error output (first 50 lines).

## Step 4: Validate requirements

Go through each requirement in spec.md > Requirements > Must Have:

For each requirement:
1. Identify which task(s) address it
2. Verify the task was completed
3. Check the implementation (read relevant files)
4. Rate: **MET** | **PARTIALLY MET** | **NOT MET**
5. Add brief evidence/explanation

Also check Should Have requirements (these are not blocking but should be reported).

## Step 5: Validate acceptance criteria

Go through each criterion in spec.md > Verification > Acceptance Criteria:

For each criterion:
1. Determine how to verify it (automated check, code inspection, or manual)
2. Verify it
3. Rate: **PASS** | **FAIL**
4. Add brief evidence

## Step 6: Run /simplify on changed files

Use `/simplify` to review all changed files for code quality, reuse opportunities, and efficiency improvements. This replaces a manual code quality scan with Claude Code's built-in simplification skill.

If `/simplify` is not available (skill not installed or not recognized), skip this step and note "Code quality scan skipped — /simplify not available" in the verification report.

`/simplify` will:
- Identify code that can be simplified or deduplicated
- Flag inefficiencies and suggest improvements
- Check compliance with CLAUDE.md conventions
- Automatically fix issues it finds

If `/simplify` makes changes, stage and commit them: `<ticket-id>: simplify pass`

Record any changes `/simplify` made in the verification report under "Code Quality Notes".

## Step 7: Produce verification report

Determine overall result:
- **PASS**: All tasks complete, all automated checks pass, all Must Have requirements MET, all acceptance criteria PASS
- **FAIL**: Any of the above conditions not met

Append the verification report to state.md:

```markdown
## Verification Report — <date>

### Overall: PASS|FAIL

### Task Completion: <N>/<N>
<List any incomplete tasks>

### Commit Verification
<List expected vs actual commits, any missing>

### Automated Checks
| Check | Result | Notes |
|---|---|---|
| `<command>` | PASS/FAIL | <brief note> |

### Requirements Validation
| Requirement | Status | Evidence |
|---|---|---|
| <requirement> | MET/PARTIALLY MET/NOT MET | <brief> |

### Acceptance Criteria
| Criterion | Result | Evidence |
|---|---|---|
| <criterion> | PASS/FAIL | <brief> |

### Code Quality (/simplify)
- <changes made by /simplify, or "No changes needed.">
- <any remaining observations>

### Summary
<2-3 sentence summary of the verification result>
```

## Step 8: Update status

- If **PASS**: Set `status: done` in state.md, set `updated: <today>`
- If **FAIL**: Set `status: in-progress` in state.md, set `updated: <today>`
  - Add specific notes about what needs to be fixed in the Progress section

Commit: `<ticket-id>: verification <PASS|FAIL>`

## Step 9: Report to user

Show the user:
1. Overall result (PASS/FAIL)
2. Summary of findings
3. If FAIL: specific items that need attention
4. If PASS: "Spec verified. Branch `<branch>` is ready for PR."
