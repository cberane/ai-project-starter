# {{project_name}}

{{one_liner}}

## Quickstart

<!-- NOTE: adapt to the project type and detected package manager -->

```bash
# install dependencies
{{cmd_install}}

# run in dev mode
{{cmd_dev}}

# run the tests
{{cmd_test}}
```

## Development

- **Build:** `{{cmd_build}}`
- **Test:** `{{cmd_test}}`
- **Lint:** `{{cmd_lint}}`

<!-- IF:ci -->
CI runs on every push and PR: {{ci_jobs}} (see `.github/workflows/ci.yml`).
<!-- ENDIF -->

## Project layout

- `src/` — source code
- `specs/` — spec-driven development artifacts (SPEC, PLAN, TASK)
- `agents/roles/` — AI agent role definitions
- `.project-setup/answers.json` — setup decisions
<!-- IF:changelog -->
- `CHANGELOG.md` — notable changes, recorded while you work
<!-- ENDIF -->
<!-- IF:adr -->
- `docs/adr/` — architecture decision records
<!-- ENDIF -->

## License

TBD