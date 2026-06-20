# Notes: data-access-gateway-default-deny-scaffold

> **Last Updated**: 2026-06-20 17:56 +08
> **Plan**: `plans/plan-data-access-gateway-default-deny-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/data-access-gateway-default-deny-scaffold.md`

## Decisions

- Preserved Gate 0 default-deny: all real channels start denied.
- Used synthetic approved policy only inside package tests to prove field
  redaction logic without implying market-data rights.
- Kept Worker `/gateway/access-check` default-deny for market-style fields.
- Returned `DATA_QUALITY_HOLD` before rights serving when quality state is held.
- Added `servingRead` planning to Gateway decisions, but kept blocked and held
  plans at `liveRead=false`, `servedRows=0`, and `sqlEmitted=false`.
- Added a later `serving_quality_release_isolation` runtime guard, but live
  Serving reads and writes remain disabled.
- Added a later entitlement row policy-source compiler, but live DB reads and
  partner rights matrix ingestion remain disabled.
- Added a later `usage_event_writer_scaffold` runtime guard, but persistent
  usage writes and billing reconciliation remain disabled.
- Added a later `serving_query_planner_scaffold` runtime guard and
  `servingQuery` decision, but live Serving SQL remains disabled.
- Added a later `serving_sql_descriptor_scaffold` runtime guard and
  `servingSqlDescriptor` decision, but SQL text and execution remain disabled.
- Added usage preview but not persistent ledger writes.

## Verification

- Passed: `npm run check:data-gateway`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/gateway/runtime`.
- Passed: Wrangler smoke for `/gateway/access-check` default deny.
- Passed: Wrangler smoke for `/gateway/access-check` quality hold.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Serving Store schema, read planner, quality release isolation planner, query
  planner, and SQL descriptor exist, but SQL text, live execution, live reads,
  and live writes are absent.
- Partner-signed field rights matrix is absent.
- Account/workspace/plan and usage ledger schemas now exist, and entitlement
  enforcement has synthetic coverage, but live DB policy source, persistent
  usage writes, and billing reconciliation are absent.
- No MCP/API redistribution endpoint is enabled.
