# Notes: serving-store-schema-scaffold

> **Last Updated**: 2026-06-20 18:05 +08
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
- Added a later quality release isolation capability that maps quality states to
  `held`, `released`, or `withdrawn`, but still writes no live records.
- Added a later query planner capability that plans released snapshot query
  material, but still emits no SQL and reads no live records.
- Added a later SQL descriptor capability that plans statement id and
  parameter bindings, but still emits no SQL text and executes no SQL.
- Added a later SQL text compiler capability that emits fixed SQL text, but
  still executes no SQL.

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
- Gateway creates blocked/held Serving read plans, quality release plans,
  no-SQL query plans, no-execute SQL descriptors, and SQL text plans, but does
  not read or write Serving Store records.
- Field entitlement live DB policy source is not wired.
- Usage ledger live writes and billing reconciliation are not wired.
