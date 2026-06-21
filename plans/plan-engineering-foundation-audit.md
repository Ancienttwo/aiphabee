# Plan: Engineering Foundation Audit

> **Status**: Verified
> **Created**: 2026-06-20 14:08 +08
> **Slug**: engineering-foundation-audit
> **Spec**: `docs/spec.md`
> **Source Sprint**: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**: `tasks/contracts/engineering-foundation-audit.contract.md`
> **Implementation Notes**: `tasks/notes/engineering-foundation-audit.notes.md`

## Agentic Routing

- Selected route: docs-only engineering audit
- Routing reason: Sprint 0.4 requires repo intake and PRD §23 mapping before runtime scaffold implementation.
- Due diligence:
  - P1 map: repo root/harness/docs/design-system/deploy/architecture placeholders vs PRD §23.
  - P2 trace: PRD requirement -> current repo artifact check -> gap -> first scaffold entry.
  - P3 decision rationale: complete audit without inventing runtime; leave app scaffold to a separate code-change slice.

## Workflow Inventory

- Active plan: `plans/plan-engineering-foundation-audit.md`
- Task contract: `tasks/contracts/engineering-foundation-audit.contract.md`
- Implementation notes: `tasks/notes/engineering-foundation-audit.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: docs-only files listed in task contract `allowed_paths`.

## Approach

### Strategy

Audit PRD §23 and Sprint 0.4 against the actual repository, then define:

- existing surfaces;
- missing runtime surfaces;
- recommended monorepo topology;
- Cloudflare binding plan;
- first scaffold slice;
- verification commands required by the next implementation task.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Implement scaffold immediately | Faster visible runtime progress | Mixes audit and code-change task; version choices need a separate coherent slice | Rejected |
| Only update tracker | Minimal changes | Does not preserve PRD §23 evidence | Rejected |
| Write audit and leave scaffold pending | Clear next implementation boundary | Requires another task before runtime exists | Selected |

## File Changes

| File | Action | Description |
|---|---|---|
| `docs/governance/engineering-foundation-audit.md` | Add | PRD §23 and Sprint 0.4 current-state audit |
| `plans/plan-engineering-foundation-audit.md` | Add | Plan for sprint backlog row 4 |
| `tasks/contracts/engineering-foundation-audit.contract.md` | Add | Docs-only execution contract |
| `tasks/notes/engineering-foundation-audit.notes.md` | Add | Notes and verification |
| `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md` | Update | Mark backlog row 4 complete |
| `docs/AiphaBee_Sprint_Tracker_v1.0.md` | Update | Mark only the PRD §23 audit item complete in Sprint 0.4 |

## Evidence Contract

- State/progress path: sprint row 4 and tracker Sprint 0.4.
- Verification evidence: `scripts/check-task-workflow.sh --strict`.
- Evaluator rubric: audit maps all PRD §23 items to current repo state and does not claim missing scaffold tasks are done.
- Stop condition: audit exists, sprint row 4 checked, tracker Sprint 0.4 completion is 1/10 with exit gate not green.
- Rollback surface: revert this commit.

## Task Breakdown

- [x] Inspect current root/runtime/deploy/architecture surfaces.
- [x] Map PRD §23 to current state.
- [x] Map Sprint 0.4 items to completion/gap state.
- [x] Document recommended runtime topology and first scaffold slice.
- [x] Run workflow strict check.
