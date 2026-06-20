# Task Contract: serving-read-scaffold-default-deny

> **Status**: Verified
> **Plan**: `plans/plan-serving-read-scaffold-default-deny.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-serving-read-default-deny
> **Last Updated**: 2026-06-20 17:10 +08
> **Notes File**:
> `tasks/notes/serving-read-scaffold-default-deny.notes.md`

## Goal

Create a deterministic Serving read planner scaffold that is attached to Data
Access Gateway decisions while preserving default-deny, quality-hold, no SQL,
and no live Serving reads.

## Scope

- In scope:
  - `@aiphabee/serving-store` read planner package;
  - Data Access Gateway `servingRead` decision attachment;
  - default-deny read blocking;
  - quality-hold read blocking;
  - cache-key material for data version, rights policy version, methodology,
    field set, and time range;
  - Worker `/gateway/runtime` read-planner capability;
  - gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - live SQL against Serving Store;
  - partner-loaded rows;
  - Hyperdrive/Supabase live reads;
  - DB entitlement policy source;
  - persistent usage ledger writes;
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
  - docs/governance/serving-read-scaffold-default-deny.md
  - docs/governance/serving-store-schema-scaffold.md
  - package-lock.json
  - packages/data-access-gateway/**
  - packages/serving-store/**
  - plans/plan-serving-read-scaffold-default-deny.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/serving-read-scaffold-default-deny.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/serving-read-scaffold-default-deny.notes.md
  - tasks/notes/serving-store-schema-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - packages/serving-store/src/index.ts
    - packages/serving-store/src/index.test.ts
    - docs/governance/serving-read-scaffold-default-deny.md
  content_checks:
    - "Default-deny creates a blocked Serving read plan with no SQL and no served rows"
    - "DATA_QUALITY_HOLD creates a quality-hold Serving read plan with no SQL and no served rows"
    - "Synthetic allowed policy can plan a held read without liveRead=true"
    - "Gateway runtime reports read-planner capability and live_reads=false"
    - "No market data rows, partner data, live DB credentials, or provider secrets are committed"
  commands_succeed:
    - npm run test -- packages/serving-store/src/index.test.ts packages/data-access-gateway/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns serving_store.read_planner.status=read_planner_scaffold"
    - "GET /gateway/runtime returns serving_store.read_planner.live_reads=false"
```

## Acceptance Notes

- This task completes a Serving read planner scaffold only.
- Data Access Gateway live Serving remains open.
- Quality-release isolation into persistent Serving snapshots remains open.

## Rollback Point

- Revert the commit that adds the read planner package, Gateway decision
  attachment, runtime capability, and tracker update.
