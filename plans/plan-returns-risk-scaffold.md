# Returns/Risk Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.1

## Task Breakdown

- [x] Extend `@aiphabee/analytics-tools` with `calculateReturnsRisk()`.
- [x] Add deterministic return/risk definitions and formula version.
- [x] Add benchmark-gated Beta calculation.
- [x] Add Worker returns-risk route.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests with golden tolerance.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers Sprint 2.1 `calculate_returns_risk`: deterministic total
return, average daily return, daily volatility, annualized volatility, max
drawdown, and Beta when a benchmark is explicitly provided. It does not
implement peer/index/history percentile comparison, frontend UI, MCP
registration, live benchmark constituents, or high-cost queueing.

## Verification

Required before closeout:

- `npm run check:returns-risk`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /analytics/returns-risk`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
