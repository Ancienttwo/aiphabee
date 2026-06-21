# Percentile Comparison Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.1

## Task Breakdown

- [x] Extend `@aiphabee/analytics-tools` with `comparePercentiles()`.
- [x] Add peer/index/history benchmark definitions with as-of metadata.
- [x] Reuse `get_financial_ratios` and `calculate_returns_risk` subject metrics.
- [x] Add Worker percentile-comparison route.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers Sprint 2.1 ANA-02 backend scaffold: peer, index, and own
history percentile comparison with explicit benchmark/constituent as-of
metadata. It does not implement live benchmark constituents, frontend UI, MCP
registration, or broad historical industry/security-master classification.

## Verification

Required before closeout:

- `npm run check:percentile-comparison`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /analytics/percentile-comparison`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
