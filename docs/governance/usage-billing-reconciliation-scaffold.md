# Usage Billing Reconciliation Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 16:01 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-usage-billing-reconciliation-scaffold.md`
> **Task Contract**:
> `tasks/contracts/usage-billing-reconciliation-scaffold.contract.md`

This slice completes the backend-only scaffold for Sprint 2.4 ACC-04 billing
traceability. It makes subscription invoice rows reconcilable to usage ledger
entries and request IDs without enabling live billing provider calls, live
ledger reads, persistent writes, SQL execution, or frontend screens.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/usage-ledger` | Owns usage event planning, quota display planning, and billing reconciliation planning |
| Runtime route | `GET /usage/runtime` | Reports quota display capability plus nested `billing_reconciliation` readiness |
| Planner route | `POST /usage/billing/reconciliation/plan` | Normalizes invoice snapshot + ledger entry rows and returns a standard no-write reconciliation plan |
| Contract | `deploy/usage/billing-reconciliation.contract.json` | Guards trace fields, no frontend, no live reads, no writes, no SQL, and no billing provider calls |
| Schema scaffold | `core.subscription_invoice`, `core.subscription_invoice_line` | Empty invoice/line tables for future billing persistence and request-level traceability |
| Existing ledger schema | `core.usage_event`, `core.usage_ledger_entry`, `core.usage_reconciliation_batch` | Existing usage ledger rows remain the future source of billable usage truth |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /usage/billing/reconciliation/plan` with
   `workspace_id`, `subscription_id`, `invoice_id`, billing period, invoice
   credits, and `ledger_entries`.
2. Worker accepts snake/camel request fields and filters ledger entries to rows
   that include `request_id`, `usage_event_id`, and `ledger_entry_id`.
3. `createUsageBillingReconciliationPlan()` sums ledger credits, compares them
   to invoice credits, and emits `matched` or `mismatch`.
4. The planner maps each ledger entry to a deterministic `invoice_line_id` and
   preserves the request ID required for support investigation.
5. Worker wraps the plan in the shared standard success envelope with zero
   credits and one usage row per planned invoice line.

## P3 Design Decision

Selected a no-write reconciliation planner plus empty invoice schema scaffold
instead of integrating Stripe, reading live ledger rows, or writing invoice
records.

Reason:

- ACC-04 and PRD §19.5 require subscription bills to match usage ledger rows and
  remain traceable to the originating request.
- The repo already has usage event and ledger-entry scaffolds, but no live
  billing provider or ledger reader.
- Frontend work is explicitly delegated to Claude.

Tradeoff:

- Billing traceability semantics and schema are now stable and testable.
- Real invoice sync, payment state, ledger reads, and persisted reconciliation
  remain blocked until live billing and ledger execution are authorized.

## Verification

Passed:

- `npm run check:usage-billing-reconciliation`
- `npm run check:database`
- `npm run test -- packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/usage-ledger`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint && npm run typecheck && npm run test && npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`
- `git diff --name-only -- apps/web`

Observed runtime fields:

```json
{
  "billing_reconciliation": {
    "billing_provider_calls": false,
    "live_ledger_reads": false,
    "persistent_writes": false,
    "route": "POST /usage/billing/reconciliation/plan",
    "status": "usage_billing_reconciliation_scaffold"
  },
  "billing_reconciliation_plan": {
    "consistency": "matched",
    "request_id_visible": true,
    "sql_emitted": false,
    "traceable_to_call": true
  }
}
```

## Residual Gaps

- Live billing provider synchronization is absent.
- Live usage ledger reads and reconciliation writes are absent.
- Invoice payment state, refunds, overage rules, and provider dispute handling
  are absent.
- Frontend billing and support investigation UI is absent by delegation.
