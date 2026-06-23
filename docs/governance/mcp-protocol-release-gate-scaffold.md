# MCP Protocol Release Gate Scaffold

> **Task Contract**: `tasks/contracts/mcp-protocol-release-gate-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/protocol-release-gate.contract.json`
> **Checker**: `npm run check:mcp-protocol-release-gate`

## P1: Architecture Map

| Surface | Owner | Role |
|---|---|---|
| `@aiphabee/mcp-runtime` | Platform Engineering | Owns `/mcp` protocol planning, Origin validation, auth/revocation gates, schema validation, compatibility metadata |
| `POST /mcp` | Worker MCP endpoint | Existing Streamable HTTP protocol plan route |
| `GET /mcp/runtime` | Worker runtime surface | Publishes protocol release gate capability, route, version, and required checks |
| `GET /mcp/compatibility/status` | MCP compatibility surface | Supplies local compatibility vectors and target protocol metadata |
| `POST /mcp/release-gates/protocol/plan` | Release gate route | Combines existing MCP plans into Sprint 3.3 protocol validation evidence |
| `aiphabee_core.mcp_protocol_release_gate`, `aiphabee_governance.mcp_protocol_release_gate_contract` | Future persistence | Empty no-live schema scaffolds for release-gate evidence |

Out of scope for this slice:

- live OAuth provider and token storage
- live auth middleware
- live MCP tool execution
- external Inspector / SDK smoke execution
- target-client end-to-end tests
- Developer Console accounting UI

## P2: Concrete Trace

1. A caller posts to `POST /mcp/release-gates/protocol/plan`.
2. Worker calls `createMcpProtocolReleaseGatePlan()`.
3. The plan composes existing MCP primitives:
   - `initialize` proves Streamable HTTP and target protocol metadata.
   - an untrusted Origin probe proves Origin denial maps to `ORIGIN_NOT_ALLOWED`.
   - a revoked OAuth credential probe proves auth/revocation is enforced before `tools/call` execution.
   - default-deny `tools/list` and `tools/call` probes prove MCP redistribution rights stay closed until confirmed.
   - a valid `get_quote_snapshot` `tools/call` proves input schema validation and output schema metadata.
   - compatibility status vectors prove local contract coverage for Streamable HTTP, initialize, schema validation, and text fallback.
4. The route returns a standard success envelope with `release_checks`, `validation`, and explicit `release_gate.blockers`.

## P3: Decision Rationale

The release gate is deliberately a composition layer instead of a new MCP protocol implementation. The invariant is that `/mcp`, Tool Registry schema, revocation enforcement, and compatibility metadata remain the source of truth. This avoids duplicating protocol behavior while giving Sprint 3.3 a single auditable gate.

The tradeoff is that this slice can only claim local contract readiness. At 10x scale, the first failure point is live credential/session enforcement and target-client differences, not the local planner. Those remain blockers until live OAuth middleware and external client smoke are implemented.

## Verification

- `npm run check:mcp-protocol-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`

