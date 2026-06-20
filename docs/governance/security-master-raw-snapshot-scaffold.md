# Security Master Raw Snapshot Scaffold

> **Status**: Verified schema scaffold
> **Last Updated**: 2026-06-20 16:45 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-security-master-raw-snapshot-scaffold.md`
> **Task Contract**:
> `tasks/contracts/security-master-raw-snapshot-scaffold.contract.md`

This slice creates the empty schema foundation for Sprint 1.1 securities master
and immutable raw snapshots. It does not apply to a live database and does not
load market data.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Migration | `supabase/migrations/20260620082000_security_master_raw_snapshot_scaffold.sql` | Creates empty `core` and governance tables |
| Contract | `deploy/database/migrations.contract.json` | Lists both local migrations and keeps `market_data=false` |
| Runtime route | `GET /data/runtime` | Reports schema capability, no live query |
| Security master | `core.company`, `core.instrument`, `core.listing`, `core.identifier_history` | Entity/listing/identifier scaffold only |
| Raw snapshots | `core.raw_source_batch`, `core.raw_snapshot`, `core.data_version_batch` | Immutable source snapshot and data version scaffold |
| Live data | Absent | No partner rows, no Hyperdrive query, no Serving Store read |

## P2 Concrete Trace

Migration validation trace:

1. `npm run check:database` reads `deploy/database/migrations.contract.json`.
2. The checker verifies every listed SQL file exists in `supabase/migrations`.
3. It rejects destructive SQL, provider secrets, database URLs, and missing table
   coverage.
4. It validates the new scaffold migration creates:
   - security master tables;
   - raw source and snapshot tables;
   - data version batch table;
   - governance contract row.

Runtime capability trace:

1. Client calls `GET /data/runtime`.
2. Worker returns a standard success envelope with:
   - `market_data_loaded=false`;
   - `live_queries=false`;
   - security master table names;
   - raw snapshot immutability and default `quality_state=HOLD`;
   - source rights default `default_deny`.

## P3 Design Decision

Selected empty schema scaffold instead of loading synthetic or partner rows.

Reason:

- Gate 0 rights matrix and partner data contract are not signed.
- Hyperdrive/Supabase live resources are still unprovisioned.
- Loading plausible market rows would blur the line between schema readiness and
  licensed data availability.

Tradeoff:

- Sprint 1.1 now has concrete DAT-01/DAT-02 database structures.
- It still cannot serve real company profiles, identifiers, or historical data.

## Verification

Passed:

- `npm run check:database`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /data/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/data/runtime` fields:

```json
{
  "default_rights_status": "default_deny",
  "live_queries": false,
  "market_data_loaded": false,
  "raw_snapshots": {
    "immutable": true,
    "quality_default_state": "HOLD",
    "table": "core.raw_snapshot"
  }
}
```

## Residual Gaps

- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Partner-signed source samples and field dictionary are absent.
- Financial fact/restatement schemas now exist in
  `docs/governance/financial-facts-restatement-scaffold.md`; corporate action
  schemas remain absent.
- Serving Gateway and persistent usage ledger are not wired to these tables.
