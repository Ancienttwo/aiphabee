# Contract: MCP Standard Error Codes Scaffold

## Scope

This slice covers Sprint 2.3 MCP-08 backend standard error codes and
machine-readable remediation metadata.

It must:

- expose PRD §9.6 standard error codes from MCP runtime capabilities;
- expose stable error categories for authentication, authorization, data, limit,
  and system failures;
- expose a versioned MCP error detail shape;
- map internal `McpRuntimeInputError` codes to standard error codes;
- return MCP Worker errors with `error.detail` fields that clients can branch on;
- keep live limiter, auth, and tool execution disabled.

## Ownership

- MCP package: `@aiphabee/mcp-runtime`
- Worker route: `POST /mcp`
- Runtime route: `GET /mcp/runtime`
- Contract: `deploy/mcp/error-codes.contract.json`
- Checker: `npm run check:mcp-error-codes`

## Acceptance

- Runtime capabilities include standard error code version, categories,
  definitions, and detail fields.
- MCP input failures return shared envelope errors with stable `error.code`.
- MCP error responses include `category`, `client_action`, `internal_code`,
  `mcp_error_version`, `recoverable`, `request_id`,
  `retry_after_required`, and `source_record_id`.
- `RATE_LIMITED` is marked as requiring retry-after metadata for future limiter
  integration.

## Out Of Scope

Frontend Console, live rate/concurrency/budget limiter, live OAuth/API key
auth middleware, live MCP tool execution, and external SDK/Inspector smoke remain
separate slices.
