# Corporate Action Adjustment Scaffold

> **Status**: Verified schema scaffold
> **Last Updated**: 2026-06-20 16:14 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-corporate-action-adjustment-scaffold.md`
> **Task Contract**:
> `tasks/contracts/corporate-action-adjustment-scaffold.contract.md`

This slice creates the empty schema foundation for Sprint 1.1 corporate
actions, adjustment methodology versions, and price adjustment factors. It does
not apply to a live database and does not load market data.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Migration | `supabase/migrations/20260620084000_corporate_action_adjustment_scaffold.sql` | Creates empty `core` adjustment tables and governance contract |
| Contract | `deploy/database/migrations.contract.json` | Lists all local migrations and keeps `market_data=false` |
| Runtime route | `GET /data/runtime` | Reports schema capability, no live query |
| Corporate action | `core.corporate_action` | Action type, dates, ratio/cash terms, source, data version, methodology |
| Adjustment methodology | `core.adjustment_methodology` | `raw`, `split_adjusted`, `total_return_adjusted`, direction, policy fields |
| Adjustment factors | `core.price_adjustment_factor` | Closed-open factor intervals linked to methodology and source |
| Engine scaffold | `packages/corporate-actions` | Synthetic deterministic engine exists, but no partner rows or adjusted series reads |
| Live data | Absent | No partner rows, no Hyperdrive query, no adjusted series read |

## P2 Concrete Trace

Migration validation trace:

1. `npm run check:database` reads `deploy/database/migrations.contract.json`.
2. The checker verifies every listed SQL file exists in `supabase/migrations`.
3. It rejects destructive SQL, provider secrets, database URLs, and missing table
   coverage.
4. It validates the new scaffold migration creates:
   - corporate action table;
   - adjustment methodology table;
   - price adjustment factor table;
   - governance contract row.

Runtime capability trace:

1. Client calls `GET /data/runtime`.
2. Worker returns a standard success envelope with:
   - `market_data_loaded=false`;
   - `live_queries=false`;
   - corporate-action table names;
   - `live_actions=false`;
   - `adjustment_types=["raw","split_adjusted","total_return_adjusted"]`;
   - `closed_open_intervals=true`;
   - default `quality_state=HOLD`.

## P3 Design Decision

Selected empty schema scaffold instead of a live adjustment engine.

Reason:

- Gate 0 rights matrix and partner data contract are not signed.
- Hyperdrive/Supabase live resources are still unprovisioned.
- Adjustment benchmark parity needs partner price bars and corporate-action
  source samples; only synthetic engine cases are available.

Tradeoff:

- Sprint 1.1 now has concrete DAT-04 storage structures.
- It still cannot serve adjusted price history or prove partner/public benchmark
  parity.

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
  "corporate_actions": {
    "adjustment_types": [
      "raw",
      "split_adjusted",
      "total_return_adjusted"
    ],
    "closed_open_intervals": true,
    "live_actions": false,
    "quality_default_state": "HOLD",
    "status": "schema_scaffold"
  },
  "live_queries": false,
  "market_data_loaded": false
}
```

## Residual Gaps

- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Synthetic adjustment computation exists, but partner corporate-action source
  samples and raw price bars are absent.
- Partner/public benchmark parity is absent.
- Serving Gateway and live usage ledger writes are not wired to these tables.
