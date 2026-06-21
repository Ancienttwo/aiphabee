# Notes: live-serving-query-planner-scaffold

> **Last Updated**: 2026-06-20 18:14 +08
> **Plan**: `plans/plan-live-serving-query-planner-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/live-serving-query-planner-scaffold.md`

## Decisions

- Added `createServingQueryPlan()` in `@aiphabee/serving-store` as a pure
  planner with `liveRead=false` and `sqlEmitted=false`.
- Kept the older `servingRead.releaseState=held` invariant and passed explicit
  snapshot release metadata into the query planner.
- Attached `servingQuery` to Data Access Gateway decisions after rights,
  field, row, time, quality, and read-plan guards.
- Extended `/gateway/runtime` with `serving_query_planner_scaffold` and
  `serving_store.query_planner`.
- Extended access contract cache material with `serving_snapshot_id` and
  `release_state`.
- Added a later SQL descriptor scaffold that converts planned queries into
  allow-listed statement id and bindings without SQL text or execution.
- Added a later SQL text compiler scaffold that emits fixed SQL text from the
  descriptor without execution.
- Added a later execution adapter scaffold that accepts SQL text but defers
  execution with empty rows.

## Verification

- Passed: `npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run typecheck`
- Passed: `npm run check:data-gateway`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/gateway/runtime` query planner capability.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Live Serving SQL execution is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- Persistent usage writes and billing reconciliation are absent.
