# MCP Endpoint Default-Deny Scaffold

> **Plan**: `plans/plan-mcp-endpoint-default-deny-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-endpoint-default-deny-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/endpoint.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns MCP method, Origin, and rights-gate planning |
| `GET /mcp/runtime` | Reports default-deny runtime capability |
| `POST /mcp` | Accepts planned `initialize`, `tools/list`, and `tools/call` methods |
| `@aiphabee/tool-registry` | Source of registered tool names, scopes, and schema IDs |
| `deploy/mcp/endpoint.contract.json` | Guards MCP-01 scaffold and Gate 0 default-deny posture |

Out of scope:

- `apps/web`
- OAuth provider implementation
- API key issuance and rotation
- live MCP tool execution
- Developer Console
- external SDK/Inspector smoke

## P2: Concrete Trace

1. A client calls `POST /mcp` with a method such as `initialize`.
2. Worker reads the HTTP `Origin` header and passes it to
   `createMcpProtocolPlan`.
3. The Worker sets `mcpRedistributionRightsConfirmed=false` from server-side
   policy; client input cannot open the rights gate.
4. `@aiphabee/mcp-runtime` validates method and Origin.
5. If Origin is trusted, `initialize` returns a no-live-execution protocol
   shape.
6. `tools/list` returns an empty list while MCP/API redistribution rights are
   unconfirmed.
7. `tools/call` returns a standard `DATA_NOT_LICENSED` error while the rights
   gate is closed.

## P3: Decision Rationale

Why default-deny first:

- PRD Gate 0 says Web display rights do not imply MCP/API machine-readable
  redistribution rights.
- Sprint 2.3 is explicitly blocked if MCP redistribution rights are not
  confirmed.
- Building the endpoint scaffold behind a closed gate lets the repo lock
  protocol method names, Origin validation, and standard error behavior without
  illegally exposing tool data.

Tradeoff:

- The backend now has a concrete `/mcp` surface for protocol planning.
- It cannot claim a live Remote MCP product until OAuth, scopes, API keys,
  limits, and client compatibility tests land.

## Verification

Passed:

- `npm run check:mcp-endpoint`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- OAuth + PKCE remains absent.
- API key hash/rotation/IP-limit flow remains absent.
- Live `tools/call` execution remains blocked.
- Developer Console remains absent.
- External MCP Inspector/SDK compatibility smoke remains absent.
