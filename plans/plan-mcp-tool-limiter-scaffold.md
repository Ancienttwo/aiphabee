# Plan: MCP Tool Limiter Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-11
- Package: `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Runtime route: `GET /mcp/runtime`
- Contract: `deploy/mcp/tool-limiter.contract.json`
- Checker: `npm run check:mcp-tool-limiter`

## Task Breakdown

- [x] Add MCP tool limiter version and no-live capability flags
- [x] Add tool-level rate limit plan metadata for `tools/call`
- [x] Add high-cost vs standard concurrency pool routing
- [x] Add budget estimate, pre-debit, and failure-refund metadata
- [x] Mark high-cost calls for planned queue enqueue without live writes
- [x] Keep frontend, live limiter, live queue, and live usage debit out of scope
- [x] Add contract checker, tests, and tracker updates

## Explicit Non-Goals

- No frontend Developer Console work
- No live OAuth/API key auth middleware
- No live rate/concurrency window reads
- No durable queue writes
- No live usage-ledger debit, refund, or billing reconciliation
- No live MCP tool execution
