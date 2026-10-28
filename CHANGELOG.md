# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versioning rules and the release procedure live in [AGENTS.md](AGENTS.md).

## [Unreleased]

### Added

- `SECURITY.md`: supported-versions policy (pre-1.0 — latest release and `main` only), private vulnerability reporting channel, in-scope/out-of-scope guidance tailored to a file-copying installer (writes outside the target, symlink/path-traversal handling, template content that could inject into a user's project or agent session, CI injection, supply chain), and supply-chain notes.
- GitHub issue templates (`.github/ISSUE_TEMPLATE/`): bug-report and feature-request forms tailored to the project (install method, `--version` output, harness, pre-flight checks; feature requests pick the touched area per the architecture rules). The contact-links config routes security reports to private disclosure and questions to Discussions; blank issues are disabled.
- README links the security policy from the Contributing section.

## [0.2.0] - 2026-10-28

### Added

- The `docs_level` answer now has real effect: `standard` and `full` generate a `CHANGELOG.md` stub; `full` additionally generates `docs/adr/TEMPLATE.md`. The generated `AGENTS.md` and `README.md` gain matching documentation rules and layout entries.
- New `IF:ignore_answers` condition: the `.project-setup/` gitignore line is generated from a declared marker in `gitignore.append` instead of being left to the renderer.
- Language-specific `.gitignore` blocks for Go and Rust (`IF:lang_go`, `IF:lang_rust` now used).
- `npm run check` / `npm test` scripts, an `author` field, and `docs/` + `CHANGELOG.md` in the npm `files` list.
- CI: version-sync check (`package.json` == `references/VERSION` == README/INSTALL pins), upgrade-path smoke test (planted old version must be replaced, stale files pruned), non-interactive `--detect-only` test, `--force` test, user-level install test, and a functional `install.sh` run; the English-only check now covers the root `README.md`, `AGENTS.md`, `CLAUDE.md`, and `CHANGELOG.md` too.
- `scripts/check.mjs` now also flags declared-but-unused tokens and conditions, `ELSE` markers outside or duplicated within a block, and undeclared `{{…}}` placeholders in the references.

### Changed

- **Breaking:** installer upgrades replace the skill directory wholesale via an atomic temp-dir swap — local edits to an installed skill are overwritten, and files removed upstream no longer linger. This matches the `install.sh` semantics. A failed copy can no longer leave a half-installed skill that a later version check would mistake for complete.
- Version changes are labeled honestly: downgrades print as `downgraded`, not `upgraded`.
- `install.sh` installs the latest **tagged release** (falls back to `main` if the tag is not fetchable), validates the target directory, and moves an unrecognized existing skill aside to a `.backup-<timestamp>` directory instead of deleting it.
- Removed dead declarations: tokens `{{language}}`/`{{framework}}` and conditions `IF:harness_claude`/`IF:harness_vibe` (harness-specific files are chosen by the apply file plan); the generated README quickstart uses `{{cmd_install}}` (e.g. `npm ci`) instead of always `{{package_manager}} install`.
- `docs/INSTALL.md` marks the flags as Node-installer-only and documents `install.sh [target-dir]`.

### Fixed

- `--detect-only` no longer prompts when no harness is detected; it prints `none detected`.
- Ctrl+C during an installer question aborts the install instead of silently taking the default answer.
- A stray `.claude`/`.vibe` **file** no longer counts as a detected harness directory; a second positional path and single-dash option typos (e.g. `-user`) fail with a clear error; `--user` combined with a path prints a notice instead of silently ignoring it.
- The AGENTS.md verification checklist is no longer self-contradictory: the attribution grep is anchored (matching CI) so the rule text itself does not trip it, and the checklist now includes `node scripts/check.mjs` and the extended smoke tests.

## [0.1.1] - 2026-10-27

### Fixed

- Installer takes the default answer when stdin is at EOF (non-interactive pipes, CI, automation) instead of hanging on the harness prompt.

### Changed

- CI: bumped `actions/checkout` and `actions/setup-node` to v7, pinned the runner to `ubuntu-26.04`, and added a Node 18 (engine floor) + Node 26 (latest LTS) test matrix.
- Added semantic versioning rules and the release procedure to AGENTS.md; added this changelog.

## [0.1.0] - 2026-10-27

### Added

- `/setup-project` skill: a one-question-at-a-time interview that generates `AGENTS.md`, spec templates (`SPEC`/`PLAN`/`TASK`), agent role definitions, git rules, and an optional repo scaffold (directories, `git init`, CI stub, README).
- npx installer (`bin/ai-project-starter.js`, zero dependencies): harness detection, `--user`, `--harness`, `--force`, `--detect-only`, idempotent re-runs, version-based in-place upgrades.
- `install.sh` POSIX shell fallback for non-Node machines.
- Support for Claude Code and vibe (Codex and OpenCode planned).
- Docs: install guide and design notes; CI validating template tokens, the installer, attribution-line and English-only rules.