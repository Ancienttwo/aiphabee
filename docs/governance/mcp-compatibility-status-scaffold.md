# MCP Compatibility Status Scaffold

> **Plan**: `plans/plan-mcp-compatibility-status-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-compatibility-status-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/compatibility.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns compatibility target metadata and no-live status plan |
| `GET /mcp/runtime` | Reports compatibility status readiness and route |
| `GET /mcp/compatibility/status` | Provides status-page source data for protocol/client compatibility |
| `POST /mcp` | Existing protocol route covered by the compatibility test vectors |
| `deploy/mcp/compatibility.contract.json` | Guards MCP-12 protocol/client/status-page contract |

Official references checked on 2026-06-21:

- MCP Inspector docs: `https://modelcontextprotocol.io/docs/tools/inspector`
- MCP 2025-03-26 Streamable HTTP transport:
  `https://modelcontextprotocol.io/specification/2025-03-26/basic/transports`
- MCP TypeScript SDK repository:
  `https://github.com/modelcontextprotocol/typescript-sdk`

Out of scope:

- `apps/web`
- live official SDK/Inspector execution
- live target-client e2e
- public status page rendering
- live OAuth/API key auth middleware
- live MCP tool execution

## P2: Concrete Trace

1. A caller requests `GET /mcp/compatibility/status`.
2. Worker calls `createMcpCompatibilityStatusPlan()`.
3. Runtime returns target protocol version, monitored protocol versions,
   Inspector/SDK targets, target clients, test vectors, release gates, and
   no-live status-page metadata.
4. Worker wraps the plan in the standard response envelope with provenance and
   zero usage.
5. The contract checker validates the same fields from
   `deploy/mcp/compatibility.contract.json`.

## P3: Decision Rationale

MCP-12 needs a compatibility surface before a real live Remote MCP endpoint can
be certified. The repository currently has default-deny/no-live protocol
planning, not live auth or live tool execution, so the correct slice is a
versioned status and test-vector contract rather than a false e2e pass.

Tradeoff:

- The target protocol remains `2025-03-26` because the current implementation
  returns that protocol version.
- `2025-11-25` is tracked as a monitored protocol version for later migration
  assessment.
- TypeScript SDK v1.x is the production smoke target while SDK v2 remains
  pre-alpha and excluded from release gating.

## Verification

Passed:

- `npm run check:mcp-compatibility`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- Official Inspector/SDK live smoke is not run.
- Target-client e2e is not run.
- Public status page rendering is not implemented.
