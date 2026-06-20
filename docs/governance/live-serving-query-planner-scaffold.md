# Live Serving Query Planner Scaffold

> **Status**: Verified query-plan scaffold
> **Last Updated**: 2026-06-20 17:56 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-live-serving-query-planner-scaffold.md`
> **Task Contract**:
> `tasks/contracts/live-serving-query-planner-scaffold.contract.md`

This slice adds the first deterministic query-plan boundary for Data Access
Gateway live Serving. It does not emit SQL, read Hyperdrive/Supabase, load
partner rows, or enable frontend access. A later SQL descriptor scaffold now
turns planned queries into no-execute descriptor material.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Query planner | `packages/serving-store` | Converts approved read plans and released snapshot metadata into no-SQL query plans |
| SQL descriptor planner | `packages/serving-store` | Converts planned queries into allow-listed statement descriptors without SQL text |
| Gateway evaluator | `packages/data-access-gateway` | Attaches `servingQuery` after rights, fields, row/time, quality, and read planning |
| Worker runtime route | `GET /gateway/runtime` | Reports `serving_query_planner_scaffold`, no live reads |
| Access contract | `deploy/gateway/access.contract.json` | Requires query planner guard and cache material |
| Live Serving | Absent | No SQL execution, Hyperdrive read, partner row, or Serving response body |

## P2 Concrete Trace

Allowed released snapshot trace:

1. Caller invokes `evaluateDataAccessRequest()` with dataset, fields, channel,
   plan, quality state, row limit, and optional time range.
2. Gateway evaluates channel, field, workspace, plan, export, row, time, and
   quality guards.
3. Gateway creates `servingRead` from the allowed field set and version
   material.
4. Gateway creates `servingQuery` with the read plan plus
   `servingSnapshotId=serving-snapshot-scaffold-v0` and
   `releaseState=released` for allowed scaffold decisions.
5. `createServingQueryPlan()` preserves allowed fields, row limit, time range,
   data version, rights version, methodology version, snapshot id, and release
   state.
6. Planner returns `status=query_planned`, `liveRead=false`,
   `sqlEmitted=false`, and bounded `plannedRows`.
7. Later `servingSqlDescriptor` planning adds statement id and bindings without
   SQL text or execution.

Blocked trace:

1. Default-deny or quality-held decisions produce a blocked/held `servingRead`.
2. `createServingQueryPlan()` returns `status=query_blocked` with
   `DATA_NOT_LICENSED`, `DATA_QUALITY_HOLD`, or
   `SERVING_SNAPSHOT_NOT_RELEASED`.
3. Planned rows stay `0`, and no SQL/live read surface is enabled.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports `guards` containing `serving_query_planner_scaffold`.
3. Worker reports
   `serving_store.query_planner.status=query_planner_scaffold`,
   `live_reads=false`, and `sql_emitted=false`.

## P3 Design Decision

Selected a query-plan scaffold instead of live Serving SQL.

Reason:

- The repo has no approved partner rows or live Serving seed/apply path.
- The Gateway contract must stay default-deny until real entitlement and
  quality-release evidence exist.
- SQL generation/execution would cross the Hyperdrive and redistribution
  boundary before Sprint 1.1 has signed data-rights proof.

Tradeoff:

- Sprint 1.1 now has an executable contract for query material and release
  gating.
- The system still cannot return real licensed market data.

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
  "guards": ["serving_query_planner_scaffold"],
  "serving_store": {
    "query_planner": {
      "status": "query_planner_scaffold",
      "requires_release_state": "released",
      "blocks_unreleased_snapshots": true,
      "live_reads": false,
      "sql_emitted": false
    }
  }
}
```

## Residual Gaps

- Live Serving SQL is absent.
- SQL text generation is absent.
- Hyperdrive/Supabase Serving reads are absent.
- Partner market data rows are absent.
- Persistent usage writes and billing reconciliation are absent.
