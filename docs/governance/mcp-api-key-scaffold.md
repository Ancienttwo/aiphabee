# MCP API Key Scaffold

> **Plan**: `plans/plan-mcp-api-key-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-api-key-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/api-key.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns API key lifecycle planning and validation |
| `GET /mcp/api-keys/runtime` | Reports API key scaffold capabilities |
| `POST /mcp/api-keys/create/plan` | Plans server-to-server key creation without live secret issuance |
| `POST /mcp/api-keys/rotate/plan` | Plans key rotation and old-key future-call denial |
| `POST /mcp/api-keys/revoke/plan` | Plans key revocation and future-call denial |
| `deploy/mcp/api-key.contract.json` | Guards MCP-03 hash/rotation/IP/one-time-display posture |

Out of scope:

- `apps/web`
- live API key generation
- persistent DB writes
- raw key storage or return
- live request authentication
- live MCP tool execution

## P2: Concrete Trace

1. A server client submits key name, scopes, optional IP allowlist, workspace, and
   rotation window to `POST /mcp/api-keys/create/plan`.
2. Runtime rejects raw API key material, validates PRD §9.7 scopes, validates IP
   allowlist entries, and enforces a 1-365 day rotation window.
3. The response plans hash-only storage, last-four storage, one-time display
   metadata, and server-to-server-only usage.
4. A server client submits key ID, scopes, optional IP allowlist, and rotation
   reason to `POST /mcp/api-keys/rotate/plan`.
5. The response plans new key material display once and immediate old-key
   future-call denial.
6. A server client submits key ID to `POST /mcp/api-keys/revoke/plan`.
7. The response plans key-hash disablement and future-call denial after revoke.

## P3: Decision Rationale

Why no-live API key planning:

- MCP-03 needs the credential lifecycle contract before live auth enforcement or
  Developer Console can be credible.
- Gate 0 still blocks live MCP/API redistribution, so key issuance must not make
  tool data callable.
- The repo can verify hash-only storage semantics, rotation, IP allowlist shape,
  and one-time display posture without handling real secrets.

Tradeoff:

- Server-to-server credential behavior is now testable.
- Durable key tables, real key generation, live authentication middleware, and
  Developer Console management remain later slices.

## Verification

Passed:

- `npm run check:mcp-api-key`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- No live API key generation.
- No persistent key hash table writes.
- No live authentication middleware.
- No Developer Console key management UI.
- Live MCP tool execution remains blocked by Gate 0 and missing auth state.
