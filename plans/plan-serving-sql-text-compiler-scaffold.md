# Plan: Serving SQL Text Compiler Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 18:05 +08
> **Slug**: serving-sql-text-compiler-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/serving-sql-text-compiler-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/serving-sql-text-compiler-scaffold.notes.md`

## Agentic Routing

- Selected route: allow-listed SQL text compiler scaffold for Sprint 1.1 Data
  Access Gateway live Serving.
- Routing reason: Gateway can produce a no-execute SQL descriptor, but there was
  no executable boundary for compiling that descriptor into controlled SQL text.
- Due diligence:
  - P1 map: `@aiphabee/serving-store`, `@aiphabee/data-access-gateway`,
    Worker `/gateway/runtime`, `core.serving_record`, and Gateway contract guard
    manifest.
  - P2 trace: Gateway decision -> `servingRead` -> `servingQuery` ->
    `servingSqlDescriptor` -> `servingSqlText` -> Worker capability.
  - P3 decision rationale: compile only an allow-listed statement id into fixed
    SQL text with positional parameters; do not execute SQL, open Hyperdrive,
    load partner rows, or touch frontend.

## Workflow Inventory

- Active plan: `plans/plan-serving-sql-text-compiler-scaffold.md`
- Task contract:
  `tasks/contracts/serving-sql-text-compiler-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/serving-sql-text-compiler-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/serving-sql-text-compiler-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `createServingSqlTextPlan()` to `@aiphabee/serving-store`.
- Compile only `serving_record_projection_by_snapshot_v0`.
- Preserve positional parameter order for snapshot id, field set, time range,
  and limit.
- Block SQL text for blocked descriptors.
- Attach `servingSqlText` to every Data Access Gateway decision.
- Expose Worker `/gateway/runtime` SQL text compiler capability and contract
  guard.
- Keep SQL execution, Hyperdrive reads, partner rows, persistent usage writes,
  and frontend out of scope.

## Task Breakdown

- [x] Add Serving SQL text compiler contracts and deterministic planner.
- [x] Cover planned and blocked SQL text cases.
- [x] Attach `servingSqlText` to Gateway decisions.
- [x] Expose Worker runtime capability and guard.
- [x] Update Gateway access contract.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
