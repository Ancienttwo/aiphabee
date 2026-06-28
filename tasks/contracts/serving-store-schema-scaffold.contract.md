# Task Contract: serving-store-schema-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-serving-store-schema-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-serving-store-schema
> **Last Updated**: 2026-06-20 16:45 +08
> **Notes File**: `tasks/notes/serving-store-schema-scaffold.notes.md`

## Goal

Create the empty database schema scaffold for versioned Serving Store
projections without enabling live Serving reads or loading partner market data.

## Scope

- In scope:
  - `aiphabee_core.serving_dataset`;
  - `aiphabee_core.serving_field`;
  - `aiphabee_core.serving_snapshot`;
  - `aiphabee_core.serving_record`;
  - governance contract row;
  - database migration contract update;
  - Worker `/data/runtime` capability route update;
  - Worker `/gateway/runtime` capability route update;
  - tracker/governance updates.
- Out of scope:
  - live Serving reads;
  - partner data loading;
  - DB entitlement policy source;
  - usage ledger live writes;
  - corporate action live adjustment engine;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/database/migrations.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/field-entitlement-enforcement-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/postgres-hyperdrive-migration-scaffold.md
  - docs/governance/serving-store-schema-scaffold.md
  - docs/governance/usage-ledger-scaffold.md
  - plans/plan-serving-store-schema-scaffold.md
  - supabase/migrations/**
  - tasks/contracts/serving-store-schema-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/field-entitlement-enforcement-scaffold.notes.md
  - tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md
  - tasks/notes/serving-store-schema-scaffold.notes.md
  - tasks/notes/usage-ledger-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - supabase/migrations/20260620091000_serving_store_scaffold.sql
    - docs/governance/serving-store-schema-scaffold.md
  content_checks:
    - "Migration creates serving_dataset/serving_field/serving_snapshot/serving_record tables"
    - "Serving snapshots carry data_version, rights_policy_version, methodology_version, as_of, market_status, quality_state, and release_state"
    - "Serving records carry entity identity, effective interval, payload, field_set, quality_state, and source_record_id"
    - "Runtime reports live_serving_reads/live_reads=false"
    - "No market data rows, partner data, live DB credentials, or provider secrets are committed"
  commands_succeed:
    - npm run check:database
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns serving_store.status=schema_scaffold"
    - "GET /gateway/runtime returns serving_store.status=schema_scaffold"
```

## Acceptance Notes

- This task completes a Serving Store schema scaffold only.
- Live Serving Gateway reads, live quality jobs, and persistent Serving mutation
  remain future work.

## Rollback Point

- Revert the commit that adds this migration and tracker update.
