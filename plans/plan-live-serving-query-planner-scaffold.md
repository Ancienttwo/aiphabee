# Plan: Live Serving Query Planner Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 17:46 +08
> **Slug**: live-serving-query-planner-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/live-serving-query-planner-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/live-serving-query-planner-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic Serving query-plan scaffold for Sprint 1.1
  DAT-06 / Data Access Gateway live Serving.
- Routing reason: Serving read planning, quality release isolation, field
  entitlement policy source, and usage event planning exist, but Gateway did
  not yet compile an allowed released snapshot into a query plan.
- Due diligence:
  - P1 map: `@aiphabee/serving-store`, `@aiphabee/data-access-gateway`,
    Worker `/gateway/runtime`, and `deploy/gateway/access.contract.json`.
  - P2 trace: Gateway rights/field/quality decision -> `servingRead` ->
    released snapshot metadata -> `servingQuery` -> Worker runtime capability.
  - P3 decision rationale: add a no-SQL query-plan boundary first; do not
    connect Hyperdrive, Serving SQL, partner rows, or frontend.

## Workflow Inventory

- Active plan: `plans/plan-live-serving-query-planner-scaffold.md`
- Task contract:
  `tasks/contracts/live-serving-query-planner-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/live-serving-query-planner-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/live-serving-query-planner-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `createServingQueryPlan()` to `@aiphabee/serving-store`.
- Require an already planned read plus explicit released snapshot metadata.
- Block default-deny, quality-hold, and unreleased snapshots before SQL.
- Preserve cache-key material: data version, rights version, methodology,
  field set, time range, Serving snapshot id, and release state.
- Attach `servingQuery` to every Data Access Gateway decision.
- Expose Worker `/gateway/runtime` query planner capability and contract guard.
- Keep live SQL, Hyperdrive reads, partner rows, persistent usage writes, and
  frontend out of scope.

## Task Breakdown

- [x] Add Serving query planner contracts and deterministic planner.
- [x] Cover released, denied, quality-held, and unreleased snapshot cases.
- [x] Attach `servingQuery` to Gateway decisions.
- [x] Expose Worker runtime capability and guard.
- [x] Update Gateway access contract.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
