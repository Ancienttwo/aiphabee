# Subscription Lifecycle Audit Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.4

## Task Breakdown

- [x] Extend `@aiphabee/account-runtime` with subscription lifecycle audit capability.
- [x] Add no-write subscription lifecycle planner.
- [x] Add Worker runtime capability and planner route.
- [x] Add audit event schema scaffold and local contract checker.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers ACC-03 backend subscription lifecycle audit planning only. It
does not call a billing provider, write subscription rows, write audit events,
preview invoices or refunds, or render frontend billing UI.

## Verification

Required before closeout:

- `npm run check:subscription-lifecycle`
- `npm run check:database`
- `npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/account-runtime`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /account/runtime`
- local Worker smoke for `POST /account/subscription/lifecycle/plan`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
