# Task Contract: corporate-action-adjustment-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-corporate-action-adjustment-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-corporate-action-adjustment
> **Last Updated**: 2026-06-20 16:14 +08
> **Notes File**: `tasks/notes/corporate-action-adjustment-scaffold.notes.md`

## Goal

Create the empty database schema scaffold for corporate actions, adjustment
methodology versions, and price adjustment factors without loading partner or
market data.

## Scope

- In scope:
  - `aiphabee_core.corporate_action`;
  - `aiphabee_core.adjustment_methodology`;
  - `aiphabee_core.price_adjustment_factor`;
  - governance contract row;
  - database migration contract update;
  - Worker `/data/runtime` capability route update;
  - tracker/governance updates.
- Out of scope:
  - real partner samples or market data;
  - raw/adjusted price bar persistence;
  - live adjustment computation;
  - Hyperdrive live `SELECT 1`;
  - Serving Gateway reads;
  - usage ledger persistence;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/database/migrations.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/corporate-action-adjustment-scaffold.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/financial-facts-restatement-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/postgres-hyperdrive-migration-scaffold.md
  - docs/governance/security-master-raw-snapshot-scaffold.md
  - plans/plan-corporate-action-adjustment-scaffold.md
  - plans/plan-financial-facts-restatement-scaffold.md
  - plans/plan-security-master-raw-snapshot-scaffold.md
  - supabase/migrations/**
  - tasks/contracts/corporate-action-adjustment-scaffold.contract.md
  - tasks/notes/corporate-action-adjustment-scaffold.notes.md
  - tasks/notes/financial-facts-restatement-scaffold.notes.md
  - tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md
  - tasks/notes/security-master-raw-snapshot-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - supabase/migrations/20260620084000_corporate_action_adjustment_scaffold.sql
    - docs/governance/corporate-action-adjustment-scaffold.md
  content_checks:
    - "Migration creates corporate_action/adjustment_methodology/price_adjustment_factor tables"
    - "Corporate actions carry announcement/ex/record/payable/effective dates"
    - "Adjustment methodology records raw/split_adjusted/total_return_adjusted and direction"
    - "Adjustment factors use closed-open intervals"
    - "No market data rows or provider secrets are committed"
  commands_succeed:
    - npm run check:database
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns corporate_actions.status=schema_scaffold"
```

## Acceptance Notes

- This task completes a DAT-04 schema scaffold only.
- Live adjustment computation and golden parity remain blocked by partner bars,
  corporate-action source samples, and Serving integration.

## Rollback Point

- Revert the commit that adds this migration and tracker update.
