# High-Cost Analytics Queue Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.1

## Task Breakdown

- [x] Add `planHighCostAnalyticsQueue()` to `@aiphabee/analytics-tools`.
- [x] Report high-cost queue capability from `GET /analytics/runtime`.
- [x] Add `POST /analytics/high-cost/plan` Worker route.
- [x] Encode PRD credit weight ranges for `screen_securities` and
  `compare_securities`.
- [x] Return independent pool, confirmation, pre-debit, failure-refund, and
  idempotent enqueue-plan metadata.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers the Sprint 2.1 backend contract for routing high-cost
screening/comparison work into an independent analytics pool. It does not
implement durable queue writes, live concurrency enforcement, MCP runtime
integration, live usage-ledger debits/refunds, or frontend confirmation UI.

## Verification

Required before closeout:

- `npm run check:high-cost-analytics`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /analytics/high-cost/plan`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
