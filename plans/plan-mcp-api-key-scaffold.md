# Plan: MCP API Key Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-03 / ACC-06
- Package: `@aiphabee/mcp-runtime`
- Worker routes:
  - `GET /mcp/api-keys/runtime`
  - `POST /mcp/api-keys/create/plan`
  - `POST /mcp/api-keys/rotate/plan`
  - `POST /mcp/api-keys/revoke/plan`
- Contract: `deploy/mcp/api-key.contract.json`
- Checker: `npm run check:mcp-api-key`

## Task Breakdown

- [x] Add API key lifecycle capability surface
- [x] Plan hash-only key storage with pepper and last-four metadata
- [x] Plan one-time key material display without returning raw key material
- [x] Validate server-to-server scopes and optional IP allowlists
- [x] Plan rotation with old-key future-call denial
- [x] Plan revocation with future-call denial
- [x] Add Worker routes, contract, tests, and tracker updates

## Explicit Non-Goals

- No live API key generation
- No persistent DB writes
- No raw key storage
- No Developer Console UI
- No live MCP tool execution
