# Implementation Notes: users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate

> **Status**: Complete
> **Plan**: plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md
> **Contract**: tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md
> **Review**: tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md
> **Last Updated**: 2026-07-03 21:33
> **Lifecycle**: notes

## Design Decisions

- Added `evaluateAgentLayerToolPolicy` in `packages/agent-runtime/src/index.ts` as the deterministic pre-planning gate. It defaults normal Agent runs to the existing scaffold tools, blocks unknown tools, and treats `parse_chart_image` as Research-only.
- Required all Research chart requests to carry explicit `technical_analysis` entitlement, tenant context, and image reference. The policy does not infer Research mode from prompt text, image names, or tool names.
- Registered `parse_chart_image` in `packages/tool-registry/src/index.ts` so successful Research requests cross the same tool version/schema/readback path as other tools.
- Wired `/agent/runs/dry-run` and `/agent/runs/plan` in `apps/worker/src/index.ts` to evaluate layer tool policy before skeleton/plan creation and return policy evidence headers on denial.
- Kept Worker success paths dry-run/no live execution. Allowed Research chart planning returns the planned tool descriptor only.
- Split registry and MCP boundaries after test feedback: Data Gateway P0 rights matrix covers all registered tools, while MCP schema/list/call surfaces only expose tools with an explicit MCP validation rule.

## Deviations From Plan Or Spec

- Added MCP runtime changes because adding a non-MCP Agent tool to the shared registry otherwise caused MCP schema snapshot generation to crash and risked exposing the tool through direct `tools/call`.
- Added Data Gateway P0 rights matrix count/test updates because registering a new tool changes the default-deny rights coverage surface.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Keep `parse_chart_image` outside shared registry | Rejected | Research success would bypass existing registry validation/readback and create a second tool contract surface. |
| Add `parse_chart_image` to MCP schemas | Rejected | The task only approves Agent/Worker policy gating; MCP exposure would widen the product surface. |
| Infer Research layer from `parse_chart_image` request | Rejected | Violates fail-closed policy and would silently translate user intent. |
| Fail unknown tools in Worker policy before runtime telemetry | Accepted | The new policy gate is the earlier source of truth for requested-tool admissibility. |

## Open Questions

- None for this slice. Real chart execution still depends on the later runner/tool execution slice.

## Verification Evidence

- `npx vitest run packages/agent-runtime/src/index.test.ts`
- `npx vitest run packages/agent-runtime/src/parse-chart-image`
- `npx vitest run packages/tool-registry/src/index.test.ts`
- `npx vitest run packages/mcp-runtime/src/index.test.ts`
- `npx vitest run packages/data-access-gateway/src/index.test.ts`
- `npx vitest run apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/tool-registry`
- `npm run typecheck --workspace @aiphabee/mcp-runtime`
- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`

## Promotion Candidates

- Promote the MCP split only if another non-MCP registry tool is added and hits the same schema/list/call boundary.
