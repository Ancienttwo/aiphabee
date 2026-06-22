# Task Contract: live-smoke-capture-artifacts

> **Status**: Verified
> **Task Profile**: governance/capture contract
> **Owner**: Codex
> **Capability ID**: phase0-runtime-readiness
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/live-smoke-capture-artifacts.notes.md`

## Goal

Define and validate the redacted capture artifact schema required before future
credentialed live smoke outputs can be attached to the Sprint 0.4 evidence
ledger.

## Scope

- In scope:
  - machine-readable capture artifact contract;
  - checker that aligns all six captures with the live smoke evidence ledger;
  - packet-directory verifier for future external run artifacts;
  - packet-directory fixture gate that reuses the same verifier;
  - operator handoff templates for the six credentialed live smoke captures;
  - package/full-check integration;
  - governance docs, sprint tracker, and deferred-ledger updates.
- Out of scope:
  - running credentialed live smoke commands;
  - storing raw smoke outputs, account IDs, tokens, OTLP headers, provider
    outputs, prompts, or model output text;
  - changing the production live smoke ledger status;
  - frontend changes.

## Files

- `deploy/governance/live-smoke-capture-artifacts.contract.json`
- `deploy/governance/live-smoke-capture-packets/README.md`
- `scripts/check-live-smoke-capture-artifacts-contract.mjs`
- `scripts/check-live-smoke-capture-packets.mjs`
- `scripts/check-live-smoke-capture-packet-fixtures.mjs`
- `scripts/check-live-smoke-capture-handoff.mjs`
- `deploy/governance/live-smoke-capture-templates/README.md`
- `deploy/governance/live-smoke-capture-templates/*.capture.json`
- `docs/governance/live-smoke-evidence-ledger.md`
- `tasks/notes/live-smoke-capture-artifacts.notes.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  commands_succeed:
    - npm run check:live-smoke-capture-artifacts
    - npm run check:live-smoke-capture-packets
    - npm run check:live-smoke-capture-packet-fixtures
    - npm run check:live-smoke-capture-handoff
    - npm run check:live-smoke-external-env-preflight
    - npm run check:live-smoke-evidence-ledger
    - npm run check:traceability-matrix
  content_checks:
    - "Capture contract covers all six ledger live smoke commands"
    - "Capture command and script values match the ledger"
    - "Passed captures require sha256 output hashes"
    - "Missing-env captures cannot unlock release transition"
    - "Provider secret store captures require cleanup proof"
    - "Empty packet directory is accepted until external env arrives"
    - "Capture packet fixtures cover empty, complete, missing-env, bad-hash, raw-output, duplicate, command-mismatch, and cleanup regressions"
    - "Operator handoff templates validate as missing-env packets before live execution"
    - "Operator handoff README lists external env names and live-smoke command order"
    - "Any committed packet file must be strict redacted/hash-only evidence"
    - "No raw secrets, raw outputs, account IDs, resource IDs, OTLP headers, prompts, or model outputs are allowed"
```

## Acceptance Notes

This task is complete when the capture contract and packet verifier are
executable and wired into `npm run check`. It does not claim live smoke output
has been captured or that Sprint 0.4 live readiness is complete.
