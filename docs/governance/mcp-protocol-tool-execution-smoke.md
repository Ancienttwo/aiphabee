# MCP Protocol Tool Execution Smoke

> **Status**: Verified local contract
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/mcp-protocol-tool-execution-smoke.contract.md`

This slice proves a guarded MCP `tools/call` request can execute a registered
Worker tool route through `POST /mcp` without changing the public default-deny
posture.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Worker MCP route | `apps/worker/src/index.ts` `POST /mcp` | Owns protocol envelope and smoke-token gate |
| Tool route map | `MCP_TOOL_EXECUTION_ROUTE_MAP` | Maps registered MCP tool names to existing Worker routes |
| MCP runtime planner | `@aiphabee/mcp-runtime` `createMcpProtocolPlan()` | Owns origin, rights, scope, revocation, schema, and usage planning |
| Smoke contract | `deploy/mcp/protocol-tool-execution-smoke.contract.json` | Owns no-secret, no-frontend, no-DB/partner claims |
| Focused test | `apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts` | Owns public deny, success, missing scope, and revoked credential probes |
| Readiness ledger | `deploy/governance/sprint1-tool-route-replay-readiness.contract.json` | Consumes this smoke as a validated Sprint 1.2 surface |

## P2 Concrete Trace

1. A trusted-origin `POST /mcp` `tools/call` request arrives.
2. The route checks `AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN` against the
   request `Authorization` header.
3. Without the token, the route passes no scopes and no redistribution-rights
   confirmation into `createMcpProtocolPlan()`, preserving `DATA_NOT_LICENSED`.
4. With the token, rights, and required scope, the runtime planner still runs
   origin, credential revocation, tool registration, input schema, and scope
   checks before execution.
5. The smoke path calls `app.request()` against the mapped Worker tool route,
   currently `/tools/get-quote-snapshot`, with a derived request id.
6. The MCP response marks `live_tool_execution=true` only for the smoke response
   and embeds the Worker route result under `tool_result`.

## P3 Design Decision

Selected an explicit smoke-token gate instead of accepting rights/scopes from
public request params directly.

The invariant is that public `POST /mcp` requests remain default-denied unless a
repo-local smoke binding is present and the caller presents the matching bearer
token. At 10x scale, the first likely failure is route-map drift between MCP
tool names and Worker route handlers, so the contract checker scans the Worker
source, test source, package script wiring, and readiness ledger together.

This does not claim live OAuth provider readiness, SDK/Inspector client smoke,
target-client e2e, partner source rows, or live DB writes.

## Verification

- `npm run test -- apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts`
- `npm run check:mcp-protocol-tool-execution-smoke`
- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay-readiness-fixtures`
