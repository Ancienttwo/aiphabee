# Plan: MCP Pagination Limits Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-06 / US-M07
- Packages:
  - `@aiphabee/tool-registry`
  - `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/pagination-limits.contract.json`
- Checker: `npm run check:mcp-pagination-limits`

## Task Breakdown

- [x] Add per-tool retrieval limit metadata to Tool Registry
- [x] Project retrieval limits into MCP `tools/list` descriptors
- [x] Add `bounded_retrieval` plan to MCP `tools/call`
- [x] Reject row limits that exceed the tool max
- [x] Reject invalid or over-window time ranges
- [x] Keep pagination/rights bypass blocked before live execution
- [x] Add contract checker, tests, and tracker updates

## Explicit Non-Goals

- No frontend Developer Console work
- No live auth middleware
- No live cursor persistence
- No live usage-ledger debits
- No external SDK/Inspector smoke
