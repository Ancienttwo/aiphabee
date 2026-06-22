# Live Smoke Evidence Ledger Transition Fixtures Notes

Date: 2026-06-22

## Completed

- Refactored `scripts/check-live-smoke-evidence-ledger-contract.mjs` to export
  `validateLedger()` while preserving the CLI checker.
- Added `scripts/check-live-smoke-evidence-ledger-fixtures.mjs`.
- Added `npm run check:live-smoke-evidence-ledger-fixtures` and wired it into
  full `npm run check`.
- Updated `docs/governance/live-smoke-evidence-ledger.md`,
  `docs/AiphaBee_Sprint_Tracker_v1.0.md`, and `tasks/todos.md`.

## Fixture Coverage

- Valid current production ledger: pending live evidence.
- Valid synthetic complete ledger: all six live smoke surfaces passed, evidence
  refs present, missing evidence cleared, transition ready.
- Invalid partial surface release flags.
- Invalid passed surface without evidence refs.
- Invalid passed surface retaining missing evidence.
- Invalid raw provider output policy regression.
- Invalid destructive secret cleanup policy regression.
- Invalid missing Hyperdrive blocker.
- Invalid non-inferable env defaulting.
- Invalid early Sprint 0.4 checkbox claim.

## Current Production State

The production ledger remains `pending_live_evidence` with
`all_live_smokes_passed=false` and `release_transition_allowed=false`. No live
smoke command was executed by this task, and no Sprint 0.4 live smoke checkbox
was marked complete.
