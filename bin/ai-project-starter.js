#!/usr/bin/env node
"use strict";

/*
 * ai-project-starter installer
 *
 * Copies the setup-project skill from this repository into a target
 * project's harness skill directories (Claude Code, vibe). Pure file
 * copy, zero dependencies. Re-running updates the skill in place.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const SKILL_NAME = "setup-project";

// ---------------------------------------------------------------- paths

const repoRoot = path.resolve(__dirname, "..");
const skillSource = path.join(repoRoot, "skills", SKILL_NAME);
const versionFile = path.join(skillSource, "references", "VERSION");

const HARNESS_DIRS = {
  claude: { project: path.join(".claude", "skills"), user: path.join(os.homedir(), ".claude", "skills") },
  vibe: { project: path.join(".vibe", "skills"), user: path.join(os.homedir(), ".vibe", "skills") },
};

const HARNESS_HINTS = {
  claude: {
    reload: "If your Claude Code session is already running and .claude/skills/ was just created, run /reload-skills.",
    run: 'In Claude Code, run: /setup-project  (or say "set up my project")',
  },
  vibe: {
    reload: "vibe asks you to trust the folder on first run (or start with: vibe --trust), then run /reload if a session is open.",
    run: "In vibe, run: /setup-project  (or say \"set up my project\")",
  },
};

// ---------------------------------------------------------------- help

function readVersion() {
  try {
    return fs.readFileSync(versionFile, "utf8").trim();
  } catch {
    return "unknown";
  }
}

function printHelp() {
  const usage = [
    "ai-project-starter - install the /setup-project skill into a project",
    "",
    "Usage:",
    "  ai-project-starter [path]         Install into [path] (default: current directory)",
    "  ai-project-starter --user         Install to user-level skill dirs (~/.claude/skills,",
    "                                    ~/.vibe/skills) - available in all your projects",
    "",
    "Options:",
    "  --harness <claude|vibe|all>  Override harness detection",
    "  --detect-only                Print detected harnesses (never prompts), install nothing",
    "  --force                      Overwrite an existing skill without prompting",
    "  --version                    Print the skill version and exit",
    "  -h, --help                   Show this help",
    "",
    "Install from GitHub (no npm publish needed):",
    "  npx github:cberane/ai-project-starter",
    "",
    "After installing, launch your harness in the target directory and run /setup-project.",
  ].join("\n");
  process.stdout.write(usage + "\n");
}

// ---------------------------------------------------------------- utils

function fail(message) {
  process.stderr.write(`ai-project-starter: ${message}\n`);
  process.exit(1);
}

function detectHarnesses(targetDir) {
  const found = [];
  for (const [name, dirs] of Object.entries(HARNESS_DIRS)) {
    const marker = path.join(targetDir, dirs.project.split(path.sep)[0]);
    try {
      // Only a directory counts as a harness marker, not a stray file.
      if (fs.statSync(marker).isDirectory()) found.push(name);
    } catch {
      // absent (or unreadable) - not detected
    }
  }
  return found;
}

function ask(question, fallback) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let settled = false;
    const settle = (fn, value) => {
      if (!settled) {
        settled = true;
        fn(value);
      }
    };
    // Ctrl+C aborts the install; EOF / a closed pipe falls back to the default.
    // Double-settle is guarded - promises settle once either way.
    rl.on("SIGINT", () => {
      process.stdout.write("\n");
      settle(reject, new Error("aborted by user (Ctrl+C)"));
      rl.close();
    });
    rl.on("close", () => settle(resolve, fallback));
    rl.question(`${question} `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      settle(resolve, trimmed === "" ? fallback : trimmed);
    });
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

// Copy the skill to a temp dir, then swap it in. The destination stays intact
// if the copy fails halfway (no half-installed skill that a later VERSION
// check would mistake for complete), and the swap replaces the directory
// wholesale, so files dropped upstream do not linger across upgrades.
function replaceSkillDir(dest) {
  const tmp = `${dest}.tmp-${process.pid}`;
  fs.rmSync(tmp, { recursive: true, force: true });
  try {
    copyDir(skillSource, tmp);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(tmp, dest);
  } catch (error) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw error;
  }
}

function installedVersion(dest) {
  const vf = path.join(dest, "references", "VERSION");
  try {
    return fs.readFileSync(vf, "utf8").trim();
  } catch {
    return null;
  }
}

// "upgraded" / "downgraded" when both versions parse as x.y.z, else "updated".
function versionDirection(oldVersion, newVersion) {
  const parse = (v) => (v.match(/^(\d+)\.(\d+)\.(\d+)$/) || []).map(Number).slice(1);
  const a = parse(oldVersion);
  const b = parse(newVersion);
  if (a.length !== 3 || b.length !== 3) return "updated";
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return b[i] > a[i] ? "upgraded" : "downgraded";
  }
  return "updated";
}

async function installInto(destDir, harness, force) {
  const dest = path.join(destDir, SKILL_NAME);
  const existing = fs.existsSync(dest);

  if (existing && !force) {
    const old = installedVersion(dest);
    const current = readVersion();
    if (old === current) {
      process.stdout.write(`  ${harness}: already at version ${current} - nothing to do\n`);
      return { harness, changed: false };
    }
    if (old !== null && current !== "unknown") {
      // straightforward upgrade of our own skill - no prompt needed.
      // The skill directory is replaced wholesale: local edits to it are lost.
      replaceSkillDir(dest);
      process.stdout.write(
        `  ${harness}: ${versionDirection(old, current)} ${old} -> ${current} (existing skill directory replaced)\n`
      );
      return { harness, changed: true };
    }
    const answer = await ask(
      `  ${harness}: skill directory already exists. Overwrite? [y/N]`,
      "n"
    );
    if (answer !== "y" && answer !== "yes") {
      process.stdout.write(`  ${harness}: kept existing skill\n`);
      return { harness, changed: false };
    }
  }

  replaceSkillDir(dest);
  process.stdout.write(`  ${harness}: installed ${readVersion()} -> ${dest}\n`);
  return { harness, changed: true };
}

// ---------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  let targetPath = ".";
  let harnessFlag = null;
  let userMode = false;
  let detectOnly = false;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      return;
    }
    if (arg === "--version") {
      process.stdout.write(`${readVersion()}\n`);
      return;
    }
    if (arg === "--detect-only") {
      detectOnly = true;
    } else if (arg === "--user") {
      userMode = true;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--harness") {
      harnessFlag = args[++i];
      if (!harnessFlag || !["claude", "vibe", "all"].includes(harnessFlag)) {
        fail("--harness expects claude, vibe, or all");
      }
    } else if (arg.startsWith("-")) {
      // catches typos like -user or -force, not just unknown --flags
      fail(`unknown option: ${arg}`);
    } else if (targetPath !== ".") {
      fail(`unexpected argument: ${arg} (only one target path is allowed)`);
    } else {
      targetPath = arg;
    }
  }

  if (!fs.existsSync(skillSource)) {
    fail("skill source not found - run this from a clone of ai-project-starter");
  }

  if (!userMode) {
    const resolved = path.resolve(targetPath);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      fail(`target directory does not exist: ${resolved}`);
    }
  }

  // resolve harnesses
  let harnesses;
  if (harnessFlag === "all" || harnessFlag === "claude" || harnessFlag === "vibe") {
    harnesses = harnessFlag === "all" ? ["claude", "vibe"] : [harnessFlag];
  } else if (userMode) {
    if (targetPath !== ".") {
      process.stdout.write("Ignoring the target path: --user installs to user-level skill dirs.\n");
    }
    harnesses = ["claude", "vibe"];
  } else {
    const detected = detectHarnesses(path.resolve(targetPath));
    if (detectOnly) {
      // never prompts - print what is actually there, even if it is nothing
      process.stdout.write(`Harnesses: ${detected.length > 0 ? detected.join(", ") : "none detected"}\n`);
      return;
    }
    if (detected.length > 0) {
      harnesses = detected;
      process.stdout.write(`Detected harnesses: ${detected.join(", ")}\n`);
    } else {
      process.stdout.write("No harness detected in the target directory.\n");
      const answer = await ask("Install for which harness? [claude/vibe/both] (default: both)", "both");
      harnesses = answer === "claude" ? ["claude"] : answer === "vibe" ? ["vibe"] : ["claude", "vibe"];
    }
  }

  if (detectOnly) {
    process.stdout.write(`Harnesses: ${harnesses.join(", ")}\n`);
    return;
  }

  process.stdout.write(`Installing ${SKILL_NAME} skill (version ${readVersion()})\n`);
  const results = [];
  for (const harness of harnesses) {
    const base = userMode ? HARNESS_DIRS[harness].user : path.join(path.resolve(targetPath), HARNESS_DIRS[harness].project);
    fs.mkdirSync(base, { recursive: true });
    results.push(await installInto(base, harness, force));
  }

  // next steps
  process.stdout.write("\nNext steps:\n");
  for (const harness of harnesses) {
    process.stdout.write(`- ${HARNESS_HINTS[harness].run}\n`);
  }
  const changedAny = results.some((r) => r.changed);
  if (changedAny) {
    for (const harness of harnesses) {
      process.stdout.write(`- ${HARNESS_HINTS[harness].reload}\n`);
    }
  }
  process.stdout.write(
    "\nThe skill will interview you one question at a time, then generate AGENTS.md,\nspec templates, agent roles, and optionally the repo scaffold.\n"
  );
}

main().catch((error) => fail(error.message));