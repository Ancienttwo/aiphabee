# Serving Store Schema Scaffold

> **Status**: Verified schema scaffold
> **Last Updated**: 2026-06-20 17:46 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-serving-store-schema-scaffold.md`
> **Task Contract**:
> `tasks/contracts/serving-store-schema-scaffold.contract.md`

This slice creates the empty schema foundation for versioned Serving Store
projections. Later read-planner, quality-release, and query-planner scaffolds
now target this schema shape, but it still does not apply to a live database,
load partner data, or enable Gateway live Serving reads/writes.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Migration | `supabase/migrations/20260620091000_serving_store_scaffold.sql` | Creates empty `core` Serving Store tables and governance contract |
| Contract | `deploy/database/migrations.contract.json` | Lists local migrations and keeps `market_data=false` |
| Data runtime route | `GET /data/runtime` | Reports Serving Store schema capability, no live queries |
| Gateway runtime route | `GET /gateway/runtime` | Reports Gateway can target Serving Store later, no live reads |
| Read planner | `packages/serving-store` | Plans blocked/held reads against the schema shape, no SQL emitted |
| Quality release planner | `packages/serving-store` | Maps quality states to `held`, `released`, or `withdrawn`, no SQL emitted |
| Query planner | `packages/serving-store` | Plans released snapshot queries against the schema shape, no SQL emitted |
| Dataset registry | `core.serving_dataset` | Dataset/domain/default quality/default rights metadata |
| Field registry | `core.serving_field` | Field path/type/right/quality metadata |
| Snapshots | `core.serving_snapshot` | Versioned, as-of, quality-gated dataset releases |
| Records | `core.serving_record` | Entity payload projection with field set and source record |
| Live reads/writes | Absent | Read/release planners exist, but no Serving Store SQL, partner rows, or market data surfaces |

## P2 Concrete Trace

Migration validation trace:

1. `npm run check:database` reads `deploy/database/migrations.contract.json`.
2. The checker verifies every listed SQL file exists in `supabase/migrations`.
3. It rejects destructive SQL, provider secrets, database URLs, and missing table
   coverage.
4. It validates the new scaffold migration creates:
   - Serving dataset table;
   - Serving field table;
   - Serving snapshot table;
   - Serving record table;
   - governance contract row.

Runtime capability trace:

1. Client calls `GET /data/runtime`.
2. Worker returns a standard success envelope with
   `serving_store.status=schema_scaffold`, `live_serving_reads=false`,
   `default_quality_state=HOLD`, and `default_rights_status=default_deny`.
3. Client calls `GET /gateway/runtime`.
4. Worker returns `serving_store.status=schema_scaffold`,
   `serving_store.read_planner.status=read_planner_scaffold`,
   `serving_store.quality_release.status=quality_release_isolation_scaffold`,
   `serving_store.query_planner.status=query_planner_scaffold`,
   and `live_reads=false`.
5. `/gateway/access-check` attaches `servingRead` and `servingQuery` plans to
   Gateway decisions but does not read data or emit SQL.

## P3 Design Decision

Selected empty Serving Store schema scaffold instead of live Gateway reads.

Reason:

- Partner-approved data and rights rows are not loaded.
- Hyperdrive live database smoke is not complete.
- Data quality release flow is not connected to persistent Serving snapshots.
- Usage ledger live writes should not meter synthetic or nonexistent Serving
  reads.

Tradeoff:

- Sprint 1.1 now has a concrete schema target for Gateway live Serving, data
  quality isolation, usage metering, blocked read planning, and release posture
  planning, plus no-SQL released snapshot query planning.
- It still cannot return real licensed market data.

## Verification

Passed:

- `npm run check:database`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /data/runtime` -> `200 OK`
- `GET /gateway/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed runtime fields:

```json
{
  "serving_store": {
    "status": "schema_scaffold",
    "read_planner": {
      "status": "read_planner_scaffold",
      "live_reads": false,
      "sql_emitted": false
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
      "sql_emitted": false
    },
    "live_serving_reads": false,
    "live_reads": false,
    "default_quality_state": "HOLD",
    "default_rights_status": "default_deny",
    "release_state_default": "held"
  }
}
```

## Residual Gaps

- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Partner-approved data loading is absent.
- Gateway creates blocked/held Serving read plans, quality release plans, and
  no-SQL query plans, but does not read or write Serving Store records.
- Field entitlement live DB policy source is not wired.
- Usage ledger live writes and billing reconciliation are not wired.
