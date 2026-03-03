#!/usr/bin/env node

// PostToolUse hook: validates YAML frontmatter of .specs/*/spec.md and .specs/*/state.md
// Exits 0 (silent) for non-spec files or valid frontmatter.
// Exits 2 with stderr for invalid frontmatter — Claude Code shows the message to Claude.

const fs = require("fs");

const STATUS_VALUES = ["draft", "in-progress", "review", "done", "blocked"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

let raw = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(raw);
    const filePath = event.tool_input?.file_path;
    if (!filePath) process.exit(0);

    const normalized = filePath.replace(/\\/g, "/");
    const isSpec = /\.specs\/[^/]+\/spec\.md$/.test(normalized);
    const isState = /\.specs\/[^/]+\/state\.md$/.test(normalized);
    if (!isSpec && !isState) process.exit(0);

    let content;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      process.exit(0);
    }

    const fm = parseFrontmatter(content);
    if (!fm) {
      fail(`${isSpec ? "spec.md" : "state.md"} is missing YAML frontmatter (expected --- ... --- block)`);
    }

    const errors = isSpec ? validateSpec(fm) : validateState(fm);
    if (errors.length > 0) {
      fail(`${isSpec ? "spec.md" : "state.md"} frontmatter invalid:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
    }

    process.exit(0);
  } catch {
    process.exit(0); // never block on unexpected errors
  }
});

function fail(msg) {
  process.stderr.write(msg + "\n");
  process.exit(2);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

function validateSpec(fm) {
  const errors = [];

  if (!fm.id) errors.push("'id' is required");
  if (!fm.title) errors.push("'title' is required");

  if (!["github", "jira", "manual"].includes(fm.source)) {
    errors.push(`'source' must be github, jira, or manual (got: ${fm.source || "missing"})`);
  }

  if (!fm.source_ref) errors.push("'source_ref' is required");

  if (!fm.created || !ISO_DATE.test(fm.created)) {
    errors.push(`'created' must be YYYY-MM-DD (got: ${fm.created || "missing"})`);
  }

  if (!STATUS_VALUES.includes(fm.status)) {
    errors.push(`'status' must be one of: ${STATUS_VALUES.join(", ")} (got: ${fm.status || "missing"})`);
  }

  if (!["P1", "P2", "P3"].includes(fm.priority)) {
    errors.push(`'priority' must be P1, P2, or P3 (got: ${fm.priority || "missing"})`);
  }

  if (fm.depends_on === undefined) {
    errors.push("'depends_on' is required (use [] for none)");
  }

  if (!fm.branch) errors.push("'branch' is required");

  return errors;
}

function validateState(fm) {
  const errors = [];

  if (!fm.id) errors.push("'id' is required");

  if (!STATUS_VALUES.includes(fm.status)) {
    errors.push(`'status' must be one of: ${STATUS_VALUES.join(", ")} (got: ${fm.status || "missing"})`);
  }

  if (fm.branch === undefined) errors.push("'branch' is required (use null if not yet set)");
  if (fm.current_task === undefined) errors.push("'current_task' is required (use null if not active)");

  if (fm.started === undefined || (fm.started !== "null" && !ISO_DATE.test(fm.started))) {
    errors.push("'started' must be YYYY-MM-DD or null");
  }

  if (!fm.updated || !ISO_DATE.test(fm.updated)) {
    errors.push(`'updated' must be YYYY-MM-DD (got: ${fm.updated || "missing"})`);
  }

  return errors;
}
