# MCP Protocol Release Gate Scaffold Notes

## What Changed

- Added `MCP_PROTOCOL_RELEASE_GATE_VERSION`.
- Added `getMcpProtocolReleaseGateCapabilities()`.
- Added `createMcpProtocolReleaseGatePlan()` as a composition layer over existing MCP protocol, revocation, schema, and compatibility planners.
- Added Worker route `POST /mcp/release-gates/protocol/plan`.
- Added `deploy/mcp/protocol-release-gate.contract.json`.
- Added `scripts/check-mcp-protocol-release-gate-contract.mjs`.
- Added empty schema scaffold:
  - `core.mcp_protocol_release_gate`
  - `governance.mcp_protocol_release_gate_contract`

## Validation Boundary

This scaffold proves local contract readiness for Streamable HTTP initialize, Origin allow/deny, auth/revocation pre-execution denial, default-deny rights behavior, `get_quote_snapshot` input schema validation, output schema metadata, and compatibility vectors.

It does not run live OAuth, live auth middleware, live tool execution, Inspector/SDK smoke, target-client e2e, or Developer Console reconciliation.

