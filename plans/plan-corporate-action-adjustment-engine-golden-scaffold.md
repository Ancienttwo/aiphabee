# Plan: Corporate Action Adjustment Engine Golden Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 16:55 +08
> **Slug**: corporate-action-adjustment-engine-golden-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/corporate-action-adjustment-engine-golden-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/corporate-action-adjustment-engine-golden-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic adjustment engine package for Sprint 1.1 DAT-04.
- Routing reason: corporate-action storage schema exists, but there is no
  executable method-versioned adjustment logic or synthetic golden parity check.
- Due diligence:
  - P1 map: PRD §10.4 adjustment methodology, existing `core.corporate_action`
    and `core.price_adjustment_factor` schema, golden fixture gate, Worker
    `/data/runtime`.
  - P2 trace: synthetic price bars + actions -> adjustment factors -> adjusted
    observations -> package tests -> Worker capability.
  - P3 decision rationale: implement deterministic synthetic engine only; do
    not claim partner/public benchmark parity without partner bars or live
    Serving reads.

## Workflow Inventory

- Active plan:
  `plans/plan-corporate-action-adjustment-engine-golden-scaffold.md`
- Task contract:
  `tasks/contracts/corporate-action-adjustment-engine-golden-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/corporate-action-adjustment-engine-golden-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/corporate-action-adjustment-engine-golden-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/corporate-actions` as a deterministic package.
- Support `raw`, `split_adjusted`, and `total_return_adjusted` output fields.
- Support split, consolidation, and cash dividend actions under a
  backward-adjusted methodology.
- Expose three synthetic golden cases through package tests and
  `/data/runtime` capability.
- Keep partner data, live DB reads, and frontend out of scope.

## Task Breakdown

- [x] Add corporate-action adjustment package.
- [x] Implement split/consolidation backward adjustment factors.
- [x] Implement cash dividend total-return factor.
- [x] Add synthetic golden cases and tests.
- [x] Expose Worker `/data/runtime` engine capability.
- [x] Update tracker/governance/todos.
- [x] Verify package tests, full checks, and workflow strict check.
