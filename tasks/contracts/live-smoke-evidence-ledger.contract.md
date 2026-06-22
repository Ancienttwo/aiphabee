# Task Contract: live-smoke-evidence-ledger

> **Status**: Verified
> **Task Profile**: governance contract
> **Owner**: Codex
> **Capability ID**: phase0-runtime-readiness
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/live-smoke-evidence-ledger.notes.md`

## Goal

Create a machine-checkable ledger for Sprint 0.4 live smoke evidence so current
partial passes and remaining blockers are explicit without committing secrets or
raw provider outputs.

## Scope

- In scope:
  - live smoke evidence ledger contract;
  - checker that cross-validates existing readiness contracts and package
    scripts;
  - governance documentation;
  - sprint tracker and deferred-ledger updates.
- Out of scope:
  - running credentialed live smoke commands;
  - provisioning Hyperdrive, OTLP, GitHub, Supabase, or AI Gateway permissions;
  - storing raw evidence payloads;
  - frontend changes.

## Files

- `deploy/governance/live-smoke-evidence-ledger.contract.json`
- `scripts/check-live-smoke-evidence-ledger-contract.mjs`
- `docs/governance/live-smoke-evidence-ledger.md`
- `tasks/notes/live-smoke-evidence-ledger.notes.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  commands_succeed:
    - npm run check:live-smoke-evidence-ledger
    - npm run check:cloudflare-resource-live-readiness
    - npm run check:model-provider-live-readiness
    - npm run check:observability-live-readiness
    - npm run check:provider-secret-stores-live-readiness
  content_checks:
    - "Ledger lists all six live smoke commands"
    - "Ledger keeps release_transition_allowed=false"
    - "Ledger forbids raw secrets and provider outputs"
    - "Ledger records Hyperdrive, AI Gateway observability, OTLP/eval-store, and provider-secret blockers"
```

## Acceptance Notes

This task is complete when the ledger is executable and integrated into
`npm run check`. It does not claim Sprint 0.4 live readiness is complete.
