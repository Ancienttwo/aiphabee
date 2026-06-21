# Partner Reconciliation Report Scaffold Notes

## Summary

Implemented the Sprint 3.2 US-O06 / DAT-10 backend scaffold for partner
reconciliation report planning.

## Current State

- `@aiphabee/usage-ledger` exposes partner reconciliation report capabilities.
- `GET /usage/runtime` includes nested `partner_reconciliation_report`
  readiness.
- `POST /usage/partner-reconciliation/plan` returns deterministic no-write
  report plans grouped by dataset, channel, package code, and user ID.
- Planned report lines aggregate usage count, credits, metered rows, request
  IDs, usage event IDs, delay, missing rows, errors, and backfills.
- `core.partner_reconciliation_report`,
  `core.partner_reconciliation_report_line`,
  `audit.partner_reconciliation_event`, and
  `governance.partner_reconciliation_contract` exist as empty schema scaffolds.
- The local contract checker verifies dimensions, SLA fields, trace fields,
  sensitive-payload exclusions, no live reads, no writes, no SQL, no billing
  calls, and database contract linkage.

## Non-Goals

- No live usage-ledger reads.
- No persisted report or report-line writes.
- No generated artifact writes.
- No partner portal delivery or settlement approval workflow.
- No final partner commercial settlement calculation.
- No frontend operations UI.

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

- `npm run check` passes through the new partner reconciliation contract and
  fails only at the existing `@aiphabee/web` Vite build on Node `v22.12.0`
  because `node:module.registerHooks` is unavailable.
