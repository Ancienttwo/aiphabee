# PRD: Agent Control Plane Convergence

> **Status**: Draft
> **Slug**: agent-control-plane-convergence
> **Created**: 2026-07-03 20:42 +0800
> **Updated**: 2026-07-03 20:42 +0800
> **Source Spec**: `docs/spec.md`
> **Tier**: compact

## AI Quick-Read Card

- Problem: AiphaBee already has Agent runtime scaffolds and a landed `parse_chart_image` chain; building a second Agent contract stack would split authority.
- Users: AiphaBee engineers shipping Generic Agent, technical-analysis Research tools, and later FastClaw runner integration.
- Platform: `@aiphabee/agent-runtime` plus Worker `/agent/*` routes.
- P0 surface: unified layer/router/runner contract and research-only tool policy.
- Core metric: one Agent contract authority; Generic cannot invoke `parse_chart_image`; Research can invoke it only through tenant/image/calibration/evidence gates.
- Hard constraint: do not create `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.
- Key risk: duplicating run/event/tool policy semantics across Worker, runtime, and FastClaw adapter.
- Unknowns: exact production auth/session source and final FastClaw deployment details remain outside this PRD.
- Acceptance scenarios: layer routing is deterministic; unknown tool defaults deny; chart parser remains research-only; existing parse-chart-image tests stay green.
- Suggested next step: create the `agent-control-plane-convergence` sprint from this PRD and expand row 1 with `$think`.

## Problem

### Product Direction

AiphaBee should not start a new dual-agent stack from scratch. Current `origin/main` already has:

- `@aiphabee/agent-runtime` as Agent runtime scaffold.
- Worker `/agent/*` entrypoints.
- Tool Registry, run context, evidence contract, release gates, and usage/billing scaffolds.
- `parse_chart_image` with chart upload metadata, R2 object ownership, tenant-aware fetch, and FR-01 calibration routing.

The next product need is convergence: make the existing runtime the single Agent Control Plane, then layer Generic and Research execution on top of it.

- Hard Constraints:
  - `@aiphabee/agent-runtime` is the only Agent contract authority.
  - Worker `/agent/*` remains the public API owner.
  - Generic Agent must not invoke `parse_chart_image`.
  - Research may invoke `parse_chart_image` only with entitlement, tenant context, image ownership checks, calibration routing, and evidence binding.
  - FastClaw is a future Research runner implementation, not a public API, not an auth/billing/compliance authority.
- Recommended Defaults:
  - Add layer/router/runner contracts inside `@aiphabee/agent-runtime`.
  - Keep `parse_chart_image` under `packages/agent-runtime/src/parse-chart-image/`.
  - Implement Generic first as guarded live Worker runner.
  - Implement FastClaw later as `AgentRunner` adapter after control-plane convergence.
- Freedoms:
  - Contract definitions may live in `index.ts` initially or be split into local runtime modules if the file becomes unwieldy.
  - Runner implementations may be local modules first and packages later if size or dependency isolation demands it.

### Feasibility Boundary

- Confirmed:
  - `parse_chart_image` is landed in `origin/main` via PR #22.
  - `chart_images` is the tenant ownership and active/removal authority.
  - `parse_chart_image` fetch receives server-owned tenant context and returns `image_not_found` before model calls for invalid image refs.
  - FR-01 `auto_match` is gated by ready matching calibration, version match, sample count, and thresholds.
- [UNKNOWN]:
  - Production auth/session source for chart upload and Research runs.
  - Final billing entitlement field names for Generic, Research, and technical-analysis capability.
  - FastClaw deployment surface, registry, and E2B account limits.
- [UNVERIFIED]:
  - Live FastClaw stream behavior against AiphaBee event adapter.
  - Live E2B artifact sync and cost guardrail behavior.

## Users

### Primary Users

- User: AiphaBee backend/runtime engineer.
  - Need: one run/event/tool contract to extend without re-deciding boundaries.
  - Success signal: Generic, Research, chart parser, and FastClaw adapter all consume the same Agent control-plane types.

- User: AiphaBee product engineer building Agent UX.
  - Need: deterministic selected layer, route reason, progress events, and evidence state.
  - Success signal: UI can render Generic and Research progress without knowing the provider or runner.

### Secondary Users

- User: Compliance/support operator.
  - Need: route decisions, tool use, evidence, and post-check results are inspectable.
  - Success signal: a run can be traced from input to selected layer to tool calls to final answer.

## Success Criteria

| Metric | Target | Measurement Method | Degradation Threshold |
|---|---:|---|---:|
| Contract authority count | 1 | Review package/API ownership in diff | >1 |
| Generic chart parser denial | 100% | Unit tests for Generic requested tools | <100% |
| Research chart parser gate coverage | 100% | Tests for valid, wrong-tenant, inactive, no-calibration cases | <100% |
| Existing parse-chart-image regression | 100% pass | `npx vitest run packages/agent-runtime/src/parse-chart-image` | any fail |
| Existing Worker regression | 100% pass | `npx vitest run apps/worker/src/index.test.ts` | any relevant fail |

## Acceptance Scenarios

### Scenario 1: Generic Cannot Invoke Chart Parser

- Given: a Generic Agent execution request asks for `parse_chart_image`.
- When: the layer tool policy is evaluated.
- Then: the request is denied before tool execution.
- Machine-checkable evidence: unit test asserts Generic requested tool policy returns blocked/default-deny for `parse_chart_image`.

### Scenario 2: Research Can Invoke Valid Tenant Chart Parser

- Given: a Research execution request has `technical_analysis` entitlement and a tenant-owned active `image_ref`.
- When: the chart parser tool is selected.
- Then: the tool can run through the existing tenant-aware `fetchImage` path and produce a routed outcome.
- Machine-checkable evidence: Research policy test plus existing `parse_chart_image` executor/image-store tests pass.

### Scenario 3: Research Fails Closed For Invalid Chart Refs

- Given: a Research request has a wrong-tenant or inactive `image_ref`.
- When: `parse_chart_image` attempts to fetch the image.
- Then: the fetch returns `null`, no model call is made, and the outcome is not `auto_match`.
- Machine-checkable evidence: tests assert `model_call_count=0`, `image_not_found`, and non-`auto_match`.

### Scenario 4: FastClaw Remains Behind AiphaBee Authority

- Given: a future Research run is routed to FastClaw.
- When: FastClaw returns stream events or a final draft.
- Then: events are converted into AiphaBee event envelopes and final draft still passes AiphaBee validator before user-visible final answer.
- Machine-checkable evidence: adapter tests in the future FastClaw sprint.

## Non-goals

- No new public Agent API outside Worker `/agent/*`.
- No `packages/agent-contracts` package.
- No `packages/agent-generic` package.
- No `apps/api-worker`.
- No FastClaw frontend client.
- No per-user FastClaw clone in the convergence sprint.
- No licensed-advice mode, broker write tools, or automated trading.
- No production auth/session implementation in the first convergence slice.

## Module Behaviors (P0)

### Module 1: Unified Control-Plane Contract

- Purpose: define layer, runner, event, route, and tool-policy semantics in `@aiphabee/agent-runtime`.
- Hard Constraints:
  - Source of truth stays in `packages/agent-runtime`.
  - Worker imports runtime contracts; it does not define competing semantics.
  - Unknown tools default deny.
- Recommended Defaults:
  - `AgentLayer = "generic" | "research"`.
  - `AgentRunMode = "dry_run" | "guarded_live" | "runner_remote"`.
  - `AgentRunner.run()` returns `AsyncIterable<AgentExecutionEvent>`.
- Failure path 1: invalid requested layer returns structured route error.
- Failure path 2: unknown tool returns policy denial before model/tool call.
- Dependencies: existing agent runtime, Worker route tests, tool registry.
- Open decisions: exact file split inside `agent-runtime`.

### Module 2: Layer Tool Policy

- Purpose: make tool availability deterministic and non-model-controlled.
- Hard Constraints:
  - `parse_chart_image` is `research` only.
  - `parse_chart_image` requires tenant context, technical-analysis entitlement, calibration gate, and evidence binding.
  - Generic cannot read tenant-private chart images.
- Recommended Defaults:
  - encode tool capability metadata close to registered tool metadata.
  - no policy means deny.
- Failure path 1: Generic chart tool request becomes blocked route/tool decision.
- Failure path 2: Research without entitlement becomes upgrade/denied route decision.
- Dependencies: `packages/tool-registry`, `packages/agent-runtime/src/parse-chart-image`.
- Open decisions: exact entitlement string for production; first slice may use fixture entitlement constants.

### Module 3: Research Chart Parser Integration Boundary

- Purpose: attach landed chart parser to Research layer without widening Generic capability.
- Hard Constraints:
  - raw pixels stay in R2 and model input for parser only; they never enter text answer context.
  - `chart_images` remains image ownership/removal authority.
  - `auto_match` only when ready matching calibration is actually used.
- Recommended Defaults:
  - convert chart parser outcome into evidence candidate for answer layer.
  - expose route decision and calibration status to Research answer renderer.
- Failure path 1: no ready calibration routes to user-confirm or visual-only, never auto.
- Failure path 2: wrong tenant/inactive/missing object routes to image not found before model call.
- Dependencies: PR #22 code, `check:chart-golden-set`, `check:chart-parse-eval`.
- Open decisions: final user-facing answer template belongs to Research Technical Analysis cutover sprint.

## Data Model

```jsonc
{
  "version": "1",
  "entities": [
    {
      "id": "agent_execution_request",
      "owner": "agent-runtime",
      "fields": {
        "run_id": "string",
        "request_id": "string",
        "tenant_id": "string",
        "user_id": "string",
        "layer": "generic|research",
        "mode": "dry_run|guarded_live|runner_remote",
        "allowed_tools": "string[]",
        "budget": "object",
        "context_refs": "object"
      }
    },
    {
      "id": "agent_execution_event",
      "owner": "agent-runtime",
      "fields": {
        "run_id": "string",
        "event_index": "integer",
        "layer": "generic|research",
        "event_type": "string",
        "payload": "object",
        "visible_to_user": "boolean",
        "created_at": "datetime"
      }
    },
    {
      "id": "agent_tool_capability",
      "owner": "agent-runtime",
      "fields": {
        "name": "string",
        "layer": "generic|research|both",
        "required_entitlement": "string|null",
        "requires_tenant_context": "boolean",
        "requires_evidence_binding": "boolean",
        "requires_calibration_gate": "boolean"
      }
    }
  ],
  "relationships": [
    "agent_execution_request.allowed_tools -> agent_tool_capability.name",
    "parse_chart_image -> chart_images via image_ref",
    "parse_chart_image -> calibration_runs via schema/prompt/model versions"
  ]
}
```

## Performance Targets

| Target | Number | Measurement Method | Degradation Threshold |
|---|---:|---|---:|
| Policy decision latency | <10 ms | unit test or local timing for pure policy function | >50 ms |
| Generic first token | <3 s | later guarded-live telemetry | >5 s |
| Research chart preflight | no model call on invalid ref | test model call counter | any call |

## Known Unknowns

| Item | Impact | Resolution Path | Owner |
|---|---|---|---|
| Production auth/session source | Blocks production route exposure | Dedicated auth/session cutover plan after convergence | Runtime owner |
| Entitlement field names | Blocks production paid Research policy | Align with billing/account runtime before Research cutover | Product/backend owner |
| FastClaw deployment and E2B limits | Blocks runner alpha | Validate in FastClaw runner adapter sprint | Infra/runtime owner |

## Developer Handoff

You are implementing this PRD.

- Build first: control-plane contract and layer tool policy in `@aiphabee/agent-runtime`.
- Do not reinterpret: `parse_chart_image` is research-only and already has tenant/image/calibration gates.
- You may improve: local module split inside `agent-runtime` if it reduces `index.ts` growth.
- Verify with:
  - `npx vitest run packages/agent-runtime/src/index.test.ts`
  - `npx vitest run packages/agent-runtime/src/parse-chart-image`
  - `npx vitest run apps/worker/src/index.test.ts`
  - `npm run check:agent-run-context`
  - `npm run check:tool-enforcement`
  - `npm run check:answer-evidence-contract`

### Acceptance Scripts

1. `npx vitest run packages/agent-runtime/src/index.test.ts packages/agent-runtime/src/parse-chart-image`
2. `npx vitest run apps/worker/src/index.test.ts`
3. `npm run check:agent-run-context && npm run check:tool-enforcement && npm run check:answer-evidence-contract`

## Backend Perspective

This PRD is backend/control-plane first. Frontend mode selection and FastClaw UX should not begin until route decisions, event envelope, and tool policy are stable. FastClaw remains an execution-plane adapter behind AiphaBee authority.
