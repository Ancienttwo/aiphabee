# MCP Revocation Enforcement Scaffold Contract

> Sprint: 2.4 subscription billing, Workflows, alerts, and correction surfaces
> Tracker item: ACC-06 MCP OAuth/Key revocation

## Scope

- Package: `@aiphabee/mcp-runtime`
- Runtime route: `GET /mcp/runtime`
- Enforcement route: `POST /mcp/revocations/enforce/plan`
- Protocol route: `POST /mcp`
- Contract: `deploy/mcp/revocation-enforcement.contract.json`
- Checker: `npm run check:mcp-revocation-enforcement`

## Guarantees

- OAuth connection revoke and API key revoke/rotation share one revocation enforcement planner.
- `revoked`, `rotated`, and `unknown` credential status plans deny future MCP calls with `AUTH_REQUIRED`.
- Denial is planned before tool execution, schema validation side effects, usage debit, live tool execution, or persistent writes.
- `POST /mcp` rejects revoked/rotated credential context before `tools/call` execution planning.
- The scaffold does not store raw credential material and does not enable live auth middleware, provider calls, live key verification, or persistent writes.

## Verification

- `npm run check:mcp-revocation-enforcement`
- `npm run check:database`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/mcp-runtime`
- `npm run build --workspace @aiphabee/worker`
