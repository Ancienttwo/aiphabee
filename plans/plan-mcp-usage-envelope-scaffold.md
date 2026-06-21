# Plan: MCP Usage Envelope Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-07 / US-M05
- Packages:
  - `@aiphabee/mcp-runtime`
  - `@aiphabee/usage-ledger`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/usage-envelope.contract.json`
- Checker: `npm run check:mcp-usage-envelope`

## Task Breakdown

- [x] Add MCP runtime usage envelope capability flags
- [x] Add request id and remaining quota fields to MCP usage summary
- [x] Add `tool_call.usage_envelope` for `tools/call`
- [x] Reuse usage-ledger quota display scaffold for remaining credits
- [x] Reuse usage-ledger event writer scaffold for request-scoped ledger plan
- [x] Keep live ledger reads/writes disabled
- [x] Add contract checker, tests, and tracker updates

## Explicit Non-Goals

- No frontend Developer Console work
- No live auth middleware
- No live ledger write/read
- No billing provider reconciliation
- No external SDK/Inspector smoke
