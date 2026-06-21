# Plan: Golden Quality Commercial Baseline

> **Status**: Verified
> **Created**: 2026-06-20 13:51 +08
> **Slug**: golden-quality-commercial-baseline
> **Spec**: `docs/spec.md`
> **Source Sprint**: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**: `tasks/contracts/golden-quality-commercial-baseline.contract.md`
> **Implementation Notes**: `tasks/notes/golden-quality-commercial-baseline.notes.md`

## Agentic Routing

- Selected route: docs-only quality/commercial baseline
- Routing reason: Sprint 0.3 requires a reviewable golden sample, quality, correction, entitlement, credit, and unit-economics baseline before implementation.
- Due diligence:
  - P1 map: PRD §10.7/§10.8/§15 -> tracker Sprint 0.3 -> sprint backlog row 3 -> governance baseline.
  - P2 trace: standardized row -> quality rules -> PASS/WARN/HOLD -> serving/gateway behavior -> correction and notification path.
  - P3 decision rationale: define quality/commercial invariants now; defer executable CI fixtures and billing runtime until engineering foundation.

## Workflow Inventory

- Active plan: `plans/plan-golden-quality-commercial-baseline.md`
- Task contract: `tasks/contracts/golden-quality-commercial-baseline.contract.md`
- Implementation notes: `tasks/notes/golden-quality-commercial-baseline.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: docs-only files listed in task contract `allowed_paths`.

## Approach

### Strategy

Create a single baseline document that fixes:

- golden sample registry and acceptance checks;
- quality rule catalog and quality-hold workflow;
- data correction state machine;
- package entitlement matrix;
- weighted credits model;
- unit economics model;
- Free-tier abuse limits.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Wait for real partner/sample data | More concrete fixtures | Blocks Phase 0 design and still lacks rights approvals | Rejected |
| Implement quality engine now | Executable progress | Premature without schema/fixtures and engineering foundation | Rejected |
| Document reviewable baseline | Unblocks planning and preserves invariants | Leaves CI and runtime work pending | Selected |

## File Changes

| File | Action | Description |
|---|---|---|
| `docs/governance/golden-quality-commercial-baseline.md` | Add | Golden samples, quality rules, correction, commercial baseline |
| `plans/plan-golden-quality-commercial-baseline.md` | Add | Plan for sprint backlog row 3 |
| `tasks/contracts/golden-quality-commercial-baseline.contract.md` | Add | Docs-only execution contract |
| `tasks/notes/golden-quality-commercial-baseline.notes.md` | Add | Notes and evidence |
| `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md` | Update | Mark backlog row 3 complete |
| `docs/AiphaBee_Sprint_Tracker_v1.0.md` | Update | Mark Sprint 0.3 design backlog complete, DoD still not green |

## Evidence Contract

- State/progress path: sprint row 3 and tracker Sprint 0.3.
- Verification evidence: `scripts/check-task-workflow.sh --strict`.
- Evaluator rubric: baseline covers each Sprint 0.3 backlog item and keeps executable/review gates open.
- Stop condition: design baseline exists, sprint row 3 checked, tracker Sprint 0.3 backlog is 9/9 with exit gate still not green.
- Rollback surface: revert this commit.

## Task Breakdown

- [x] Record golden sample categories and manifest shape.
- [x] Record quality rule catalog.
- [x] Record quality-hold and data-correction workflows.
- [x] Record package entitlement matrix.
- [x] Record weighted credits model.
- [x] Record unit economics model.
- [x] Record Free-tier abuse limits.
- [x] Run workflow strict check.
