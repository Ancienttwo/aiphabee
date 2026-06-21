# Partner Support Release Gate Scaffold Notes

## Decision

The gate lives in `@aiphabee/usage-ledger` because partner reconciliation and partner settlement are usage-ledger concerns. It imports `@aiphabee/support-ops` one-way to reuse the existing request_id investigation planner.

## Trace

`POST /usage/release-gates/partner-support/plan` creates a synthetic partner reconciliation report with a target `request_id`, then creates a support investigation plan for the same `request_id`. The output exposes `ops_drill.request_ids_available` and `ops_drill.usage_event_ids_available` so support can verify the join without seeing sensitive payloads.

## No-Live Boundary

The scaffold keeps live ledger reads, live support log reads, partner report artifact writes, partner portal delivery, billing provider reads, SQL emission, and persistent writes disabled. It is a release-gate contract, not a production settlement job.

## Verification Entry Points

- `npm run check:partner-support-release-gate`
- `npm run check:database`
- `npm run check:secrets`
- `npx vitest run packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
