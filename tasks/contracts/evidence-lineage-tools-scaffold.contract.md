# Task Contract: evidence-lineage-tools-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-evidence-lineage-tools-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-evidence-lineage-tools
> **Last Updated**: 2026-06-21 02:33 +08
> **Notes File**:
> `tasks/notes/evidence-lineage-tools-scaffold.notes.md`

## Goal

Create no-live `get_data_lineage` and `get_entitlements` tool scaffolds that
return synthetic evidence/source metadata and current entitlement scope through
the existing standard response envelope.

## Scope

- In scope:
  - new `@aiphabee/evidence-lineage` package;
  - synthetic lineage fixtures keyed by `evidence_id` and `record_id`;
  - source batch, source record, data version, methodology/formula, quality
    state, and upstream metadata;
  - synthetic entitlement rows compiled through the existing Gateway policy
    source compiler;
  - workspace/channel/tool/dataset/fields/as_of/time_range/row/export handling;
  - field redaction, default-deny, scope denied, out-of-range, and row-limit
    behavior;
  - `POST /tools/get-data-lineage` and `POST /tools/get-entitlements`;
  - registry entries for both tools promoted to scaffold;
  - repo-level evidence-lineage contract checker;
  - tracker/governance updates.
- Out of scope:
  - durable Evidence/Lineage service storage;
  - live DB entitlement reads;
  - partner/vendor source records;
  - MCP endpoint implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/evidence-lineage.contract.json
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/evidence-lineage-tools-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/evidence-lineage/**
  - packages/tool-registry/**
  - plans/plan-evidence-lineage-tools-scaffold.md
  - scripts/check-evidence-lineage-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/evidence-lineage-tools-scaffold.contract.md
  - tasks/notes/evidence-lineage-tools-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Known evidence_id returns source, batch, data version, methodology/formula, quality state, and upstream lineage"
    - "Known record_id returns the same lineage record"
    - "Held lineage fixture returns DATA_QUALITY_HOLD through the Worker route"
    - "Unknown lineage lookup returns NOT_FOUND through the Worker route"
    - "Known workspace entitlement overview lists available datasets and tools"
    - "Requested fields are evaluated through Gateway entitlement policy, including redaction"
    - "Unsupported workspace/tool/dataset/field scope returns SCOPE_DENIED or DATA_NOT_LICENSED through the Worker route"
    - "Requested row/time limits return TOO_MANY_ROWS or OUT_OF_RANGE through the Worker route"
    - "Registry marks get_data_lineage and get_entitlements as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP endpoint, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/evidence-lineage/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:evidence-lineage
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/get-data-lineage with ev_financial_facts_00700_fy2023 returns synthetic lineage"
    - "POST /tools/get-entitlements with financial_facts fields returns entitlement scope and redaction"
    - "GET /tools/runtime reports handler_ready_tool_count=9"
```

## Acceptance Notes

- This task completes no-live lineage and entitlement self-check tool
  scaffolds only.
- It does not implement a durable Evidence/Lineage service, live entitlement DB
  reads, partner source rows, or MCP protocol tool-call integration.
- Verification completed through package/registry/Worker tests, repo checks,
  Worker smoke, and strict workflow check.

## Rollback Point

- Revert the commit that adds `@aiphabee/evidence-lineage`, both Worker tool
  routes, registry status updates, the evidence-lineage contract checker, and
  tracker/governance changes.
