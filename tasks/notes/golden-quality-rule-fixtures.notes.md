# Notes: golden-quality-rule-fixtures

> **Last Updated**: 2026-06-20 15:45 +08
> **Plan**: `plans/plan-golden-quality-rule-fixtures.md`
> **Runtime Evidence**: `docs/governance/golden-quality-rule-fixtures.md`

## Decisions

- Used synthetic fixtures rather than partner data, so no market-data licensing
  or source authenticity is implied.
- Made `npm run test:golden` strict now that a manifest exists.
- Kept the evaluator dependency-free and deterministic.
- Required held samples to assert `DATA_QUALITY_HOLD`.
- Kept production sample volume and commercial sign-off outside this slice.

## Verification

- Passed: `npm run test:golden`
- Passed: `npm run check`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Partner-approved source sample corpus is absent.
- Serving Store quarantine / Data Access Gateway runtime hold behavior is not
  implemented.
- Package, credits, and unit-economics assumptions are not cost-reviewed with
  real partner, model, and Cloudflare costs.
