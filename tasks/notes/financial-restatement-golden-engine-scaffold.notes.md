# Notes: financial-restatement-golden-engine-scaffold

> **Last Updated**: 2026-06-20 17:02 +08
> **Plan**: `plans/plan-financial-restatement-golden-engine-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/financial-restatement-golden-engine-scaffold.md`

## Decisions

- Added `@aiphabee/financial-facts` instead of embedding restatement logic in
  Worker routes.
- Implemented deterministic version preservation, point-in-time selection,
  restatement deltas, and balance sheet identity validation.
- Kept synthetic golden cases in package tests and capability output. No partner
  statement taxonomy, source rows, database URLs, or credentials are committed.
- Kept `/data/runtime` as capability reporting only; no live Serving read is
  introduced.

## Verification

- Passed: `npm run test -- packages/financial-facts/src/index.test.ts`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /data/runtime`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Partner-signed statement taxonomy and field contract are absent.
- Partner financial source samples are absent.
- Serving Gateway does not read financial facts.
- Financial ratio engine remains future work.
