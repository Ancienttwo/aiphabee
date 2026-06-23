# Task Contract: usage-ledger-event-writer-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-usage-ledger-event-writer-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-usage-event-writer
> **Last Updated**: 2026-06-20 17:30 +08
> **Notes File**:
> `tasks/notes/usage-ledger-event-writer-scaffold.notes.md`

## Goal

Create a deterministic usage event writer scaffold that turns Gateway decisions
into usage event and ledger-entry plans without enabling live database writes or
billing reconciliation.

## Scope

- In scope:
  - `@aiphabee/usage-ledger` event writer planner;
  - usage event IDs at request/operation/dataset/occurred-at grain;
  - ledger-entry preview/blocked billable state;
  - workspace-context guard for schema readiness;
  - Data Access Gateway `usageLedger` decision attachment;
  - Worker `/gateway/runtime` event-writer capability;
  - gateway access contract guard update;
  - tracker/governance updates.
- Out of scope:
  - live SQL writes to `aiphabee_core.usage_event`;
  - live SQL writes to `aiphabee_core.usage_ledger_entry`;
  - billing provider integration;
  - invoice export or reconciliation posting;
  - quota display UI;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/gateway/access.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/usage-ledger-event-writer-scaffold.md
  - docs/governance/usage-ledger-scaffold.md
  - package-lock.json
  - packages/data-access-gateway/**
  - packages/usage-ledger/**
  - plans/plan-usage-ledger-event-writer-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/usage-ledger-event-writer-scaffold.contract.md
  - tasks/contracts/usage-ledger-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/notes/usage-ledger-event-writer-scaffold.notes.md
  - tasks/notes/usage-ledger-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - packages/usage-ledger/src/index.ts
    - packages/usage-ledger/src/index.test.ts
    - docs/governance/usage-ledger-event-writer-scaffold.md
  content_checks:
    - "Gateway decisions include a usageLedger event/ledger plan"
    - "Billable preview requires workspace context, no error, and positive credits"
    - "Default-deny and quality-hold events remain blocked and zero-credit"
    - "Runtime reports event_writer.status=event_writer_scaffold"
    - "No usage rows, billing rows, market data rows, live DB credentials, or provider secrets are committed"
  commands_succeed:
    - npm run test -- packages/usage-ledger/src/index.test.ts packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run check:data-gateway
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /gateway/runtime returns usage_ledger.event_writer.status=event_writer_scaffold"
    - "GET /gateway/runtime returns usage_ledger.event_writer.live_writes=false"
```

## Acceptance Notes

- This task completes a per-call usage event writer scaffold only.
- Live usage writes, reconciliation posting, billing provider integration, and
  quota UI remain future work.

## Rollback Point

- Revert the commit that adds the usage-ledger planner package, Gateway
  decision attachment, runtime capability, contract guard, and tracker update.
