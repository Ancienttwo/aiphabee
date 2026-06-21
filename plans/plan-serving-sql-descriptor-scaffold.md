# Plan: Serving SQL Descriptor Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 17:56 +08
> **Slug**: serving-sql-descriptor-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/serving-sql-descriptor-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/serving-sql-descriptor-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic no-execute SQL descriptor scaffold for Sprint
  1.1 Data Access Gateway live Serving.
- Routing reason: Gateway can produce `servingQuery`, but there was no
  executable boundary for translating query material into a parameterized
  Serving Store SQL descriptor.
- Due diligence:
  - P1 map: `@aiphabee/serving-store`, `@aiphabee/data-access-gateway`,
    Worker `/gateway/runtime`, and Gateway contract guard manifest.
  - P2 trace: Gateway decision -> `servingRead` -> `servingQuery` ->
    `servingSqlDescriptor` -> Worker capability.
  - P3 decision rationale: expose statement id, selected fields, bindings, and
    row limit without SQL text, SQL execution, Hyperdrive, partner rows, or
    frontend.

## Workflow Inventory

- Active plan: `plans/plan-serving-sql-descriptor-scaffold.md`
- Task contract:
  `tasks/contracts/serving-sql-descriptor-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/serving-sql-descriptor-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/serving-sql-descriptor-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `createServingSqlDescriptor()` to `@aiphabee/serving-store`.
- Consume only `ServingQueryPlan`; block descriptors when the query plan is
  blocked.
- Output an allow-listed `statementId`, table set, selected field paths,
  snapshot/time/field/limit bindings, and no-execute flags.
- Attach `servingSqlDescriptor` to every Data Access Gateway decision.
- Expose Worker `/gateway/runtime` SQL descriptor capability and contract guard.
- Keep SQL text generation, SQL execution, Hyperdrive reads, partner rows,
  persistent usage writes, and frontend out of scope.

## Task Breakdown

- [x] Add Serving SQL descriptor contracts and deterministic planner.
- [x] Cover planned and blocked descriptor cases.
- [x] Attach `servingSqlDescriptor` to Gateway decisions.
- [x] Expose Worker runtime capability and guard.
- [x] Update Gateway access contract.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
