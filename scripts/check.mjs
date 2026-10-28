#!/usr/bin/env node
// Read-only validator for the setup-project skill. Exit 1 on any finding.
//
// 1. Every {{token}} and IF:condition used in templates or references must be
//    declared in references/tokens.md.
// 2. Every token and condition declared in tokens.md must actually be used
//    (no dead declarations).
// 3. IF/ELSE/ENDIF markers must be well-formed: no ELSE outside a block,
//    at most one ELSE per block, no stray ENDIF, no unclosed block.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "skills", "setup-project");
const tokensDoc = readFileSync(join(root, "references", "tokens.md"), "utf8");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// Scan the whole skill except the declaration doc itself, the version file,
// and nothing else. SKILL.md illustrates syntax with the generic placeholders
// {{token}} and IF:condition - those two names are exempt.
const SKIP_FILES = new Set(["references/tokens.md", "references/VERSION"]);
const GENERIC_TOKENS = new Set(["token"]);
const GENERIC_CONDS = new Set(["condition"]);

const scanned = walk(root)
  .filter((file) => !SKIP_FILES.has(file.replace(`${root}/`, "")))
  .map((file) => {
    const rel = file.replace(`${root}/`, "");
    return { rel, content: readFileSync(file, "utf8") };
  });

const tokenRe = /\{\{([a-z0-9_]+)\}\}/g;
const condRe = /<!--\s*(IF|ELSE|ENDIF)(?::([a-z0-9_]+))?\s*-->/g;

// declarations in tokens.md (table rows)
const declaredTokens = new Set(
  [...tokensDoc.matchAll(/^\| `(\{\{[a-z0-9_]+\}\})`/gm)].map((m) => m[1])
);
const declaredConds = new Set(
  [...tokensDoc.matchAll(/^\| `IF:([a-z0-9_]+)`/gm)].map((m) => m[1])
);

const problems = [];
const usedTokens = new Set();
const usedConds = new Set();

for (const { rel, content } of scanned) {
  for (const match of content.matchAll(tokenRe)) {
    const token = match[1];
    usedTokens.add(token);
    if (!declaredTokens.has(`{{${token}}}`) && !GENERIC_TOKENS.has(token)) {
      problems.push(`${rel}: token {{${token}}} not declared in tokens.md`);
    }
  }

  // condition names also appear in references prose (file plan notes);
  // count them as usage but not as undeclared-marker findings there
  if (rel.startsWith("templates/")) {
    for (const match of content.matchAll(/IF:([a-z0-9_]+)/g)) {
      const cond = match[1];
      usedConds.add(cond);
      if (!declaredConds.has(cond) && !GENERIC_CONDS.has(cond)) {
        problems.push(`${rel}: condition IF:${cond} not declared in tokens.md`);
      }
    }
  } else {
    for (const match of content.matchAll(/IF:([a-z0-9_]+)/g)) {
      usedConds.add(match[1]);
    }
  }

  // marker well-formedness (IF/ELSE/ENDIF) - only meaningful in templates
  if (!rel.startsWith("templates/")) continue;
  let depth = 0;
  const elseSeen = new Set();
  for (const match of content.matchAll(condRe)) {
    if (match[1] === "IF") {
      depth++;
    } else if (match[1] === "ELSE") {
      if (depth === 0) {
        problems.push(`${rel}: ELSE without matching IF`);
      } else if (elseSeen.has(depth)) {
        problems.push(`${rel}: second ELSE in the same IF block`);
      } else {
        elseSeen.add(depth);
      }
    } else {
      depth--;
      elseSeen.delete(depth + 1);
      if (depth < 0) problems.push(`${rel}: ENDIF without matching IF`);
    }
  }
  if (depth !== 0) problems.push(`${rel}: unclosed IF block (${depth})`);
}

// no dead declarations
for (const token of declaredTokens) {
  if (!usedTokens.has(token.slice(2, -2))) {
    problems.push(`references/tokens.md: token ${token} declared but never used`);
  }
}
for (const cond of declaredConds) {
  if (!usedConds.has(cond)) {
    problems.push(`references/tokens.md: condition IF:${cond} declared but never used`);
  }
}

if (problems.length > 0) {
  console.error(`check: ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `check: ${declaredTokens.size} tokens and ${declaredConds.size} conditions declared, used, and well-formed`
);