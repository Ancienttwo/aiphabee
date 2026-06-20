# Task Contract: field-entitlement-enforcement-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-field-entitlement-enforcement-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-field-entitlement-enforcement
> **Last Updated**: 2026-06-20 16:27 +08
> **Notes File**: `tasks/notes/field-entitlement-enforcement-scaffold.notes.md`

## Goal

Extend the Data Access Gateway evaluator so field access can be decided by
workspace, plan, channel, dataset, field, time range, and export context while
keeping live policy source disabled.

## Scope

- In scope:
  - `packages/data-access-gateway` entitlement policy model;
  - synthetic workspace entitlement tests;
  - cache key dimensions for workspace and export;
  - `deploy/gateway/access.contract.json` guard/cache contract update;
  - `scripts/check-data-access-gateway-contract.mjs` contract validation update;
  - Worker `/gateway/runtime` capability update;
  - Worker `/gateway/access-check` request passthrough for workspace/export;
  - tracker/governance updates.
- Out of scope:
  - partner rights matrix ingestion;
  - database policy reads;
  - live Serving Store access;
  - real account or entitlement rows;
  - billing writes;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/gateway/access.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/field-entitlement-enforcement-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - packages/data-access-gateway/**
  - plans/plan-field-entitlement-enforcement-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/field-entitlement-enforcement-scaffold.contract.md
  - tasks/notes/field-entitlement-enforcement-scaffold.notes.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Evaluator handles workspace, plan, field, time range, and export dimensions"
    - "Cache key includes workspace and export dimensions"
    - "Default-deny remains active when no live entitlement policy source exists"
    - "Gateway runtime reports live_policy_source=false"
  commands_succeed:
    - npm run check:data-gateway
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns field_entitlement_enforcement.status=scaffold"
    - "POST /gateway/access-check remains default-deny for live routes"
```

## Acceptance Notes

- This task completes a DAT-05 enforcement scaffold only.
- Live partner rights matrix execution remains blocked by external rights
  approval and live database policy reads. A row-snapshot policy-source compiler
  now exists as a separate scaffold.

## Rollback Point

- Revert the commit that updates Gateway evaluator and tracker state.
