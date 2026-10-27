---
name: setup-project
description: Interactive setup interview that configures a project for AI-assisted, spec-driven development. Load when the user asks to set up, initialize, scaffold, or configure a fresh or existing project, says "setup my fresh project from GITHUB_REPO_URL", "start a new project", or wants AGENTS.md, agent roles, spec templates, or AI harness config generated. Conducts a one-question-at-a-time interview, then generates all project configuration and optionally the full repo scaffold.
argument-hint: [GITHUB_REPO_URL]
---

# setup-project

Turn the current project into a fully configured, AI-assisted, spec-driven project by interviewing the user — **one question at a time** — and then generating configuration and, if requested, the repo scaffold.

## Scope

Two phases, strictly separated:

- **Phase 1 — Configuration.** `AGENTS.md` (single source of truth), per-harness wrapper config, `.project-setup/answers.json`, spec templates, agent role files, `.gitignore` additions, git rules. Always offered; the core of this skill.
- **Phase 2 — Scaffold (optional, offered at the end).** Directory structure, `git init` (only if `.git` is absent), CI workflow stub, README. The user explicitly consents to each part.

## How this skill is organized

```
SKILL.md                  # This file: contract, flow, phases
references/questions.md   # The full question catalog: options, defaults, prefill
references/tokens.md      # Template tokens and conditional-section semantics
references/apply.md       # File plan, conflict protocol, report format
references/VERSION        # Skill version
templates/                # Every file generated in the target project
```

Read `references/questions.md` before starting the interview. Read `references/tokens.md` and `references/apply.md` before applying. Reference support files by path relative to this skill directory; read them on demand.

## Before the first question: pre-check scan

Scan the project **before asking anything**, so questions come pre-filled instead of blind. Detect:

- Existing `.git` (repo state), harness directories (`.claude/`, `.vibe/`, `.agents/`)
- Lockfiles / manifest files → language, framework, package manager
- Existing `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`, test directories, CI workflows
- If the user provided a `GITHUB_REPO_URL` as the argument: extract the project name from it and note that the repo may need cloning — ask where the project should live before proceeding

**Resume & amend:** if `.project-setup/answers.json` exists, do not restart. Show the stored answers as a table, then ask (one question): *"Resume setup and amend these, or start fresh?"* On resume, prefill every question from the stored answers and only ask which sections to redo, then jump to the summary.

## Interview contract (non-negotiable)

1. **Exactly one question at a time.** Never batch multiple questions. Never proceed without an answer or an explicit "default".
2. **Every question has a stated default.** "Default" / "just confirm" must always be a valid answer. State the default in the question.
3. **In Claude Code**, ask via the AskUserQuestion tool (at most 4 options per question; short headers; use multi-select only where the catalog says so). **In any other harness**, ask as a plain numbered markdown question ending with: *"Reply with a number, or your own answer."*
4. **Never invent answers.** If the pre-check scan found something, propose it as the default; the user confirms.
5. **On any error or ambiguity: Stop → Report → Suggest → Wait.** Do not guess.
6. **English only** in every question, file, and report this skill produces — even if the user prompts in another language — unless the user explicitly chooses a different language during the interview.
7. **Git is read-only.** Never run `git config` write commands and never set or change `user.name`, `user.email`, or signing settings. If git identity is missing, inform the user and let them set it.

## Question flow

The full catalog with options, defaults, and prefill sources lives in `references/questions.md`. Order:

| # | Topic | Default highlights |
|---|-------|--------------------|
| 1 | Project name | from directory or GITHUB_REPO_URL |
| 2 | One-line purpose | free text |
| 3 | Project type | from scan |
| 4 | Language + framework | from lockfiles |
| 5 | Package manager | from lockfile |
| 6 | Build / test / lint / dev commands | stack conventions |
| 7 | Repo state (fresh vs existing) | from scan |
| 8 | Harnesses used (multi-select) | from scan; both if none found |
| 9 | Language rule | English only |
| 10 | Git rules (bundle) | no AI attribution, conventional commits, feature branches |
| 11 | Workflow mode | direct mode (spec → implement → test, one task at a time) |
| 12 | Agent roles (multi-select) | core: orchestrator, developer, tester |
| 13 | Testing | TDD on, framework from stack |
| 14 | Quality gates (bundle) | linter/formatter from stack, review before commit |
| 15 | CI | GitHub Actions, lint + test |
| 16 | Docs level | README + changelog |
| 17 | Commit answers.json | yes |
| 18 | Phase 2 consent | asked last |

**Bundle topics** (10, 14): show the default bundle and ask *"All defaults?"* — if the user accepts, move on; otherwise drill into only the non-default sub-parts, one at a time.

## Summary and confirmation

After the last question, render a compact answer table (topic → decision) and ask one final question:

> *Apply these settings? (yes / change a topic / abort)*

If the user names a topic, re-ask only that topic, then re-show the summary. Do not write any file before an explicit "yes".

## Apply — Phase 1 (configuration)

Write `.project-setup/answers.json` first (schema in `references/tokens.md`). Then generate files per the file plan in `references/apply.md`, rendering templates from this skill's `templates/` directory:

1. Substitute every `{{token}}` from the answers.
2. Expand or drop each `<!-- IF:condition -->` block according to the answers.
3. Strip all rendering guidance comments.
4. Write the file, honoring the conflict protocol below for anything that already exists.

Key rules (details in `references/apply.md`):

- **AGENTS.md is the single source of truth.** Every rule, role, and command lives there.
- **Thin wrappers per enabled harness** — Claude Code gets a ~10-line `CLAUDE.md` whose core is `@AGENTS.md`. vibe reads root `AGENTS.md` directly; never generate `.vibe/AGENTS.md`.
- **`.gitignore`**: append (or replace on re-run) one marked block — `# --- ai-project-starter ---` … `# --- end ai-project-starter ---`. Never touch anything outside the block.
- **Re-run updates instead of duplicating.** If answers.json says a file was generated before, regenerate it from the template rather than stacking copies.

## Apply — Phase 2 (scaffold, only with consent)

If the user consented at question 18:

1. Create the directory structure for the project type (`src/`, or type-specific), `specs/` with the three lifecycle templates rendered, `agents/roles/` containing **only the enabled roles**.
2. `git init` **only if** `.git` is absent. Never configure identity or hooks.
3. Write the CI workflow stub (if CI is on) and the README scaffold.
4. Close with the post-setup report.

## Post-setup report

After applying, print exactly (format in `references/apply.md`): files created / merged / skipped with reasons, decisions recorded in answers.json, suggested next commands, and what was deliberately **not** done (e.g., "no git identity configured — set it yourself", "CI workflow is a stub — jobs need stack-specific commands").

## Conflict protocol

For every file that already exists, stop and ask — one file at a time — offering:

1. **MERGE** — merge template content into the existing file (manual review)
2. **USE_TEMPLATE** — replace with the generated version
3. **KEEP_LOCAL** — keep the existing file, skip generation
4. **DIFF** — show a full diff, then ask again
5. **SKIP** — skip this file entirely

Priority ladder: user's explicit instructions > local customizations > this skill's templates > defaults.

## Harness table

Data, not logic — add a row to support a new harness:

| Harness | Project skills dir | User skills dir | Context file | Notes |
|---------|-------------------|-----------------|--------------|-------|
| Claude Code | `.claude/skills/<name>/` | `~/.claude/skills/<name>/` | `CLAUDE.md` (imports `AGENTS.md`) | no trust needed; `/reload-skills` if the skills dir was created mid-session |
| vibe | `.vibe/skills/<name>/` | `~/.vibe/skills/<name>/` | `AGENTS.md` (root) | project skills require a trusted folder (`vibe --trust`); `/reload` after install |
| Codex (future) | TBD | TBD | `AGENTS.md` (root) | not yet supported |
| OpenCode (future) | TBD | TBD | `AGENTS.md` (root) | not yet supported |