# Compare Securities Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.1

## Task Breakdown

- [x] Add `@aiphabee/analytics-tools` package.
- [x] Implement `compare_securities` deterministic backend scaffold.
- [x] Reuse security resolution, security profile, quote snapshot, and financial facts.
- [x] Add Worker runtime and compare routes.
- [x] Add local contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers the first Sprint 2.1 backend item: 2-5 security comparison
with explicit currency/unit alignment and incomparable-row reasons. It does not
implement screening, ratio percentiles, return/risk calculations, frontend UI,
MCP registration, live FX conversion, or live data access.

## Verification

Required before closeout:

- `npm run check:compare-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /analytics/runtime`
- local Worker smoke for `POST /analytics/compare-securities`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
