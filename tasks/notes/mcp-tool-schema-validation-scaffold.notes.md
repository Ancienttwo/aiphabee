# Notes: MCP Tool Schema Validation Scaffold

Date: 2026-06-21

## Completed

- Extended `@aiphabee/mcp-runtime` `tools/call` planning with input validation
  metadata.
- Passed Worker `params.arguments` into `createMcpProtocolPlan`.
- Added strict argument object validation.
- Added required-field and any-of identity-field validation for all 9 registered
  tools.
- Added unsupported-argument rejection for input fields outside local schema
  properties.
- Added tool-call output validation metadata:
  - `structured_content_required=true`
  - `raw_text_only_response_allowed=false`
  - `structured_content_matches_output_schema=planned_no_live`
- Added `deploy/mcp/tool-schema-validation.contract.json`.
- Added `npm run check:mcp-tool-schema-validation`.

## Trace

1. Worker receives MCP `tools/call` with `params.name` and `params.arguments`.
2. Worker forwards arguments into MCP runtime.
3. Runtime checks tool registration, rights gate, and required scope.
4. Runtime validates arguments against the local input schema rule map.
5. Runtime rejects missing required fields and unsupported fields.
6. Valid plans return input/output schema IDs and structuredContent validation
   metadata without live execution.

## Verification

- `npm run check:mcp-tool-schema-validation`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- No live MCP tool execution.
- No hosted schema registry.
- No full JSON Schema runtime validator.
- No live `structuredContent` generation.
