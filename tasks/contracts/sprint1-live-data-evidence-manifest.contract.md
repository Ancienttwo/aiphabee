# Task Contract: sprint1-live-data-evidence-manifest

> **Status**: Verified
> **Task Profile**: governance/release guard
> **Owner**: Codex
> **Capability ID**: sprint11-live-data-evidence-manifest
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/sprint1-live-data-evidence-manifest.notes.md`

## Goal

Create a machine-checkable evidence manifest for Sprint 1.1 live data activation
so accepted evidence, not checkbox edits, controls the transition from blocked
live Serving/usage surfaces to a future activation decision.

## Scope

- In scope:
  - Sprint 1.1 live data evidence manifest;
  - contract checker and transition fixtures;
  - evidence packet verifier, packet fixtures, and operator handoff templates;
  - alignment with the Sprint 1.1 activation ledger gate ids, blocked surfaces,
    and required evidence names;
  - package/full-check integration;
  - governance docs, sprint tracker, and deferred-ledger updates.
- Out of scope:
  - collecting real partner rows or live DB values;
  - enabling Hyperdrive SQL execution;
  - writing usage ledger rows;
  - posting billing reconciliation;
  - frontend changes.

## Files

- `deploy/governance/sprint1-live-data-evidence-manifest.contract.json`
- `scripts/check-sprint1-live-data-evidence-manifest-contract.mjs`
- `scripts/check-sprint1-live-data-evidence-manifest-fixtures.mjs`
- `scripts/check-sprint1-live-data-evidence-packets.mjs`
- `scripts/check-sprint1-live-data-evidence-packet-fixtures.mjs`
- `scripts/check-sprint1-live-data-evidence-handoff.mjs`
- `docs/governance/sprint1-live-data-evidence-manifest.md`
- `deploy/governance/sprint1-live-data-evidence-packets/`
- `deploy/governance/sprint1-live-data-evidence-templates/`
- `docs/governance/sprint1-live-data-activation.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/notes/sprint1-live-data-evidence-manifest.notes.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  commands_succeed:
    - npm run check:sprint1-live-data-evidence-manifest
    - npm run check:sprint1-live-data-evidence-manifest-fixtures
    - npm run check:sprint1-live-data-evidence-packets
    - npm run check:sprint1-live-data-evidence-packet-fixtures
    - npm run check:sprint1-live-data-evidence-handoff
    - npm run check:sprint1-live-data-activation
    - npm run check:traceability-matrix
  content_checks:
    - "Data Access Gateway live Serving remains unchecked"
    - "Usage ledger live writes remains unchecked"
    - "Production manifest keeps all activation gates missing"
    - "Packet directory may be empty until external evidence arrives"
    - "Handoff templates validate as missing packets"
    - "Complete fixture requires all gates accepted with sha256 evidence refs"
    - "No raw partner rows, DB values, billing payloads, URLs, tokens, or secrets are committed"
```

## Acceptance Notes

This task is complete when evidence manifest validation and transition fixtures
are wired into `npm run check`. It does not claim Sprint 1.1 live Serving or
usage-ledger live writes are complete.
