# Sprint 1.1 Live Data Activation Notes

Date: 2026-06-22

## Completed

- Added `deploy/governance/sprint1-live-data-activation.contract.json`.
- Added `scripts/check-sprint1-live-data-activation-contract.mjs`.
- Added `docs/governance/sprint1-live-data-activation.md`.
- Linked the activation contract to the Sprint 1.1 evidence manifest and
  required manifest/fixture checks.
- Added `npm run check:sprint1-live-data-activation` and wired it into full
  `npm run check`.
- Updated `docs/AiphaBee_Sprint_Tracker_v1.0.md` and `tasks/todos.md`.

## Boundary

The activation checker links the existing Data Gateway, database, field-rights,
Serving quality readiness, quota display, and billing reconciliation contracts.
It verifies the current system still has live data access, live Serving SQL,
persistent usage writes, and billing provider posting disabled.

## Activation Gates

The ledger requires evidence for signed partner data rights, loaded partner
Serving rows, live field-rights policy source, Hyperdrive `SELECT 1`, Serving
SQL execution cutover, quality-owner approval, live usage-event writes,
live usage-ledger-entry writes, and billing reconciliation reads before Sprint
1.1 can claim live data activation.

## Current State

No live reads or writes were enabled in this task. The Data Access Gateway live
Serving and Usage ledger live writes checkboxes remain incomplete.
