# Plan: MCP Standard Error Codes Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-08
- Package: `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Runtime route: `GET /mcp/runtime`
- Contract: `deploy/mcp/error-codes.contract.json`
- Checker: `npm run check:mcp-error-codes`

## Task Breakdown

- [x] Add PRD §9.6 MCP standard error code version and taxonomy
- [x] Add standard error categories and client action metadata
- [x] Map `McpRuntimeInputErrorCode` values to standard error codes
- [x] Expose standard error definitions from `GET /mcp/runtime`
- [x] Add machine-readable `error.detail` for MCP Worker error responses
- [x] Keep live limiter/auth/tool execution out of scope
- [x] Add contract checker, tests, and tracker updates

## Explicit Non-Goals

- No frontend Developer Console work
- No live OAuth provider or API key auth middleware
- No live tool execution
- No live rate/concurrency/budget limiter
- No external SDK/Inspector smoke
