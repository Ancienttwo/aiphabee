# Plan: Serving Read Scaffold Default-Deny

> **Status**: Verified
> **Created**: 2026-06-20 17:10 +08
> **Slug**: serving-read-scaffold-default-deny
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/serving-read-scaffold-default-deny.contract.md`
> **Implementation Notes**:
> `tasks/notes/serving-read-scaffold-default-deny.notes.md`

## Agentic Routing

- Selected route: Data Access Gateway read-planner scaffold for Sprint 1.1.
- Routing reason: Serving Store schema and Gateway policy evaluator exist, but
  the Gateway decision did not yet carry a Serving read plan that proves
  default-deny and quality-hold stop before live reads.
- Due diligence:
  - P1 map: PRD Serving pipeline, `@aiphabee/serving-store`,
    `@aiphabee/data-access-gateway`, Worker `/gateway/runtime`, access
    contract, and no-live-data boundary.
  - P2 trace: access-check request -> Gateway evaluator -> serving read plan
    -> Worker runtime capability -> no SQL and no served rows.
  - P3 decision rationale: add a deterministic read planner only; preserve
    default-deny until partner rows, rights rows, quality release, and usage
    writes are live.

## Workflow Inventory

- Active plan: `plans/plan-serving-read-scaffold-default-deny.md`
- Task contract:
  `tasks/contracts/serving-read-scaffold-default-deny.contract.md`
- Implementation notes:
  `tasks/notes/serving-read-scaffold-default-deny.notes.md`
- Runtime evidence:
  `docs/governance/serving-read-scaffold-default-deny.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/serving-store` as a package-level read planner capability.
- Extend Data Access Gateway decisions with a `servingRead` plan.
- Keep `liveRead=false`, `servedRows=0`, and `sqlEmitted=false` for every
  current path.
- Expose read-planner capability on Worker `/gateway/runtime`.
- Keep live partner data, SQL reads, usage ledger live writes, and frontend out
  of scope.

## Task Breakdown

- [x] Add Serving Store read planner package scaffold.
- [x] Connect Gateway decisions to `servingRead`.
- [x] Preserve default-deny and quality-hold before live reads.
- [x] Expose Worker `/gateway/runtime` read-planner capability.
- [x] Update access contract guard and checker.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
