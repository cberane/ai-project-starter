# Design

## Architecture

```
┌─────────────────────┐      copies      ┌──────────────────────────────┐
│ ai-project-starter  │ ────────────────► │ target project                │
│ repo                │  (npx installer)  │ .claude/skills/setup-project/ │
│                     │                   │ .vibe/skills/setup-project/  │
│ skills/setup-project│                   └──────────────┬───────────────┘
│  ├── SKILL.md       │                                  │ /setup-project
│  ├── references/    │                                  ▼
│  └── templates/     │                   interview → AGENTS.md, CLAUDE.md,
└─────────────────────┘                   specs/, agents/roles/, scaffold
```

**The installer is dumb, the skill is smart.** The installer (plain Node, zero dependencies) only copies the self-contained skill directory into the target project's harness skill dirs. All intelligence lives in `SKILL.md`, executed by the agent at interview time. This keeps the installer trivial, makes upgrades a re-run, and leaves the flow defined in exactly one place.

**One canonical copy.** No mirrors, no sync scripts, no symlinks. Dogfooding uses `--user` (installs to `~/.claude/skills/` + `~/.vibe/skills/`). Drift is impossible because nothing is duplicated.

**AGENTS.md is the single source of truth** in generated projects. Harness wrappers stay thin: Claude Code gets a `CLAUDE.md` whose core is `@AGENTS.md`; vibe reads root `AGENTS.md` directly (never `.vibe/AGENTS.md` — vibe does not load that file).

## Interview design

One question at a time, every question with a stated default, bundle-confirmation topics for fast defaults. The full catalog lives in `skills/setup-project/references/questions.md`. Answers are recorded to `.project-setup/answers.json` — the machine-readable record of decisions, the resume-and-amend source on re-runs, and the record of which files were generated (and how), which is what makes re-runs update instead of duplicate.

## Template rendering

Templates contain `{{snake_case_tokens}}` and `<!-- IF:condition -->…<!-- ENDIF -->` blocks (with optional `<!-- ELSE -->`). The **agent is the rendering engine**: substitute tokens from answers.json, expand/drop conditionals, strip guidance comments, then write — fitting surrounding prose to the answers rather than doing blind string substitution. Every token and condition is declared in `references/tokens.md`; `scripts/check.mjs` verifies no undeclared token or marker exists and CI enforces it.

## Harness adapters

Harness support is **data**, not logic:

| Harness | Project skills | User skills | Context file | Status |
|---------|---------------|-------------|--------------|--------|
| Claude Code | `.claude/skills/<name>/` | `~/.claude/skills/<name>/` | `CLAUDE.md` (`@AGENTS.md` import) | v1 |
| vibe | `.vibe/skills/<name>/` | `~/.vibe/skills/<name>/` | `AGENTS.md` (root) | v1 |
| Codex | TBD | TBD | `AGENTS.md` (root) | planned |
| OpenCode | TBD | TBD | `AGENTS.md` (root) | planned |

Adding a harness = a new row in the SKILL.md harness table, a new entry in `HARNESS_DIRS` in the installer, and a docs update. No flow changes.

### Consolidation candidate

vibe also reads the cross-harness directories `.agents/skills/` (project) and `~/.agents/skills/` (user). If Claude Code grows support for those, both harnesses could share a single skills directory. Until then, per-harness dirs are the safe default.

### Future vibe-specific enhancement

vibe has native TOML agent definitions (`~/.vibe/agents/*.toml`, `.vibe/agents/`). The starter's prose role files in `agents/roles/` work in every harness; generating vibe TOML agents additionally is a possible later addition.

## Constraints carried into every generated project

- English-only output
- No AI attribution in git (asked, defaulting to on)
- Spec-driven development, direct mode (one task at a time)
- Core agent roles (orchestrator, developer, tester) + optional UI designer, file worker (cheap model), code reviewer, DevOps
- Read-only git rule: agents never write `git config`