# Shared Tool Registry Scaffold

> **Status**: Verified shared registry scaffold
> **Last Updated**: 2026-06-21 01:25 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-shared-tool-registry-scaffold.md`
> **Task Contract**:
> `tasks/contracts/shared-tool-registry-scaffold.contract.md`

This slice creates a shared Tool Registry metadata source for Sprint 1.2.
Later `resolve_security`, `get_security_profile`, `get_market_calendar`, and
`get_quote_snapshot` scaffolds now mark four tool handlers as available for
synthetic no-live lookup. MCP/API endpoints, live Serving reads, partner row
access, and frontend surfaces remain absent.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Tool registry package | `packages/tool-registry` | Owns tool names, versions, permissions, schema IDs, execution posture, and fixture requirements |
| Agent runtime | `packages/agent-runtime` | Reads registered tool policy from shared registry |
| Worker runtime route | `GET /tools/runtime` | Reports registry capability and disabled execution |
| Registry contract | `deploy/tools/registry.contract.json` | Requires 9 planned tools and no arbitrary SQL/URL |
| Contract checker | `scripts/check-tool-registry-contract.mjs` | Validates registry contract and no secret-like values |
| Tool handlers | Four no-live scaffolds | `resolve_security`, `get_security_profile`, `get_market_calendar`, and `get_quote_snapshot` have synthetic handlers; other handlers and live data access remain absent |

## P2 Concrete Trace

Registry capability trace:

1. Client calls `GET /tools/runtime`.
2. Worker calls `getToolRegistryCapabilities()`.
3. Registry returns 9 read-only tool entries with schema, permission,
   execution, and testing metadata.
4. The capability reports `schema_ready=true`, `rights_aware=true`,
   `standard_response_envelope=true`, `execution_ready=false`,
   `handler_ready_tool_count=4`, `allow_arbitrary_sql=false`, and
   `allow_arbitrary_url=false`.

Agent policy trace:

1. `POST /agent/runs/dry-run` receives requested tools.
2. Agent runtime validates tools through the shared registry.
3. Registered tools pass as policy entries.
4. Unregistered tools such as `sql.query` are rejected with `SCOPE_DENIED`.

Contract trace:

1. `npm run check:tool-registry` reads
   `deploy/tools/registry.contract.json`.
2. The checker validates required tool names, routes, channels, metadata
   fields, disabled execution, and no secret-like values.

## P3 Design Decision

Selected a metadata-only registry scaffold before tool execution.

Reason:

- Sprint 1.2 requires shared schema/version/permission/test metadata before
  MCP/API tools can execute consistently.
- Live data access and partner rows are still blocked by Sprint 1.1 residuals.
- A registry allowlist is the smallest boundary that advances AGT-04 without
  enabling arbitrary SQL, arbitrary URL, or unregistered tools.

Tradeoff:

- The system now has a single source of planned tool metadata.
- Most tool handlers, precise JSON Schema bodies, full golden fixtures, and
  Evidence/Lineage integration remain incomplete.

## Verification

Passed:

- `npm run test -- packages/tool-registry/src/index.test.ts packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:tool-registry`
- `npm run typecheck`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /tools/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/tools/runtime` fields:

```json
{
  "status": "shared_tool_registry_scaffold",
  "tool_count": 9,
  "schema_ready": true,
  "rights_aware": true,
  "standard_response_envelope": true,
  "handler_ready_tool_count": 4,
  "execution_ready": false,
  "allow_arbitrary_sql": false,
  "allow_arbitrary_url": false
}
```

## Residual Gaps

- `resolve_security`, `get_security_profile`, `get_market_calendar`, and
  `get_quote_snapshot` have no-live synthetic handlers.
- Other individual tool handlers are absent.
- MCP/API endpoints are absent.
- Tool JSON Schema bodies and golden fixtures are not implemented.
- Evidence/Lineage service is absent.
- Live Serving reads and partner market data rows are absent.
