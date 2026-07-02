# Task Contract: postgres-hyperdrive-migration-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-postgres-hyperdrive-migration-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-postgres-hyperdrive-migrations
> **Last Updated**: 2026-06-20 15:10 +08
> **Notes File**: `tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md`

## Goal

Create a verified repo-local Postgres/Hyperdrive migration scaffold for the future
Cloudflare Hyperdrive connection path without configuring live resources or
running remote DDL.

## Scope

- In scope:
  - Postgres-compatible SQL migration file naming;
  - database migration manifest;
  - no-secret checker for migration files and commands;
  - names-only Hyperdrive local development connection env var;
  - Worker database capability route;
  - tracker/governance updates.
- Out of scope:
  - provisioning a retired Supabase project;
  - provisioning Cloudflare Hyperdrive resource;
  - committing Hyperdrive `id`, local connection string, or database URL;
  - running retired Supabase CLI apply commands against a remote database;
  - running `SELECT 1` through Hyperdrive;
  - market-data tables, ingestion jobs, and data gateway behavior.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - apps/worker/**
  - deploy/database/**
  - deploy/env/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/env-secrets-contract.md
  - docs/governance/phase0-traceability-closeout.md
  - docs/governance/postgres-hyperdrive-migration-scaffold.md
  - package.json
  - plans/plan-postgres-hyperdrive-migration-scaffold.md
  - scripts/check-database-migrations-contract.mjs
  - supabase/**
  - tasks/contracts/postgres-hyperdrive-migration-scaffold.contract.md
  - tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/database/migrations.contract.json
    - scripts/check-database-migrations-contract.mjs
    - deploy/database/migrations/20260620071000_phase0_foundation.sql
    - docs/governance/postgres-hyperdrive-migration-scaffold.md
  content_checks:
    - "Migration manifest provider is supabase_postgres"
    - "Connection path is cloudflare_hyperdrive"
    - "Hyperdrive binding name is AIPHABEE_HYPERDRIVE"
    - "SQL creates only non-market-data governance/core/audit scaffolding"
    - "Default data rights status remains default_deny"
    - "No resource IDs, database URLs, passwords, tokens, or secret values are committed"
  commands_succeed:
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /database/runtime returns 200 and reports live_queries=false"
```

## Acceptance Notes

- This task completes the repo-local migration scaffold leaf only.
- Live Hyperdrive resource provisioning and read-only `SELECT 1` smoke remain
  later backend/runtime tasks.

## Rollback Point

- Revert the commit that adds this scaffold and status update.
