# Plan: MCP Compatibility Status Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-12 / US-M08
- Package: `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Status route: `GET /mcp/compatibility/status`
- Contract: `deploy/mcp/compatibility.contract.json`
- Checker: `npm run check:mcp-compatibility`

## Task Breakdown

- [x] Add MCP compatibility status version and target protocol metadata
- [x] Add official Inspector and TypeScript SDK target metadata
- [x] Add target-client matrix for external compatibility smoke
- [x] Add compatibility test-vector matrix covering protocol, schema, auth, limits,
  error, usage, and `as_of`/delay/source display
- [x] Add no-live status-page scaffold route
- [x] Keep public status page, live SDK smoke, Inspector smoke, and target-client
  e2e out of scope
- [x] Add contract checker, runtime/worker tests, and tracker updates

## Explicit Non-Goals

- No frontend Developer Console or public status page rendering
- No network install/run of current Inspector or SDK in CI
- No live OAuth/API key auth middleware
- No live MCP tool execution
- No claim that external client e2e has passed before Gate 0 rights and live
  auth/execution are enabled
