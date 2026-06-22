# Notes: mcp-protocol-tool-execution-smoke

## Decision

Added a smoke-token gated MCP protocol execution path for `tools/call` instead
of trusting rights and scopes from public request params.

## Why

Sprint 1.2 already had registered tool routes, schema metadata, runtime schema
serving, golden fixtures, and Worker route replay. The missing local proof was
that the actual MCP protocol route could call a registered tool after the
runtime planner approved origin, rights, scope, credential status, and schema
shape. The smoke binding keeps the public route default-denied while allowing a
deterministic local verifier to exercise the execution path.

## Verification Surface

- `apps/worker/src/index.ts`
- `apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts`
- `deploy/mcp/protocol-tool-execution-smoke.contract.json`
- `scripts/check-mcp-protocol-tool-execution-smoke-contract.mjs`
- `deploy/governance/sprint1-tool-route-replay-readiness.contract.json`
- `npm run test -- apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts`
- `npm run check:mcp-protocol-tool-execution-smoke`
- `npm run check:tool-route-replay-readiness`
- `npm run check:tool-route-replay-readiness-fixtures`

## Deferred

- Evidence record/source-ref insert smoke.
- Partner source-row sample manifest and data-owner signoff.
- SDK/Inspector or target-client e2e.
