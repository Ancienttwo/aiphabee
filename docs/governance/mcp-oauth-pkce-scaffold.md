# MCP OAuth PKCE Scaffold

> **Plan**: `plans/plan-mcp-oauth-pkce-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-oauth-pkce-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/oauth-pkce.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns OAuth/PKCE planner, scope catalog, and revocation plan |
| `GET /mcp/oauth/runtime` | Reports OAuth/PKCE scaffold capabilities |
| `POST /mcp/oauth/authorize/plan` | Plans authorization-code + PKCE consent |
| `POST /mcp/oauth/token/plan` | Plans PKCE token exchange without live token issuance |
| `POST /mcp/oauth/revoke/plan` | Plans connection/token revocation |
| `deploy/mcp/oauth-pkce.contract.json` | Guards MCP-02 required fields and no-token posture |

Out of scope:

- `apps/web`
- live OAuth provider
- live token issuance
- client secret storage
- API key management
- live MCP tool execution

## P2: Concrete Trace

1. A client submits `client_id`, `redirect_uri`, `code_challenge`,
   `code_challenge_method=S256`, and scopes to
   `POST /mcp/oauth/authorize/plan`.
2. Runtime validates redirect URI, PKCE method, PKCE challenge shape, and PRD
   §9.7 scope names.
3. The response returns clear consent metadata, scope descriptions, and
   `revocable=true` for every scope.
4. A client submits authorization code and code verifier to
   `POST /mcp/oauth/token/plan`.
5. The response confirms PKCE verification is planned, but no access or refresh
   token is issued.
6. A client submits connection ID or token ID to
   `POST /mcp/oauth/revoke/plan`.
7. The response marks future calls denied after revoke and plans scope-grant
   removal.

## P3: Decision Rationale

Why no-live OAuth planning:

- Sprint 2.3 needs visible, revocable scopes before API keys, tool calls, usage
  reconciliation, or Developer Console can be trustworthy.
- Gate 0 still prevents live MCP/API redistribution; OAuth should not imply
  data redistribution rights.
- The repo can lock the authorization contract and safety invariants without
  storing secrets or issuing tokens.

Tradeoff:

- The OAuth/PKCE contract is testable now.
- A real OAuth provider, durable code/token storage, and frontend consent UI
  remain later slices.

## Verification

Passed:

- `npm run check:mcp-oauth-pkce`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/mcp-runtime`
- `npm run build --workspace @aiphabee/worker`

## Residual Gaps

- Live OAuth provider remains absent.
- Persistent authorization-code and token storage remain absent.
- Frontend consent UI remains absent.
- API key issuance/rotation remains absent.
- Live MCP tool execution remains blocked by Gate 0 and missing auth state.
