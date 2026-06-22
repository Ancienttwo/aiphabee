# Task Contract: live-smoke-external-env-preflight

> **Status**: Verified
> **Task Profile**: governance/preflight checker
> **Owner**: Codex
> **Capability ID**: phase0-runtime-readiness
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/live-smoke-external-env-preflight.notes.md`

## Goal

Make the remaining Sprint 0.4 live smoke external environment requirements
machine-readable per command without printing secret values or running networked
smoke operations.

## Scope

- In scope:
  - preflight checker for all six live smoke commands in the evidence ledger;
  - env source classification as `env`, `contract_partial_provisioning`, or
    `missing`;
  - package script and full `npm run check` integration;
  - governance docs, tracker, and deferred-ledger updates.
- Out of scope:
  - running credentialed live smoke commands;
  - validating token permissions;
  - printing env values, account IDs, tokens, OTLP headers, or provider outputs;
  - frontend changes.

## Files

- `scripts/check-live-smoke-external-env-preflight.mjs`
- `docs/governance/live-smoke-evidence-ledger.md`
- `tasks/notes/live-smoke-external-env-preflight.notes.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  commands_succeed:
    - npm run check:live-smoke-external-env-preflight
    - npm run check:live-smoke-evidence-ledger
    - npm run check:traceability-matrix
  content_checks:
    - "Preflight covers all six live smoke commands"
    - "Preflight reads required env from existing contracts"
    - "Preflight reports names and source categories only"
    - "Non-inferable env cannot resolve from contract defaults"
    - "Missing env names must already be listed in ledger.non_inferable_env"
```

## Acceptance Notes

This task is complete when the preflight gate is executable and part of full
`npm run check`. It does not claim live credentials exist or that any live smoke
command has passed.
