# High-Cost Analytics Queue Scaffold Notes

## Summary

Implemented the Sprint 2.1 backend `plan_high_cost_analytics` scaffold for
routing high-cost screening/comparison work to an independent analytics pool.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getHighCostAnalyticsQueueCapabilities()`
  - `planHighCostAnalyticsQueue()`
- `GET /analytics/runtime` reports `high_cost_analytics_queue`.
- `POST /analytics/high-cost/plan` returns:
  - deterministic PRD credit-weight estimate
  - `analytics_high_cost` vs `analytics_standard` pool decision
  - confirmation requirement
  - pre-debit and failure-refund requirements
  - idempotency key, queue key, and planned task id
  - explicit `durable_queue_writes: false`
- Routing rules:
  - `screen_securities` weight range: 8-20, high-cost by default
  - `compare_securities` weight range: 5-15, high-cost when estimated weight
    is at least 8

## Non-Goals

- No durable queue writes.
- No live concurrency limiter.
- No live usage-ledger pre-debit/refund.
- No MCP runtime limiter.
- No frontend confirmation UI.

## Verification

Passed:

- `npm run check:high-cost-analytics`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- `npm run test`
- `npm run test:golden`
- `npm run lint`
- Worker smoke for runtime capability, confirmed high-cost comparison,
  unconfirmed high-cost screen, and small comparison standard-pool plan
- `scripts/check-task-workflow.sh --strict`

Observed residual:

- Root `npm run check` was run. All lint/typecheck/test/golden/contract checks,
  including `check:high-cost-analytics`, passed before it failed at
  `@aiphabee/web` `vite build` under Node `v22.12.0` because
  `@cloudflare/vite-plugin` requires `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.
