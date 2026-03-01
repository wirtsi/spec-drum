# spec-drum: Research

All research conducted on 2026-02-28 for designing spec-drum, a lightweight spec-driven development tool for Claude Code.

---

## Table of Contents

1. [Inspirations](#1-inspirations)
   - [Get Shit Done (GSD)](#11-get-shit-done-gsd)
   - [GitHub spec-kit](#12-github-spec-kit)
   - [BMAD Method](#13-bmad-method)
2. [Claude Code Modern Features](#2-claude-code-modern-features)
3. [Beads: Agent-First Issue Tracker](#3-beads-agent-first-issue-tracker)
4. [Meta-Prompting & SDD Landscape](#4-meta-prompting--sdd-landscape)
5. [Key Takeaways for spec-drum](#5-key-takeaways-for-spec-drum)

---

## 1. Inspirations

### 1.1 Get Shit Done (GSD)

**Repo**: https://github.com/gsd-build/get-shit-done
**npm**: `get-shit-done-cc` v1.22.0 | **Stars**: ~22.2k | **License**: MIT

**Core Concept**: A meta-prompting and context engineering layer on top of Claude Code. Its key insight: AI quality degrades as context fills up ("context rot"). Solution: thin orchestrator stays at ~15% context usage, spawns specialized subagents with fresh ~200k token windows for heavy work.

**Architecture**:
- 32 slash commands, 11 agent definitions, 33 workflows, 26 templates, 13 references
- Installs 100+ files into `~/.claude/` via `npx get-shit-done-cc@latest`
- Uses OLD `commands/` directory (not modern skills)
- No plugin format, no LSP awareness, no agent team support

**Workflow**: `/gsd:new-project` → `/gsd:discuss-phase N` → `/gsd:plan-phase N` → `/gsd:execute-phase N` → `/gsd:verify-work N`

**Spec Format**: XML-structured executable prompts with YAML frontmatter. Plans ARE the prompts -- not documents converted into prompts.

```xml
<task type="auto">
  <name>Task 1: Create registration endpoint</name>
  <files>src/app/api/auth/signup/route.ts</files>
  <action>Use jose for JWT. Validate email format...</action>
  <verify><automated>curl -X POST localhost:3000/api/auth/signup returns 201</automated></verify>
  <done>Valid signup returns 201; duplicate returns 409</done>
</task>
```

**Project Memory** (`.planning/` directory):
- `PROJECT.md` - Vision, constraints
- `REQUIREMENTS.md` - Scoped with REQ-IDs
- `ROADMAP.md` - Phased delivery plan
- `STATE.md` - Current position, decisions, blockers (memory across sessions)
- `CONTEXT.md` - User's locked implementation decisions per phase
- Per-phase: `PLAN.md`, `SUMMARY.md`, `VERIFICATION.md`, `UAT.md`, `RESEARCH.md`

**Context Engineering**:
- Orchestrator pattern: main session coordinates, subagents execute in fresh contexts
- PostToolUse hook monitors context usage, warns at 35% remaining, critical at 25%
- Statusline hook shows real-time context bar in terminal
- Task sizing: complete within ~50% of context budget

**Key Strengths**:
- Context engineering is the real innovation
- Wave-based parallel execution (plans grouped by dependency waves)
- Goal-backward verification (what must be TRUE, not just "did tasks complete")
- Atomic git commits per task
- Requirements traceability (REQ-IDs → phases → plans → verification)

**Key Weaknesses**:
- Too heavy: 100+ files, 32 commands, significant ceremony
- Outdated Claude Code integration (old commands/, no skills/plugins/agents)
- Requires `--dangerously-skip-permissions` for practical use
- Overhead for experienced devs who know what they want
- No CI/CD integration, no team workflow support
- Token-expensive multi-agent orchestration

---

### 1.2 GitHub spec-kit

**Repo**: https://github.com/github/spec-kit
**Stars**: ~28k | **License**: MIT | Released September 2025

**Core Concept**: Open-source toolkit from GitHub for spec-driven development. Templates + CLI + prompts centered around writing specifications first, then technical plans, then small testable tasks.

**Workflow**: Specification → Technical Plan → Tasks → Implementation

**Key Feature**: Works with 11+ AI coding assistants (Claude Code, Copilot, Gemini CLI, Cursor, etc.). Not locked to one tool.

**Spec Format**: Markdown with structured sections. Configurable prompts and a "constitution" of immutable principles.

**Relevance to spec-drum**: Validates the spec-first approach. spec-kit's multi-tool support shows that markdown specs are the most portable format.

---

### 1.3 BMAD Method

**Repo**: https://github.com/bmad-code-org/BMAD-METHOD
**Version**: 6.0.3 | **npm**: `bmad-method` | **License**: MIT

**Core Concept**: "Breakthrough Method for Agile AI-Driven Development." Positions AI as expert collaborator guiding humans through structured, agile-grounded processes. 4-phase progressive workflow with 9 named persona agents.

**Architecture**:
- Module system: BMM (core agile), BMB (agent builder), TEA (testing), GDS (game dev), CIS (creative)
- 9 persona agents defined in `.agent.yaml` files: Mary (Analyst), John (PM), Winston (Architect), Sally (UX), Bob (Scrum), Amelia (Dev), Quinn (QA), Barry (Quick Flow), Paige (Tech Writer)
- 34+ workflows with micro-file architecture (each step is a self-contained instruction file)
- Installs into `_bmad/` directory with agents, workflows, teams, data

**Workflow**: Analysis → Planning → Solutioning → Implementation (4 phases)
- Analysis: Brainstorm → Research → Product Brief
- Planning: PRD → Validate PRD → UX Design
- Solutioning: Architecture → Epics/Stories → Implementation Readiness Gate
- Implementation: Sprint Planning → Story → Dev → Code Review → QA

**3-Track Scale Adaptation**:
- Quick Flow: Simple features (1-15 stories), 2 commands
- BMad Method: Products/platforms (10-50+ stories), full 4-phase
- Enterprise: Complex systems (30+), + compliance/security

**Key Strengths**:
- Progressive context building (each phase produces docs feeding the next)
- Solutioning phase prevents conflicting architectural decisions
- Adversarial review (forced-finding technique prevents rubber-stamping)
- Scale-adaptive (Quick Flow vs full BMM vs Enterprise)
- Cross-platform (Claude Code, Cursor, Windsurf, Augment, Kiro)
- Party Mode (multiple agent personas debate in one session)

**Key Weaknesses**:
- Significant ceremony overhead (4 phases, many documents)
- Steep learning curve (9 agents, 34+ workflows, trigger codes)
- Agent personas consume context tokens
- Opinionated sequential workflow
- Requires Node.js v20+ for installation

---

## 2. Claude Code Modern Features

### Skills
- Custom capabilities defined in `.claude/skills/<name>/SKILL.md`
- YAML frontmatter: name, description, allowed-tools, model, context (fork for subagent)
- String substitution: `$ARGUMENTS`, `$ARGUMENTS[0]`, `${CLAUDE_SESSION_ID}`
- Dynamic context: `` !`command` `` runs shell before sending to Claude
- Locations: enterprise > personal (`~/.claude/skills/`) > project (`.claude/skills/`) > plugin
- With `context: fork`, skills run in isolated subagent contexts (fresh 200k window)
- Replaces old `.claude/commands/` format (still backwards compatible)

### Custom Agents
- Defined in `.claude/agents/<name>.md` with YAML frontmatter
- Full custom system prompt, tool restrictions, model override, permission modes
- Persistent memory across sessions (`memory: user|project|local`)
- Custom hooks scoped to the agent
- Git worktree isolation (`isolation: worktree`)
- Only spawned by Claude (not user-invocable like skills)

### Skills vs Agents Decision
For spec-drum: **Skills with `context: fork`** provide 90% of agent value with much less complexity. Custom agents add persistent memory, custom hooks, and worktrees -- but spec-drum's markdown files serve as the memory, and project-level hooks suffice.

### Agent Teams (Experimental)
- Multiple Claude Code instances working together
- Shared task list with dependencies, direct messaging between agents
- Team lead coordinates, teammates work independently
- Enabled via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

### LSP Integration
- Plugin-based Language Server Protocol support
- Instant diagnostics, go-to-definition, type info
- ~50ms navigation vs ~45s text search
- Supported: TypeScript, Python, Rust, Go, Java, etc.

### Hooks
- Shell commands/HTTP/LLM prompts at lifecycle events
- Events: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, SubagentStart/Stop, Stop, PreCompact, SessionEnd, etc.
- Exit 0 = proceed, Exit 2 = block (stderr becomes feedback)
- Configured in settings.json (user, project, or local scope)

### CLAUDE.md
- Persistent instructions loaded at session start
- Scoped: managed policy > project > user > local
- Directory-scoped via `.claude/rules/` with path patterns
- `@path/to/import` syntax for importing additional files
- Auto memory at `~/.claude/projects/<project>/memory/`

### MCP Servers
- Model Context Protocol for external tool/data integration
- Transports: HTTP, SSE, stdio
- Scopes: local, project, user
- OAuth 2.0 auth, dynamic tool updates
- Claude Code can serve AS an MCP server

### Plugins
- Self-contained directories with skills, agents, hooks, MCP servers, LSP servers, settings
- Distributed through marketplaces (GitHub, npm, URLs)
- Installed via `claude plugin install <name>@<marketplace>`

---

## 3. Beads: Agent-First Issue Tracker

**Repo**: https://github.com/steveyegge/beads
**Author**: Steve Yegge | **Language**: Go | **Stars**: 17.7k | **License**: MIT | **Version**: v0.56.1

### What It Is
A distributed, git-backed **graph issue tracker** designed specifically for AI coding agents. "A memory upgrade for your coding agent."

### Core Innovation
Issues are nodes in a **dependency graph** stored in a **Dolt database** (version-controlled SQL, "Git for databases"). This enables:
- `bd ready` -- shows only tasks with no open blockers (dependency-aware scheduling)
- Hash-based IDs (`bd-a1b2`) -- zero merge conflicts across branches/agents
- Cell-level merging (Dolt) -- far superior to line-level git merges
- Millisecond queries on 10k+ issues
- Time-travel queries (any historical state)

### Data Model
```
.beads/
  dolt/              # Dolt database
  metadata.json      # Backend config
  config.yaml        # Project config
```

Core fields: id, title, description, status (open/in_progress/closed), priority (0-4), issue_type (bug/feature/task/epic/chore/gate/message), assignee, labels, estimated_minutes, metadata (arbitrary JSON).

### Dependency Types
**Blocking** (affect `bd ready`): blocks, parent-child, conditional-blocks, waits-for
**Non-blocking** (annotations): related, tracks, discovered-from, caused-by, validates, supersedes, replies_to, duplicates

### Gates System
Special issues blocking work until external conditions resolve:
- `gh:pr` - PR merged
- `gh:run` - CI passes
- `timer` - time elapsed
- `bead` - cross-repo issue closed
- `human` - manual approval

### Claude Code Integration
Three mechanisms (lightweight to heavy):
1. **CLI + Hooks** (recommended): `bd setup claude` installs SessionStart hook running `bd prime` (~1-2k tokens). PreCompact hook preserves workflow context. Most token-efficient.
2. **MCP Plugin**: For Claude Desktop or MCP-only envs. Slash commands + MCP tools.
3. **Project config**: .claude/settings.json with hooks, /handoff command.

### Agent Workflow
```bash
bd init                          # Initialize
bd ready --json                  # Find ready work
bd update bd-a1b2 --claim        # Claim atomically
# ... do work ...
bd close bd-a1b2 --reason "..."  # Complete
bd ready --json                  # What's newly unblocked?
bd dolt push                     # Sync
```

### Key Features
- Agent-first: every command has `--json`, `bd prime` = 1-2k tokens
- Zero-conflict concurrency (hash-based IDs)
- Molecules: template work graphs (epics as executable dependency graphs)
- Wisps: ephemeral child issues for local iteration
- Context compaction: semantic summarization of completed tasks
- Multi-repo routing, cross-repo dependencies
- Stealth mode (local-only, no repo commits)
- OpenTelemetry observability

### Beads vs Markdown Files

| Dimension | Markdown Files | Beads |
|---|---|---|
| Storage | Flat text files | Dolt SQL database |
| Query | Grep/parse | SQL, millisecond, `--json` |
| Dependencies | Manual text refs | First-class graph |
| Ready work | Human reasons | `bd ready` computes |
| Concurrency | Git merge conflicts | Cell-level merge, zero conflicts |
| Scale | Degrades with count | 10k+ issues, 29ms queries |
| Agent interface | Parse unstructured text | Structured JSON |
| Context cost | Load full files | `bd prime` = 1-2k tokens |
| Setup | mkdir | Install Go binary + Dolt |
| Portability | Universal | Requires bd CLI |

### Assessment for spec-drum

**Beads is powerful but adds significant infrastructure overhead.** It requires:
- Go binary installation (bd CLI)
- Dolt database engine
- Understanding of graph-based dependency model
- Additional CLI commands in the workflow

**spec-drum's philosophy is "skills + CLAUDE.md only."** Adding Beads would introduce:
- An external binary dependency
- A database layer underneath the markdown specs
- Complexity that contradicts the "lightweight" goal

**However, Beads could be an optional integration point:**
- spec-drum could source tickets FROM beads: `/spec-plan bd-a1b2`
- The spec files remain markdown, but ticket discovery uses `bd ready`
- This gives dependency-aware scheduling without replacing the spec format

**Recommendation**: Keep spec-drum's core as pure markdown files. Make Beads an optional ticket source (alongside GitHub Issues, Jira, manual). Don't depend on it -- integrate with it.

---

## 4. Meta-Prompting & SDD Landscape

### What Is Meta-Prompting
Creating reusable prompt templates and configuration files that shape how AI coding agents behave across a project -- rather than hand-crafting individual prompts per task. CLAUDE.md files, .cursorrules, and GSD's XML plans are all forms of meta-prompting.

### Spec-Driven Development (SDD)
2025's breakout engineering practice. Pattern: **Specify → Plan → Tasks → Implement → Verify**.

Major implementations:
- **Kiro** (AWS) - IDE with agent hooks, requirements → design → tasks
- **spec-kit** (GitHub) - Open-source toolkit, configurable prompts + constitution
- **Tessl** - Most radical: specification IS the maintained artifact, not the code
- **GSD** - Meta-prompting + context engineering layer
- **cc-sdd** - Kiro-style SDD commands for Claude Code

### Context Engineering > Prompt Engineering
The critical skill is now what information you feed the AI, how you structure it, and how you keep it from going stale. Small, focused context windows beat large, noisy ones.

### Common Pain Points (Industry Data)
- 66% of devs: biggest frustration is AI solutions that are "almost right"
- 65%: missing context is top issue during refactoring
- 46% actively distrust AI output (vs 33% who trust)
- Code duplication up 4x with AI assistance
- Productivity paradox: devs THINK they're 20% faster but are measurably 19% slower without proper workflows

### Cross-Tool Standard: AGENTS.md
Emerging under the Linux Foundation's Agentic AI Foundation. Supported by Claude Code, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Aider, Zed, Warp, RooCode. Aims to unify the fragmented .cursorrules / CLAUDE.md / JULES.md landscape.

### Other Frameworks in the Space
| Project | Approach |
|---|---|
| claude-code-spec-workflow | Requirements → Design → Tasks → Implementation |
| claude-code-starter | Dual-agent meta-framework |
| Claude-Code-Workflow | JSON-driven multi-agent cadence |
| claude-code-workflows | Production-ready specialized AI agents |
| Repomix | Packs codebase into single AI-friendly file |

---

## 5. Key Takeaways for spec-drum

1. **The spec IS the prompt**: GSD's core insight. Plans should be executable specifications, not documents that get interpreted. spec-drum's spec.md must be detailed enough for a forked skill to implement without asking questions.

2. **Fresh context windows**: GSD's orchestrator-subagent pattern solves context rot. `context: fork` in skills gives us this for free.

3. **Conventions via CLAUDE.md**: Instead of reinventing project memory (PROJECT.md, REQUIREMENTS.md, etc.), leverage Claude Code's native CLAUDE.md system. Conventions belong in CLAUDE.md files placed throughout the codebase, not in a spec directory.

4. **Ticket-driven, not phase-driven**: GSD and BMAD both use phase-based workflows that add ceremony. spec-drum is ticket-driven -- each unit of work is a ticket with its own spec, state, and branch.

5. **2 files per ticket**: spec.md (what to build + research + verification criteria) and state.md (progress + decisions + verification reports). Research is embedded, not separate. The PR is the result.

6. **Git-native team flow**: Branch per ticket, atomic commits per task, PR is the deliverable. No separate summary files.

7. **4 skills, zero config**: `/spec-init`, `/spec-plan`, `/spec-execute`, `/spec-verify`. No config.json, no install scripts, no CLI tools.

8. **Beads as optional integration, not dependency**: spec-drum can source tickets from Beads (`bd ready --json`) but doesn't require it. The markdown spec files are the primary format.

9. **Model strategy matters**: Opus for planning (hardest reasoning), sonnet for execution (following clear instructions), sonnet for verification (structured checking).

10. **Don't automate PR creation**: Team-specific workflows vary too much. spec-drum creates the branch and code; humans handle the PR.
