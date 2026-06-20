# Plan: Tool Enforcement Scaffold

> **Status**: Implemented
> **Owner**: Codex
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/tool-enforcement-scaffold.contract.md`
> **Notes**: `tasks/notes/tool-enforcement-scaffold.notes.md`

## Goal

Complete the Sprint 1.3 AGT-04 scaffold for registered, versioned,
permission-aware tool enforcement at the Agent planner boundary without
enabling live tool execution.

## Task Breakdown

- [x] Extend Agent runtime capabilities with `tool_enforcement`.
- [x] Attach registry-derived enforcement metadata to Agent run tool context.
- [x] Attach no-SQL/no-URL, schema, version, scope, rights-aware, and no-live
      metadata to planned tool calls.
- [x] Return `tool_enforcement` from `createToolLoopAgentPlan()`.
- [x] Preserve request rejection for unregistered SQL/URL tool names.
- [x] Add `deploy/agent/tool-enforcement.contract.json` and
      `npm run check:tool-enforcement`.
- [x] Update runtime and Worker tests.
- [x] Update Sprint tracker, governance notes, task contract, and deferred
      ledger.

## Out of Scope

- Live tool execution.
- Runtime JSON Schema serving or MCP protocol endpoint.
- Live entitlement database reads.
- Frontend Ask or evidence-card UI.

## Verification Surface

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:tool-enforcement`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- Local Wrangler smoke for allowed planner output and SQL/URL tool rejection.
