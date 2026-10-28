# Apply phase: file plan, conflicts, and report

## File plan — Phase 1 (configuration)

Generate in this order (skip harness-specific files for unselected harnesses; skip role files not enabled):

| Target file | Source template | Notes |
|-------------|-----------------|-------|
| `.project-setup/answers.json` | (written directly) | always first; the record of decisions |
| `AGENTS.md` | `templates/AGENTS.md` | single source of truth |
| `CLAUDE.md` | `templates/CLAUDE.md` | only if harnesses includes claude; thin wrapper importing `@AGENTS.md` |
| `specs/SPEC.md` | `templates/specs/spec.md` | spec-driven lifecycle |
| `specs/PLAN.md` | `templates/specs/plan.md` | |
| `specs/TASK.md` | `templates/specs/task.md` | |
| `agents/roles/orchestrator.md` | `templates/agents/orchestrator.md` | core, always |
| `agents/roles/developer.md` | `templates/agents/developer.md` | core, always |
| `agents/roles/tester.md` | `templates/agents/tester.md` | core, always |
| `agents/roles/ui-designer.md` | `templates/agents/ui-designer.md` | only if role enabled |
| `agents/roles/file-worker.md` | `templates/agents/file-worker.md` | only if role enabled |
| `agents/roles/code-reviewer.md` | `templates/agents/code-reviewer.md` | only if role enabled |
| `agents/roles/devops.md` | `templates/agents/devops.md` | only if role enabled |
| `.gitignore` | `templates/gitignore.append` | marked-block append, never a full overwrite |
| `CHANGELOG.md` | `templates/CHANGELOG.md` | only if docs_level is standard or full (IF:changelog) |
| `docs/adr/TEMPLATE.md` | `templates/docs/adr.md` | only if docs_level is full (IF:adr) |
| `README.md` | `templates/README.md` | only in Phase 2, or in Phase 1 for existing repos without one — ask |

Never generate `.vibe/AGENTS.md` — vibe reads root `AGENTS.md` directly.

## File plan — Phase 2 (scaffold, only with consent)

1. Directory layout by project type: `src/` (library, API, CLI), `src/app/` + `src/components/` (web app), plus `tests/` if the testing framework expects a directory. Keep it minimal — the user will reshape it.
2. Copy the three spec templates into `specs/` as `SPEC.md`, `PLAN.md`, `TASK.md` if not already present from Phase 1.
3. Write only the **enabled** role files into `agents/roles/`.
4. `.github/workflows/ci.yml` from `templates/ci.yml` — only if `ci_enabled`.
5. `README.md` from `templates/README.md` (conflict protocol applies if one exists).
6. `git init` **only if `.git` is absent**. Never run `git config` writes, never install hooks, never commit — the user makes the first commit.

## Conflict protocol

For each target file that already exists, **stop and ask one file at a time**:

1. **MERGE** — read the existing file, merge the generated content into it, preserving local customizations; show the result before writing
2. **USE_TEMPLATE** — replace with the generated version
3. **KEEP_LOCAL** — keep the existing file unchanged, skip generation
4. **DIFF** — show a full diff, then ask again
5. **SKIP** — skip this file, no record

Recommended defaults per file: `AGENTS.md` → MERGE; `CLAUDE.md`, `README.md` → MERGE; `specs/*`, `agents/roles/*` → USE_TEMPLATE (they are templates by nature); `.gitignore` → always the marked block, never a conflict.

Record every decision in `answers.json → generated_files`.

**Re-runs:** for any file listed in `generated_files` with resolution USE_TEMPLATE or created fresh, regenerate directly (it is ours). For MERGE files, re-run the conflict protocol. This is the update mechanism — there are no sync scripts.

### .gitignore marked block

Append (or replace on re-run) exactly one block; never touch anything outside it:

```
# --- ai-project-starter ---
…generated lines…
# --- end ai-project-starter ---
```

If `commit_answers` is false, the `IF:ignore_answers` block in `templates/gitignore.append` adds `.project-setup/` to the generated lines.

## Error protocol

On any failure (unreadable file, missing directory, git error): **Stop → Report** (what failed, where) **→ Suggest** (one or two concrete fixes) **→ Wait** for the user. Never retry silently, never guess.

## Post-setup report format

```markdown
## Setup complete

**Created**
- AGENTS.md (merged with existing content)  ← list each file + conflict resolution

**Skipped**
- .github/workflows/ci.yml (CI disabled)      ← each with reason

**Decisions recorded** in .project-setup/answers.json

**Next steps**
- <the most useful concrete next action, e.g. "review AGENTS.md">
- <e.g. "run: {{cmd_test}}">

**Not done (deliberately)**
- <e.g. "no git identity configured — set user.name/user.email yourself">
- <e.g. "CI workflow is a stub — adjust jobs for {{language_framework}}">
```

Keep it honest: everything not done goes under "Not done" with a reason. English only.