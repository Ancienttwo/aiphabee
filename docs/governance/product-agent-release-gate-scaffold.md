# Product Agent Release Gate Scaffold

> **Status**: Backend scaffold
> **Last Updated**: 2026-06-21 22:08 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/product-agent-release-gate-scaffold.contract.md`

This slice completes the backend-only Sprint 3.3 §19.2 scaffold for proving
security ambiguity cannot be silently selected and concrete financial numbers
must be backed by a tool result or deterministic calculation reference.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/agent-runtime` | Owns pre-tool-call resolution, tool-loop planning, numeric source guard, and answer/evidence contract |
| Runtime route | `GET /agent/runtime` | Reports nested `product_agent_release_gate` readiness |
| Gate route | `POST /agent/release-gates/product-agent/plan` | Returns ambiguity and numeric-evidence release gate checks |
| Preflight source | `POST /agent/runs/preflight` | Produces blocking clarification for ambiguous securities before tool planning |
| Tool-loop source | `POST /agent/runs/plan` | Produces `numeric_source_guard` and `answer_evidence_contract` without model/tool execution |
| Contract | `deploy/agent/product-agent-release-gate.contract.json` | Guards required checks, no-live boundaries, linked contracts, and release blockers |
| Schema scaffold | `aiphabee_core.product_agent_release_gate`, `aiphabee_governance.product_agent_release_gate_contract` | Empty future persistence tables |
| Explicitly absent | Live post-generation numeric extraction, live evidence binding, frontend clarification UI | Remain blocked or delegated |

## P2 Concrete Trace

1. Caller requests `POST /agent/release-gates/product-agent/plan`.
2. Worker normalizes optional ambiguous security query, numeric prompt, locale,
   response depth, user, workspace, and tool list.
3. The gate calls `createPreToolCallResolution()` with `ABC`.
4. Preflight returns two ambiguous candidates, no resolved security, blocking
   clarification, and `tool_readiness.can_plan_tools=false`.
5. The gate calls `createToolLoopAgentPlan()` for `00700.HK` with numeric source
   tools.
6. Tool-loop output embeds `numeric_source_guard` requiring `tool_result` or
   `deterministic_calculation`, plus `answer_evidence_contract` requiring fact
   evidence cards and calculation refs.
7. Response returns standard envelope metadata, release checks, and blockers
   while preserving no model calls, no tool execution, no SQL, and no frontend
   rendering.

## P3 Design Decision

Selected a release-gate planner inside `@aiphabee/agent-runtime` instead of
duplicating ambiguity or numeric evidence logic.

Reason:

- The product gate is a cross-check over existing runtime invariants, not a new
  resolver or answer parser.
- Reusing preflight and tool-loop planner functions keeps the gate tied to the
  same contracts that production execution will later pass through.
- The current repo can prove planning-time controls while still naming the live
  blockers.

Tradeoff:

- The repo can now test the release-gate contract for silent selection and
  numeric evidence binding.
- Live post-generation extraction, live evidence binding, and frontend
  clarification rendering remain future work.

## Verification

Run the focused gate:

- `npm run check:product-agent-release-gate`
- `npm run check:database`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
