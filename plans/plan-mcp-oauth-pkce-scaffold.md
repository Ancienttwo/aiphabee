# Plan: MCP OAuth PKCE Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-02
- Package: `@aiphabee/mcp-runtime`
- Worker routes:
  - `GET /mcp/oauth/runtime`
  - `POST /mcp/oauth/authorize/plan`
  - `POST /mcp/oauth/token/plan`
  - `POST /mcp/oauth/revoke/plan`
- Contract: `deploy/mcp/oauth-pkce.contract.json`
- Checker: `npm run check:mcp-oauth-pkce`

## Task Breakdown

- [x] Add PRD §9.7 OAuth scope catalog
- [x] Require S256 PKCE for authorization planning
- [x] Return clear, revocable scope consent metadata
- [x] Plan token exchange without issuing or forwarding tokens
- [x] Plan connection/token revocation so future calls are denied
- [x] Add Worker routes, contract, tests, and tracker updates

## Explicit Non-Goals

- No live OAuth provider
- No live token issuance
- No client secret storage
- No frontend consent screen
- No live MCP tool execution
