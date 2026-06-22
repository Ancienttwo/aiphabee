# Corporate Action Benchmark Parity Scaffold Contract

## Source

- PRD: `docs/researches/AiphaBee_PRD_v1.0.md`
- Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Contract: `deploy/governance/corporate-action-benchmark-parity.contract.json`

## Acceptance

- `@aiphabee/corporate-actions` exposes `CORPORATE_ACTION_BENCHMARK_PARITY_VERSION`, `getCorporateActionBenchmarkParityCapabilities()`, and `runCorporateActionBenchmarkParityGate()`.
- The benchmark fixture includes 20 cases with 10 `partner_reference` and 10 `public_exchange_reference` cases.
- The gate compares `splitAdjustedClose` and `totalReturnAdjustedClose` with explicit tolerance and returns empty `failures` when passed.
- Worker exposes `GET /data/corporate-actions/benchmark-parity`.
- `GET /data/runtime` exposes `corporate_actions.benchmark_parity`.
- Live partner data, live Serving reads, SQL execution, persistent writes, and frontend rendering remain disabled.

## Verification

- `npm run check:corporate-action-benchmark-parity`
- `npm run check:traceability-matrix`
- `npm run typecheck --workspace @aiphabee/corporate-actions`
- `npm run typecheck --workspace @aiphabee/worker`
