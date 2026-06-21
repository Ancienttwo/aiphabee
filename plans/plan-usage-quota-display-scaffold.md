# Usage Quota Display Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 1.4

## Task Breakdown

- [x] Extend `@aiphabee/usage-ledger` with Web Agent/MCP quota display capability.
- [x] Add no-read/no-write quota display planner.
- [x] Add Worker runtime and plan routes.
- [x] Add local contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers backend quota display planning for ACC-04 only. It does not
read a live usage ledger, reconcile billing, write usage rows, or render a
frontend quota UI.

## Verification

Required before closeout:

- `npm run check:usage-quota-display`
- `npm run test -- packages/usage-ledger/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/usage-ledger`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/usage-ledger`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /usage/runtime`
- local Worker smoke for `POST /usage/quota/plan`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
