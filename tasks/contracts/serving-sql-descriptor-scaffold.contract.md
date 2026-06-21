# Task Contract: serving-sql-descriptor-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-serving-sql-descriptor-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-serving-sql-descriptor
> **Last Updated**: 2026-06-20 17:56 +08
> **Notes File**:
> `tasks/notes/serving-sql-descriptor-scaffold.notes.md`

## Goal

Create a deterministic no-execute SQL descriptor scaffold that turns a planned
Serving query into an allow-listed statement descriptor with parameter bindings,
while preserving no live reads and no SQL text emission.

## Scope

- In scope:
  - `@aiphabee/serving-store` SQL descriptor contracts;
  - blocked-query descriptor handling;
  - allow-listed statement id;
  - selected field paths;
  - snapshot id, field set, time range, and limit bindings;
  - Data Access Gateway `servingSqlDescriptor` attachment;
  - Worker `/gateway/runtime` SQL descriptor capability;
  - Gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - SQL text generation;
  - live SQL execution;
  - Hyperdrive/Supabase reads;
  - partner market data rows;
  - Serving Store writes;
  - live usage writes or billing reconciliation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/gateway/access.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/live-serving-query-planner-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/serving-read-scaffold-default-deny.md
  - docs/governance/serving-sql-descriptor-scaffold.md
  - docs/governance/serving-store-schema-scaffold.md
  - packages/data-access-gateway/**
  - packages/serving-store/**
  - plans/plan-serving-sql-descriptor-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/serving-sql-descriptor-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/live-serving-query-planner-scaffold.notes.md
  - tasks/notes/serving-read-scaffold-default-deny.notes.md
  - tasks/notes/serving-sql-descriptor-scaffold.notes.md
  - tasks/notes/serving-store-schema-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Serving SQL descriptor blocks blocked ServingQueryPlan inputs"
    - "Planned descriptors include statement id, selected fields, snapshot/time/limit bindings, and no SQL text"
    - "Gateway decisions include servingSqlDescriptor alongside servingRead, servingQuery, and usageLedger"
    - "Runtime reports sql_descriptor.status=sql_descriptor_scaffold and execution_ready=false"
    - "No SQL text, live SQL execution, Hyperdrive reads, market data rows, provider secrets, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns guards including serving_sql_descriptor_scaffold"
    - "GET /gateway/runtime returns serving_store.sql_descriptor.execution_ready=false"
```

## Acceptance Notes

- This task completes a no-execute SQL descriptor scaffold only.
- Real Serving reads, SQL text generation/execution, partner rows, and billing
  writes remain future work.

## Rollback Point

- Revert the commit that adds the Serving SQL descriptor, Gateway
  `servingSqlDescriptor` attachment, runtime capability, contract guard, and
  tracker update.
