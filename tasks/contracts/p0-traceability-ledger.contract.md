# Task Contract: p0-traceability-ledger

> **Status**: Verified
> **Plan**: `plans/plan-p0-traceability-ledger.md`
> **Task Profile**: docs-only
> **Owner**: Codex
> **Capability ID**: gate0-p0-traceability
> **Last Updated**: 2026-06-20 14:32 +08
> **Notes File**: `tasks/notes/p0-traceability-ledger.notes.md`

## Goal

Create a repo-local traceability ledger that maps every P0 requirement in
tracker §M to an owner role, stable issue reference, test gate, and release
gate.

## Scope

- In scope:
  - P0 requirements only;
  - repo-local issue references;
  - owner roles;
  - planned test and release gates;
  - tracker/todo/closeout updates.
- Out of scope:
  - external GitHub/Jira/Linear issue creation;
  - named human owner assignment;
  - implementation of the requirements;
  - changing §M requirement completion statuses.

## Workflow Inventory

- Source plan: `plans/plan-p0-traceability-ledger.md`
- Source tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Ledger: `docs/governance/p0-traceability-ledger.md`
- Notes file: `tasks/notes/p0-traceability-ledger.notes.md`
- Scope gate: edit only paths listed under `allowed_paths`.

## Allowed Paths

```yaml
allowed_paths:
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/phase0-traceability-closeout.md
  - plans/plan-p0-traceability-ledger.md
  - tasks/contracts/p0-traceability-ledger.contract.md
  - tasks/notes/p0-traceability-ledger.notes.md
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
      purpose: traceability_scope_owner
    explorer:
      mode: read_only
      purpose: p0_requirement_extraction
    worker:
      mode: edit_within_allowed_paths
      purpose: ledger_delivery
    verifier:
      mode: read_only
      purpose: row_count_and_workflow_check
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - docs/governance/p0-traceability-ledger.md
    - plans/plan-p0-traceability-ledger.md
    - tasks/contracts/p0-traceability-ledger.contract.md
    - tasks/notes/p0-traceability-ledger.notes.md
  content_checks:
    - "Ledger has 53 P0 requirement rows"
    - "Each P0 row has issue_ref, owner, sprint, test_gate, release_gate, implementation_state"
    - "Tracker Sprint 0.4 traceability leaf is checked"
    - "Tracker §M requirement statuses are not incorrectly marked complete"
  commands_succeed:
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes Sprint 0.4's traceability ledger leaf only.
- It does not complete any P0 feature requirement.
- External issue tracker sync can be added later without changing the stable
  repo-local `issue_ref` values.

## Rollback Point

- Revert the commit that adds this ledger and status update.
