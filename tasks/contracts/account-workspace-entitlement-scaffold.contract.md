# Task Contract: account-workspace-entitlement-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-account-workspace-entitlement-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-account-workspace-entitlement
> **Last Updated**: 2026-06-20 16:20 +08
> **Notes File**: `tasks/notes/account-workspace-entitlement-scaffold.notes.md`

## Goal

Create the empty database schema scaffold for account, workspace, subscription,
and entitlement separation without loading market data or enabling live auth,
billing, or entitlement execution.

## Scope

- In scope:
  - `platform.account`;
  - `platform.workspace`;
  - `platform.workspace_membership`;
  - `platform.subscription_plan`;
  - `platform.workspace_subscription`;
  - `aiphabee_governance.data_entitlement`;
  - `aiphabee_governance.workspace_entitlement`;
  - governance contract row;
  - database migration contract update;
  - Worker `/data/runtime` and `/gateway/runtime` capability route updates;
  - tracker/governance updates.
- Out of scope:
  - identity provider integration;
  - payment provider integration;
  - real account or billing rows;
  - field-level live entitlement enforcement;
  - usage ledger persistence;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/database/migrations.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/account-workspace-entitlement-scaffold.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/engineering-foundation-audit.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/postgres-hyperdrive-migration-scaffold.md
  - docs/governance/golden-quality-commercial-baseline.md
  - plans/plan-account-workspace-entitlement-scaffold.md
  - supabase/migrations/**
  - tasks/contracts/account-workspace-entitlement-scaffold.contract.md
  - tasks/notes/account-workspace-entitlement-scaffold.notes.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - supabase/migrations/20260620085000_account_workspace_entitlement_scaffold.sql
    - docs/governance/account-workspace-entitlement-scaffold.md
  content_checks:
    - "Migration creates account/workspace/membership tables"
    - "Migration creates subscription plan and workspace subscription tables"
    - "Migration creates data entitlement and workspace entitlement tables"
    - "Workspace entitlements default to default_deny"
    - "No market data rows, account rows, billing rows, or provider secrets are committed"
  commands_succeed:
    - npm run check:database
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns account_workspace.status=schema_scaffold"
    - "GET /gateway/runtime returns account_workspace_entitlements.status=schema_scaffold"
```

## Acceptance Notes

- This task completes an ACC-02 schema scaffold only.
- DAT-05 live field-level enforcement and ACC-04 usage ledger remain separate
  Sprint 1.1 rows.

## Rollback Point

- Revert the commit that adds this migration and tracker update.
