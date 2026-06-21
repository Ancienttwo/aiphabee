# Notes: event-study-scaffold

> **Last Updated**: 2026-06-21 18:43 +08
> **Runtime Evidence**:
> `docs/governance/event-study-scaffold.md`

## Decisions

- Kept event study inside `@aiphabee/analytics-tools` because it reuses
  security resolution, price-history fixtures, source-record IDs, and existing
  analytics runtime routing.
- Used `security_return_minus_benchmark_return` as the scaffolded abnormal
  return method and exposed the formula version through capability metadata.
- Treated missing event-window samples as first-class output in
  `missing_observations` rather than filtering them out.
- Added `run_event_study` to the high-cost analytics independent pool with PRD
  20-50 credit bounds.
- Kept frontend, live data, queue writes, usage debits, and SQL execution out of
  scope.

## Verification

- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:event-study`
- `npm run check:high-cost-analytics`
- `npm run typecheck`
- `npm run test`
- `npm run check` -> passes lint/typecheck/tests/golden/contracts, reaches
  `npm run build`, then fails only at delegated `@aiphabee/web` Vite build
  because Node v22.12.0 lacks `node:module.registerHooks`
- `git diff --check`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Live event-study data execution and persistent high-cost queue writes remain
  absent.
- Historical constituents/industry/names remain a separate Sprint 3.1 item.
- Multilingual, newbie/professional, export, session memory, and frontend
  surfaces remain separate Sprint 3.1 items.
