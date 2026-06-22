# Live Smoke Capture Artifacts Notes

Date: 2026-06-22

## Completed

- Added `deploy/governance/live-smoke-capture-artifacts.contract.json`.
- Added `scripts/check-live-smoke-capture-artifacts-contract.mjs`.
- Added `npm run check:live-smoke-capture-artifacts` and wired it into full
  `npm run check`.
- Updated `docs/governance/live-smoke-evidence-ledger.md`,
  `docs/AiphaBee_Sprint_Tracker_v1.0.md`, and `tasks/todos.md`.

## Capture Schema Boundary

Each future credentialed live smoke capture must reference the ledger command
and script, include an observed time, runner label, exit code, redacted source
locator, `sha256:` hash of the redacted JSON output, and `redacted_no_secrets`
status. The provider-secret store rotation capture additionally requires
cleanup proof because it performs destructive set/list/rotate/delete operations.

## Current State

The contract is ready for external-env capture, but no live smoke outputs were
captured in this task. The production evidence ledger remains
`pending_live_evidence` with `all_live_smokes_passed=false` and
`release_transition_allowed=false`.

No Sprint 0.4 live smoke checkbox was marked complete.
