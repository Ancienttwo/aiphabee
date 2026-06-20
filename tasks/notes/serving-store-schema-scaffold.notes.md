# Notes: serving-store-schema-scaffold

> **Last Updated**: 2026-06-20 17:10 +08
> **Plan**: `plans/plan-serving-store-schema-scaffold.md`
> **Runtime Evidence**: `docs/governance/serving-store-schema-scaffold.md`

## Decisions

- Added empty Serving Store projection schemas only. No market data, partner
  rows, database URLs, credentials, or live resource identifiers are committed.
- Kept serving snapshots versioned by `data_version`, `rights_policy_version`,
  and `methodology_version` so later Gateway cache keys can bind to exact data
  and policy state.
- Kept snapshot `release_state` defaulting to `held` and quality state defaulting
  to `HOLD` so severe anomalies cannot be mistaken for released Serving data.
- Added `/data/runtime` and `/gateway/runtime` capability fields, not live
  reads.
- Added a later read planner capability that targets the schema shape, but
  still emits no SQL and reads no live records.

## Verification

- Passed: `npm run check:database`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /data/runtime`
- Passed: Wrangler smoke for `GET /gateway/runtime`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Partner-approved data loading is absent.
- Gateway creates blocked/held Serving read plans, but does not read Serving
  Store records.
- Field entitlement live DB policy source is not wired.
- Usage ledger live writes and billing reconciliation are not wired.
