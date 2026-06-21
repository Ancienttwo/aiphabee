# Contract: MCP API Key Scaffold

## Scope

This slice covers Sprint 2.3 MCP-03 backend server-to-server API key lifecycle
planning only.

It must:

- expose API key runtime/create/rotate/revoke plan routes;
- restrict key usage to server-to-server scenarios;
- plan hash-only storage with pepper and last-four metadata;
- avoid raw key return or storage;
- mark key material as one-time display only;
- support key rotation and IP allowlists;
- plan revoke/rotate future-call denial.

## Ownership

- Package: `@aiphabee/mcp-runtime`
- Runtime route: `GET /mcp/api-keys/runtime`
- Create route: `POST /mcp/api-keys/create/plan`
- Rotate route: `POST /mcp/api-keys/rotate/plan`
- Revoke route: `POST /mcp/api-keys/revoke/plan`
- Contract: `deploy/mcp/api-key.contract.json`
- Checker: `npm run check:mcp-api-key`

## Acceptance

- `create` rejects missing key name or scope.
- `create` rejects raw API key material and invalid IP allowlist entries.
- `create` returns hash-only storage and one-time-display metadata.
- `rotate` requires key ID and plans old-key future-call denial.
- `revoke` requires key ID and plans future-call denial.
- All routes keep `api_key_live=false` and avoid live secret generation.

## Out Of Scope

Live key generation, persistent key hash storage, live request authentication,
Developer Console UI, and live MCP tool execution remain separate slices.
