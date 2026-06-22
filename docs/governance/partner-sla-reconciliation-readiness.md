# Partner SLA Reconciliation Readiness

## Scope

This readiness gate closes DAT-10 for local backend evidence: partner SLA and reconciliation reports expose daily and weekly delay, missing-row, error, and backfill counters.

The implementation composes two existing no-live usage surfaces:

- `createPartnerReconciliationReportPlan()` for daily and weekly grouped partner reports
- `createPartnerSupportReleaseGatePlan()` for support request_id drill-down and sensitive-payload exclusion

## Runtime Surface

- Runtime readiness: `GET /usage/runtime`
- Readiness route: `GET /usage/partner-sla/reconciliation-readiness`
- Partner report route: `POST /usage/partner-reconciliation/plan`
- Partner support gate route: `POST /usage/release-gates/partner-support/plan`

The readiness response returns daily and weekly report plans, a combined SLA summary, support release-gate evidence, release checks, and explicit live blockers.

## Release Checks

- `daily_report_generated`
- `weekly_report_generated`
- `sla_counters_cover_delay_missing_error_backfill`
- `request_usage_trace_complete`
- `partner_support_release_gate_passed`
- `live_surfaces_blocked`
- `sensitive_payloads_excluded`

## Explicit Non-Claims

This gate does not enable live usage-ledger reads, partner report artifact writes, partner portal delivery, final settlement approval, live support log reads, SQL execution, persistent writes, or frontend UI.

The live release gate remains `blocked_live_partner_sla_reconciliation` until partner data, artifact storage, partner portal delivery, and settlement signoff exist.

## Verification

- `npm run check:partner-sla-reconciliation-readiness`
- `npm run check:partner-reconciliation-report`
- `npm run check:partner-support-release-gate`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
