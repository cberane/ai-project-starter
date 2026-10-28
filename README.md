# ai-project-starter

A portable `/setup-project` skill that turns any fresh or existing repository into a fully configured, AI-assisted, spec-driven project — through an interactive interview, one question at a time.

Install it into your coding harness (Claude Code, vibe-cli today; Codex and OpenCode planned), then just say:

```
/setup my fresh project from GITHUB_REPO_URL
```

or simply:

```
/setup-project
```

The agent interviews you about your project (name, stack, harnesses, testing, git rules, agent roles, CI, …), and then generates everything: `AGENTS.md`, per-harness config, spec templates, agent role definitions, git rules, and — if you want — the full repo scaffold including `git init` and a CI stub.

## Install

### npx (recommended)

From inside your project directory:

```bash
npx github:cberane/ai-project-starter
```

No npm publish required — `npx` clones the repo and runs the installer directly. To pin a stable version, use a tag:

```bash
npx github:cberane/ai-project-starter#v0.2.1
```

### Manual clone

```bash
git clone https://github.com/cberane/ai-project-starter.git
node ai-project-starter/bin/ai-project-starter.js /path/to/your/project
```

### Without Node

```bash
curl -fsSL https://raw.githubusercontent.com/cberane/ai-project-starter/main/install.sh | sh
```

See [docs/INSTALL.md](docs/INSTALL.md) for all flags (`--user`, `--harness`, `--force`, `--detect-only`).

## What happens after install

1. The installer copies the `setup-project` skill into your project's harness skill directories (`.claude/skills/` and/or `.vibe/skills/`).
2. You launch your harness and run `/setup-project` (or just ask the agent to set up your project).
3. The agent conducts the interview — **one question at a time**, every question with a sensible default:
   - Project basics: name, purpose, type, language, framework, package manager, commands
   - Harnesses used in this project
   - Rules: language (English by default), git rules (**no AI attribution** by default), branch policy
   - Workflow: direct mode — spec → implement → test, one task at a time
   - Agent roles: orchestrator, developer, tester (core) + UI designer, file worker (cheap model), code reviewer, DevOps (optional)
   - Testing policy, quality gates, CI, docs level
4. After a summary you confirm, the agent generates:

```
your-project/
├── AGENTS.md              # Single source of truth: rules, roles, workflow, commands
├── CLAUDE.md              # Thin wrapper for Claude Code (imports AGENTS.md)
├── .project-setup/
│   └── answers.json       # Machine-readable record of your setup decisions
├── specs/
│   ├── SPEC.md            # Spec template: goal, non-goals, acceptance criteria
│   ├── PLAN.md            # Task breakdown
│   └── TASK.md            # One task: the direct-mode unit of work
└── agents/
    └── roles/             # Only the roles you enabled
        ├── orchestrator.md
        ├── developer.md
        ├── tester.md
        └── …
```

5. Optionally (Phase 2), it scaffolds the repo: directory structure, `git init`, GitHub Actions stub, README.

Re-running `/setup-project` later offers **resume & amend** — it reads `answers.json`, shows your stored decisions, and only asks what changed.

## Design principles

- **One copy of everything.** No mirrors, no sync scripts, no symlinks. The skill updates previously generated files on re-run.
- **The installer is dumb, the skill is smart.** The CLI only copies files; all intelligence lives in the harness-agnostic `SKILL.md` executed by your agent.
- **Harness-agnostic core, per-harness thin config.** `AGENTS.md` is the single source of truth; every harness gets a thin wrapper.
- **English only, no AI attribution in git** — asked during the interview, defaulting to on.

Read [docs/DESIGN.md](docs/DESIGN.md) for the full architecture, the interview catalog, and the plan for Codex/OpenCode support.

## Contributing

Work on this repository happens with the same AI-assisted workflow it produces. See [AGENTS.md](AGENTS.md) for the rules agents follow in this repo (they mirror what the skill generates).

Found a security issue? Please report it privately — see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)