# Traceability Matrix Sync Contract

## Source

- PRD: `docs/researches/AiphaBee_PRD_v1.0.md`
- Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Governance: `docs/governance/traceability-matrix-sync.md`

## Acceptance

- §M rows with existing repo-local acceptance evidence are checked.
- §M rows that still need live runtime, frontend, external partner/signoff, or deferred product evidence remain unchecked.
- A local checker asserts both sides of the boundary.
- The root `npm run check` includes the traceability matrix checker.
- No product runtime or web frontend source is changed by this sync.

## Verification

- `npm run check:traceability-matrix`
- `npm run check`
