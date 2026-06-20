# Task Contract: data-contract-methodology-baseline

> **Status**: Verified
> **Plan**: `plans/plan-data-contract-methodology-baseline.md`
> **Task Profile**: docs-only
> **Owner**: Codex
> **Capability ID**: gate0-data-methodology
> **Last Updated**: 2026-06-20 13:34 +08
> **Notes File**: `tasks/notes/data-contract-methodology-baseline.notes.md`

## Goal

Deliver a Phase 0 data contract and methodology baseline covering the partner
contract shape, security master, time/version model, point-in-time rule,
adjustment methodology, financial restatement model, metric library v0, HK
calendar model, and data product pipeline.

## Scope

- In scope:
  - docs-only methodology baseline;
  - plan/contract/notes;
  - sprint/tracker status updates for this task.
- Out of scope:
  - signed partner contract;
  - database migrations;
  - live ingestion;
  - API/tool implementation;
  - golden sample execution.

## Workflow Inventory

- Source plan: `plans/plan-data-contract-methodology-baseline.md`
- Source sprint: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
- Deferred-goal ledger: `tasks/todos.md`
- Notes file: `tasks/notes/data-contract-methodology-baseline.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Scope gate: edit only paths listed under `allowed_paths`.

## Allowed Paths

```yaml
allowed_paths:
  - docs/governance/data-contract-methodology-baseline.md
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - plans/plan-data-contract-methodology-baseline.md
  - plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md
  - tasks/contracts/data-contract-methodology-baseline.contract.md
  - tasks/notes/data-contract-methodology-baseline.notes.md
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
    - docs/governance/data-contract-methodology-baseline.md
    - plans/plan-data-contract-methodology-baseline.md
    - tasks/contracts/data-contract-methodology-baseline.contract.md
    - tasks/notes/data-contract-methodology-baseline.notes.md
  content_checks:
    - "Baseline records partner data contract shape"
    - "Baseline records security master model"
    - "Baseline records time/version model"
    - "Baseline records point-in-time query rule"
    - "Baseline records raw/split_adjusted/total_return_adjusted methodology"
    - "Baseline records financial facts and restatements"
    - "Baseline records metric definition library v0"
    - "Baseline records HK trading calendar model"
    - "Baseline records Raw -> Standardized -> Quality -> Derived -> Serving -> Gateway pipeline"
  commands_succeed:
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes the Sprint 0.2 design backlog.
- The Sprint 0.2 DoD remains open until the data partner contract is actually
  signed and reviewed against real field names, source IDs, SLAs, and samples.

## Rollback Point

- Revert the commit that adds this baseline and status update.
