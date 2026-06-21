# Notes: MCP Endpoint Default-Deny Scaffold

Date: 2026-06-21

## Completed

- Added `@aiphabee/mcp-runtime`.
- Added Worker routes:
  - `GET /mcp/runtime`
  - `POST /mcp`
- Added default-deny MCP/API redistribution rights gate.
- Added Origin validation before tool discovery.
- Added planned support for:
  - `initialize`
  - `tools/list`
  - `tools/call`
- Added `deploy/mcp/endpoint.contract.json`.
- Added `npm run check:mcp-endpoint`.

## Trace

1. Client submits a method to `POST /mcp`.
2. Worker reads the HTTP `Origin` header and does not trust client-supplied
   rights flags.
3. `@aiphabee/mcp-runtime` validates method and Origin.
4. Runtime applies `mcp_api_redistribution_rights_confirmed=false`.
5. `initialize` returns server/protocol capabilities without live execution.
6. `tools/list` returns no tools while the rights gate is closed.
7. `tools/call` fails with `DATA_NOT_LICENSED` while the rights gate is closed.

## Verification

- `npm run check:mcp-endpoint`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- OAuth/PKCE planning is covered by
  `tasks/notes/mcp-oauth-pkce-scaffold.notes.md`; live OAuth provider and token
  storage remain absent.
- API key issuance, hashing, rotation, and IP limits are not implemented.
- Live MCP tool execution is not implemented.
- Official SDK/Inspector compatibility smoke is not implemented.
- Developer Console remains absent.
