# Task Contract: usage-ledger-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-usage-ledger-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-usage-ledger
> **Last Updated**: 2026-06-20 16:27 +08
> **Notes File**: `tasks/notes/usage-ledger-scaffold.notes.md`

## Goal

Create the empty database schema scaffold for usage events, weighted credit
metering, ledger entries, and reconciliation batches without enabling live
usage writes or billing reconciliation.

## Scope

- In scope:
  - `aiphabee_core.usage_meter_rule`;
  - `aiphabee_core.usage_event`;
  - `aiphabee_core.usage_reconciliation_batch`;
  - `aiphabee_core.usage_ledger_entry`;
  - governance contract row;
  - database migration contract update;
  - Worker `/gateway/runtime` capability route update;
  - tracker/governance updates.
- Out of scope:
  - live event writes;
  - billing provider integration;
  - quota display UI;
  - billing invoices;
  - live Serving Gateway reads;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/database/migrations.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/account-workspace-entitlement-scaffold.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/postgres-hyperdrive-migration-scaffold.md
  - docs/governance/usage-ledger-scaffold.md
  - plans/plan-usage-ledger-scaffold.md
  - supabase/migrations/**
  - tasks/contracts/usage-ledger-scaffold.contract.md
  - tasks/notes/account-workspace-entitlement-scaffold.notes.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md
  - tasks/notes/usage-ledger-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - supabase/migrations/20260620090000_usage_ledger_scaffold.sql
    - docs/governance/usage-ledger-scaffold.md
  content_checks:
    - "Migration creates usage_meter_rule/usage_event/usage_reconciliation_batch/usage_ledger_entry tables"
    - "Usage event links workspace/account context and request/run identifiers"
    - "Ledger entries support weighted credits and billable state"
    - "Reconciliation batch target delay is five minutes or less"
    - "No market data rows, usage rows, billing rows, or provider secrets are committed"
  commands_succeed:
    - npm run check:database
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns usage_ledger.status=schema_scaffold"
```

## Acceptance Notes

- This task completes an ACC-04 schema scaffold only.
- Live usage writes, billing reconciliation, and UI quota display remain future
  work. Event writer planning now exists as a separate scaffold.

## Rollback Point

- Revert the commit that adds this migration and tracker update.
