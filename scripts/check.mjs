#!/usr/bin/env node
// Read-only validator: every {{token}} and IF:condition used in the skill
// templates must be declared in references/tokens.md. Exit 1 on any finding.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "setup-project");
const tokensDoc = readFileSync(join(root, "references", "tokens.md"), "utf8");
const templatesDir = join(root, "templates");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const problems = [];
const tokenRe = /\{\{([a-z_]+)\}\}/g;
const condRe = /<!--\s*(IF|ELSE|ENDIF)(?::([a-z_]+))?\s*-->/g;

for (const file of walk(templatesDir)) {
  const content = readFileSync(file, "utf8");
  const rel = file.replace(`${root}/`, "");

  for (const match of content.matchAll(tokenRe)) {
    if (!tokensDoc.includes(`{{${match[1]}}}`)) {
      problems.push(`${rel}: token {{${match[1]}}} not declared in tokens.md`);
    }
  }

  let depth = 0;
  for (const match of content.matchAll(condRe)) {
    if (match[1] === "IF") {
      depth++;
      if (!tokensDoc.includes(`IF:${match[2]}`)) {
        problems.push(`${rel}: condition IF:${match[2]} not declared in tokens.md`);
      }
    } else if (match[1] === "ENDIF") {
      depth--;
      if (depth < 0) problems.push(`${rel}: ENDIF without matching IF`);
    }
  }
  if (depth !== 0) problems.push(`${rel}: unclosed IF block (${depth})`);
}

if (problems.length > 0) {
  console.error(`check: ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log("check: all template tokens and conditions are declared");