# Task Contract: phase0-traceability-closeout

> **Status**: Verified
> **Plan**: `plans/plan-phase0-traceability-closeout.md`
> **Task Profile**: docs-only
> **Owner**: Codex
> **Capability ID**: gate0-program-closeout
> **Last Updated**: 2026-06-20 14:24 +08
> **Notes File**: `tasks/notes/phase0-traceability-closeout.notes.md`

## Goal

Close the Phase 0 sprint backlog at the program-evidence layer by reconciling
completed artifacts, blocked exit gates, tracker status, PRD traceability
maturity, `tasks/todos.md`, and the next executable slice.

## Scope

- In scope:
  - docs-only closeout;
  - plan/contract/notes;
  - sprint/tracker/todos status updates.
- Out of scope:
  - resolving external legal/data approvals;
  - runtime scaffold implementation;
  - CI implementation;
  - P0 issue tracker creation;
  - pushing/remote reconciliation.

## Workflow Inventory

- Source plan: `plans/plan-phase0-traceability-closeout.md`
- Source sprint: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
- Deferred-goal ledger: `tasks/todos.md`
- Notes file: `tasks/notes/phase0-traceability-closeout.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Scope gate: edit only paths listed under `allowed_paths`.

## Allowed Paths

```yaml
allowed_paths:
  - docs/governance/phase0-traceability-closeout.md
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - plans/plan-phase0-traceability-closeout.md
  - plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md
  - tasks/contracts/phase0-traceability-closeout.contract.md
  - tasks/notes/phase0-traceability-closeout.notes.md
  - tasks/todos.md
```

## Delegation Contract

```yaml
delegation:
  budget:
    tokens: null
    tool_calls: null
    wall_time_minutes: null
  permission_scope:
    mode: inherit_allowed_paths
    writable_paths: []
    network: inherited
  roles:
    parent:
      mode: narrate_and_gatekeep
      purpose: approval_checkpoint_owner
    explorer:
      mode: read_only
      purpose: evidence_reconciliation
    worker:
      mode: edit_within_allowed_paths
      purpose: closeout_delivery
    verifier:
      mode: read_only
      purpose: exit_criteria_review
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - docs/governance/phase0-traceability-closeout.md
    - plans/plan-phase0-traceability-closeout.md
    - tasks/contracts/phase0-traceability-closeout.contract.md
    - tasks/notes/phase0-traceability-closeout.notes.md
  content_checks:
    - "Closeout records completed evidence artifacts"
    - "Closeout records blocked Phase 0 exit gates"
    - "Closeout records PRD traceability maturity"
    - "tasks/todos.md records deferred blockers"
    - "Sprint row 5 is marked complete"
  commands_succeed:
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task closes the current Phase 0 sprint backlog row, not the full Phase 0 gate.
- Phase 0 remains active until external approvals and implementation gates are green.

## Rollback Point

- Revert the commit that adds this closeout and status update.
