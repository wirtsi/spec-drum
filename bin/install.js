#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const SKILL_FILES = [
  { src: "skills/spec-init/SKILL.md", dest: "skills/spec-init/SKILL.md" },
  { src: "skills/spec-plan/SKILL.md", dest: "skills/spec-plan/SKILL.md" },
  { src: "skills/spec-execute/SKILL.md", dest: "skills/spec-execute/SKILL.md" },
  { src: "skills/spec-verify/SKILL.md", dest: "skills/spec-verify/SKILL.md" },
];

const SPEC_FILES = [
  { src: "specs/CLAUDE.md", dest: "CLAUDE.md" },
];

function printBanner() {
  console.log();
  console.log("  spec-drum \uD83E\uDD41");
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
  const srcPath = path.join(PACKAGE_ROOT, srcRel);
  const srcContent = fs.readFileSync(srcPath, "utf-8");

  if (fs.existsSync(destPath)) {
    const existing = fs.readFileSync(destPath, "utf-8");
    if (existing === srcContent) {
      return "up-to-date";
    }
    return "differs";
  }

  ensureDir(destPath);
  fs.writeFileSync(destPath, srcContent, "utf-8");
  return "created";
}

function writeFile(srcRel, destPath) {
  const srcPath = path.join(PACKAGE_ROOT, srcRel);
  const srcContent = fs.readFileSync(srcPath, "utf-8");
  ensureDir(destPath);
  fs.writeFileSync(destPath, srcContent, "utf-8");
}

async function handleDiffers(rl, destPath, srcRel) {
  const rel = path.relative(process.cwd(), destPath);
  console.log(`  ~ ${rel} differs from source`);
  const answer = await ask(rl, "    Overwrite / Skip / Backup? [o/s/b]: ");

  switch (answer.toLowerCase()) {
    case "o":
    case "overwrite":
      writeFile(srcRel, destPath);
      return "overwritten";
    case "b":
    case "backup": {
      const backupPath = destPath + ".bak";
      fs.copyFileSync(destPath, backupPath);
      writeFile(srcRel, destPath);
      return "backed-up";
    }
    case "s":
    case "skip":
    default:
      return "skipped";
  }
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
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    scope = await promptScope(rl);
    rl.close();
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const results = { created: 0, "up-to-date": 0, overwritten: 0, "backed-up": 0, skipped: 0 };

  if (scope === "local") {
    const cwd = process.cwd();
    const claudeDir = path.join(cwd, ".claude");
    const specsDir = path.join(cwd, ".specs");

    console.log("  Installing to this project...");
    console.log();

    // Install skill files into .claude/skills/
    for (const file of SKILL_FILES) {
      const destPath = path.join(claudeDir, file.dest);
      const status = installFile(file.src, destPath);
      const rel = ".claude/" + file.dest;

      if (status === "created") {
        console.log(`  \u2713 ${rel}`);
        results.created++;
      } else if (status === "up-to-date") {
        console.log(`  \u2022 ${rel} (up to date)`);
        results["up-to-date"]++;
      } else if (status === "differs") {
        const action = await handleDiffers(rl, destPath, file.src);
        if (action === "overwritten") {
          console.log(`  \u2713 ${rel} (overwritten)`);
          results.overwritten++;
        } else if (action === "backed-up") {
          console.log(`  \u2713 ${rel} (backed up + overwritten)`);
          results["backed-up"]++;
        } else {
          console.log(`  - ${rel} (skipped)`);
          results.skipped++;
        }
      }
    }

    // Install spec conventions into .specs/
    for (const file of SPEC_FILES) {
      const destPath = path.join(specsDir, file.dest);
      const status = installFile(file.src, destPath);
      const rel = ".specs/" + file.dest;

      if (status === "created") {
        console.log(`  \u2713 ${rel}`);
        results.created++;
      } else if (status === "up-to-date") {
        console.log(`  \u2022 ${rel} (up to date)`);
        results["up-to-date"]++;
      } else if (status === "differs") {
        const action = await handleDiffers(rl, destPath, file.src);
        if (action === "overwritten") {
          console.log(`  \u2713 ${rel} (overwritten)`);
          results.overwritten++;
        } else if (action === "backed-up") {
          console.log(`  \u2713 ${rel} (backed up + overwritten)`);
          results["backed-up"]++;
        } else {
          console.log(`  - ${rel} (skipped)`);
          results.skipped++;
        }
      }
    }
  } else {
    // Global install: skills only (no .specs)
    const claudeDir = path.join(os.homedir(), ".claude");

    console.log("  Installing globally...");
    console.log();

    for (const file of SKILL_FILES) {
      const destPath = path.join(claudeDir, file.dest);
      const status = installFile(file.src, destPath);
      const rel = "~/.claude/" + file.dest;

      if (status === "created") {
        console.log(`  \u2713 ${rel}`);
        results.created++;
      } else if (status === "up-to-date") {
        console.log(`  \u2022 ${rel} (up to date)`);
        results["up-to-date"]++;
      } else if (status === "differs") {
        const action = await handleDiffers(rl, destPath, file.src);
        if (action === "overwritten") {
          console.log(`  \u2713 ${rel} (overwritten)`);
          results.overwritten++;
        } else if (action === "backed-up") {
          console.log(`  \u2713 ${rel} (backed up + overwritten)`);
          results["backed-up"]++;
        } else {
          console.log(`  - ${rel} (skipped)`);
          results.skipped++;
        }
      }
    }
  }

  rl.close();

  console.log();

  const parts = [];
  if (results.created > 0) parts.push(`${results.created} created`);
  if (results.overwritten > 0) parts.push(`${results.overwritten} overwritten`);
  if (results["backed-up"] > 0) parts.push(`${results["backed-up"]} backed up`);
  if (results["up-to-date"] > 0) parts.push(`${results["up-to-date"]} up to date`);
  if (results.skipped > 0) parts.push(`${results.skipped} skipped`);

  if (parts.length > 0) {
    console.log(`  ${parts.join(", ")}.`);
  }

  console.log();
  if (scope === "local") {
    console.log("  Done! Run /spec-init to get started.");
  } else {
    console.log("  Done! Skills installed globally.");
    console.log("  Run /spec-init in any project to get started.");
  }
  console.log();
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
