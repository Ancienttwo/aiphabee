# Task Contract: serving-quality-release-isolation-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-serving-quality-release-isolation-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-serving-quality-release-isolation
> **Last Updated**: 2026-06-20 17:20 +08
> **Notes File**:
> `tasks/notes/serving-quality-release-isolation-scaffold.notes.md`

## Goal

Create a deterministic Serving quality release/isolation scaffold that converts
Serving quality states into `held`, `released`, or `withdrawn` release posture
without enabling live database writes, SQL reads, or partner data surfaces.

## Scope

- In scope:
  - `@aiphabee/serving-store` release/isolation planner;
  - `PASS/WARN/HOLD/REJECT_RAW` release semantics;
  - field-level and record-level quality state aggregation;
  - `DATA_QUALITY_HOLD` mapping for non-released Serving plans;
  - Worker `/data/runtime` quality-release capability;
  - Worker `/gateway/runtime` quality-release capability;
  - gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - live SQL writes to `aiphabee_core.serving_snapshot`;
  - live SQL reads from Serving Store;
  - partner-loaded rows;
  - live quality jobs or replay jobs;
  - usage ledger live writes;
  - billing reconciliation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/gateway/access.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/serving-quality-release-isolation-scaffold.md
  - docs/governance/serving-read-scaffold-default-deny.md
  - docs/governance/serving-store-schema-scaffold.md
  - packages/data-access-gateway/**
  - packages/serving-store/**
  - plans/plan-serving-quality-release-isolation-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/serving-quality-release-isolation-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/serving-quality-release-isolation-scaffold.notes.md
  - tasks/notes/serving-read-scaffold-default-deny.notes.md
  - tasks/notes/serving-store-schema-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - docs/governance/serving-quality-release-isolation-scaffold.md
    - packages/serving-store/src/index.ts
    - packages/serving-store/src/index.test.ts
  content_checks:
    - "PASS and WARN produce releaseState=released"
    - "WARN carries a visible quality warning"
    - "HOLD produces releaseState=held and DATA_QUALITY_HOLD"
    - "REJECT_RAW produces releaseState=withdrawn and DATA_QUALITY_HOLD"
    - "Runtime reports no live reads, no live writes, and no SQL emitted"
    - "No market data rows, partner data, live DB credentials, or provider secrets are committed"
  commands_succeed:
    - npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /data/runtime returns serving_store.quality_release.status=quality_release_isolation_scaffold"
    - "GET /gateway/runtime returns serving_store.quality_release.status=quality_release_isolation_scaffold"
```

## Acceptance Notes

- This task completes a release/isolation scaffold only.
- Data Access Gateway live Serving remains open.
- Persistent quality jobs and live Serving snapshot mutation remain open.

## Rollback Point

- Revert the commit that adds the release/isolation planner, runtime capability,
  contract guard, and tracker update.
