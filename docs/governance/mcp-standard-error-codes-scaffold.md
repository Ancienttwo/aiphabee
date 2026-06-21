# MCP Standard Error Codes Scaffold

> **Plan**: `plans/plan-mcp-standard-error-codes-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-standard-error-codes-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/error-codes.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns PRD §9.6 MCP standard error code taxonomy, categories, and internal error mappings |
| `POST /mcp` | Returns standard envelope errors with machine-readable MCP detail |
| MCP OAuth/API key planning routes | Reuse the same MCP error detail helper for validation failures |
| `GET /mcp/runtime` | Reports standard error version, categories, definitions, and detail fields |
| `deploy/mcp/error-codes.contract.json` | Guards MCP-08 code/category/action/retry-after contract |

Out of scope:

- `apps/web`
- live OAuth provider or token storage
- live tool execution
- rate/concurrency limiter behavior
- external SDK/Inspector smoke

## P2: Concrete Trace

1. A MCP request reaches `/mcp`, `/mcp/oauth/*/plan`, or `/mcp/api-keys/*/plan`.
2. The runtime validates method, origin, scope, rights, key, schema, pagination,
   or PKCE inputs.
3. Failures throw `McpRuntimeInputError` with an internal code.
4. Worker maps the internal code through `getMcpRuntimeStandardError()`.
5. Worker returns the shared response envelope with `error.code` plus
   `error.detail.category`, `client_action`, `internal_code`,
   `mcp_error_version`, `recoverable`, `retry_after_required`, and
   `source_record_id`.

## P3: Decision Rationale

The stable contract is PRD §9.6's code taxonomy, not the current throw-site names.
Internal codes can remain precise for logs and provenance, while MCP clients get a
small fixed set of codes and remediation hints.

Tradeoff:

- HTTP status remains narrow enough for validation vs rights vs limit behavior.
- Client branching should use `error.code` and `error.detail`, not message text.
- `RATE_LIMITED` and `BUDGET_EXCEEDED` are defined now, but live limiter behavior
  remains MCP-11.

## Verification

Passed:

- `npm run check:mcp-error-codes`
- `npm run check:mcp-endpoint`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- MCP-11 live rate/concurrency/budget limiter is not implemented.
- Developer Console rendering is not implemented.
- External SDK/Inspector compatibility smoke remains pending.
