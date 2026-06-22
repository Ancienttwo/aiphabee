# Unsourced Numeric Sampling Gate

> **Status**: Verified local deterministic gate
> **Last Updated**: 2026-06-22 00:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/unsourced-numeric-sampling-gate.contract.md`
> **Machine Contract**: `deploy/observability/unsourced-numeric-sampling.contract.json`

This slice adds a local deterministic sampling gate for the PRD A4 unsourced
numeric claim target. It samples candidate answer payloads through the existing
post-generation validator and computes the eval v1-compatible
`observed_rate < 0.001` rule.

It does not claim production/live sampling completeness. The A4 tracker item
for production/live sampling remains incomplete until live model output,
partner-approved corpus sampling, and persistent eval evidence are available.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime | `packages/agent-runtime` | Owns `createUnsourcedNumericSamplingReport()` and reuses `validatePostGenerationEvidenceBinding()` |
| Eval v1 contract | `deploy/observability/eval-v1.contract.json` | Owns the canonical `0.001` target rate |
| Sampling contract | `deploy/observability/unsourced-numeric-sampling.contract.json` | Requires 1000 accepted samples and 3 blocked probes |
| Checker | `npm run check:unsourced-numeric-sampling` | Cross-checks package scripts, runtime/test tokens, docs, tracker, and linked contracts |
| Explicitly absent | Production/live corpus sampling | No model calls, live evidence binding, frontend cards, persistent eval writes, or partner-approved corpus |

## P2 Concrete Trace

1. A deterministic fixture sample enters `createUnsourcedNumericSamplingReport()`
   as either `accepted_answer` or `blocked_probe`.
2. The helper forwards the sample payload to
   `validatePostGenerationEvidenceBinding()`.
3. Accepted samples contribute to `accepted_sample_count` and
   `unsourced_claim_count`.
4. Blocked probes must return `blocked_unsourced_numeric_claim` and
   `output_allowed=false`.
5. The report passes only when at least 1000 accepted samples produce
   `observed_rate < 0.001` and at least 3 blocked probes are detected.

## P3 Design Decision

Selected a local sampling gate inside `@aiphabee/agent-runtime` instead of
adding an `@aiphabee/observability` dependency on Agent runtime.

Reason:

- The only safe source of truth for unsourced numeric detection is the
  post-generation validator.
- Eval v1 already defines the target rate, but observability must remain a
  no-dependency metrics package.
- The smallest coherent change is a runtime report helper plus a governance
  checker that links back to eval v1.

Tradeoff:

- The repo now has a deterministic regression gate for the A4 target semantics.
- Production/live sampling remains incomplete until real model outputs and eval
  persistence are wired.

## Verification

Required:

- `npm run check:unsourced-numeric-sampling`
- `npm run check:post-generation-evidence-binding`
- `npm run check:eval-v1`
- `npm run test --workspace @aiphabee/agent-runtime`
- `npm run check`

## Residual Gaps

- production/live sampling remains incomplete.
- No live model output corpus is sampled.
- No persistent eval-store write is claimed.
- No frontend evidence-card rendering is claimed.
