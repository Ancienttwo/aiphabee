# Usage Billing Reconciliation Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.4

## Task Breakdown

- [x] Extend `@aiphabee/usage-ledger` with billing reconciliation capability.
- [x] Add no-read/no-write billing reconciliation planner.
- [x] Add Worker runtime capability and planner route.
- [x] Add invoice and invoice-line schema scaffold.
- [x] Add local contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers ACC-04 backend billing-to-usage-ledger traceability planning
only. It does not call a billing provider, read live ledger rows, write invoice
rows, perform payment collection, calculate refunds, or render frontend billing
UI.

## Verification

Required before closeout:

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
