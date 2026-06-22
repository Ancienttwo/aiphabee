# Task Contract: Unsourced Numeric Sampling Gate

## Objective

Add a local deterministic gate for the A4 unsourced numeric claim target without
claiming production/live sampling completion.

## Acceptance

- Add `deploy/observability/unsourced-numeric-sampling.contract.json`.
- Add `npm run check:unsourced-numeric-sampling`.
- Export `createUnsourcedNumericSamplingReport()` from
  `@aiphabee/agent-runtime`.
- Reuse `validatePostGenerationEvidenceBinding()` for every sample.
- Require at least 1000 `accepted_answer` samples.
- Require at least 3 `blocked_probe` samples.
- Use `target_rate=0.001` and fail when `observed_rate >= 0.001`.
- Keep the A4 production/live sampling checkbox unchecked in the tracker.

## Verification

- `npm run check:unsourced-numeric-sampling`
- `npm run check:post-generation-evidence-binding`
- `npm run check:eval-v1`
- `npm run test --workspace @aiphabee/agent-runtime`
- `npm run check`

## Out Of Scope

- production/live sampling remains incomplete.
- Live model output sampling.
- Partner-approved production corpus sampling.
- Persistent eval-store writes.
- Frontend evidence-card rendering.
