# Task Contract: financial-facts-restatement-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-financial-facts-restatement-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-financial-facts-restatement
> **Last Updated**: 2026-06-20 16:08 +08
> **Notes File**: `tasks/notes/financial-facts-restatement-scaffold.notes.md`

## Goal

Create the empty database schema scaffold for financial statements, financial
facts, and restatement links without loading partner or market data.

## Scope

- In scope:
  - `aiphabee_core.financial_statement`;
  - `aiphabee_core.financial_fact`;
  - `aiphabee_core.financial_restatement`;
  - governance contract row;
  - database migration contract update;
  - Worker `/data/runtime` capability route update;
  - tracker/governance updates.
- Out of scope:
  - real partner samples or market data;
  - corporate action tables and adjustment engine;
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
  - docs/governance/financial-facts-restatement-scaffold.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/postgres-hyperdrive-migration-scaffold.md
  - docs/governance/security-master-raw-snapshot-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md
  - plans/plan-financial-facts-restatement-scaffold.md
  - deploy/database/migrations/**
  - tasks/contracts/financial-facts-restatement-scaffold.contract.md
  - tasks/notes/financial-facts-restatement-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/database/migrations/20260620083000_financial_facts_restatement_scaffold.sql
    - docs/governance/financial-facts-restatement-scaffold.md
  content_checks:
    - "Migration creates financial_statement/financial_fact/financial_restatement tables"
    - "Financial facts carry period, currency, unit, scale, accounting standard, data_version, and methodology_version"
    - "Restatements link original and restated statements without overwriting prior versions"
    - "No market data rows or provider secrets are committed"
  commands_succeed:
    - npm run check:database
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns financial_facts.status=schema_scaffold"
```

## Acceptance Notes

- This task completes a DAT-03 schema scaffold only.
- Real data loading, partner field mapping, and live Serving remain blocked by
  external data contract and Hyperdrive provisioning.

## Rollback Point

- Revert the commit that adds this migration and tracker update.
