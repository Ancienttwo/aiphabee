# Task Contract: field-entitlement-policy-source-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-field-entitlement-policy-source-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-field-entitlement-policy-source
> **Last Updated**: 2026-06-20 17:38 +08
> **Notes File**:
> `tasks/notes/field-entitlement-policy-source-scaffold.notes.md`

## Goal

Create a deterministic policy-source scaffold that compiles account/workspace
entitlement rows into Data Access Gateway policy while preserving default-deny
and avoiding live database reads.

## Scope

- In scope:
  - row contracts for `aiphabee_governance.data_entitlement`;
  - row contracts for `aiphabee_governance.workspace_entitlement`;
  - row contracts for `platform.workspace_subscription`;
  - active validity filtering;
  - billing-state filtering for subscription rows;
  - wildcard field pattern support;
  - blocked-over-approved precedence;
  - Worker `/gateway/runtime` policy-source capability;
  - gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - live database reads;
  - partner rights matrix ingestion;
  - external rights approval;
  - live Serving Store access;
  - persistent usage writes;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/gateway/access.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/field-entitlement-enforcement-scaffold.md
  - docs/governance/field-entitlement-policy-source-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - packages/data-access-gateway/**
  - plans/plan-field-entitlement-policy-source-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/field-entitlement-enforcement-scaffold.contract.md
  - tasks/contracts/field-entitlement-policy-source-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/field-entitlement-enforcement-scaffold.notes.md
  - tasks/notes/field-entitlement-policy-source-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Compiler maps active data_entitlement/workspace_entitlement/subscription rows into DataAccessPolicy"
    - "Expired workspace entitlements do not open channels"
    - "Blocked field policy overrides wildcard approval"
    - "Export and time-window limits from DB rows are enforced"
    - "Runtime reports policy_source.status=policy_source_scaffold and live_db_reads=false"
    - "No partner rights matrix, live DB credentials, market data rows, or provider secrets are committed"
  commands_succeed:
    - npm run test -- packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns field_entitlement_enforcement.policy_source.status=policy_source_scaffold"
    - "GET /gateway/runtime returns field_entitlement_enforcement.policy_source.live_db_reads=false"
```

## Acceptance Notes

- This task completes a DB policy-source scaffold only.
- Live DB reads, partner rights matrix ingestion, and signed external rights
  approval remain future work.

## Rollback Point

- Revert the commit that adds the policy-source compiler, runtime capability,
  contract guard, and tracker update.
