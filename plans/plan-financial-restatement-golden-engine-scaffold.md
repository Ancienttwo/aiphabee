# Plan: Financial Restatement Golden Engine Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 17:02 +08
> **Slug**: financial-restatement-golden-engine-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/financial-restatement-golden-engine-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/financial-restatement-golden-engine-scaffold.notes.md`

## Agentic Routing

- Selected route: deterministic financial restatement engine package for Sprint
  1.1 DAT-03.
- Routing reason: financial statement/restatement schemas exist, but there is no
  executable logic proving version preservation, point-in-time selection, or
  restatement deltas.
- Due diligence:
  - P1 map: PRD §10.5, existing `core.financial_statement`,
    `core.financial_fact`, `core.financial_restatement`, golden fixtures, Worker
    `/data/runtime`.
  - P2 trace: synthetic statement versions -> timeline -> as-of selection ->
    restatement event deltas -> package tests -> Worker capability.
  - P3 decision rationale: implement deterministic synthetic engine only; do
    not load partner taxonomy, source samples, or live Serving reads.

## Workflow Inventory

- Active plan: `plans/plan-financial-restatement-golden-engine-scaffold.md`
- Task contract:
  `tasks/contracts/financial-restatement-golden-engine-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/financial-restatement-golden-engine-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/financial-restatement-golden-engine-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/financial-facts` as a deterministic package.
- Preserve original and restated statement versions without overwriting history.
- Select visible statement by `published_at` for point-in-time queries.
- Emit restatement deltas and reject accounting identity breaks.
- Expose synthetic golden capability through `/data/runtime`.

## Task Breakdown

- [x] Add financial facts/restatement package.
- [x] Implement restatement timeline construction.
- [x] Implement point-in-time statement selection.
- [x] Implement restatement delta generation and balance sheet identity guard.
- [x] Add synthetic golden cases and tests.
- [x] Expose Worker `/data/runtime` engine capability.
- [x] Update tracker/governance/todos.
- [x] Verify package tests, full checks, and workflow strict check.
