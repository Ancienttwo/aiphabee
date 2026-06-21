# Contract: MCP Usage Envelope Scaffold

## Scope

This slice covers Sprint 2.3 MCP-07 backend response usage, remaining quota,
request id visibility, and no-live usage reconciliation planning.

It must:

- expose usage envelope capability from `GET /mcp/runtime`;
- include `request_id` and `request_id_visible` in MCP usage summaries;
- include remaining quota fields in MCP usage summaries;
- include `tool_call.usage_envelope` for `tools/call`;
- include a usage ledger event plan for `operation=tool_call`;
- include a quota display snapshot with remaining credits;
- keep live ledger reads/writes disabled.

## Ownership

- MCP package: `@aiphabee/mcp-runtime`
- Usage package: `@aiphabee/usage-ledger`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/usage-envelope.contract.json`
- Checker: `npm run check:mcp-usage-envelope`

## Acceptance

- MCP runtime reports usage envelope readiness.
- `tools/call` plans expose `usage_envelope`.
- Usage summary exposes request id, credits, rows, and remaining quota fields.
- Usage ledger plan includes `requestId`, `operation=tool_call`, channel, dataset,
  metered rows, tool name, and usage event id.
- No live ledger reads/writes or billing reconciliation are enabled.

## Out Of Scope

Frontend Console, live OAuth/API key auth middleware, live usage-ledger
read/write, billing reconciliation, external SDK/Inspector smoke, and live MCP
tool execution remain separate slices.
