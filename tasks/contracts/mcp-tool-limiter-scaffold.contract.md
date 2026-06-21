# Contract: MCP Tool Limiter Scaffold

## Scope

This slice covers Sprint 2.3 MCP-11 backend limiter semantics for Remote MCP
`tools/call` planning.

It must:

- expose MCP tool limiter readiness and version from runtime capabilities;
- expose standard and high-cost MCP concurrency pools;
- include tool-level rate-limit metadata in `tools/call` plans;
- include budget estimate, pre-debit, and failure-refund metadata;
- isolate high-cost calls from the ordinary MCP pool;
- use `RATE_LIMITED` and `BUDGET_EXCEEDED` standard error codes for future live
  enforcement;
- keep live limiter reads, durable queue writes, usage debit/refund, frontend,
  and live tool execution disabled.

## Ownership

- MCP package: `@aiphabee/mcp-runtime`
- Runtime route: `GET /mcp/runtime`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/tool-limiter.contract.json`
- Checker: `npm run check:mcp-tool-limiter`

## Acceptance

- `GET /mcp/runtime` reports `mcp_tool_limiter_ready`,
  `mcp_tool_limiter_version`, `rate_limit_plan_ready`,
  `concurrency_limit_plan_ready`, and `budget_limit_plan_ready`.
- Standard-cost `tools/call` plans use `mcp_standard` with `max_parallel=8` and
  no durable queue requirement.
- High-cost `tools/call` plans use `mcp_high_cost` with `max_parallel=2` and
  `mcp-high-cost` planned enqueue metadata.
- Tool-limit plans declare no live window reads, no live inflight reads, no live
  queue writes, and no live usage debit.

## Out Of Scope

Frontend Console, live limiter implementation, persistent queue enqueue, live
budget debit/refund, billing reconciliation, and external SDK/Inspector smoke
remain separate slices.
