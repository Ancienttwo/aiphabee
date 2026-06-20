# Notes: financial-facts-restatement-scaffold

> **Last Updated**: 2026-06-20 16:08 +08
> **Plan**: `plans/plan-financial-facts-restatement-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/financial-facts-restatement-scaffold.md`

## Decisions

- Added empty financial statement, fact, and restatement schemas only. No market
  data, partner samples, IDs, URLs, or credentials are committed.
- Kept every financial fact evidence-bound through `source_record_id`,
  `data_version`, and `methodology_version`.
- Kept restatements as explicit links between original and restated statement
  versions instead of overwriting older disclosures.
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
- Partner-signed statement taxonomy and field contract are absent.
- Corporate actions are not modeled yet.
- Serving Gateway and usage ledger remain unwired.
