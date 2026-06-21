# Notes: MCP OAuth PKCE Scaffold

Date: 2026-06-21

## Completed

- Extended `@aiphabee/mcp-runtime` with OAuth/PKCE planning.
- Added PRD §9.7 scope catalog:
  - `security.read`
  - `market.read`
  - `fundamentals.read`
  - `filings.read`
  - `analytics.run`
  - `portfolio.read`
  - `alerts.write`
  - `exports.read`
  - `admin.usage.read`
- Added Worker routes:
  - `GET /mcp/oauth/runtime`
  - `POST /mcp/oauth/authorize/plan`
  - `POST /mcp/oauth/token/plan`
  - `POST /mcp/oauth/revoke/plan`
- Added `deploy/mcp/oauth-pkce.contract.json`.
- Added `npm run check:mcp-oauth-pkce`.

## Trace

1. Client submits authorize input with client ID, redirect URI, S256 PKCE
   challenge, and requested scopes.
2. Runtime validates the redirect URI, PKCE method/challenge, and supported
   scope list.
3. Authorize plan returns clear scope descriptions and marks every scope
   revocable.
4. Token plan requires an authorization code and code verifier, but does not
   issue live tokens.
5. Revoke plan requires a connection ID or token ID and marks future calls denied
   after revocation.

## Verification

- `npm run check:mcp-oauth-pkce`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/mcp-runtime`
- `npm run build --workspace @aiphabee/worker`

## Residual Gaps

- No live OAuth provider.
- No persistent authorization-code or token storage.
- No frontend consent screen.
- API key issuance/rotation planning is covered by
  `tasks/notes/mcp-api-key-scaffold.notes.md`; live key generation and auth
  middleware remain absent.
- No live MCP tool execution.
