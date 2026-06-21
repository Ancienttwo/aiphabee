# High-Cost Analytics Queue Scaffold Contract

## Objective

Complete the backend-only Sprint 2.1 contract for high-cost analytics routing:

- high-cost `screen_securities` plans use an independent concurrency pool
- large `compare_securities` plans use the same high-cost pool
- small comparisons can remain on the standard analytics pool
- high-cost work requires confirmation before enqueue

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Planner route: `POST /analytics/high-cost/plan`
- Contract: `deploy/analytics/high-cost-analytics-queue.contract.json`
- Checker: `npm run check:high-cost-analytics`

## Required Guarantees

- Use standard response envelopes.
- Keep frontend rendering disabled.
- Keep live data access disabled.
- Keep SQL emission disabled.
- Keep durable queue writes disabled in this scaffold.
- Encode `screen_securities` PRD weight range 8-20.
- Encode `compare_securities` PRD weight range 5-15.
- Route estimated credit weight `>= 8` to `analytics_high_cost`.
- Return `analytics_standard` for small comparison plans.
- Return `pre_debit_required`, `failure_refund_required`, and
  `requires_confirmation_before_enqueue`.
- Return idempotency key and planned queue key for high-cost work.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and package typecheck/build pass.
- Local Worker smoke proves confirmed high-cost comparison, unconfirmed
  high-cost screen, and small comparison standard-pool behavior.
- Sprint tracker row is checked only for the backend queue planner; live queue,
  MCP limiter, live ledger, and frontend confirmation remain open.
