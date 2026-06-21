# Plan: Serving Execution Adapter Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 18:14 +08
> **Slug**: serving-execution-adapter-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/serving-execution-adapter-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/serving-execution-adapter-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live execution adapter scaffold for Sprint 1.1 Data Access
  Gateway live Serving.
- Routing reason: Gateway can compile Serving SQL text, but there was no adapter
  boundary that accepts SQL text and explicitly defers execution.
- Due diligence:
  - P1 map: `@aiphabee/serving-store`, `@aiphabee/data-access-gateway`,
    Worker `/gateway/runtime`, and Gateway contract guard manifest.
  - P2 trace: Gateway decision -> `servingRead` -> `servingQuery` ->
    `servingSqlDescriptor` -> `servingSqlText` -> `servingExecution`.
  - P3 decision rationale: define the Hyperdrive adapter shape without live
    execution, live rows, partner data, or frontend.

## Workflow Inventory

- Active plan: `plans/plan-serving-execution-adapter-scaffold.md`
- Task contract:
  `tasks/contracts/serving-execution-adapter-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/serving-execution-adapter-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/serving-execution-adapter-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `createServingExecutionAdapterPlan()` to `@aiphabee/serving-store`.
- Accept only `ServingSqlTextPlan` as input.
- Preserve upstream blocked reasons.
- For planned SQL text, return `execution_deferred` with
  `LIVE_SERVING_EXECUTION_DISABLED`.
- Always return `executionReady=false`, `sqlExecuted=false`, `liveRead=false`,
  `rows=[]`, and `servedRows=0`.
- Attach `servingExecution` to every Data Access Gateway decision.
- Expose Worker `/gateway/runtime` execution adapter capability and contract
  guard.
- Keep Hyperdrive execution, partner rows, persistent usage writes, and frontend
  out of scope.

## Task Breakdown

- [x] Add Serving execution adapter contracts and deterministic planner.
- [x] Cover deferred and blocked execution cases.
- [x] Attach `servingExecution` to Gateway decisions.
- [x] Expose Worker runtime capability and guard.
- [x] Update Gateway access contract.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
