# Task Contract: gate0-rights-regulatory-decision-pack

> **Status**: Verified
> **Plan**: `plans/plan-gate0-rights-regulatory-decision-pack.md`
> **Task Profile**: docs-only
> **Owner**: Codex
> **Capability ID**: gate0-governance
> **Last Updated**: 2026-06-20 13:18 +08
> **Notes File**: `tasks/notes/gate0-rights-regulatory-decision-pack.notes.md`

## Goal

Deliver a Gate 0 decision packet that records field-level rights, default-deny
gaps, HKEX/vendor licensing status, Type 4 review status, MVP boundary copy,
PCPD path, commercial settlement dimensions, and signature state.

## Scope

- In scope:
  - docs-only governance packet;
  - plan/contract/notes;
  - sprint/tracker status update for this task.
- Out of scope:
  - legal opinion;
  - partner rights negotiation;
  - market-data ingestion;
  - runtime product implementation;
  - Phase 1 feature work.

## Workflow Inventory

- Source plan: `plans/plan-gate0-rights-regulatory-decision-pack.md`
- Source sprint: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
- Deferred-goal ledger: `tasks/todos.md`
- Notes file: `tasks/notes/gate0-rights-regulatory-decision-pack.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Scope gate: edit only paths listed under `allowed_paths`.

## Allowed Paths

```yaml
allowed_paths:
  - docs/governance/gate0-rights-regulatory-decision-pack.md
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - plans/plan-gate0-rights-regulatory-decision-pack.md
  - plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md
  - tasks/contracts/gate0-rights-regulatory-decision-pack.contract.md
  - tasks/notes/gate0-rights-regulatory-decision-pack.notes.md
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
      purpose: docs_packet_delivery
    verifier:
      mode: read_only
      purpose: exit_criteria_review
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - docs/governance/gate0-rights-regulatory-decision-pack.md
    - plans/plan-gate0-rights-regulatory-decision-pack.md
    - tasks/contracts/gate0-rights-regulatory-decision-pack.contract.md
    - tasks/notes/gate0-rights-regulatory-decision-pack.notes.md
  content_checks:
    - "Packet records field-level rights matrix v0"
    - "Packet records DEFAULT_DENY for unconfirmed rights"
    - "Packet records HKEX/vendor licensing status"
    - "Packet records Type 4 review status and MVP boundary copy"
    - "Packet records PCPD path"
    - "Packet records commercial settlement dimensions"
    - "Packet records signature state"
  commands_succeed:
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task is complete when the decision packet exists and unsupported external
  approvals remain explicitly pending.
- Completion of this task does not mean Sprint 0.1 legal/data approvals are
  complete.

## Rollback Point

- Revert the commit that adds this packet and status update.
