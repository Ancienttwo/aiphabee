# Contract: MCP OAuth PKCE Scaffold

## Scope

This slice covers Sprint 2.3 MCP-02 backend OAuth/PKCE planning only.

It must:

- expose OAuth authorize/token/revoke plan routes;
- require PKCE `S256`;
- show requested scopes clearly;
- keep scope grants revocable;
- block third-party token passthrough;
- avoid live token issuance.

## Ownership

- Package: `@aiphabee/mcp-runtime`
- Runtime route: `GET /mcp/oauth/runtime`
- Authorize route: `POST /mcp/oauth/authorize/plan`
- Token route: `POST /mcp/oauth/token/plan`
- Revoke route: `POST /mcp/oauth/revoke/plan`
- Contract: `deploy/mcp/oauth-pkce.contract.json`
- Checker: `npm run check:mcp-oauth-pkce`

## Acceptance

- `authorize` rejects missing client, redirect URI, PKCE challenge, or scope.
- `authorize` rejects non-`S256` PKCE and unsupported scopes.
- `authorize` returns clear scope descriptions with `revocable=true`.
- `token` requires authorization code and code verifier.
- `token` sets `access_token_issued=false`.
- `revoke` requires a connection ID or token ID and plans future-call denial.

## Out Of Scope

- Live OAuth provider integration, persistent authorization-code storage, token
  issuance, frontend consent UI, API key management, and live MCP tool execution
  remain separate slices.
