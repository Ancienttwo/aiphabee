# Partner Reconciliation Report Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 21:20 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/partner-reconciliation-report-scaffold.contract.md`

This slice completes the backend-only Sprint 3.2 US-O06 / DAT-10 scaffold for
partner reconciliation reports. It lets finance and operations plan an export
grouped by dataset, channel, package, user, and usage amount without enabling
live ledger reads, partner portal reads, persistent writes, billing-provider
calls, SQL execution, or frontend screens.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/usage-ledger` | Owns usage event, quota, billing reconciliation, and partner reconciliation report planning |
| Runtime route | `GET /usage/runtime` | Reports nested `partner_reconciliation_report` readiness |
| Planner route | `POST /usage/partner-reconciliation/plan` | Normalizes usage rows and returns a standard no-write export plan |
| Contract | `deploy/usage/partner-reconciliation-report.contract.json` | Guards group-by dimensions, SLA fields, trace fields, no live reads, no writes, no SQL, no frontend, and no sensitive payloads |
| Schema scaffold | `core.partner_reconciliation_report`, `core.partner_reconciliation_report_line`, `audit.partner_reconciliation_event`, `governance.partner_reconciliation_contract` | Empty tables for future persisted report/export/audit flows |
| Existing ledger schema | `core.usage_event`, `core.usage_ledger_entry` | Future source of usage truth; this scaffold accepts bounded snapshots instead of reading live rows |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /usage/partner-reconciliation/plan` with partner,
   workspace, period, cadence, format, and `usage_rows`.
2. Worker accepts snake/camel request fields and normalizes each usage row into
   dataset, channel, package code, user ID, request ID, usage event ID, usage
   amount, credits, metered rows, and SLA counters.
3. `createPartnerReconciliationReportPlan()` groups rows by dataset, channel,
   package code, and user ID.
4. The planner sums usage count, credits, metered rows, missing rows, errors,
   and backfills, preserving request IDs and usage event IDs for traceability.
5. Worker wraps the report plan in the standard success envelope with zero
   credits and one usage row per planned report line.

## P3 Design Decision

Selected a no-write report planner under `@aiphabee/usage-ledger` instead of
adding a separate partner-finance service or extending subscription invoice
reconciliation.

Reason:

- US-O06 requires finance/operations reconciliation by dataset, channel,
  package, user, and usage amount.
- DAT-10 adds partner SLA dimensions: delay, missing rows, errors, and
  backfills in daily/weekly reports.
- Subscription invoice reconciliation is account billing specific and does not
  own partner settlement dimensions.
- The repo does not yet have live usage-ledger reads or live export writes.

Tradeoff:

- Partner report shape, grouping, SLA counters, traceability, and schema
  ownership are now stable and testable.
- Actual live ledger extraction, artifact generation, partner portal delivery,
  and final settlement math remain future slices.

## Verification

Passed:

- `npm run check:partner-reconciliation-report`
- `npm run check:database`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/usage-ledger`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`
- `git diff --name-only -- apps/web`

Known root check caveat:

- `npm run check` passes through all contract checks, including
  `check:partner-reconciliation-report`, then fails at the existing
  `@aiphabee/web` Vite build because Node `v22.12.0` does not expose
  `node:module.registerHooks` required by `@cloudflare/vite-plugin`.

Observed runtime fields:

```json
{
  "partner_reconciliation_report": {
    "group_by": ["dataset", "channel", "package_code", "user_id"],
    "live_ledger_reads": false,
    "partner_sla_report": true,
    "persistent_writes": false,
    "route": "POST /usage/partner-reconciliation/plan",
    "status": "partner_reconciliation_report_scaffold"
  }
}
```

## Residual Gaps

- Live usage-ledger reads are absent.
- Export artifact generation and partner portal delivery are absent.
- Final commercial settlement math and partner sign-off workflow are absent.
- Frontend operations UI is absent by delegation.
