# Agent Runtime Scaffold

> **Status**: Verified dry-run scaffold
> **Last Updated**: 2026-06-20 15:25 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-agent-runtime-scaffold.md`
> **Task Contract**: `tasks/contracts/agent-runtime-scaffold.contract.md`

This slice implements the AI SDK v7 Agent Runtime skeleton on the Worker
surface without configuring a real model provider or making model calls.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime package | `packages/agent-runtime` | Provider-agnostic dry-run runtime, registered tool policy, AI SDK stop condition |
| AI SDK dependency | `ai@7.0.0-beta.182` | Pinned to current v7 beta because npm latest is v6 |
| Worker route | `GET /agent/runtime` | Returns capabilities, limits, registered tools, and no-call surfaces |
| Worker route | `POST /agent/runs/dry-run` | Validates prompt/tool policy and returns dry-run skeleton |
| Shared contracts | `packages/data-contracts` | Adds PRD §9.6 error code coverage needed by agent validation |
| Model provider | Not configured | No API keys, no AI Gateway provider, no Workers AI binding |
| Market data / MCP | Absent | No market data route and no MCP redistribution endpoint |

## P2 Concrete Trace

Capability trace:

1. `GET /agent/runtime` enters the Hono Worker.
2. Worker calls `getAgentRuntimeCapabilities()` from `@aiphabee/agent-runtime`.
3. The response envelope reports:
   - `ai_sdk.package_name=ai`
   - `ai_sdk.target_version=7.0.0-beta.182`
   - `ai_sdk.stop_condition=isStepCount`
   - `model_provider=not_configured`
   - `model_calls=false`
   - `market_data=false`
   - `mcp_redistribution=false`

Dry-run trace:

1. `POST /agent/runs/dry-run` accepts `prompt`, optional `max_steps`, and
   optional `tools`.
2. Worker calls `createAgentRunSkeleton()`.
3. The package enforces:
   - prompt is required;
   - step count must be 1-8;
   - only registered tool names are allowed;
   - arbitrary SQL and arbitrary URL are disabled.
4. Valid input returns `status=dry_run`, `run_id`, AI SDK stop condition
   metadata, and zero-credit usage.
5. An unregistered tool returns `SCOPE_DENIED`.

## P3 Design Decision

Selected a dry-run runtime skeleton instead of a real provider call.

Reason:

- No approved model provider secret or AI Gateway binding exists in the repo.
- Gate 0 still blocks market-data and MCP redistribution surfaces.
- The next valuable step is to prove the runtime contracts, budgets, and tool
  allowlist before binding a model provider.

Tradeoff:

- This completes the Sprint 0.4 Agent Runtime skeleton leaf.
- It does not complete streaming generation, real tool execution, budget ledger
  billing, or model provider configuration.

## Verification

Passed:

- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /agent/runtime` -> `200 OK`
- `POST /agent/runs/dry-run` -> `200 OK`
- `POST /agent/runs/dry-run` with `tools:["sql.query"]` -> `403 SCOPE_DENIED`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Model provider / streaming contract now exists in
  `docs/governance/model-provider-streaming-scaffold.md`; real AI Gateway
  request, `streamText`, and `generateText` execution remain unimplemented.
- Registered tools are planned policy entries; they do not execute market data.
- Usage ledger, persistent run store, OTel spans, and Workflow handoff are not
  implemented.
