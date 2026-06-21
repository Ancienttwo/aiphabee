# Task Contract: live-serving-query-planner-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-live-serving-query-planner-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-live-serving-query-planner
> **Last Updated**: 2026-06-20 17:46 +08
> **Notes File**:
> `tasks/notes/live-serving-query-planner-scaffold.notes.md`

## Goal

Create a deterministic Serving query planner that turns an approved Gateway
read plan plus released snapshot metadata into a query plan while preserving
default-deny, quality isolation, and no-live-SQL constraints.

## Scope

- In scope:
  - `@aiphabee/serving-store` query planner contracts;
  - released snapshot gating;
  - denied/quality-held read-plan blocking;
  - row-limit planning;
  - cache-key material with snapshot id and release state;
  - Data Access Gateway `servingQuery` decision attachment;
  - Worker `/gateway/runtime` query planner capability;
  - Gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - live Serving SQL;
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
  - docs/governance/serving-store-schema-scaffold.md
  - packages/data-access-gateway/**
  - packages/serving-store/**
  - plans/plan-live-serving-query-planner-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/live-serving-query-planner-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/live-serving-query-planner-scaffold.notes.md
  - tasks/notes/serving-read-scaffold-default-deny.notes.md
  - tasks/notes/serving-store-schema-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Serving query planner blocks denied Gateway read plans"
    - "Serving query planner blocks HOLD/REJECT_RAW or unreleased snapshots"
    - "Released snapshot query plans preserve allowed field set and row limits"
    - "Gateway decisions include servingQuery alongside servingRead and usageLedger"
    - "Runtime reports query_planner.status=query_planner_scaffold and live_reads=false"
    - "No live SQL, Hyperdrive reads, market data rows, provider secrets, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns guards including serving_query_planner_scaffold"
    - "GET /gateway/runtime returns serving_store.query_planner.live_reads=false"
```

## Acceptance Notes

- This task completes a query-plan scaffold only.
- Real Serving reads, SQL generation/execution, partner rows, and billing writes
  remain future work.

## Rollback Point

- Revert the commit that adds the Serving query planner, Gateway `servingQuery`
  attachment, runtime capability, contract guard, and tracker update.
