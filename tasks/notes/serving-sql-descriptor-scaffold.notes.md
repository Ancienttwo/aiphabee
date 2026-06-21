# Notes: serving-sql-descriptor-scaffold

> **Last Updated**: 2026-06-20 18:14 +08
> **Plan**: `plans/plan-serving-sql-descriptor-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/serving-sql-descriptor-scaffold.md`

## Decisions

- Added `createServingSqlDescriptor()` in `@aiphabee/serving-store` as a pure
  descriptor planner with `executionReady=false`, `liveRead=false`,
  `sqlEmitted=false`, and `sqlTextEmitted=false`.
- Used an allow-listed `statementId` and parameter binding object instead of
  emitting SQL text.
- Attached `servingSqlDescriptor` to Data Access Gateway decisions after
  `servingQuery`.
- Extended `/gateway/runtime` with `serving_sql_descriptor_scaffold` and
  `serving_store.sql_descriptor`.
- Added a later SQL text compiler scaffold that emits fixed SQL text from the
  descriptor while keeping execution disabled.
- Added a later execution adapter scaffold that accepts SQL text but returns
  deferred empty-row plans.
- Kept live SQL execution, Hyperdrive reads, partner rows, and frontend out of
  scope.

## Verification

- Passed: `npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run typecheck`
- Passed: `npm run check:data-gateway`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/gateway/runtime` SQL descriptor capability.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Live Serving SQL execution is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- Persistent usage writes and billing reconciliation are absent.
