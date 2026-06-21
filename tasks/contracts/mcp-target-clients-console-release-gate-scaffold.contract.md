# Task Contract: MCP Target Clients Console Release Gate Scaffold

## Scope

Close the local no-write contract for Sprint 3.3 / PRD §19.3 item `主流目标客户端端到端通过；Developer Console 可对账`.

## In Scope

- Add runtime capability metadata for target-client and Console reconciliation release readiness.
- Add `POST /mcp/release-gates/target-clients-console/plan`.
- Link target-client matrix to existing MCP compatibility status.
- Link Console reconciliation to request_id, usage, OAuth scope, API key lifecycle, stable errors, and provenance fields.
- Add contract JSON, checker, empty Supabase schema scaffold, tests, tracker update, and task note.

## Out of Scope

- Developer Console frontend/UI implementation.
- Live SDK/Inspector/client smoke execution.
- Persistent Console log store reads/writes.
- Live usage ledger reads.
- Live OAuth provider, API key generation, limiter windows, tool execution, database writes, model calls, or SQL emission.

## Verification

- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run build --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/worker`
- `npx vitest run packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:mcp-target-clients-console-release-gate`
- `npm run check:database`

