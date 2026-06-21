# Usage Billing Reconciliation Scaffold Notes

## Summary

Implemented the Sprint 2.4 ACC-04 backend scaffold for subscription bill to
usage-ledger reconciliation and request-level traceability.

## Current State

- `@aiphabee/usage-ledger` exposes usage billing reconciliation capabilities.
- `GET /usage/runtime` includes nested `billing_reconciliation` readiness.
- `POST /usage/billing/reconciliation/plan` returns deterministic no-write
  reconciliation plans with invoice fields, invoice line fields, consistency
  status, and request-ID traceability.
- `core.subscription_invoice` and `core.subscription_invoice_line` exist as
  empty schema scaffolds for future persistence.
- The local contract checker verifies trace fields, no live ledger reads, no
  billing provider calls, no writes, no SQL, and database contract linkage.

## Non-Goals

- No live billing provider integration.
- No live usage ledger reads.
- No invoice or invoice-line writes.
- No payment, refund, dispute, or overage handling.
- No frontend billing UI.

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
