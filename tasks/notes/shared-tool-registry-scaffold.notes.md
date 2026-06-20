# Notes: shared-tool-registry-scaffold

> **Last Updated**: 2026-06-21 01:05 +08
> **Plan**: `plans/plan-shared-tool-registry-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/shared-tool-registry-scaffold.md`

## Decisions

- Added `@aiphabee/tool-registry` as the shared metadata source for planned
  read-only tools.
- Registered 9 Sprint 1.2 tool names:
  `resolve_security`, `get_security_profile`, `get_market_calendar`,
  `get_quote_snapshot`, `get_price_history`, `get_corporate_actions`,
  `get_financial_facts`, `get_data_lineage`, and `get_entitlements`.
- Required each entry to carry version, schema IDs, permission scope,
  rights-aware metadata, execution posture, and required golden fixture path.
- Kept every handler disabled with no live data access and no arbitrary SQL/URL.
- Migrated agent runtime registered tool policy to the shared registry.
- Added Worker `/tools/runtime` and `npm run check:tool-registry`.
- Added later `resolve_security` and `get_security_profile` tool scaffolds and
  marked both as handler-ready registry entries.

## Verification

- Passed: `npm run test -- packages/tool-registry/src/index.test.ts packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check:tool-registry`
- Passed: `npm run typecheck`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `/tools/runtime`.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- `resolve_security` and `get_security_profile` have no-live synthetic handlers.
- Other individual tool handlers are absent.
- MCP/API endpoints are absent.
- Tool JSON Schema bodies and golden fixtures are not implemented.
- Evidence/Lineage service is absent.
- Live Serving reads and partner market data rows are absent.
