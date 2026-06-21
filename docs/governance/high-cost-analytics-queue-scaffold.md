# High-Cost Analytics Queue Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 13:10 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-high-cost-analytics-queue-scaffold.md`
> **Task Contract**: `tasks/contracts/high-cost-analytics-queue-scaffold.contract.md`

This slice continues Sprint 2.1 by adding a backend-only planner that routes
high-cost screening/comparison work into an independent analytics concurrency
pool. It is a no-write scaffold: it proves the contract before live queue,
ledger, and MCP enforcement exist.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/analytics-tools` | Owns deterministic analytics cost and routing planner |
| Runtime route | `GET /analytics/runtime` | Reports high-cost queue capability and route |
| Planner route | `POST /analytics/high-cost/plan` | Returns pool, confirmation, and enqueue-plan metadata |
| Contract | `deploy/analytics/high-cost-analytics-queue.contract.json` | Guards high-cost pool, confirmation, and no-write behavior |
| Checker | `npm run check:high-cost-analytics` | Fails if queue policy fields drift |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /analytics/high-cost/plan` with `tool_name`,
   securities or universe size, and optional `user_confirmed`.
2. Worker normalizes snake_case and camelCase request fields.
3. `planHighCostAnalyticsQueue()` validates that the tool is
   `screen_securities` or `compare_securities`.
4. The planner estimates PRD credit weight:
   - `screen_securities`: 8-20, based on universe size
   - `compare_securities`: 5-15, based on security count and metric count
5. Estimated weight `>= 8` returns `analytics_high_cost`, max parallel 2,
   `queue_required: true`, and ordinary pool protection.
6. Unconfirmed high-cost work returns `confirmation_required` and
   `awaiting_confirmation`.
7. Confirmed high-cost work returns `queued_planned` and `would_enqueue`, with
   idempotency key, queue key, and planned task id.
8. Small comparison work returns `inline_allowed` on `analytics_standard`.
9. The Worker returns the result in the shared standard envelope.

## P3 Design Decision

Selected a deterministic no-write queue planner before implementing live queue
writes.

Reason:

- PRD §12.2 requires high-cost tools to avoid starving ordinary queries.
- PRD weights make `screen_securities` high-cost by default and
  `compare_securities` high-cost when broad enough.
- The repo does not yet have durable queue bindings, live usage-ledger pre-debit,
  or MCP runtime limiter integration.

Tradeoff:

- Pool selection, confirmation, idempotency, and usage policy are now testable.
- No live concurrency or queue write is claimed.
- MCP-11 full limiter and US-W10 live debit/refund remain separate slices.

## Verification

Passed:

- `npm run check:high-cost-analytics`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /analytics/runtime`
- local Worker smoke for confirmed high-cost comparison
- local Worker smoke for unconfirmed high-cost screen
- local Worker smoke for small comparison standard-pool plan
- `scripts/check-task-workflow.sh --strict`

Observed queue-plan behavior:

```json
{
  "toolName": "plan_high_cost_analytics",
  "status": "queued_planned",
  "cost_estimate": {
    "credit_weight": 8,
    "high_cost_threshold": 8
  },
  "scheduling_decision": {
    "concurrency_pool": "analytics_high_cost",
    "queue_required": true,
    "max_parallel": 2
  },
  "durable_queue_writes": false
}
```

## Residual Gaps

- Durable queue writes are not implemented.
- Live concurrency limiter is not implemented.
- Live usage-ledger pre-debit/refund is not implemented.
- MCP runtime limiter remains pending for Sprint 2.3.
- Frontend confirmation UI remains delegated.
