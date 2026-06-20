# Data Access Gateway Default-Deny Scaffold

> **Status**: Verified guarded scaffold
> **Last Updated**: 2026-06-20 18:14 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-data-access-gateway-default-deny-scaffold.md`
> **Task Contract**:
> `tasks/contracts/data-access-gateway-default-deny-scaffold.contract.md`

This slice creates the first executable Data Access Gateway boundary. It does
not read real market data or grant any partner rights.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Gateway evaluator | `packages/data-access-gateway` | Default-deny rights, field redaction, row/time limits, quality hold, cache key, `servingRead`, `servingQuery`, `servingSqlDescriptor`, `servingSqlText`, and `servingExecution` plans |
| Entitlement policy source | `packages/data-access-gateway` | Compiles account/workspace entitlement row snapshots into Gateway policy without SQL |
| Serving read planner | `packages/serving-store` | Plans blocked/held Serving reads without SQL or live rows |
| Serving quality release planner | `packages/serving-store` | Plans `held/released/withdrawn` posture without SQL or live writes |
| Serving query planner | `packages/serving-store` | Plans released snapshot queries without SQL or live rows |
| Serving SQL descriptor planner | `packages/serving-store` | Plans statement id and bindings without SQL text or execution |
| Serving SQL text compiler | `packages/serving-store` | Compiles allow-listed descriptor into fixed SQL text without execution |
| Serving execution adapter | `packages/serving-store` | Accepts SQL text and returns deferred empty-row execution plan |
| Usage event writer | `packages/usage-ledger` | Plans usage event and ledger entry previews without SQL or billing writes |
| Gateway contract | `deploy/gateway/access.contract.json` | No-secret default-deny route/guard manifest |
| Contract checker | `scripts/check-data-access-gateway-contract.mjs` | Validates channels, guards, limits, routes, and no secret-like values |
| Worker runtime route | `GET /gateway/runtime` | Reports guard capabilities and no live data surface |
| Worker access route | `POST /gateway/access-check` | Returns `DATA_NOT_LICENSED` by default or `DATA_QUALITY_HOLD` for held data |
| Real Serving Store | Schema and planner scaffolds only | Projection tables and no-SQL planners exist, but no partner rows, live reads, live entitlements, or MCP redistribution |

## P2 Concrete Trace

Default-deny trace:

1. Client sends `POST /gateway/access-check` with channel, dataset, fields, and
   requested row count.
2. Worker normalizes the request and calls `evaluateDataAccessRequest()`.
3. The default policy has every channel at `default_deny`.
4. Requested fields are denied with reason `channel_blocked`.
5. Gateway attaches `servingRead.status=blocked_by_gateway`,
   `liveRead=false`, `servedRows=0`, and `sqlEmitted=false`.
6. Gateway attaches `servingQuery.status=query_blocked`,
   `blockedReason=DATA_NOT_LICENSED`, `plannedRows=0`, and
   `sqlEmitted=false`.
7. Worker returns a standard error envelope with `DATA_NOT_LICENSED`.

Quality-hold trace:

1. Client sends the same route with `quality_state=HOLD`.
2. The evaluator returns `status=quality_hold` before serving any fields.
3. Gateway attaches `servingRead.status=quality_hold`,
   `liveRead=false`, `servedRows=0`, and `sqlEmitted=false`.
4. Gateway attaches `servingQuery.status=query_blocked`,
   `blockedReason=DATA_QUALITY_HOLD`, `plannedRows=0`, and
   `sqlEmitted=false`.
5. Worker returns `DATA_QUALITY_HOLD` and zero usage rows/credits.

Allowed synthetic unit-test trace:

1. Tests use `createSyntheticApprovedPolicy()` for non-market synthetic fields.
2. Approved field is kept; unapproved field is redacted.
3. Cache key includes dataset, channel, plan, allowed fields, data version,
   rights policy version, methodology version, and time range.
4. Gateway attaches `servingQuery.status=query_planned` with no live read or
   SQL execution.

## P3 Design Decision

Selected a guarded gateway scaffold instead of a real Serving Store integration.

Reason:

- Gate 0 rights matrix and partner field contract are not signed.
- Schema scaffolds and planners exist, including Serving Store projection
  tables, blocked read plans, release/isolation plans, no-SQL query plans,
  no-execute SQL descriptors, fixed SQL text plans, and deferred execution
  plans, but no partner rows or live Serving SQL execution exists yet.
- Exposing real data before rights enforcement would violate PRD default-deny.

Tradeoff:

- Sprint 1.1 now has executable gateway behavior and runtime smoke.
- Usage ledger schemas, usage event writer, and entitlement evaluator scaffold
  now exist, but it still does not complete real data persistence, live usage
  writes, billing reconciliation, or live database entitlement policy source.

## Verification

Passed:

- `npm run check:data-gateway`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /gateway/runtime` -> `200 OK`
- `POST /gateway/access-check` -> `403 DATA_NOT_LICENSED`
- `POST /gateway/access-check` with `quality_state=HOLD` ->
  `409 DATA_QUALITY_HOLD`
- `scripts/check-task-workflow.sh --strict`

Observed `/gateway/runtime` fields:

```json
{
  "default_rights_status": "default_deny",
  "live_data_access": false,
  "market_data_surfaces": false,
  "mcp_redistribution_surfaces": false,
  "serving_store.read_planner.live_reads": false,
  "serving_store.read_planner.sql_emitted": false,
  "serving_store.quality_release.live_writes": false,
  "serving_store.quality_release.sql_emitted": false,
  "serving_store.query_planner.live_reads": false,
  "serving_store.query_planner.sql_emitted": false,
  "serving_store.sql_descriptor.execution_ready": false,
  "serving_store.sql_descriptor.sql_text_emitted": false,
  "serving_store.sql_text_compiler.execution_ready": false,
  "serving_store.sql_text_compiler.sql_executed": false,
  "serving_store.execution_adapter.execution_ready": false,
  "serving_store.execution_adapter.rows_returned": false,
  "field_entitlement_enforcement.policy_source.live_db_reads": false,
  "field_entitlement_enforcement.policy_source.sql_emitted": false,
  "usage_ledger.event_writer.live_writes": false,
  "usage_ledger.event_writer.sql_emitted": false,
  "rights_policy_version": "gate0-default-deny-v0"
}
```

## Residual Gaps

- Securities master, raw snapshot, financial fact/restatement,
  corporate-action/adjustment, Serving Store schemas, read planner, and quality
  release isolation/query planners, SQL descriptors, SQL text plans, and
  deferred execution adapter plans now exist, but no live execution or live
  reads/writes exist.
- Partner-signed rights matrix is absent.
- Account/workspace/plan and usage ledger schemas now exist, usage event writer
  has synthetic coverage, and entitlement enforcement has synthetic coverage,
  but live DB policy source, persistent usage writes, and billing reconciliation
  are absent.
- No external MCP/API redistribution surface is enabled.
