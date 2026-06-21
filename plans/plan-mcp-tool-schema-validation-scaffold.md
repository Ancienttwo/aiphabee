# Plan: MCP Tool Schema Validation Scaffold

## Scope

- Sprint: 2.3
- Requirement: MCP-04
- Package: `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Schema source: `deploy/tools/tool-schemas.contract.json`
- Contract: `deploy/mcp/tool-schema-validation.contract.json`
- Checker: `npm run check:mcp-tool-schema-validation`

## Task Breakdown

- [x] Pass MCP `params.arguments` into runtime tool-call planning
- [x] Validate `tools/call` arguments are objects
- [x] Reject missing required input schema fields
- [x] Reject unsupported arguments outside schema properties
- [x] Return input/output schema IDs in tool-call plan
- [x] Return `structuredContent`/`outputSchema` validation plan
- [x] Add contract checker, tests, and tracker updates

## Explicit Non-Goals

- No live MCP tool execution
- No hosted schema registry
- No full JSON Schema runtime engine
- No frontend integration
