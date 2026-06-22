# Sprint 1.1 Live Data Evidence Manifest Notes

Date: 2026-06-22

## Completed

- Added `deploy/governance/sprint1-live-data-evidence-manifest.contract.json`.
- Added `scripts/check-sprint1-live-data-evidence-manifest-contract.mjs`.
- Added `scripts/check-sprint1-live-data-evidence-manifest-fixtures.mjs`.
- Added `scripts/check-sprint1-live-data-evidence-packets.mjs`.
- Added `scripts/check-sprint1-live-data-evidence-packet-fixtures.mjs`.
- Added `scripts/check-sprint1-live-data-evidence-handoff.mjs`.
- Added `docs/governance/sprint1-live-data-evidence-manifest.md`.
- Added `deploy/governance/sprint1-live-data-evidence-packets/` and
  `deploy/governance/sprint1-live-data-evidence-templates/`.
- Linked the Sprint 1.1 activation contract back to the evidence manifest.
- Added both evidence manifest checks to `package.json` and full `npm run check`.
- Updated `docs/AiphaBee_Sprint_Tracker_v1.0.md` and `tasks/todos.md`.

## Boundary

The production manifest keeps all nine activation gates `missing`, all live
runtime flags false, and `release_transition_allowed=false`. It accepts only
redacted, hash-only evidence refs and rejects raw partner rows, database values,
billing payloads, tokens, and secret-like material.

## Fixture Coverage

The manifest fixture checker covers current pending state, complete accepted
state, partial transition flags, accepted gate without evidence refs, non-hash
refs, missing gate retaining refs, unredacted evidence, activation gate block
mismatch, and accepted flag mismatch. The packet fixture checker covers empty
packet directory, complete accepted packet set, missing packet, non-hash refs,
raw row field rejection, required-evidence mismatch, duplicate gate id,
unexpected gate id, secret-like locator, and missing packet directory.

## Current State

No live reads or writes were enabled. The Data Access Gateway live Serving and
Usage ledger live writes checkboxes remain incomplete.
