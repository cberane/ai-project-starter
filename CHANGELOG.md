# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versioning rules and the release procedure live in [AGENTS.md](AGENTS.md).

## [Unreleased]

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