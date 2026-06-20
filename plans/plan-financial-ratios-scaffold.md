# Financial Ratios Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.1

## Task Breakdown

- [x] Extend `@aiphabee/analytics-tools` with `getFinancialRatios()`.
- [x] Add deterministic ratio definitions and formula version.
- [x] Add synthetic percentile methodology.
- [x] Add Worker financial-ratios route.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers Sprint 2.1 `get_financial_ratios`: deterministic derived
financial ratios, formula version, source record IDs, anomaly handling, and
synthetic percentile scaffold. It does not implement valuation ratios, live peer
constituents, frontend UI, MCP registration, or return/risk/Beta calculations.

## Verification

Required before closeout:

- `npm run check:financial-ratios`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /analytics/financial-ratios`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
