# Usage Ledger Scaffold

> **Status**: Verified schema scaffold
> **Last Updated**: 2026-06-20 17:30 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-usage-ledger-scaffold.md`
> **Task Contract**: `tasks/contracts/usage-ledger-scaffold.contract.md`

This slice creates the empty schema foundation for Sprint 1.1 usage events,
weighted credit metering, ledger entries, and reconciliation batches. A later
event-writer scaffold now targets this schema shape, but it still does not apply
to a live database and does not enable live usage writes or billing
reconciliation.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Migration | `supabase/migrations/20260620090000_usage_ledger_scaffold.sql` | Creates empty `core` usage tables and governance contract |
| Contract | `deploy/database/migrations.contract.json` | Lists all local migrations and keeps `market_data=false` |
| Gateway runtime route | `GET /gateway/runtime` | Reports usage-ledger capability, no live writes |
| Event writer | `packages/usage-ledger` | Plans usage events and ledger entries, no SQL emitted |
| Meter rules | `aiphabee_core.usage_meter_rule` | Channel/dataset/operation unit and credit weight |
| Events | `aiphabee_core.usage_event` | Request/run/workspace/account context and metered counts |
| Reconciliation | `aiphabee_core.usage_reconciliation_batch` | Workspace period, target delay, status, total credits |
| Ledger | `aiphabee_core.usage_ledger_entry` | Event-to-meter entries with billable state |
| Live writes | Absent | Event writer exists, but no SQL writes, billing integration, or invoice reconciliation |

## P2 Concrete Trace

Migration validation trace:

1. `npm run check:database` reads `deploy/database/migrations.contract.json`.
2. The checker verifies every listed SQL file exists in `supabase/migrations`.
3. It rejects destructive SQL, provider secrets, database URLs, and missing table
   coverage.
4. It validates the new scaffold migration creates:
   - usage meter rule table;
   - usage event table;
   - reconciliation batch table;
   - ledger entry table;
   - governance contract row.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker returns a standard success envelope with:
   - `usage_ledger.status=schema_scaffold`;
   - `usage_ledger.event_writer.status=event_writer_scaffold`;
   - `weighted_credits=true`;
   - `reconciliation_target_delay_minutes=5`;
   - `live_writes=false`;
   - no live data access.

## P3 Design Decision

Selected empty schema scaffold instead of live ledger writes.

Reason:

- Serving Store schema exists, but live Gateway reads are still absent.
- Identity, workspace context, and billing provider integration are not wired to
  runtime calls.
- Writing usage from scaffolded decisions would create misleading billing
  evidence before data rights and partner rows are live.

Tradeoff:

- Sprint 1.1 now has concrete ACC-04 ledger structures.
- Sprint 1.1 now has executable per-call usage event planning.
- It still cannot persist or reconcile real Web/MCP usage to billing.

## Verification

Passed:

- `npm run check:database`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /gateway/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/gateway/runtime` fields:

```json
{
  "usage_ledger": {
    "event_writer": {
      "status": "event_writer_scaffold",
      "live_writes": false,
      "live_billing_reconciliation": false,
      "sql_emitted": false
    },
    "live_writes": false,
    "reconciliation_target_delay_minutes": 5,
    "status": "schema_scaffold",
    "weighted_credits": true
  },
  "live_data_access": false
}
```

## Residual Gaps

- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Serving Store schema exists, but live Gateway reads and account identity
  context are absent.
- `/gateway/access-check` now plans usage events, but persistent usage writes
  are absent.
- Billing provider reconciliation and invoice export are absent.
