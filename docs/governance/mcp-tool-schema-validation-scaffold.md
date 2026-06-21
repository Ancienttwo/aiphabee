# MCP Tool Schema Validation Scaffold

> **Plan**: `plans/plan-mcp-tool-schema-validation-scaffold.md`
> **Task Contract**: `tasks/contracts/mcp-tool-schema-validation-scaffold.contract.md`
> **Local Contract**: `deploy/mcp/tool-schema-validation.contract.json`

## P1: Architecture Map

| Surface | Role |
|---|---|
| `@aiphabee/mcp-runtime` | Owns MCP `tools/call` argument validation and output validation plan |
| `@aiphabee/tool-registry` | Source of tool names and input/output schema IDs |
| `deploy/tools/tool-schemas.contract.json` | Local schema authority for 9 tool input/output schema pairs |
| `POST /mcp` | Carries MCP `tools/call` method and `params.arguments` |
| `deploy/mcp/tool-schema-validation.contract.json` | Guards MCP-04 strict input and structured output posture |

Out of scope:

- `apps/web`
- live MCP tool execution
- full JSON Schema runtime engine
- live structuredContent generation
- schema registry hosting

## P2: Concrete Trace

1. A client submits `method=tools/call`, `params.name`, and
   `params.arguments` to `POST /mcp`.
2. Worker forwards `params.arguments` into `createMcpProtocolPlan`.
3. Runtime validates the tool name, Gate 0 rights, required scope, and then
   validates arguments against the local tool input rule map.
4. Missing required fields, non-object arguments, or unsupported fields fail
   before a no-live tool call plan is returned.
5. A valid plan includes `input_schema_id`, `output_schema_id`,
   `input_validation`, and `output_validation`.
6. Output validation declares `structured_content_required=true`,
   raw-text-only responses disallowed, and `structured_content_matches_output_schema`
   planned for the registered `outputSchema`.

## P3: Decision Rationale

Why validate in `@aiphabee/mcp-runtime`:

- MCP `tools/call` is the protocol boundary where untrusted client arguments
  enter the backend.
- Tool Registry already owns tool names and schema IDs, so MCP runtime should
  bind calls to those IDs instead of inventing alternate contracts.
- Gate 0 still blocks live execution, but strict input rejection can be proven
  now without exposing data.

Tradeoff:

- The scaffold validates object shape, required fields, any-of identity fields,
  and additional-property denial for all 9 registered tools.
- Full JSON Schema runtime value-type validation and live `structuredContent`
  generation remain later work.

## Verification

Passed:

- `npm run check:mcp-tool-schema-validation`
- `npm run test -- packages/mcp-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/worker`

## Residual Gaps

- No live tool execution.
- No hosted schema registry.
- No full JSON Schema validation engine.
- No live `structuredContent` payload generation.
