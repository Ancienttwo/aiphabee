# Task Contract: serving-sql-text-compiler-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-serving-sql-text-compiler-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-serving-sql-text-compiler
> **Last Updated**: 2026-06-20 18:05 +08
> **Notes File**:
> `tasks/notes/serving-sql-text-compiler-scaffold.notes.md`

## Goal

Create a deterministic SQL text compiler scaffold that turns an allow-listed
Serving SQL descriptor into parameterized SQL text while preserving no
execution, no live reads, and default-deny blocking.

## Scope

- In scope:
  - `@aiphabee/serving-store` SQL text compiler contracts;
  - blocked-descriptor handling;
  - allow-listed statement id;
  - fixed SQL text template for `aiphabee_core.serving_record`;
  - positional parameter order;
  - Data Access Gateway `servingSqlText` attachment;
  - Worker `/gateway/runtime` SQL text compiler capability;
  - Gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - SQL execution;
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
  - docs/governance/serving-sql-text-compiler-scaffold.md
  - docs/governance/serving-store-schema-scaffold.md
  - packages/data-access-gateway/**
  - packages/serving-store/**
  - plans/plan-serving-sql-text-compiler-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/serving-sql-text-compiler-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/live-serving-query-planner-scaffold.notes.md
  - tasks/notes/serving-read-scaffold-default-deny.notes.md
  - tasks/notes/serving-sql-descriptor-scaffold.notes.md
  - tasks/notes/serving-sql-text-compiler-scaffold.notes.md
  - tasks/notes/serving-store-schema-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Serving SQL text compiler blocks blocked descriptors"
    - "Planned SQL text uses only allow-listed statement id and positional parameters"
    - "Gateway decisions include servingSqlText alongside servingRead, servingQuery, servingSqlDescriptor, and usageLedger"
    - "Runtime reports sql_text_compiler.status=sql_text_compiler_scaffold and execution_ready=false"
    - "No SQL execution, Hyperdrive reads, market data rows, provider secrets, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns guards including serving_sql_text_compiler_scaffold"
    - "GET /gateway/runtime returns serving_store.sql_text_compiler.execution_ready=false"
```

## Acceptance Notes

- This task completes a SQL text compiler scaffold only.
- Real Serving reads, SQL execution, partner rows, and billing writes remain
  future work.

## Rollback Point

- Revert the commit that adds the Serving SQL text compiler, Gateway
  `servingSqlText` attachment, runtime capability, contract guard, and tracker
  update.
