# Task Contract: engineering-foundation-audit

> **Status**: Verified
> **Plan**: `plans/plan-engineering-foundation-audit.md`
> **Task Profile**: docs-only
> **Owner**: Codex
> **Capability ID**: gate0-engineering-foundation
> **Last Updated**: 2026-06-20 14:08 +08
> **Notes File**: `tasks/notes/engineering-foundation-audit.notes.md`

## Goal

Deliver a repo-current engineering foundation audit against PRD §23 and Sprint
0.4, including the first scaffold boundary and verification surface.

## Scope

- In scope:
  - docs-only engineering audit;
  - plan/contract/notes;
  - sprint/tracker status updates for this task.
- Out of scope:
  - package manager installation;
  - runtime scaffold implementation;
  - CI workflow implementation;
  - Cloudflare/Postgres smoke tests;
  - P0 issue/owner/test/release traceability implementation.

## Workflow Inventory

- Source plan: `plans/plan-engineering-foundation-audit.md`
- Source sprint: `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md`
- Deferred-goal ledger: `tasks/todos.md`
- Notes file: `tasks/notes/engineering-foundation-audit.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Scope gate: edit only paths listed under `allowed_paths`.

## Allowed Paths

```yaml
allowed_paths:
  - docs/governance/engineering-foundation-audit.md
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - plans/plan-engineering-foundation-audit.md
  - plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md
  - tasks/contracts/engineering-foundation-audit.contract.md
  - tasks/notes/engineering-foundation-audit.notes.md
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
      purpose: repo_audit
    worker:
      mode: edit_within_allowed_paths
      purpose: audit_delivery
    verifier:
      mode: read_only
      purpose: exit_criteria_review
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - docs/governance/engineering-foundation-audit.md
    - plans/plan-engineering-foundation-audit.md
    - tasks/contracts/engineering-foundation-audit.contract.md
    - tasks/notes/engineering-foundation-audit.notes.md
  content_checks:
    - "Audit maps PRD section 23 items to current repo state"
    - "Audit maps Sprint 0.4 items to completion/gap state"
    - "Audit documents recommended runtime topology"
    - "Audit documents Cloudflare binding plan"
    - "Audit documents first scaffold slice and verification surface"
  commands_succeed:
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes the PRD §23 audit item only.
- Sprint 0.4 runtime scaffold, CI, binding, and traceability tasks remain
  incomplete until implemented and verified.

## Rollback Point

- Revert the commit that adds this audit and status update.
