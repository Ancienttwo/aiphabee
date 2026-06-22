# Consensus Estimates Scaffold

Status: local contract complete

This slice closes the Phase 4 backlog item for `get_consensus_or_estimates`
as a backend-only analytics tool gated by explicit redistribution rights.

## Scope

- Package: `@aiphabee/analytics-tools`
- Runtime capability: `GET /analytics/runtime`
- Route: `POST /analytics/consensus-estimates`
- Contract: `deploy/analytics/consensus-estimates.contract.json`
- Gate: `npm run check:consensus-estimates`

## Invariants

- Consensus and estimates require explicit redistribution rights before
  returning rows.
- Calls without confirmed rights return `blocked_redistribution_rights`.
- Calls with rights but without a resolvable security return
  `blocked_resolution`.
- Outputs include `rights`, `security`, `consensus`, `estimates`, and
  `source_record_ids`.
- The scaffold uses deterministic synthetic samples only; it does not read live
  providers, expose raw provider payloads, emit SQL, write persistent state,
  provide investment advice, or render frontend UI.

## Verification

Run:

```sh
npm run check:consensus-estimates
npx vitest run packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts
```
