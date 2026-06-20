# Stock Workbench Aggregate Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 1.4

## Task Breakdown

- [x] Add `@aiphabee/workbench` backend aggregate package.
- [x] Reuse existing synthetic tool surfaces for profile, quote, price history,
  financial facts, and corporate actions.
- [x] Add Worker runtime and snapshot routes.
- [x] Add local contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers backend aggregation for STK-01, STK-02, STK-03, and STK-05.
It does not render frontend UI, add valuation-derived metrics, or implement
announcement/document search.

## Verification

Required before closeout:

- `npm run check:stock-workbench`
- `npm run test -- packages/workbench/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/workbench`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/workbench`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /workbench/runtime`
- local Worker smoke for `POST /workbench/stock/snapshot`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
