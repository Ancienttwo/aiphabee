# Notes: MCP revocation enforcement scaffold

## Completed

- Added `MCP_REVOCATION_ENFORCEMENT_VERSION` and a shared revocation enforcement planner in `@aiphabee/mcp-runtime`.
- Exposed `getMcpRevocationEnforcementCapabilities()` and nested readiness fields in `GET /mcp/runtime`.
- Added `POST /mcp/revocations/enforce/plan` in the Worker.
- Extended `POST /mcp` planning so provided revoked/rotated credential context fails with `AUTH_REQUIRED` before tool execution planning.
- Added `deploy/mcp/revocation-enforcement.contract.json` and `npm run check:mcp-revocation-enforcement`.
- Added empty `aiphabee_core.mcp_credential_revocation` and `aiphabee_governance.mcp_revocation_enforcement_contract` scaffolds.

## Boundaries

- No live OAuth provider integration.
- No live API key auth middleware.
- No live credential store reads.
- No raw credential storage.
- No persistent writes or live tool execution.

## Verification

- Passed: `npm run typecheck --workspace @aiphabee/mcp-runtime`
- Passed: `npm run typecheck --workspace @aiphabee/worker`
- Passed: `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- Passed: `npm run check:mcp-revocation-enforcement`
- Passed: `npm run check:database`
- Passed: targeted MCP contract checks (`check:mcp-oauth-pkce`, `check:mcp-api-key`, `check:mcp-endpoint`, `check:mcp-error-codes`)
- Passed: `npm run lint && npm run typecheck && npm run test && npm run test:golden`
- Passed: `npm run build --workspace @aiphabee/mcp-runtime`
- Passed: `npm run build --workspace @aiphabee/worker`
- Caveat: `npm run check` reaches `npm run build` and fails only in `@aiphabee/web` because `@cloudflare/vite-plugin` imports `node:module.registerHooks`; frontend work is delegated and `apps/web` was not changed in this slice.
