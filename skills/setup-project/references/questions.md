# Question catalog

Every question is asked **one at a time**, with its default stated in the question text. In Claude Code, use AskUserQuestion: at most 4 options (the tool offers "Other" for free text automatically). In other harnesses, use numbered markdown options plus *"Reply with a number, or your own answer."*

Prefill column: where the default comes from — always propose it, never assume it.

## 1. project_name
- **Question:** "Project name? (default: `{{directory_or_repo_name}}`)"
- **Prefill:** current directory name, or the repo name from GITHUB_REPO_URL.
- **Also derive** `project_slug` (lowercase, hyphens) for use in package names and paths.

## 2. one_liner
- **Question:** "One-line purpose of the project? (a single sentence — this goes into AGENTS.md and README)"
- **Prefill:** none. The only question with no default; if the user skips, write "TBD".

## 3. project_type
- **Options:** web app / API service / library / CLI tool — plus "Other" for mobile, desktop, etc.
- **Prefill:** from scan (e.g., `index.html` + assets → web app; only `src/` → library).
- **Follow-up:** none in v1; type drives the Phase 2 directory layout.

## 4. language_framework
- **Question:** "Primary language and framework? (default: `{{scan_result}}`)"
- **Prefill:** lockfiles and manifests (`package.json` → Node/JS-TS, `pyproject.toml`/`requirements.txt` → Python, `Cargo.toml` → Rust, `go.mod` → Go).
- **If multiple detected:** ask which is primary.

## 5. package_manager
- **Options:** from what the scan found — npm / pnpm / yarn / pip / uv / poetry / cargo / go / none.
- **Prefill:** lockfile (`package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `uv.lock` → uv, …).

## 6. commands
- **Question:** "Confirm the standard commands." Show a table with build / test / lint / dev and the conventions for the detected stack; ask *"All defaults?"*
- **If the user changes one:** re-ask only that command.

## 7. repo_state
- **Options:** fresh (empty or near-empty) / existing code.
- **Prefill:** from scan (tracked files, `.git` presence).
- **Effect:** existing code → conflict protocol becomes likely; the skill says so.

## 8. harnesses (multi-select)
- **Options:** Claude Code / vibe / both / neither (config only, no harness dirs).
- **Prefill:** detected `.claude/`, `.vibe/`, `.agents/` directories; if none, default **both**.
- **Effect:** which wrappers get generated and where the skill itself is installed.

## 9. language_rule
- **Question:** "All generated content and agent communication in English only? (default: yes)"
- **Default: English only.** If the user opts out, record their chosen language and generate everything in it.
- **This rule also goes into the generated AGENTS.md as a standing rule for future sessions.**

## 10. git_rules (bundle)
- **Default bundle:** no AI attribution in git · conventional commits · feature branches with PRs.
- **Question:** "Git rules — all defaults?" Show the bundle as a table. If accepted, move on.
- **Drill-down sub-questions (only for parts the user rejects, one at a time):**
  - `attribution`: "Keep the no-AI-attribution rule? (no Co-Authored-By, no 'Generated with', no AI mentions in commit messages or PR descriptions — default: yes, keep)"
  - `commit_style`: free-form vs conventional commits
  - `branch_policy`: direct-to-main vs feature branches
- **Note:** the no-AI-attribution rule instructs all future agents on this repo. It applies to the *generated project's* commits.

## 11. workflow_mode
- **Question:** "Direct mode: one task at a time, spec → implement → test? (default: yes)"
- **v1 is confirmation-only.** The row exists so additional modes (scrum, pair programming) can be added later without changing the flow.

## 12. agent_roles (multi-select)
- **Core (always on):** orchestrator, developer, tester.
- **Optional:** UI designer / file worker (cheap model) / code reviewer / DevOps.
- **Question:** "Beyond the core roles (orchestrator, developer, tester), enable which optional roles?"
- **File worker note:** confirm the user understands it is for bulk mechanical file operations on a cheap model tier, never design decisions.

## 13. testing
- **Sub-bundle, default:** framework from stack (Jest/Vitest/pytest/go test/…) · TDD on · no coverage gate.
- **Question:** "Testing — all defaults?" Drill into non-default parts one at a time (framework choice, TDD on/off, coverage threshold %).

## 14. quality_gates (bundle)
- **Default bundle:** linter + formatter from stack · code review before every commit · security review on request (not scheduled).
- **Question:** "Quality gates — all defaults?" Drill into non-default parts one at a time.

## 15. ci
- **Question:** "GitHub Actions CI with lint + test jobs? (default: yes)"
- **If no:** skip CI generation entirely (recorded as `ci_enabled: false`).

## 16. docs_level
- **Default:** README + changelog, no ADRs.
- **Options:** minimal (README only) / standard (README + changelog) / full (README + changelog + ADRs in `docs/adr/`).

## 17. commit_answers
- **Question:** "Commit `.project-setup/answers.json` to the repository? It documents your setup decisions. (default: yes)"
- **If no:** add `.project-setup/` to the `.gitignore` marked block.

## 18. phase2
- **Question:** "Scaffold the repo structure now? This creates directories, runs `git init` (if needed), and writes a CI stub + README. (default: ask — you choose)"
- **Options:** yes, full scaffold / config only (Phase 1 only, instructions in the report).

---

After 18 → summary and confirmation (see SKILL.md), then apply.