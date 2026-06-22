# Task Contract: sprint1-live-data-activation

> **Status**: Verified
> **Task Profile**: governance/release guard
> **Owner**: Codex
> **Capability ID**: sprint11-live-data-activation
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/sprint1-live-data-activation.notes.md`

## Goal

Create a machine-checkable activation ledger for Sprint 1.1 live Serving and
live usage writes, without enabling live reads, SQL execution, persistent usage
writes, billing provider posting, or frontend behavior.

## Scope

- In scope:
  - Sprint 1.1 live data activation contract;
  - checker that links Data Gateway, Serving readiness, usage quota, billing
    reconciliation, database, and field-rights contracts;
  - explicit external activation gates;
  - package/full-check integration;
  - governance docs, sprint tracker, and deferred-ledger updates.
- Out of scope:
  - loading partner Serving rows;
  - enabling Hyperdrive SQL execution;
  - writing `core.usage_event` or `core.usage_ledger_entry`;
  - posting billing reconciliation;
  - frontend changes.

## Files

- `deploy/governance/sprint1-live-data-activation.contract.json`
- `scripts/check-sprint1-live-data-activation-contract.mjs`
- `docs/governance/sprint1-live-data-activation.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/notes/sprint1-live-data-activation.notes.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  commands_succeed:
    - npm run check:sprint1-live-data-activation
    - npm run check:data-gateway
    - npm run check:serving-quality-live-readiness
    - npm run check:usage-quota-display
    - npm run check:usage-billing-reconciliation
    - npm run check:traceability-matrix
  content_checks:
    - "Data Access Gateway live Serving remains unchecked"
    - "Usage ledger live writes remains unchecked"
    - "Existing no-live contracts still report live reads/writes=false"
    - "Activation gates cover partner rows, Hyperdrive, field rights, quality owner cutover, usage writes, and billing reconciliation"
    - "No market rows, usage rows, billing rows, database URLs, account IDs, tokens, or provider secrets are committed"
```

## Acceptance Notes

This task is complete when the activation ledger is executable and wired into
`npm run check`. It does not claim Sprint 1.1 live Serving or usage-ledger live
writes are complete.
