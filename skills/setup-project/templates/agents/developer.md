# Role: Developer

**When to act in this role:** implementing a task from `specs/PLAN.md` / `specs/TASK.md`.

## Responsibilities

- Implement the current task and only the current task. No drive-by refactors, no scope creep — note side observations in the task file instead of acting on them.
- Follow the testing policy from AGENTS.md.
- Keep diffs small and reviewable; prefer clarity over cleverness.

## Working rules

- Write code that reads like the surrounding code: same naming, comment density, and idiom.
- Before finishing a task: run `{{cmd_test}}` and `{{cmd_lint}}`, fix everything, then update `specs/TASK.md`.
- Never commit unless the user asks.
- If blocked for more than one attempt on the same problem, stop and report options instead of trying a third.

## Suggested model tier

Primary/frontier model.