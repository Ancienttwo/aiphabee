# Serving SQL Text Compiler Scaffold

> **Status**: Verified SQL text compiler scaffold
> **Last Updated**: 2026-06-20 18:14 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-serving-sql-text-compiler-scaffold.md`
> **Task Contract**:
> `tasks/contracts/serving-sql-text-compiler-scaffold.contract.md`

This slice adds a deterministic SQL text compiler boundary after the Serving SQL
descriptor. It emits fixed, allow-listed SQL text and positional parameter
metadata, but does not execute SQL, read Hyperdrive/Supabase, load partner rows,
or enable frontend access. A later execution adapter scaffold now accepts SQL
text and bindings but still returns deferred execution with empty rows.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| SQL text compiler | `packages/serving-store` | Converts an allow-listed descriptor into fixed SQL text and bindings |
| Execution adapter | `packages/serving-store` | Accepts SQL text and bindings, returns deferred no-live execution plan |
| Gateway evaluator | `packages/data-access-gateway` | Attaches `servingSqlText` after `servingSqlDescriptor` |
| Worker runtime route | `GET /gateway/runtime` | Reports `serving_sql_text_compiler_scaffold`, no execution |
| Access contract | `deploy/gateway/access.contract.json` | Requires SQL text compiler guard |
| Live Serving SQL | Absent | SQL text exists, but execution, Hyperdrive read, partner row, and Serving response body remain absent |

## P2 Concrete Trace

Allowed SQL text trace:

1. `evaluateDataAccessRequest()` completes rights, field, quality, read, query,
   and descriptor planning.
2. Gateway calls `createServingSqlTextPlan()` with `servingSqlDescriptor`.
3. Compiler accepts only
   `statementId=serving_record_projection_by_snapshot_v0`.
4. Compiler emits fixed SQL text against `aiphabee_core.serving_record`.
5. Compiler records positional parameter order:
   `serving_snapshot_id`, `field_set`, `time_from`, `time_to`, `limit`.
6. Compiler returns `status=sql_text_planned`,
   `executionReady=false`, `liveRead=false`, and `sqlExecuted=false`.
7. Later `servingExecution` planning accepts this SQL text but returns
   `execution_deferred` and empty rows.

Blocked SQL text trace:

1. Default-deny, quality-held, or unreleased snapshot decisions produce
   `servingSqlDescriptor.status=descriptor_blocked`.
2. Compiler returns `status=sql_text_blocked` with the same blocked reason.
3. SQL text is absent, selected fields are empty, limit is `0`, and no execution
   surface is enabled.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports `guards` containing `serving_sql_text_compiler_scaffold`.
3. Worker reports
   `serving_store.sql_text_compiler.status=sql_text_compiler_scaffold`,
   `execution_ready=false`, `sql_executed=false`, and `live_reads=false`.

## P3 Design Decision

Selected fixed-template SQL text compilation instead of live SQL execution.

Reason:

- SQL execution requires live Hyperdrive/Supabase smoke and partner rows, both
  still absent.
- Field paths remain parameter bindings so arbitrary requested fields are not
  concatenated into SQL text.
- Keeping execution disabled preserves the default-deny boundary while making
  the future adapter contract testable.

Tradeoff:

- Sprint 1.1 now has deterministic SQL text for the future Serving adapter.
- The system still cannot execute SQL or return real licensed market data.

## Verification

Passed:

- `npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck`
- `npm run check:data-gateway`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /gateway/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/gateway/runtime` fields:

```json
{
  "guards": ["serving_sql_text_compiler_scaffold"],
  "serving_store": {
    "sql_text_compiler": {
      "status": "sql_text_compiler_scaffold",
      "execution_ready": false,
      "sql_executed": false,
      "live_reads": false
    }
  }
}
```

## Residual Gaps

- SQL execution is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- Persistent usage writes and billing reconciliation are absent.
