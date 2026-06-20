# Task Contract: security-master-raw-snapshot-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-security-master-raw-snapshot-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-security-master-raw-snapshot
> **Last Updated**: 2026-06-20 16:45 +08
> **Notes File**: `tasks/notes/security-master-raw-snapshot-scaffold.notes.md`

## Goal

Create the empty database schema scaffold for securities master entities,
immutable raw source snapshots, and data-version batches without loading market
data.

## Scope

- In scope:
  - `core.company`;
  - `core.instrument`;
  - `core.listing`;
  - `core.identifier_history`;
  - `core.raw_source_batch`;
  - `core.raw_snapshot`;
  - `core.data_version_batch`;
  - governance contract row;
  - database migration contract update;
  - Worker `/data/runtime` capability route;
  - tracker/governance updates.
- Out of scope:
  - real partner samples or market data;
  - financial facts and restatement tables;
  - corporate action tables;
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
  - docs/governance/postgres-hyperdrive-migration-scaffold.md
  - docs/governance/security-master-raw-snapshot-scaffold.md
  - plans/plan-security-master-raw-snapshot-scaffold.md
  - supabase/migrations/**
  - tasks/contracts/security-master-raw-snapshot-scaffold.contract.md
  - tasks/notes/security-master-raw-snapshot-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - supabase/migrations/20260620082000_security_master_raw_snapshot_scaffold.sql
    - docs/governance/security-master-raw-snapshot-scaffold.md
  content_checks:
    - "Migration creates company/instrument/listing/identifier_history tables"
    - "Migration creates raw_source_batch/raw_snapshot/data_version_batch tables"
    - "Raw snapshots are immutable and quality default is HOLD"
    - "Source rights default to default_deny"
    - "No market data rows or provider secrets are committed"
  commands_succeed:
    - npm run check:database
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns market_data_loaded=false"
```

## Acceptance Notes

- This task completes schema scaffolds for DAT-01/DAT-02 only.
- Real data loading and live database application remain blocked by external
  data contract and Hyperdrive provisioning.

## Rollback Point

- Revert the commit that adds this migration and tracker update.
