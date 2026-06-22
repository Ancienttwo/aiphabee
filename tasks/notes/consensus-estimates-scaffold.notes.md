# Consensus Estimates Scaffold Notes

## Summary

Implemented the Phase 4 backend scaffold for consensus ratings, target price,
and financial estimates without enabling live provider access or redistribution
outside an explicit rights gate.

## Current State

- `@aiphabee/analytics-tools` exposes:
  - `getConsensusOrEstimates()`
  - `getConsensusOrEstimatesCapabilities()`
- `GET /analytics/runtime` includes the consensus estimates capability.
- Worker exposes `POST /analytics/consensus-estimates` using the standard
  success envelope.
- The local contract checker verifies redistribution-rights gating, blocked
  statuses, no-live/no-SQL/no-raw-payload/no-advice invariants, source record
  IDs, tests, package scripts, and tracker sync.

## Non-Goals

- No live consensus or estimates provider reads.
- No DB writes.
- No SQL emission.
- No raw provider payload exposure.
- No investment advice.
- No frontend consensus UI.

## Verification

Run:

- `npm run check:consensus-estimates`
- `npx vitest run packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
