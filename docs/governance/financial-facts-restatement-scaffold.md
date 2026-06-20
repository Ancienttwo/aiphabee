# Financial Facts Restatement Scaffold

> **Status**: Verified schema scaffold
> **Last Updated**: 2026-06-20 16:08 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-financial-facts-restatement-scaffold.md`
> **Task Contract**:
> `tasks/contracts/financial-facts-restatement-scaffold.contract.md`

This slice creates the empty schema foundation for Sprint 1.1 financial
statements, standardized financial facts, and restatement version links. It does
not apply to a live database and does not load market data.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Migration | `supabase/migrations/20260620083000_financial_facts_restatement_scaffold.sql` | Creates empty `core` financial tables and governance contract |
| Contract | `deploy/database/migrations.contract.json` | Lists all local migrations and keeps `market_data=false` |
| Runtime route | `GET /data/runtime` | Reports schema capability, no live query |
| Financial statement | `core.financial_statement` | Period, statement type, currency/unit/scale, accounting standard, source, versions |
| Financial fact | `core.financial_fact` | Metric-level values tied to statement, period, source, data version, methodology version |
| Restatement | `core.financial_restatement` | Links original and restated statement versions with reason metadata |
| Live data | Absent | No partner rows, no Hyperdrive query, no Serving Store read |

## P2 Concrete Trace

Migration validation trace:

1. `npm run check:database` reads `deploy/database/migrations.contract.json`.
2. The checker verifies every listed SQL file exists in `supabase/migrations`.
3. It rejects destructive SQL, provider secrets, database URLs, and missing table
   coverage.
4. It validates the new scaffold migration creates:
   - financial statement table;
   - financial fact table;
   - financial restatement table;
   - governance contract row.

Runtime capability trace:

1. Client calls `GET /data/runtime`.
2. Worker returns a standard success envelope with:
   - `market_data_loaded=false`;
   - `live_queries=false`;
   - financial fact table names;
   - `live_facts=false`;
   - `restatement_versions=true`;
   - default financial `quality_state=HOLD`.

## P3 Design Decision

Selected empty schema scaffold instead of loading synthetic or partner financial
facts.

Reason:

- Gate 0 rights matrix and partner data contract are not signed.
- Hyperdrive/Supabase live resources are still unprovisioned.
- Financial facts have partner-specific statement taxonomy, units, scale, and
  restatement semantics that should not be guessed from synthetic rows.

Tradeoff:

- Sprint 1.1 now has concrete DAT-03 storage structures.
- It still cannot serve real financial facts, ratios, or restatement evidence.

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
  "financial_facts": {
    "live_facts": false,
    "quality_default_state": "HOLD",
    "restatement_versions": true,
    "status": "schema_scaffold",
    "tables": [
      "core.financial_statement",
      "core.financial_fact",
      "core.financial_restatement"
    ]
  },
  "live_queries": false,
  "market_data_loaded": false
}
```

## Residual Gaps

- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Partner-signed statement taxonomy, field dictionary, and source samples are
  absent.
- Corporate-action/adjustment schemas now exist in
  `docs/governance/corporate-action-adjustment-scaffold.md`, but the live
  adjustment engine is absent.
- Serving Gateway and persistent usage ledger are not wired to these tables.
