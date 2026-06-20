# Internal Account Session Manual Plan Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 1.4

## Task Breakdown

- [x] Add a backend-only account runtime package for ACC-01.
- [x] Add runtime capability and no-write planning routes.
- [x] Add a local contract checker and wire it into root `check`.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers internal account/session/device/manual-plan scaffolding only.
It does not add frontend screens, issue session cookies, call a live identity
provider, write account rows, or integrate billing.

## Verification

Required before closeout:

- `npm run check:account-runtime`
- `npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/account-runtime`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /account/runtime`
- local Worker smoke for `POST /account/session/plan`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
