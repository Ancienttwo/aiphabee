# Partner SLA Reconciliation Readiness Notes

## Decision

DAT-10 stays in `@aiphabee/usage-ledger` because the requirement is about partner-facing usage accounting, SLA counters, and reconciliation output. The readiness gate aggregates existing report and support-gate plans instead of adding a new persistence model.

## Trace

`GET /usage/partner-sla/reconciliation-readiness` calls `createPartnerSlaReconciliationReadinessReport()`. The report builds daily and weekly partner reconciliation plans from four deterministic usage rows, checks delay/missing/error/backfill SLA counters, verifies request_id and usage_event_id traceability, then composes the partner support release gate for metadata-only request_id investigation.

## No-Live Boundary

The gate returns readiness evidence only. It keeps live ledger reads, partner artifact writes, partner portal delivery, support log reads, SQL emission, billing provider calls, frontend UI, and persistent writes disabled.

## Verification Entry Points

- `npm run check:partner-sla-reconciliation-readiness`
- `npm run check:partner-reconciliation-report`
- `npm run check:partner-support-release-gate`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
