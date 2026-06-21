# Task Contract: serving-execution-adapter-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-serving-execution-adapter-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-serving-execution-adapter
> **Last Updated**: 2026-06-20 18:14 +08
> **Notes File**:
> `tasks/notes/serving-execution-adapter-scaffold.notes.md`

## Goal

Create a no-live execution adapter scaffold that accepts compiled Serving SQL
text and returns a deterministic deferred execution plan with no rows and no
database calls.

## Scope

- In scope:
  - `@aiphabee/serving-store` execution adapter contracts;
  - blocked SQL text handling;
  - deferred Hyperdrive adapter shape;
  - empty row result shape;
  - Data Access Gateway `servingExecution` attachment;
  - Worker `/gateway/runtime` execution adapter capability;
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
  - docs/governance/serving-execution-adapter-scaffold.md
  - docs/governance/serving-read-scaffold-default-deny.md
  - docs/governance/serving-sql-descriptor-scaffold.md
  - docs/governance/serving-sql-text-compiler-scaffold.md
  - docs/governance/serving-store-schema-scaffold.md
  - packages/data-access-gateway/**
  - packages/serving-store/**
  - plans/plan-serving-execution-adapter-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/serving-execution-adapter-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/live-serving-query-planner-scaffold.notes.md
  - tasks/notes/serving-execution-adapter-scaffold.notes.md
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
    - "Serving execution adapter blocks blocked SQL text"
    - "Planned SQL text returns execution_deferred with LIVE_SERVING_EXECUTION_DISABLED"
    - "Adapter always returns executionReady=false, sqlExecuted=false, liveRead=false, rows=[], and servedRows=0"
    - "Gateway decisions include servingExecution alongside Serving plans and usageLedger"
    - "Runtime reports execution_adapter.status=execution_adapter_scaffold and execution_ready=false"
    - "No SQL execution, Hyperdrive reads, market data rows, provider secrets, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns guards including serving_execution_adapter_scaffold"
    - "GET /gateway/runtime returns serving_store.execution_adapter.execution_ready=false"
```

## Acceptance Notes

- This task completes a no-live execution adapter scaffold only.
- Real Serving reads, SQL execution, partner rows, and billing writes remain
  future work.

## Rollback Point

- Revert the commit that adds the Serving execution adapter, Gateway
  `servingExecution` attachment, runtime capability, contract guard, and tracker
  update.
