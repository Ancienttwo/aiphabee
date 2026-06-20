# Notes: corporate-action-adjustment-scaffold

> **Last Updated**: 2026-06-20 16:14 +08
> **Plan**: `plans/plan-corporate-action-adjustment-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/corporate-action-adjustment-scaffold.md`

## Decisions

- Added empty corporate action, adjustment methodology, and adjustment factor
  schemas only. No market data, partner samples, IDs, URLs, or credentials are
  committed.
- Kept corporate actions evidence-bound through `source_record_id`,
  `data_version`, and `methodology_version`.
- Modeled adjustment outputs as method-versioned factors with closed-open
  intervals and explicit forward/backward direction.
- Added `/data/runtime` capability fields, not a live database query.

## Verification

- Passed: `npm run check:database`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /data/runtime`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Hyperdrive and Supabase live database are not provisioned.
- Partner corporate-action source samples and price bars are absent.
- Adjustment computation and golden parity are not live.
- Serving Gateway and usage ledger remain unwired.
