# Serving SQL Descriptor Scaffold

> **Status**: Verified SQL descriptor scaffold
> **Last Updated**: 2026-06-20 18:05 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-serving-sql-descriptor-scaffold.md`
> **Task Contract**:
> `tasks/contracts/serving-sql-descriptor-scaffold.contract.md`

This slice adds a deterministic no-execute SQL descriptor boundary after
Gateway Serving query planning. It does not emit SQL text, execute SQL, read
Hyperdrive/Supabase, load partner rows, or enable frontend access. A later SQL
text compiler scaffold now compiles allow-listed descriptors into fixed SQL
text while keeping execution disabled.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| SQL descriptor planner | `packages/serving-store` | Converts planned Serving queries into statement descriptor and bindings |
| SQL text compiler | `packages/serving-store` | Compiles allow-listed descriptors into fixed SQL text, no execution |
| Gateway evaluator | `packages/data-access-gateway` | Attaches `servingSqlDescriptor` after `servingQuery` |
| Worker runtime route | `GET /gateway/runtime` | Reports `serving_sql_descriptor_scaffold`, no execution |
| Access contract | `deploy/gateway/access.contract.json` | Requires SQL descriptor guard |
| Live Serving SQL | Absent | No SQL text, execution, Hyperdrive read, partner row, or Serving response body |

## P2 Concrete Trace

Allowed descriptor trace:

1. `evaluateDataAccessRequest()` completes rights, field, quality, read, and
   query planning.
2. Gateway calls `createServingSqlDescriptor()` with `servingQuery`.
3. Descriptor keeps an allow-listed
   `statementId=serving_record_projection_by_snapshot_v0`.
4. Descriptor records selected field paths and parameter bindings for Serving
   snapshot id, field set, time range, and row limit.
5. Descriptor returns `status=descriptor_planned`,
   `executionReady=false`, `liveRead=false`, `sqlTextEmitted=false`, and
   `sqlEmitted=false`.
6. Later `servingSqlText` planning can compile the descriptor into fixed SQL
   text, but keeps `executionReady=false` and `sqlExecuted=false`.

Blocked descriptor trace:

1. Default-deny, quality-held, or unreleased snapshot decisions produce
   `servingQuery.status=query_blocked`.
2. Descriptor returns `status=descriptor_blocked` with the same blocked reason.
3. Selected fields are empty, limit is `0`, and no SQL text/execution surface is
   enabled.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports `guards` containing `serving_sql_descriptor_scaffold`.
3. Worker reports
   `serving_store.sql_descriptor.status=sql_descriptor_scaffold`,
   `execution_ready=false`, `sql_text_emitted=false`, and `live_reads=false`.

## P3 Design Decision

Selected descriptor planning instead of SQL text generation.

Reason:

- Partner rows and live Serving releases are still absent.
- Hyperdrive live reads are outside the current verified boundary.
- SQL text would be closer to execution and injection risk before the signed
  data-rights and source-row path exists.

Tradeoff:

- Sprint 1.1 now has a deterministic SQL descriptor contract for the future
  live Serving adapter.
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
  "guards": ["serving_sql_descriptor_scaffold"],
  "serving_store": {
    "sql_descriptor": {
      "status": "sql_descriptor_scaffold",
      "execution_ready": false,
      "sql_text_emitted": false,
      "sql_emitted": false,
      "live_reads": false
    }
  }
}
```

## Residual Gaps

- Live Serving SQL execution is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- Persistent usage writes and billing reconciliation are absent.
