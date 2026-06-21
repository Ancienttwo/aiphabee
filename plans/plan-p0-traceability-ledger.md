# Plan: P0 Traceability Ledger

> **Status**: Verified
> **Created**: 2026-06-20 14:32 +08
> **Slug**: p0-traceability-ledger
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md` §M
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**: `tasks/contracts/p0-traceability-ledger.contract.md`
> **Implementation Notes**: `tasks/notes/p0-traceability-ledger.notes.md`

## Agentic Routing

- Selected route: governance traceability ledger
- Routing reason: Sprint 0.4 has an open PRD §23.12 requirement to map every P0
  requirement to issue, owner, test, and release gate; this is non-frontend and
  not blocked by external approvals.
- Due diligence:
  - P1 map: PRD requirement IDs, tracker §M, Sprint 0.4 traceability leaf,
    repo-local issue references.
  - P2 trace: tracker §M row -> ledger row -> owner/issue/test/release gate ->
    tracker Sprint 0.4 checkbox.
  - P3 decision rationale: use stable repo-local issue refs until an external
    issue tracker is selected.

## Workflow Inventory

- Active plan: `plans/plan-p0-traceability-ledger.md`
- Task contract: `tasks/contracts/p0-traceability-ledger.contract.md`
- Implementation notes: `tasks/notes/p0-traceability-ledger.notes.md`
- Ledger: `docs/governance/p0-traceability-ledger.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extract all P0 requirement rows from tracker §M.
- Assign each row a stable `AIP-P0-*` repo-local issue reference.
- Assign accountable owner roles and planned test/release gates.
- Keep requirement implementation statuses unchanged unless the requirement is
  actually delivered.
- Update Sprint 0.4 completion only for the traceability ledger leaf.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Wait for GitHub/Jira/Linear tracker | Real issue IDs | Blocks traceability on tool choice | Rejected |
| Use repo-local issue refs | Stable now and easy to migrate | Requires later external sync if desired | Selected |
| Mark P0 requirements complete | Inflates progress | Requirements are not implemented | Rejected |

## File Changes

| File | Action | Description |
|---|---|---|
| `docs/governance/p0-traceability-ledger.md` | Add | 53-row P0 owner/issue/test/release ledger |
| `plans/plan-p0-traceability-ledger.md` | Add | Plan for the traceability slice |
| `tasks/contracts/p0-traceability-ledger.contract.md` | Add | Execution contract |
| `tasks/notes/p0-traceability-ledger.notes.md` | Add | Notes and verification |
| `docs/AiphaBee_Sprint_Tracker_v1.0.md` | Update | Mark Sprint 0.4 traceability leaf complete |
| `docs/governance/phase0-traceability-closeout.md` | Update | Replace missing traceability state with ledger state |
| `docs/governance/engineering-runtime-scaffold.md` | Update | Remove stale traceability residual gap |
| `tasks/todos.md` | Update | Remove completed traceability blocker |

## Evidence Contract

- State/progress path: tracker Sprint 0.4 and `docs/governance/p0-traceability-ledger.md`.
- Verification evidence: P0 row count check and `scripts/check-task-workflow.sh --strict`.
- Evaluator rubric: all P0 rows from tracker §M have owner, issue ref, test gate,
  release gate; no P1/P2 requirements are incorrectly counted as P0.
- Stop condition: ledger has 53 P0 rows and tracker Sprint 0.4 increases by one
  checked leaf without marking Phase 0 green.
- Rollback surface: revert this commit.

## Task Breakdown

- [x] Extract P0 IDs from tracker §M.
- [x] Build repo-local issue/owner/test/release ledger.
- [x] Update tracker and deferred ledger.
- [x] Verify count and workflow strict check.
