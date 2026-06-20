# Plan: Serving Quality Release Isolation Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 17:20 +08
> **Slug**: serving-quality-release-isolation-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/serving-quality-release-isolation-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/serving-quality-release-isolation-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic Serving quality release/isolation scaffold for
  Sprint 1.1 DAT-06.
- Routing reason: Serving Store schema and read planning exist, but quality
  states were not yet converted into executable `held/released/withdrawn`
  Serving release posture.
- Due diligence:
  - P1 map: PRD quality hold workflow, Serving Store schema `quality_state` and
    `release_state`, `@aiphabee/serving-store`, Worker `/data/runtime` and
    `/gateway/runtime`, Gateway contract guard manifest.
  - P2 trace: quality state input -> release isolation plan -> runtime
    capability -> Gateway guard manifest -> no live SQL/read/write.
  - P3 decision rationale: model release/isolation semantics first; do not
    mutate a live database or serve partner rows until data contracts and live
    quality release jobs exist.

## Workflow Inventory

- Active plan:
  `plans/plan-serving-quality-release-isolation-scaffold.md`
- Task contract:
  `tasks/contracts/serving-quality-release-isolation-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/serving-quality-release-isolation-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/serving-quality-release-isolation-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a Serving quality release planner to `@aiphabee/serving-store`.
- Map `PASS/WARN` to `released`, `HOLD` to `held`, and `REJECT_RAW` to
  `withdrawn`.
- Keep all non-released plans mapped to `DATA_QUALITY_HOLD`.
- Expose release/isolation capability on Worker `/data/runtime` and
  `/gateway/runtime`.
- Keep live DB writes, live Serving reads, partner data loading, billing, and
  frontend out of scope.

## Task Breakdown

- [x] Add quality release isolation plan API.
- [x] Cover PASS/WARN/HOLD/REJECT_RAW release semantics with tests.
- [x] Expose Worker runtime quality release capability.
- [x] Add `serving_quality_release_isolation` Gateway contract guard.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
