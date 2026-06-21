# Plan: MCP Endpoint Default-Deny Scaffold

## Scope

- Sprint: 2.3
- Requirements: MCP-01, Gate 0 MCP/API redistribution premise
- Package: `@aiphabee/mcp-runtime`
- Worker routes:
  - `GET /mcp/runtime`
  - `POST /mcp`
- Contract: `deploy/mcp/endpoint.contract.json`
- Checker: `npm run check:mcp-endpoint`

## Task Breakdown

- [x] Add MCP runtime package
- [x] Support planned `initialize`, `tools/list`, and `tools/call` methods
- [x] Enforce Origin validation before tool discovery
- [x] Keep MCP/API redistribution rights default-denied
- [x] Return empty tools/list while rights are unconfirmed
- [x] Reject tools/call with `DATA_NOT_LICENSED` while rights are unconfirmed
- [x] Add Worker route, tests, contract, and tracker updates

## Explicit Non-Goals

- No live OAuth provider
- No live API key issuance
- No live tool execution
- No protocol compatibility smoke against external clients
- No Developer Console UI
