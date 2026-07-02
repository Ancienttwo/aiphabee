# Task Contract: evidence-lineage-service-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-evidence-lineage-service-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-evidence-lineage-service
> **Last Updated**: 2026-06-21 02:54 +08
> **Notes File**:
> `tasks/notes/evidence-lineage-service-scaffold.notes.md`

## Goal

Create a no-write Evidence/Lineage service scaffold that plans how a tool call
links to source records, data version, methodology version, and a user-visible
citation through the standard response envelope.

## Scope

- In scope:
  - evidence record planner in `@aiphabee/evidence-lineage`;
  - source record ref planner;
  - stable evidence record/source ref IDs;
  - default-deny rights state;
  - user-visible citation metadata;
  - Worker `GET /evidence/runtime`;
  - Worker `POST /evidence/records/plan`;
  - empty Supabase tables for evidence records and source refs;
  - governance contract row for no-live service state;
  - repo-level evidence service contract checker;
  - tracker/governance updates.
- Out of scope:
  - live DB writes;
  - live SQL execution or emitted SQL statements;
  - partner/vendor source records;
  - MCP protocol endpoint integration;
  - runtime JSON Schema serving;
  - live route replay;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/database/migrations.contract.json
  - deploy/evidence/service.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/evidence-lineage-service-scaffold.md
  - package.json
  - packages/evidence-lineage/**
  - plans/plan-evidence-lineage-service-scaffold.md
  - scripts/check-evidence-service-contract.mjs
  - deploy/database/migrations/20260621024500_evidence_lineage_service_scaffold.sql
  - tasks/contracts/evidence-lineage-service-scaffold.contract.md
  - tasks/notes/evidence-lineage-service-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Evidence service runtime reports durable_schema_ready=true and live_db_writes=false"
    - "Evidence record planner links requestId, toolName, tool/schema versions, data version, methodology version, and default-deny rights state"
    - "Source refs link evidence record ID to source/sourceRecordId/dataVersion/methodologyVersion"
    - "Citation metadata is user-visible and lists source record IDs"
    - "Planner returns planned_no_write with liveDbWrites=false and sqlEmitted=false"
    - "Database migration creates empty evidence and source-ref tables without enabling writes"
    - "Contract checker rejects live_db_writes, partner_source_records_loaded, or sql_emitted=true"
    - "No MCP protocol endpoint, runtime schema serving, live route replay, partner rows, live DB writes, or frontend changes are claimed"
  commands_succeed:
    - npm run test -- packages/evidence-lineage/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:evidence-service
    - npm run check:database
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /evidence/runtime returns status=evidence_lineage_service_scaffold and live_db_writes=false"
    - "POST /evidence/records/plan returns planned_no_write, one source ref, a user-visible citation, liveDbWrites=false, and sqlEmitted=false"
```

## Acceptance Notes

- This task completes the local no-write Evidence/Lineage service scaffold for
  Sprint 1.2.
- It does not claim live data durability, partner record ingestion, MCP
  protocol integration, runtime schema serving, live route replay, or frontend
  citation rendering.

## Rollback Point

- Revert the commit that adds evidence service planner behavior, Worker
  evidence routes, the empty Evidence/Lineage migration, the evidence service
  contract checker, and tracker/governance changes.
