# Notes: golden-regression-hook

> **Last Updated**: 2026-06-20 14:45 +08
> **Plan**: `plans/plan-golden-regression-hook.md`
> **Runtime Evidence**: `docs/governance/golden-regression-hook.md`

## Decisions

- Did not create fake golden fixtures.
- Kept the default hook non-blocking when no manifest exists, with explicit
  `not_configured` output.
- Added `--require-fixtures` as the future strict mode.
- Wired the hook into both root `npm run check` and GitHub Actions.

## Verification

- Passed: `npm run test:golden`
- Passed: `npm run check`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Fixture manifest is absent.
- Fixture source samples are absent.
- Quality rule engine is absent.
- Sprint 0.3 executable golden sample DoD remains not green.
