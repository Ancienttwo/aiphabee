# Notes: MCP API Key Scaffold

Date: 2026-06-21

## Completed

- Extended `@aiphabee/mcp-runtime` with server-to-server API key lifecycle
  planning.
- Added Worker routes:
  - `GET /mcp/api-keys/runtime`
  - `POST /mcp/api-keys/create/plan`
  - `POST /mcp/api-keys/rotate/plan`
  - `POST /mcp/api-keys/revoke/plan`
- Added hash-only storage metadata:
  - `raw_key_stored=false`
  - `key_hash_stored=true`
  - `pepper_required=true`
  - `key_last_four_stored=true`
- Added one-time display metadata without returning raw key material.
- Added IP allowlist validation and rotation window validation.
- Added `deploy/mcp/api-key.contract.json`.
- Added `npm run check:mcp-api-key`.

## Trace

1. Client submits key name, requested scopes, optional IP allowlist, workspace,
   owner, and rotation window.
2. Runtime rejects raw key material, validates scopes, validates IP allowlist,
   and normalizes rotation window.
3. Create plan returns hash-only storage and one-time-display metadata without
   issuing live key material.
4. Rotate plan requires key ID and marks old-key future calls denied after
   rotation.
5. Revoke plan requires key ID and marks future calls denied after revocation.

## Verification

- `npm run check:mcp-api-key`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- No live API key generation.
- No persistent key hash table writes.
- No live request authentication middleware.
- No Developer Console key management UI.
- No live MCP tool execution.
