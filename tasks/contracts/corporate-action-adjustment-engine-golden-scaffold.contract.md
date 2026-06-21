# Task Contract: corporate-action-adjustment-engine-golden-scaffold

> **Status**: Verified
> **Plan**:
> `plans/plan-corporate-action-adjustment-engine-golden-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-corporate-action-engine-golden
> **Last Updated**: 2026-06-20 16:55 +08
> **Notes File**:
> `tasks/notes/corporate-action-adjustment-engine-golden-scaffold.notes.md`

## Goal

Create a deterministic corporate-action adjustment engine scaffold with
synthetic golden cases, without enabling live partner data reads or claiming
production benchmark parity.

## Scope

- In scope:
  - `@aiphabee/corporate-actions` package;
  - split and consolidation backward-adjusted factor handling;
  - cash dividend total-return factor handling;
  - synthetic golden cases and package tests;
  - Worker `/data/runtime` capability update;
  - tracker/governance updates.
- Out of scope:
  - partner corporate-action rows;
  - live raw price bar reads;
  - public benchmark parity;
  - Serving Gateway reads;
  - usage ledger persistence;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/corporate-action-adjustment-engine-golden-scaffold.md
  - docs/governance/corporate-action-adjustment-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - packages/corporate-actions/**
  - package-lock.json
  - plans/plan-corporate-action-adjustment-engine-golden-scaffold.md
  - tasks/contracts/corporate-action-adjustment-engine-golden-scaffold.contract.md
  - tasks/notes/corporate-action-adjustment-engine-golden-scaffold.notes.md
  - tasks/notes/corporate-action-adjustment-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Package exports deterministic corporate-action adjustment capabilities"
    - "Split and consolidation produce backward-adjusted split-adjusted closes"
    - "Cash dividend produces total-return-adjusted closes"
    - "Synthetic golden cases pass and are surfaced in /data/runtime"
    - "Runtime reports live_partner_data=false"
  commands_succeed:
    - npm run test -- packages/corporate-actions/src/index.test.ts
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns corporate_actions.engine.status=engine_scaffold"
```

## Acceptance Notes

- This task completes a deterministic synthetic engine scaffold.
- Partner-backed live adjustment computation and external benchmark parity remain
  future work.

## Rollback Point

- Revert the commit that adds `@aiphabee/corporate-actions` and runtime updates.
