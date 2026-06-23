# Usage Quota Display Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 05:15 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-usage-quota-display-scaffold.md`
> **Task Contract**:
> `tasks/contracts/usage-quota-display-scaffold.contract.md`

This slice completes the backend-only scaffold for Sprint 1.4 ACC-04 Web Agent
and MCP quota/usage display. It exposes deterministic quota snapshot planning
without live ledger reads, persistent writes, billing reconciliation, SQL, or
frontend UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/usage-ledger` | Owns usage event planning and quota display planning |
| Runtime route | `GET /usage/runtime` | Reports display fields, channels, plan codes, freshness target, and no-live posture |
| Planner route | `POST /usage/quota/plan` | Returns deterministic quota display snapshot plan |
| Contract | `deploy/usage/quota-display.contract.json` | Guards standard envelope, no frontend, no live reads, no writes, no billing reconciliation |
| Existing schema | `platform.workspace_subscription`, `aiphabee_core.usage_event`, `aiphabee_core.usage_ledger_entry`, `aiphabee_core.usage_reconciliation_batch` | Referenced storage tables from Sprint 1.1 usage ledger schema |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /usage/quota/plan` with `workspace_id`, `channel`,
   `plan_code`, and optional used/pending credits.
2. Worker normalizes the request and calls `createUsageQuotaDisplayPlan()`.
3. The planner maps the plan code to a deterministic scaffold credit limit and
   calculates remaining credits.
4. The plan returns `live_ledger_reads=false`, `persistent_writes=false`,
   `sql_emitted=false`, `request_id_visible=true`, and
   `freshness_target_minutes=5`.
5. Worker wraps the plan in the shared standard success envelope.

## P3 Design Decision

Selected a deterministic quota snapshot planner instead of live usage-ledger
reads or billing reconciliation.

Reason:

- ACC-04 requires Web Agent/MCP quota and usage display with less than 5-minute
  delay and traceability.
- The repo already has usage ledger schema/event-writer scaffolds, but no live
  DB reads/writes or billing provider.
- Frontend display is delegated to Claude.

Tradeoff:

- Web/MCP quota display contract is now stable and testable.
- Real usage numbers and billing traceability remain blocked until live usage
  writes and reconciliation are enabled.

## Verification

Passed:

- `npm run check:usage-quota-display`
- `npm run test -- packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/usage-ledger`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /usage/runtime`
- local Worker smoke for `POST /usage/quota/plan`

Observed runtime fields:

```json
{
  "quota_runtime": {
    "live_ledger_reads": false,
    "persistent_writes": false,
    "request_id_visible": true,
    "status": "usage_quota_display_scaffold"
  },
  "quota_plan": {
    "credits_pending": 10,
    "credits_remaining": 9750,
    "credits_used": 240,
    "live_ledger_reads": false,
    "sql_emitted": false,
    "status": "planned_no_write"
  }
}
```

## Residual Gaps

- Live usage ledger reads are absent.
- Persistent usage writes remain absent.
- Billing reconciliation and invoice traceability are absent.
- Frontend quota display UI is absent by delegation.
