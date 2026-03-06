#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const HOOK_COMMAND =
  'if [ -f "$CLAUDE_PROJECT_DIR/.claude/bin/validate-spec.js" ]; then node "$CLAUDE_PROJECT_DIR/.claude/bin/validate-spec.js"; else node "$HOME/.claude/bin/validate-spec.js"; fi';

const SKILL_FILES = [
  { src: "skills/spec-steer/SKILL.md", dest: "skills/spec-steer/SKILL.md" },
  { src: "skills/spec-plan/SKILL.md", dest: "skills/spec-plan/SKILL.md" },
  { src: "skills/spec-execute/SKILL.md", dest: "skills/spec-execute/SKILL.md" },
  { src: "skills/spec-verify/SKILL.md", dest: "skills/spec-verify/SKILL.md" },
  { src: "skills/spec-quick/SKILL.md", dest: "skills/spec-quick/SKILL.md" },
  { src: "bin/validate-spec.js", dest: "bin/validate-spec.js" },
];

const SPEC_FILES = [
  { src: "specs/CLAUDE.md", dest: "CLAUDE.md" },
];

function printBanner() {
  console.log();
  console.log("  spec-drum 🥁");
  console.log();
}

function printHelp() {
  printBanner();
  console.log("  Usage: npx spec-drum [options]");
  console.log();
  console.log("  Options:");
  console.log("    --local   Install to this project (.claude/ and .specs/)");
  console.log("    --global  Install globally (~/.claude/)");
  console.log("    --help    Show this help message");
  console.log();
  console.log("  If no option is given, you'll be prompted to choose.");
  console.log();
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function promptScope(rl) {
  console.log("  Install to:");
  console.log("    1) This project (.claude/)");
  console.log("    2) Global (~/.claude/)");
  console.log();

  while (true) {
    const answer = await ask(rl, "  Choose [1/2]: ");
    if (answer === "1") return "local";
    if (answer === "2") return "global";
    console.log("  Please enter 1 or 2.");
  }
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function installFile(srcRel, destPath) {
  const srcContent = fs.readFileSync(path.join(PACKAGE_ROOT, srcRel), "utf-8");
  if (fs.existsSync(destPath)) {
    return fs.readFileSync(destPath, "utf-8") === srcContent ? "up-to-date" : "differs";
  }
  ensureDir(destPath);
  fs.writeFileSync(destPath, srcContent, "utf-8");
  return "created";
}

function overwriteFile(srcRel, destPath) {
  ensureDir(destPath);
  fs.writeFileSync(destPath, fs.readFileSync(path.join(PACKAGE_ROOT, srcRel), "utf-8"), "utf-8");
}

async function handleDiffers(rl, destPath, srcRel) {
  console.log(`  ~ ${path.relative(process.cwd(), destPath)} differs from source`);
  const answer = await ask(rl, "    Overwrite / Skip / Backup? [o/s/b]: ");
  switch (answer.toLowerCase()) {
    case "o":
    case "overwrite":
      overwriteFile(srcRel, destPath);
      return "overwritten";
    case "b":
    case "backup":
      fs.copyFileSync(destPath, destPath + ".bak");
      overwriteFile(srcRel, destPath);
      return "backed-up";
    default:
      return "skipped";
  }
}

async function installFiles(rl, files, destDir, prefix, results) {
  for (const file of files) {
    const destPath = path.join(destDir, file.dest);
    const rel = prefix + file.dest;
    const status = installFile(file.src, destPath);

    if (status === "created") {
      console.log(`  ✓ ${rel}`);
      results.created++;
    } else if (status === "up-to-date") {
      console.log(`  • ${rel} (up to date)`);
      results["up-to-date"]++;
    } else {
      const action = await handleDiffers(rl, destPath, file.src);
      if (action === "overwritten") {
        console.log(`  ✓ ${rel} (overwritten)`);
        results.overwritten++;
      } else if (action === "backed-up") {
        console.log(`  ✓ ${rel} (backed up + overwritten)`);
        results["backed-up"]++;
      } else {
        console.log(`  - ${rel} (skipped)`);
        results.skipped++;
      }
    }
  }
}

function removeOldSpecInit(claudeDir) {
  const oldDir = path.join(claudeDir, "skills", "spec-init");
  if (fs.existsSync(oldDir)) {
    fs.rmSync(oldDir, { recursive: true });
    console.log("  ✓ removed old skills/spec-init/ (renamed to spec-steer)");
  }
}

function mergeHook(settingsPath) {
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8")); } catch { /**/ }
  }

  const postToolUse = (settings.hooks = settings.hooks || {}).PostToolUse =
    (settings.hooks.PostToolUse || []);

  if (postToolUse.some((g) => g.hooks?.some((h) => h.command === HOOK_COMMAND))) {
    return "up-to-date";
  }

  postToolUse.push({ matcher: "Write|Edit", hooks: [{ type: "command", command: HOOK_COMMAND }] });
  ensureDir(settingsPath);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
  return "created";
}

async function run() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  printBanner();

  let scope;
  if (args.includes("--local")) {
    scope = "local";
  } else if (args.includes("--global")) {
    scope = "global";
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    scope = await promptScope(rl);
    rl.close();
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const results = { created: 0, "up-to-date": 0, overwritten: 0, "backed-up": 0, skipped: 0 };

  const claudeDir = scope === "local"
    ? path.join(process.cwd(), ".claude")
    : path.join(os.homedir(), ".claude");

  console.log(scope === "local" ? "  Installing to this project..." : "  Installing globally...");
  console.log();

  removeOldSpecInit(claudeDir);
  await installFiles(rl, SKILL_FILES, claudeDir, scope === "local" ? ".claude/" : "~/.claude/", results);

  if (scope === "local") {
    await installFiles(rl, SPEC_FILES, path.join(process.cwd(), ".specs"), ".specs/", results);
  }

  const hookStatus = mergeHook(path.join(claudeDir, "settings.json"));
  const settingsLabel = (scope === "local" ? ".claude" : "~/.claude") + "/settings.json";
  if (hookStatus === "created") {
    console.log(`  ✓ ${settingsLabel} (hook added)`);
    results.created++;
  } else {
    console.log(`  • ${settingsLabel} (hook already present)`);
    results["up-to-date"]++;
  }

  rl.close();
  console.log();

  const parts = [];
  if (results.created > 0) parts.push(`${results.created} created`);
  if (results.overwritten > 0) parts.push(`${results.overwritten} overwritten`);
  if (results["backed-up"] > 0) parts.push(`${results["backed-up"]} backed up`);
  if (results["up-to-date"] > 0) parts.push(`${results["up-to-date"]} up to date`);
  if (results.skipped > 0) parts.push(`${results.skipped} skipped`);
  if (parts.length > 0) console.log(`  ${parts.join(", ")}.`);

  console.log();
  if (scope === "local") {
    console.log("  Done! Run /spec-steer to get started.");
  } else {
    console.log("  Done! Skills installed globally.");
    console.log("  Run /spec-steer in any project to get started.");
  }
  console.log();
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
