# Plan: Gate 0 Rights Regulatory Decision Pack

> **Status**: Verified
> **Created**: 2026-06-20 13:18 +08
> **Slug**: gate0-rights-regulatory-decision-pack
> **Spec**: `docs/spec.md`
> **Source Sprint**: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**: `tasks/contracts/gate0-rights-regulatory-decision-pack.contract.md`
> **Implementation Notes**: `tasks/notes/gate0-rights-regulatory-decision-pack.notes.md`

## Agentic Routing

- Selected route: docs-only Gate 0 evidence closeout
- Routing reason: external legal/data approvals are not available; the safe task is to record decision surfaces, default-deny runtime implications, and remaining blockers.
- Due diligence:
  - P1 map: PRD §14/§18 -> tracker Sprint 0.1 -> sprint backlog row 1 -> governance packet.
  - P2 trace: unconfirmed market-data field -> rights matrix `UNCONFIRMED` -> runtime `DEFAULT_DENY` -> later Gateway error `DATA_NOT_LICENSED`.
  - P3 decision rationale: preserve Gate 0 invariant; do not build Phase 1 code or mark legal/data approvals as complete without external evidence.

## Workflow Inventory

- Active plan: `plans/plan-gate0-rights-regulatory-decision-pack.md`
- Task contract: `tasks/contracts/gate0-rights-regulatory-decision-pack.contract.md`
- Implementation notes: `tasks/notes/gate0-rights-regulatory-decision-pack.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: docs-only files listed in the task contract `allowed_paths`.

## Approach

### Strategy

Create a single reviewable Gate 0 packet that records:

- field-level rights matrix v0;
- default-deny gaps;
- HKEX/vendor licensing questions;
- Type 4 review scope and MVP boundary copy;
- PCPD/privacy path;
- commercial settlement dimensions;
- signature register and go/no-go rule.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Wait for external counsel/data partner documents | Avoids provisional language | Blocks repo execution and leaves no contract for evidence collection | Rejected |
| Mark Sprint 0.1 tasks complete from PRD assumptions | Creates apparent progress | Unsafe and false; no external evidence | Rejected |
| Record a default-deny packet and blockers | Safe, executable, supports next evidence collection | Leaves Gate 0 blocked | Selected |

## File Changes

| File | Action | Description |
|---|---|---|
| `docs/governance/gate0-rights-regulatory-decision-pack.md` | Add | Gate 0 packet and rights/regulatory matrix |
| `plans/plan-gate0-rights-regulatory-decision-pack.md` | Add | Plan for the sprint backlog task |
| `tasks/contracts/gate0-rights-regulatory-decision-pack.contract.md` | Add | Docs-only execution contract |
| `tasks/notes/gate0-rights-regulatory-decision-pack.notes.md` | Add | Implementation notes and evidence |
| `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md` | Update | Mark backlog row 1 complete with plan link and execution log |
| `docs/AiphaBee_Sprint_Tracker_v1.0.md` | Update | Add current Gate 0 packet status without marking external approvals complete |

## Evidence Contract

- State/progress path: sprint row 1 and tracker §F.
- Verification evidence: `scripts/check-task-workflow.sh --strict`.
- Evaluator rubric: packet includes all acceptance fields and leaves unsupported external approvals pending.
- Stop condition: Gate 0 packet exists and task row is checked; Sprint 0.1 external tasks remain unchecked.
- Rollback surface: revert this commit.

## Task Breakdown

- [x] Record rights/regulatory official boundary checks.
- [x] Add field-level rights matrix v0 with `DEFAULT_DENY`.
- [x] Add Type 4, PCPD, commercial, and signature sections.
- [x] Update sprint/tracker state.
- [x] Run workflow strict check.
