# MCP Protocol Release Gate Scaffold Contract

This slice covers Sprint 3.3 MCP §19.3:

- Streamable HTTP, Origin, and auth checks
- input/output Schema compatibility checks

## Required Surfaces

- `@aiphabee/mcp-runtime` exposes `mcp_protocol_release_gate`
- `GET /mcp/runtime` includes:
  - `mcp_protocol_release_gate_ready`
  - `mcp_protocol_release_gate_route`
  - `mcp_protocol_release_gate_version`
  - `mcp_protocol_release_gate_required_checks`
- Worker exposes `POST /mcp/release-gates/protocol/plan`
- Local contract: `deploy/mcp/protocol-release-gate.contract.json`
- Checker: `npm run check:mcp-protocol-release-gate`
- Empty schema scaffolds:
  - `aiphabee_core.mcp_protocol_release_gate`
  - `aiphabee_governance.mcp_protocol_release_gate_contract`

## Required Checks

- `streamable_http_initialize_contract`
- `origin_required_and_allowed`
- `auth_enforced_before_tool_execution`
- `tools_list_default_deny_until_rights_confirmed`
- `tools_call_input_schema_validation`
- `tools_call_output_schema_contract`
- `compatibility_vectors_present`

## Explicit Non-Claims

- No live OAuth provider.
- No live auth middleware.
- No live tool execution.
- No live DB writes.
- No external Inspector / SDK smoke run.
- No target-client e2e.
- No Developer Console accounting UI.

