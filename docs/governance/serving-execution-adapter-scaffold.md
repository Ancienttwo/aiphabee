# Serving Execution Adapter Scaffold

> **Status**: Verified execution adapter scaffold
> **Last Updated**: 2026-06-20 18:25 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-serving-execution-adapter-scaffold.md`
> **Task Contract**:
> `tasks/contracts/serving-execution-adapter-scaffold.contract.md`

This slice adds a no-live execution adapter boundary after the Serving SQL text
compiler. It accepts SQL text and bindings, but does not execute SQL, read
Hyperdrive/Supabase, load partner rows, or enable frontend access. A later
result-envelope scaffold now binds deferred/blocked execution plans to empty
rows and shared envelope metadata.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Execution adapter planner | `packages/serving-store` | Converts SQL text plans into deferred Hyperdrive adapter plans |
| Gateway evaluator | `packages/data-access-gateway` | Attaches `servingExecution` after `servingSqlText` |
| Worker runtime route | `GET /gateway/runtime` | Reports `serving_execution_adapter_scaffold`, no execution |
| Access contract | `deploy/gateway/access.contract.json` | Requires execution adapter guard |
| Live Serving SQL | Absent | Adapter and result envelope exist, but execution, Hyperdrive read, partner row, and API/MCP response route remain absent |

## P2 Concrete Trace

Deferred execution trace:

1. `evaluateDataAccessRequest()` completes rights, field, quality, read, query,
   descriptor, and SQL text planning.
2. Gateway calls `createServingExecutionAdapterPlan()` with `servingSqlText`.
3. Adapter accepts planned SQL text and parameter bindings.
4. Adapter returns `status=execution_deferred`,
   `deferredReason=LIVE_SERVING_EXECUTION_DISABLED`,
   `executionReady=false`, `sqlExecuted=false`, `liveRead=false`, `rows=[]`,
   and `servedRows=0`.

Blocked execution trace:

1. Default-deny, quality-held, or unreleased snapshot decisions produce
   `servingSqlText.status=sql_text_blocked`.
2. Adapter returns `status=execution_blocked` with the upstream blocked reason.
3. SQL is not executed, rows stay empty, and no live read surface is enabled.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports `guards` containing `serving_execution_adapter_scaffold`.
3. Worker reports
   `serving_store.execution_adapter.status=execution_adapter_scaffold`,
   `execution_ready=false`, `sql_executed=false`, and `live_reads=false`.

## P3 Design Decision

Selected a no-live adapter scaffold instead of SQL execution.

Reason:

- Hyperdrive live `SELECT 1` and live Serving rows are still absent.
- Partner data rights and source-row samples are still absent.
- Returning empty rows with a deferred reason preserves the default-deny and
  no-redistribution boundary while defining the future adapter seam.

Tradeoff:

- Sprint 1.1 now has a deterministic adapter contract for future live Serving.
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
  "guards": ["serving_execution_adapter_scaffold"],
  "serving_store": {
    "execution_adapter": {
      "status": "execution_adapter_scaffold",
      "adapter": "hyperdrive",
      "execution_ready": false,
      "sql_executed": false,
      "rows_returned": false,
      "live_reads": false
    }
  }
}
```

## Residual Gaps

- SQL execution is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- API/MCP tool routes do not yet consume the result envelope.
- Persistent usage writes and billing reconciliation are absent.
