# Contract: MCP Compatibility Status Scaffold

## Scope

This slice covers Sprint 2.3 MCP-12 backend/governance compatibility status for
Remote MCP.

It must:

- expose a status route for MCP compatibility and status-page source data;
- report the target protocol version and monitored protocol versions;
- identify official Inspector and TypeScript SDK targets;
- define target-client e2e smoke targets;
- define test vectors for Streamable HTTP, initialize, tools/list, tools/call
  schema validation, structured content/text fallback, OAuth, API keys,
  pagination, standard errors, usage/request_id, and `as_of`/delay/source
  display;
- keep live Inspector/SDK/client smoke and public status page rendering disabled.

## Ownership

- MCP package: `@aiphabee/mcp-runtime`
- Runtime route: `GET /mcp/runtime`
- Status route: `GET /mcp/compatibility/status`
- Contract: `deploy/mcp/compatibility.contract.json`
- Checker: `npm run check:mcp-compatibility`

## Acceptance

- Runtime capabilities include `mcp_compatibility_status_ready`,
  `mcp_compatibility_status_route`, `mcp_compatibility_status_version`,
  `mcp_live_client_e2e_passed`, `mcp_target_protocol_version`, and monitored
  protocol versions.
- `GET /mcp/compatibility/status` returns official Inspector/SDK metadata,
  target clients, test vectors, release gate, and no-live status-page metadata.
- Every target client and test vector explicitly reports `live_* = false` until
  a real external client smoke is run.

## Out Of Scope

Frontend status page, live official SDK/Inspector execution, live target-client
e2e, live OAuth/API key auth middleware, and live MCP tool execution remain
separate slices.
