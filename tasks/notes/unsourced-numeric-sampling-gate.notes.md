# Unsourced Numeric Sampling Gate Notes

## What Changed

- Added `createUnsourcedNumericSamplingReport()` to `@aiphabee/agent-runtime`.
- Added deterministic 1000 accepted-answer sampling coverage and 3 blocked
  probes in the agent runtime tests.
- Added `deploy/observability/unsourced-numeric-sampling.contract.json`.
- Added `check:unsourced-numeric-sampling` and wired it into root `npm run check`.
- Updated the tracker and deferred ledger without marking A4 production/live
  sampling complete.

## Verification

- `npm run check:unsourced-numeric-sampling`
- `npm run check:post-generation-evidence-binding`
- `npm run check:eval-v1`
- `npm run test --workspace @aiphabee/agent-runtime`
- `npm run check`

## Remaining Gaps

production/live sampling remains incomplete. Live model output sampling,
partner-approved production corpus sampling, persistent eval writes, and
frontend evidence-card rendering are not claimed.
