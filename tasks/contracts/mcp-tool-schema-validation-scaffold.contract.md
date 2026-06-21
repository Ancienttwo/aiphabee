# Contract: MCP Tool Schema Validation Scaffold

## Scope

This slice covers Sprint 2.3 MCP-04 backend validation for MCP `tools/call`
arguments and structured output planning.

It must:

- bind every MCP tool call to Tool Registry input/output schema IDs;
- validate `params.arguments` as an object;
- reject missing required fields;
- reject unsupported fields outside the input schema;
- expose output validation metadata for `structuredContent` and `outputSchema`;
- keep live tool execution disabled.

## Ownership

- Package: `@aiphabee/mcp-runtime`
- Protocol route: `POST /mcp`
- Schema source: `deploy/tools/tool-schemas.contract.json`
- Contract: `deploy/mcp/tool-schema-validation.contract.json`
- Checker: `npm run check:mcp-tool-schema-validation`

## Acceptance

- Valid `tools/call` planning returns `input_schema_id` and `output_schema_id`.
- Valid `tools/call` planning sets `schema_validation=validated`.
- Valid `tools/call` planning sets `structured_content_required=true`.
- Missing required arguments throw `McpRuntimeInputError`.
- Unsupported arguments throw `McpRuntimeInputError`.
- The checker verifies all 9 registered tool schema pairs still deny arbitrary
  `sql`, `sql_text`, `url`, and `endpoint` input fields.

## Out Of Scope

Live MCP tool execution, hosted schema registry, full JSON Schema runtime
validation, live `structuredContent` generation, and frontend integration remain
separate slices.
