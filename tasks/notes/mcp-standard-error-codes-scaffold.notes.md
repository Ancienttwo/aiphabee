# Notes: MCP Standard Error Codes Scaffold

Date: 2026-06-21

## Completed

- Added `MCP_STANDARD_ERROR_CODES_VERSION`.
- Added PRD §9.6 MCP standard error code list.
- Added standard categories and client actions for auth, rights, data, limit,
  and system failures.
- Added `getMcpRuntimeStandardError()` and
  `getMcpStandardErrorDefinition()`.
- Extended `GET /mcp/runtime` capability output with error definitions and
  detail fields.
- Added MCP Worker `error.detail` metadata for runtime input and internal
  error responses.
- Added `deploy/mcp/error-codes.contract.json`.
- Added `npm run check:mcp-error-codes`.

## Trace

1. MCP runtime throws `McpRuntimeInputError`.
2. Worker maps the internal code to a PRD standard code.
3. Worker returns shared envelope error fields plus MCP-specific detail.
4. Runtime capabilities and contract file expose the same code/category/action
   taxonomy.

## Verification

- `npm run check:mcp-error-codes`
- `npm run check:mcp-endpoint`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- MCP-11 live rate/concurrency/budget limiter is not implemented.
- Developer Console is not implemented.
- External SDK/Inspector compatibility smoke is not implemented.
