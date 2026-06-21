# Task Contract: golden-quality-commercial-baseline

> **Status**: Verified
> **Plan**: `plans/plan-golden-quality-commercial-baseline.md`
> **Task Profile**: docs-only
> **Owner**: Codex
> **Capability ID**: gate0-quality-commercial
> **Last Updated**: 2026-06-20 13:51 +08
> **Notes File**: `tasks/notes/golden-quality-commercial-baseline.notes.md`

## Goal

Deliver a Phase 0 baseline for golden samples, data quality rules, data
quality hold/correction workflows, package entitlements, weighted credits, unit
economics, and Free-tier abuse limits.

## Scope

- In scope:
  - docs-only quality/commercial baseline;
  - plan/contract/notes;
  - sprint/tracker status updates for this task.
- Out of scope:
  - executable fixture files;
  - CI quality runner;
  - billing implementation;
  - runtime entitlement enforcement;
  - signed pricing approval.

## Workflow Inventory

- Source plan: `plans/plan-golden-quality-commercial-baseline.md`
- Source sprint: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
- Deferred-goal ledger: `tasks/todos.md`
- Notes file: `tasks/notes/golden-quality-commercial-baseline.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Scope gate: edit only paths listed under `allowed_paths`.

## Allowed Paths

```yaml
allowed_paths:
  - docs/governance/golden-quality-commercial-baseline.md
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - plans/plan-golden-quality-commercial-baseline.md
  - plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md
  - tasks/contracts/golden-quality-commercial-baseline.contract.md
  - tasks/notes/golden-quality-commercial-baseline.notes.md
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
      purpose: source_and_repo_research
    worker:
      mode: edit_within_allowed_paths
      purpose: docs_baseline_delivery
    verifier:
      mode: read_only
      purpose: exit_criteria_review
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - docs/governance/golden-quality-commercial-baseline.md
    - plans/plan-golden-quality-commercial-baseline.md
    - tasks/contracts/golden-quality-commercial-baseline.contract.md
    - tasks/notes/golden-quality-commercial-baseline.notes.md
  content_checks:
    - "Baseline records golden sample categories and manifest shape"
    - "Baseline records automatic quality rules"
    - "Baseline records data quality hold workflow"
    - "Baseline records data correction workflow"
    - "Baseline records package entitlement matrix"
    - "Baseline records weighted credits model"
    - "Baseline records unit economics model"
    - "Baseline records Free-tier abuse limits"
  commands_succeed:
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes the Sprint 0.3 design backlog.
- Sprint 0.3 DoD remains open until golden sample fixtures and quality rules are
  executable in CI and commercial model assumptions are reviewed against real
  partner/infrastructure costs.

## Rollback Point

- Revert the commit that adds this baseline and status update.
