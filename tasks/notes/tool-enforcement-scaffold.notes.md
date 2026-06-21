# Tool Enforcement Scaffold Notes

> **Date**: 2026-06-21
> **Owner**: Codex
> **Sprint**: 1.3
> **Tracker Item**: AGT-04

## Summary

Added an Agent planner enforcement scaffold that proves requested tools are
registered, versioned, schema-bound, permission-aware, no-arbitrary-SQL/URL, and
read-only before future execution can consume the plan.

## Implementation Notes

- `GET /agent/runtime` now advertises `tool_enforcement`.
- `POST /agent/runs/plan` returns `tool_enforcement` with registry version,
  requested tools, required checks, and per-tool checks.
- Planned tool calls now include scope, data classes, rights-aware flag,
  standard response envelope flag, no SQL/URL flags, handler state, and execution
  mode.
- `sql.query` and `http.fetch` remain rejected as unregistered tools.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:tool-enforcement`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `POST /agent/runs/plan` registered tools smoke: `tool_enforcement.status=allowed`, `all_checks_passed=true`
- `POST /agent/runs/dry-run` `sql.query` / `http.fetch` smoke: `403 SCOPE_DENIED`

## Residual Gaps

- No actual tool execution exists yet.
- No runtime schema-serving endpoint exists yet.
- No MCP protocol endpoint exists yet.
- No live entitlement DB reads exist yet.
- Frontend Ask and evidence cards remain out of scope.
