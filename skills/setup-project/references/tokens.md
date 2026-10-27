# Tokens, answers.json schema, and rendering rules

## answers.json schema

Written by the skill to `.project-setup/answers.json` after the user confirms the summary. All values are JSON primitives; arrays where noted.

```json
{
  "schema_version": 1,
  "skill_version": "read from references/VERSION",
  "project_name": "My Project",
  "project_slug": "my-project",
  "one_liner": "…",
  "project_type": "web_app",
  "language": "typescript",
  "framework": "next",
  "package_manager": "pnpm",
  "commands": { "build": "", "test": "", "lint": "", "dev": "" },
  "repo_state": "fresh",
  "harnesses": ["claude", "vibe"],
  "language_rule": "english_only",
  "git_rules": {
    "no_ai_attribution": true,
    "commit_style": "conventional",
    "branch_policy": "feature_branches"
  },
  "workflow_mode": "direct",
  "agent_roles": ["orchestrator", "developer", "tester"],
  "testing": { "framework": "vitest", "tdd": true, "coverage_gate": null },
  "quality_gates": {
    "linter": "eslint",
    "formatter": "prettier",
    "review_before_commit": true,
    "security_review": "on_request"
  },
  "ci_enabled": true,
  "ci_jobs": ["lint", "test"],
  "docs_level": "standard",
  "commit_answers": true,
  "generated_files": []
}
```

`generated_files` lists every file this skill wrote, with the conflict resolution used (e.g. `{"path": "AGENTS.md", "resolution": "MERGE"}`). It is how re-runs know to **update instead of duplicate**.

## Tokens

Every `{{token}}` in a template is replaced with the corresponding answers value. Tokens not answerable from answers.json must never appear in templates.

| Token | Source |
|-------|--------|
| `{{project_name}}` | project_name |
| `{{project_slug}}` | project_slug |
| `{{one_liner}}` | one_liner |
| `{{project_type}}` | project_type (humanized: `web_app` → `web app`) |
| `{{language}}` | language |
| `{{framework}}` | framework ("none" if empty) |
| `{{language_framework}}` | `"<language> / <framework>"`, or just `"<language>"` if no framework |
| `{{package_manager}}` | package_manager |
| `{{cmd_build}}` | commands.build |
| `{{cmd_test}}` | commands.test |
| `{{cmd_lint}}` | commands.lint |
| `{{cmd_dev}}` | commands.dev |
| `{{cmd_install}}` | standard install command for the package manager (e.g. `npm ci`, `pnpm install`, `pip install -e .`) |
| `{{test_framework}}` | testing.framework |
| `{{linter}}` | quality_gates.linter |
| `{{formatter}}` | quality_gates.formatter |
| `{{ci_jobs}}` | ci_jobs rendered as prose (e.g. `lint and test`) |
| `{{coverage_gate}}` | testing.coverage_gate (only used inside IF:coverage_gate) |
| `{{setup_date}}` | date of the run (YYYY-MM-DD) |

## Conditional sections

Templates contain `<!-- IF:condition -->…<!-- ENDIF -->` blocks. Expand (keep contents, drop the markers) when the condition is true, drop the whole block (markers included) when false.

| Condition | True when |
|-----------|-----------|
| `IF:tdd` | testing.tdd |
| `IF:coverage_gate` | testing.coverage_gate is not null |
| `IF:ci` | ci_enabled |
| `IF:feature_branches` | git_rules.branch_policy == feature_branches |
| `IF:no_attribution` | git_rules.no_ai_attribution |
| `IF:changelog` / `IF:adr` | docs_level standard/full |
| `IF:role_ui_designer` | agent_roles includes ui_designer |
| `IF:role_file_worker` | agent_roles includes file_worker |
| `IF:role_code_reviewer` | agent_roles includes code_reviewer |
| `IF:role_devops` | agent_roles includes devops |
| `IF:lang_javascript` | language in [javascript, typescript] |
| `IF:lang_python` | language == python |
| `IF:lang_go` / `IF:lang_rust` | language == go / rust |
| `IF:harness_claude` | harnesses includes claude |
| `IF:harness_vibe` | harnesses includes vibe |
| `IF:review_before_commit` | quality_gates.review_before_commit |
| `IF:security_review_on_request` | quality_gates.security_review == on_request |

## ELSE blocks

`<!-- IF:condition -->A<!-- ELSE -->B<!-- ENDIF -->` renders as A when the condition is true, as B when false. Plain `<!-- IF:… -->…<!-- ENDIF -->` (no ELSE) drops the whole block when false. Use ELSE sparingly — only when both branches carry real content.

**Never nest IF blocks.** Flatten templates instead: independent rules each get their own small IF block.

## Rendering rules

1. Replace tokens **first**, then evaluate conditionals (so conditions and contents never interact).
2. After rendering, strip every remaining rendering comment (`<!-- IF:… -->`, `<!-- ENDIF -->`, and any `<!-- NOTE: … -->` guidance comments in templates).
3. Never leave a `{{token}}` or an `IF` marker in a generated file. If one survives because an answer is missing, **stop and ask** — do not guess.
4. Generated files are prose with placeholders, not literal string substitution only: fit surrounding sentences to the answer (e.g. drop "using {{framework}}" when framework is "none").