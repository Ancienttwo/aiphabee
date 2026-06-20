# Notes: serving-sql-text-compiler-scaffold

> **Last Updated**: 2026-06-20 18:05 +08
> **Plan**: `plans/plan-serving-sql-text-compiler-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/serving-sql-text-compiler-scaffold.md`

## Decisions

- Added `createServingSqlTextPlan()` in `@aiphabee/serving-store` as a pure
  compiler with `executionReady=false`, `liveRead=false`, and
  `sqlExecuted=false`.
- Compiled only the allow-listed
  `serving_record_projection_by_snapshot_v0` descriptor.
- Kept selected fields, Serving snapshot id, time range, and limit as positional
  parameters; field paths are not string-concatenated into SQL.
- Attached `servingSqlText` to Data Access Gateway decisions after
  `servingSqlDescriptor`.
- Extended `/gateway/runtime` with `serving_sql_text_compiler_scaffold` and
  `serving_store.sql_text_compiler`.
- Kept SQL execution, Hyperdrive reads, partner rows, and frontend out of scope.

## Verification

- Passed: `npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run typecheck`
- Passed: `npm run check:data-gateway`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/gateway/runtime` SQL text compiler capability.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- SQL execution is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- Persistent usage writes and billing reconciliation are absent.
