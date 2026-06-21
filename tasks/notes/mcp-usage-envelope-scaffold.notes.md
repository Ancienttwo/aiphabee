# Notes: MCP Usage Envelope Scaffold

Date: 2026-06-21

## Completed

- Added MCP runtime usage envelope capability flags.
- Added `MCP_USAGE_ENVELOPE_VERSION`.
- Extended MCP usage summary with `request_id`, `request_id_visible`,
  `credit_limit`, `credits_used`, `credits_pending`, `credits_remaining`, and
  reconciliation status.
- Added `tool_call.usage_envelope` for `tools/call`.
- Reused `@aiphabee/usage-ledger` quota display planning for remaining credits.
- Reused `@aiphabee/usage-ledger` event writer planning for request-scoped
  `tool_call` usage events.
- Added `deploy/mcp/usage-envelope.contract.json`.
- Added `npm run check:mcp-usage-envelope`.

## Trace

1. MCP runtime validates `tools/call` gates and bounded retrieval.
2. MCP runtime estimates credits from bounded row limit.
3. Usage quota display plan returns request id, pending estimate, and remaining
   credits.
4. Usage ledger event plan records the no-live `tool_call` event shape.
5. MCP response carries both usage summary and detailed usage envelope.

## Verification

- `npm run check:mcp-usage-envelope`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts packages/usage-ledger/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/usage-ledger`

## Residual Gaps

- No live OAuth/API key workspace context.
- No live usage-ledger writes or reads.
- No billing reconciliation.
- No external SDK/Inspector smoke.
