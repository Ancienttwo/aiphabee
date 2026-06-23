# Usage Ledger Event Writer Scaffold

> **Status**: Verified event-writer scaffold
> **Last Updated**: 2026-06-20 17:30 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-usage-ledger-event-writer-scaffold.md`
> **Task Contract**:
> `tasks/contracts/usage-ledger-event-writer-scaffold.contract.md`

This slice creates a deterministic usage event and ledger-entry planner for
Data Access Gateway calls. It does not write live usage rows, post billing
entries, export invoices, or touch frontend quota UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Event writer planner | `packages/usage-ledger` | Builds usage event and ledger-entry plans without SQL |
| Gateway decision | `packages/data-access-gateway` | Attaches `usageLedger` to every decision |
| Gateway contract | `deploy/gateway/access.contract.json` | Adds `usage_event_writer_scaffold` required guard |
| Worker runtime route | `GET /gateway/runtime` | Reports event-writer capability, no live writes |
| Usage schema | `aiphabee_core.usage_event`, `aiphabee_core.usage_ledger_entry` | Existing schema target only; no mutation |
| Billing | Absent | No provider integration, invoice posting, or reconciliation writes |

## P2 Concrete Trace

Per-call usage planning trace:

1. Worker receives `POST /gateway/access-check` and creates or forwards
   `requestId`.
2. Worker passes `requestId`, optional workspace/account context, and occurrence
   timestamp into `evaluateDataAccessRequest()`.
3. Gateway computes rights, row limits, quality state, Serving read plan, and
   usage summary.
4. Gateway calls `createUsageLedgerEventPlan()` with request, dataset, channel,
   rows, fields, credits, quality state, data version, methodology version, and
   rights policy version.
5. Planner returns deterministic `usageEventId`, `meterRuleId`, and
   `ledgerEntryId`.
6. If workspace context exists and the decision has positive credits with no
   error, the ledger entry is `billableState=preview`; otherwise it is
   `billableState=blocked`.
7. Planner always returns `writeReady=false` and `sqlEmitted=false`.

Runtime capability trace:

1. Client calls `GET /gateway/runtime`.
2. Worker reports `usage_ledger.event_writer.status=event_writer_scaffold`,
   `live_writes=false`, `live_billing_reconciliation=false`,
   `weighted_credits=true`, and `reconciliation_target_delay_minutes=5`.

## P3 Design Decision

Selected usage event/ledger planning instead of live writes.

Reason:

- Hyperdrive/Supabase live write smoke is absent.
- Billing provider integration and reconciliation posting are absent.
- Workspace identity exists as schema and synthetic policy, but live auth and
  subscription context are not wired.
- Writing persistent usage from scaffolded calls would create misleading
  billing evidence.

Tradeoff:

- Sprint 1.1 now has executable per-call usage accounting semantics.
- The system still cannot post or reconcile real billable usage.

## Verification

Passed:

- `npm run test -- packages/usage-ledger/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
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
  "usage_ledger": {
    "event_writer": {
      "status": "event_writer_scaffold",
      "usage_event_grain": "request_operation_dataset_occurred_at",
      "live_writes": false,
      "live_billing_reconciliation": false,
      "weighted_credits": true,
      "reconciliation_target_delay_minutes": 5,
      "sql_emitted": false
    },
    "live_writes": false
  }
}
```

## Residual Gaps

- Live Supabase/Hyperdrive usage writes are absent.
- Billing provider integration and invoice reconciliation are absent.
- Quota display UI remains out of scope and delegated away from this backend
  slice.
- Live DB entitlement policy source is not wired.
