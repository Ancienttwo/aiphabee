# Serving Read Scaffold Default-Deny

> **Status**: Verified read planner scaffold
> **Last Updated**: 2026-06-20 17:56 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-serving-read-scaffold-default-deny.md`
> **Task Contract**:
> `tasks/contracts/serving-read-scaffold-default-deny.contract.md`

This slice creates a deterministic Serving read planner attached to Data Access
Gateway decisions. It does not run SQL, query live Serving Store rows, load
partner data, or enable frontend surfaces.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Read planner | `packages/serving-store` | Builds Serving read plans from Gateway status, fields, quality state, and version material |
| Quality release planner | `packages/serving-store` | Maps quality state to `held`, `released`, or `withdrawn` before future live reads |
| Query planner | `packages/serving-store` | Converts approved read plans plus released snapshot metadata into no-SQL query plans |
| SQL descriptor planner | `packages/serving-store` | Converts planned queries into no-execute statement descriptors |
| Gateway evaluator | `packages/data-access-gateway` | Adds `servingRead`, `servingQuery`, and `servingSqlDescriptor` to every decision after rights, field, row, time, and quality guards |
| Gateway contract | `deploy/gateway/access.contract.json` | Adds `serving_read_default_deny` to required guards |
| Contract checker | `scripts/check-data-access-gateway-contract.mjs` | Validates the read guard remains in the manifest |
| Worker runtime route | `GET /gateway/runtime` | Reports read-planner capability, no live reads, no SQL |
| Real Serving reads | Absent | No Hyperdrive query, partner row, released snapshot read, or MCP redistribution |

## P2 Concrete Trace

Default-deny trace:

1. Client sends `POST /gateway/access-check` with a market-style dataset and
   requested fields.
2. Worker calls `evaluateDataAccessRequest()`.
3. Gateway rights and field guards return `status=deny`.
4. Gateway calls `createServingReadPlan()` with denied status and empty allowed
   fields.
5. Planner returns `status=blocked_by_gateway`,
   `blockedReason=DATA_NOT_LICENSED`, `liveRead=false`, `servedRows=0`, and
   `sqlEmitted=false`.

Quality-hold trace:

1. Client or test input provides `quality_state=HOLD`.
2. Gateway returns `status=quality_hold` before serving fields.
3. Planner returns `status=quality_hold`,
   `blockedReason=DATA_QUALITY_HOLD`, `liveRead=false`, `servedRows=0`, and
   `sqlEmitted=false`.

Synthetic allowed trace:

1. Unit tests use `createSyntheticApprovedPolicy()` for a non-live dataset.
2. Gateway redacts disallowed fields and forwards allowed fields to the read
   planner.
3. Planner returns `status=read_planned` with allowed fields and cache-key
   material, but keeps `releaseState=held`, `liveRead=false`, and
   `sqlEmitted=false`.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports `serving_store.read_planner.status=read_planner_scaffold`,
   `serving_store.quality_release.status=quality_release_isolation_scaffold`,
   `serving_store.query_planner.status=query_planner_scaffold`,
   `serving_store.sql_descriptor.status=sql_descriptor_scaffold`,
   `live_reads=false`, `sql_emitted=false`, `blocks_default_deny=true`, and
   `blocks_quality_hold=true`.

## P3 Design Decision

Selected a deterministic read planner scaffold instead of live Serving Store
reads.

Reason:

- Serving Store projection schemas exist, but there are no partner-approved
  rows or released snapshots.
- Field entitlement live DB policy source is absent.
- Quality-release isolation is not yet connected to persistent Serving rows.
- Usage ledger live writes should not meter synthetic planned reads.

Tradeoff:

- Gateway decisions now prove how Serving reads would be blocked or planned.
- Serving quality states now prove whether future snapshots would be held,
  released, or withdrawn before live reads.
- Serving query plans now prove released snapshot gating and cache material
  without executing SQL.
- SQL descriptors now prove statement id and binding material without emitting
  SQL text.
- The system still cannot return real licensed market data.

## Verification

Passed:

- `npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts`
- `npm run typecheck`
- `npm run check:data-gateway`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /gateway/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/gateway/runtime` read-planner fields:

```json
{
  "read_planner": {
    "status": "read_planner_scaffold",
    "live_reads": false,
    "sql_emitted": false,
    "blocks_default_deny": true,
    "blocks_quality_hold": true,
    "release_state_default": "held"
  },
  "quality_release": {
    "status": "quality_release_isolation_scaffold",
    "live_reads": false,
    "live_writes": false,
    "sql_emitted": false
  },
  "query_planner": {
    "status": "query_planner_scaffold",
    "live_reads": false,
    "sql_emitted": false,
    "requires_release_state": "released"
  },
  "sql_descriptor": {
    "status": "sql_descriptor_scaffold",
    "execution_ready": false,
    "sql_text_emitted": false,
    "live_reads": false
  }
}
```

## Residual Gaps

- Live Supabase/Hyperdrive Serving reads are absent.
- Partner-approved data loading is absent.
- Persistent quality-release jobs and Serving snapshot mutation are absent.
- Query planning and SQL descriptor planning exist, but SQL text generation and
  live Serving SQL execution are absent.
- Field entitlement live DB policy source is not wired.
- Usage ledger live writes and billing reconciliation are not wired.
