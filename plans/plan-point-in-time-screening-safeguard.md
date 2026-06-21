# Point-in-Time Screening Safeguard

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.1

## Task Breakdown

- [x] Extend `screenSecurities()` input with `classificationAsOf`.
- [x] Add point-in-time guard metadata to all screen results.
- [x] Block historical screens when `classificationAsOf` is after `asOf`.
- [x] Add Worker request mapping for `classification_as_of`.
- [x] Extend screen contract and checker for SEC-05 guard behavior.
- [x] Add package and Worker tests.
- [x] Update tracker, traceability ledger, and deferred-goal ledger.

## Scope

This slice covers the Sprint 2.1 backend guard that prevents historical
screening from using future classification metadata. It does not implement live
historical constituents, live historical industry mappings, historical security
names, frontend UI, MCP registration, or broad live screens.

## Verification

Required before closeout:

- `npm run check:screen-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for normal and blocked `POST /analytics/screen-securities`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
