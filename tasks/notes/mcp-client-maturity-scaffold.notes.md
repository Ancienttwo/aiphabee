# MCP Client Maturity Scaffold Notes

Date: 2026-06-22

## Decision

Implement PRD §18.5 MCP resources/prompts or interactive Apps as a maturity
assessment planner, not as live MCP protocol support.

## Why

The repo already has a Phase 3 target-client and Developer Console release gate.
Phase 4 asks for an evaluation of resources, prompts, or interactive MCP Apps
based on client maturity. The smallest coherent backend slice is therefore a
capability matrix that keeps all new surfaces behind live client evidence and
security review.

## Boundary

`planned_no_live_mcp_client_maturity` means AiphaBee has a local assessment
contract for target clients and candidate features. It does not mean that
`resources/list`, `resources/read`, `prompts/list`, `prompts/get`, embedded
resources, Apps SDK widgets, or interactive Apps are available in production.

Tools-only remains the fallback mode for every target client.

## Verification Surface

- `deploy/mcp/client-maturity.contract.json`
- `scripts/check-mcp-client-maturity-contract.mjs`
- `packages/mcp-runtime/src/index.test.ts`
- `apps/worker/src/index.test.ts`
- `npm run check:mcp-client-maturity`
