# Plan: Data Contract Methodology Baseline

> **Status**: Verified
> **Created**: 2026-06-20 13:34 +08
> **Slug**: data-contract-methodology-baseline
> **Spec**: `docs/spec.md`
> **Source Sprint**: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**: `tasks/contracts/data-contract-methodology-baseline.contract.md`
> **Implementation Notes**: `tasks/notes/data-contract-methodology-baseline.notes.md`

## Agentic Routing

- Selected route: docs-only data methodology baseline
- Routing reason: PRD Phase 0 requires fixed data contracts and methodology before implementation.
- Due diligence:
  - P1 map: PRD §10/§11.5 -> tracker Sprint 0.2 -> sprint backlog row 2 -> governance baseline.
  - P2 trace: partner record -> raw snapshot -> standardized row -> quality gate -> derived metric -> serving row -> gateway response.
  - P3 decision rationale: keep data methods versioned and point-in-time safe; do not implement physical schemas before partner fields and Gate 0 rights are signed.

## Workflow Inventory

- Active plan: `plans/plan-data-contract-methodology-baseline.md`
- Task contract: `tasks/contracts/data-contract-methodology-baseline.contract.md`
- Implementation notes: `tasks/notes/data-contract-methodology-baseline.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: docs-only files listed in task contract `allowed_paths`.

## Approach

### Strategy

Create a single baseline document that fixes:

- partner data contract shape;
- canonical company/instrument/listing/identifier history model;
- time/version and point-in-time rules;
- price adjustment methodology;
- financial restatement model;
- metric definition library v0;
- HK trading calendar model;
- Raw -> Standardized -> Quality -> Derived -> Serving -> Gateway pipeline.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Wait for partner sample files | Avoids placeholder fields | Blocks methodology work and Phase 0 sequencing | Rejected |
| Implement database schema now | Creates executable progress | Premature before rights and partner schemas | Rejected |
| Document versioned methodology baseline | Enables review and later schema work | Leaves partner signature pending | Selected |

## File Changes

| File | Action | Description |
|---|---|---|
| `docs/governance/data-contract-methodology-baseline.md` | Add | Data contract and methodology baseline |
| `plans/plan-data-contract-methodology-baseline.md` | Add | Plan for sprint backlog row 2 |
| `tasks/contracts/data-contract-methodology-baseline.contract.md` | Add | Docs-only execution contract |
| `tasks/notes/data-contract-methodology-baseline.notes.md` | Add | Notes and evidence |
| `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md` | Update | Mark backlog row 2 complete |
| `docs/AiphaBee_Sprint_Tracker_v1.0.md` | Update | Mark Sprint 0.2 design backlog complete, while leaving DoD unsigned |

## Evidence Contract

- State/progress path: sprint row 2 and tracker Sprint 0.2.
- Verification evidence: `scripts/check-task-workflow.sh --strict`.
- Evaluator rubric: baseline includes every Sprint 0.2 design item and keeps partner-signature DoD open.
- Stop condition: design baseline exists, sprint row 2 checked, tracker Sprint 0.2 backlog is 9/9 with exit gate still not green.
- Rollback surface: revert this commit.

## Task Breakdown

- [x] Record partner contract baseline.
- [x] Record canonical security master model.
- [x] Record time/version and point-in-time rules.
- [x] Record price adjustment methodology.
- [x] Record financial restatement model.
- [x] Record metric definition library v0.
- [x] Record HK trading calendar model.
- [x] Record productized data pipeline.
- [x] Run workflow strict check.
