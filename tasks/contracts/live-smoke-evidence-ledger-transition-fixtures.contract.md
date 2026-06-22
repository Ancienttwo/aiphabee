# Task Contract: live-smoke-evidence-ledger-transition-fixtures

> **Status**: Verified
> **Task Profile**: governance fixture gate
> **Owner**: Codex
> **Capability ID**: phase0-runtime-readiness
> **Last Updated**: 2026-06-22
> **Notes File**: `tasks/notes/live-smoke-evidence-ledger-transition-fixtures.notes.md`

## Goal

Add deterministic fixtures for the live smoke evidence ledger so future changes
cannot unlock Sprint 0.4 release transition from partial, raw, or cleanup-free
evidence states.

## Scope

- In scope:
  - export reusable ledger validation from the existing checker;
  - add transition fixtures for pending, complete, and invalid evidence states;
  - wire the fixture gate into `package.json` and full `npm run check`;
  - update governance docs, tracker, and deferred ledger.
- Out of scope:
  - running credentialed live smoke commands;
  - writing external evidence refs into the production ledger;
  - provisioning Cloudflare, OTLP, GitHub, Supabase, or model-provider env;
  - frontend changes.

## Files

- `scripts/check-live-smoke-evidence-ledger-contract.mjs`
- `scripts/check-live-smoke-evidence-ledger-fixtures.mjs`
- `docs/governance/live-smoke-evidence-ledger.md`
- `tasks/notes/live-smoke-evidence-ledger-transition-fixtures.notes.md`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- `tasks/todos.md`
- `package.json`

## Exit Criteria

```yaml
exit_criteria:
  commands_succeed:
    - npm run check:live-smoke-evidence-ledger
    - npm run check:live-smoke-evidence-ledger-fixtures
    - npm run check:traceability-matrix
  content_checks:
    - "Fixture gate has current pending and complete passed valid scenarios"
    - "Partial surface release flags are rejected"
    - "Passed surfaces without evidence refs are rejected"
    - "Passed surfaces retaining missing_evidence are rejected"
    - "Raw-provider-output and destructive cleanup policy regressions are rejected"
    - "Sprint 0.4 live smoke checkbox remains unclaimed in production ledger"
```

## Acceptance Notes

This task is complete when transition fixtures are executable and part of full
`npm run check`. It does not claim any live smoke command has been rerun or that
Sprint 0.4 live readiness is complete.
