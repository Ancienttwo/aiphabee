# Screen Securities Scaffold

> Status: Implemented locally
> Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Sprint: 2.1

## Task Breakdown

- [x] Extend `@aiphabee/analytics-tools` with `screenSecurities()`.
- [x] Add deterministic natural-language parser for editable structured conditions.
- [x] Reuse `compareSecurities()` as the synthetic preview universe evaluator.
- [x] Add Worker screen route.
- [x] Add contract checker and root check wiring.
- [x] Add package and Worker tests.
- [x] Update tracker and deferred-goal ledger.

## Scope

This slice covers Sprint 2.1 ANA-03, ANA-04, and US-W05 backend scaffold:
natural-language-to-structured filter planning, visible missing-value rules,
preview hits, why-matched explanations, rejected-row reasons, and explainable
ranking. It does not implement frontend UI, broad NLP, live execution, MCP
registration, high-cost queueing, return/risk calculations, or ratio percentiles.

## Verification

Required before closeout:

- `npm run check:screen-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /analytics/screen-securities`
- `git diff --check`
- `scripts/check-task-workflow.sh --strict`
