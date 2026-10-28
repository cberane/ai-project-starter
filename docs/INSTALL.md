# Installing ai-project-starter

## Requirements

- A target project directory (fresh or existing)
- For npx: Node.js ≥ 18
- For the shell fallback: git + a POSIX shell (no Node needed)

## npx (recommended)

From inside your project directory:

```bash
npx github:cberane/ai-project-starter
```

`npx` clones the repository and runs the installer directly — no npm publish needed. The installer detects your harness directories (`.claude/`, `.vibe/`) and copies the `setup-project` skill into place.

**Caching gotcha:** npm caches git dependencies by resolved commit. If you just pushed a change and npx keeps installing the old version, either use an explicit ref:

```bash
npx github:cberane/ai-project-starter#main
```

or clear the npx cache (`npx clear-npx-cache`, or remove `~/.npm/_npx`). For a stable pin, use a tag:

```bash
npx github:cberane/ai-project-starter#v0.2.0
```

## Manual clone

```bash
git clone https://github.com/cberane/ai-project-starter.git
node ai-project-starter/bin/ai-project-starter.js /path/to/your/project
```

## Without Node

```bash
curl -fsSL https://raw.githubusercontent.com/cberane/ai-project-starter/main/install.sh | sh
```

Run from the project root; it clones to a temp dir and copies the skill in. It installs the latest **tagged release** (falling back to `main` if the tag is not fetchable yet) and accepts an optional target directory:

```bash
sh install.sh /path/to/project
```

The shell fallback supports only `[target-dir]` — the flags below apply to the Node installer (npx / manual clone) only. Where the existing skill cannot be recognized (no readable version file), it is moved aside to a `.backup-<timestamp>` directory instead of being overwritten.

## User-level install (dogfooding)

```bash
npx github:cberane/ai-project-starter --user
```

Installs to `~/.claude/skills/setup-project/` and `~/.vibe/skills/setup-project/` — the skill is then available in **all** your projects, not just one. Re-running updates in place; a version change upgrades without prompting. Upgrades replace the skill directory wholesale — local edits to the installed skill are overwritten. A target path passed alongside `--user` is ignored.

## Flags

Node installer only (see [Without Node](#without-node) for the shell fallback):

| Flag | Effect |
|------|--------|
| `[path]` | Target directory (default: current directory) |
| `--user` | Install to user-level skill dirs instead of a project |
| `--harness claude\|vibe\|all` | Override harness detection |
| `--detect-only` | Print detected harnesses (never prompts), install nothing |
| `--force` | Overwrite an existing skill directory without prompting |
| `--version` | Print the skill version |
| `-h, --help` | Usage |

## After installing

1. Launch your harness in the target directory.
2. Run `/setup-project` (or just ask the agent to set up your project, optionally with a `GITHUB_REPO_URL`).
3. The interview runs **one question at a time**, every question with a default.

Harness-specific notes:

- **Claude Code:** project skills load automatically. If `.claude/skills/` was newly created while a session was already running, run `/reload-skills` once.
- **vibe:** project skills load only in trusted folders — trust the folder when vibe prompts on first run, or start with `vibe --trust`. If a session is already open, run `/reload` after installing.

## Troubleshooting

- **"skill source not found"** — the installer must run from a clone of this repository (or via npx, which clones for you).
- **vibe does not show the skill** — check that the project folder is trusted, and run `/reload`.
- **Claude Code does not show the skill** — run `/reload-skills` if the skills directory was created mid-session.
- **npx installs an old version** — see the caching gotcha above.