# Live Smoke Capture Artifacts Notes

Date: 2026-06-22

## Completed

- Added `deploy/governance/live-smoke-capture-artifacts.contract.json`.
- Added `scripts/check-live-smoke-capture-artifacts-contract.mjs`.
- Added `deploy/governance/live-smoke-capture-packets/README.md`.
- Added `scripts/check-live-smoke-capture-packets.mjs`.
- Added `scripts/check-live-smoke-capture-packet-fixtures.mjs`.
- Added `npm run check:live-smoke-capture-artifacts` and wired it into full
  `npm run check`.
- Added `npm run check:live-smoke-capture-packets` and wired it into full
  `npm run check`.
- Added `npm run check:live-smoke-capture-packet-fixtures` and wired it into
  full `npm run check`.
- Updated `docs/governance/live-smoke-evidence-ledger.md`,
  `docs/AiphaBee_Sprint_Tracker_v1.0.md`, and `tasks/todos.md`.

## Capture Schema Boundary

Each future credentialed live smoke capture must reference the ledger command
and script, include an observed time, runner label, exit code, redacted source
locator, `sha256:` hash of the redacted JSON output, and `redacted_no_secrets`
status. The provider-secret store rotation capture additionally requires
cleanup proof because it performs destructive set/list/rotate/delete operations.

The capture packet verifier accepts an empty packet directory while external env
is unavailable. Once a JSON packet exists, it must use the ledger-backed
`<capture_id>.capture.json` file name, match the expected command/script, carry
only strict schema fields, use `sha256:` evidence refs, and avoid raw outputs or
secret-like payloads.

The capture packet fixtures reuse the exported packet validator and cover
empty-directory, complete-passed, missing-env, missing output hash, missing-env
with output hash, non-hash evidence refs, provider-secret cleanup, non-
destructive cleanup, raw-output fields, command mismatches, duplicate capture
IDs, unexpected capture IDs, secret-like locators, and missing artifact
directory regressions.

## Current State

The contract is ready for external-env capture, but no live smoke outputs were
captured in this task. The production evidence ledger remains
`pending_live_evidence` with `all_live_smokes_passed=false` and
`release_transition_allowed=false`.

No Sprint 0.4 live smoke checkbox was marked complete.
