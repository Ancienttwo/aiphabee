# Contract: MCP Pagination Limits Scaffold

## Scope

This slice covers Sprint 2.3 MCP-06 backend pagination, max-row, and
time-range guardrails for registered MCP tools.

It must:

- expose retrieval limits for every registered tool;
- expose cursor pagination metadata for paginated tools;
- validate `tools/call` row limits before no-live execution planning;
- validate `tools/call` time ranges before no-live execution planning;
- map over-row requests to `TOO_MANY_ROWS`;
- map invalid or over-window time ranges to `OUT_OF_RANGE`;
- keep live execution disabled.

## Ownership

- Registry package: `@aiphabee/tool-registry`
- MCP package: `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/pagination-limits.contract.json`
- Checker: `npm run check:mcp-pagination-limits`

## Acceptance

- Tool Registry marks pagination limits ready.
- MCP runtime marks pagination limits ready.
- MCP `tools/list` descriptors include `retrieval_limits`.
- MCP `tools/call` plans include `bounded_retrieval`.
- Requests exceeding max rows are rejected before live execution.
- Requests exceeding max time window are rejected before live execution.

## Out Of Scope

Frontend Console, live OAuth/API key auth middleware, persistent cursor storage,
live usage-ledger reconciliation, external SDK/Inspector smoke, and live MCP
tool execution remain separate slices.
