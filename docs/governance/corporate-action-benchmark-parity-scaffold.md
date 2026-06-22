# Corporate Action Benchmark Parity Scaffold

## Scope

This scaffold closes DAT-04 benchmark parity for the local corporate action adjustment engine without enabling live partner data. It extends `@aiphabee/corporate-actions` with `runCorporateActionBenchmarkParityGate()` and exposes `GET /data/corporate-actions/benchmark-parity`.

## Boundary

- The parity gate compares deterministic adjustment output against 20 hard-coded partner/public benchmark reference cases.
- Cases cover split, consolidation, cash dividend, multi-action chains, same-effective-date no-adjustment, and post-action no-adjustment boundaries.
- The fixture is balanced between `partner_reference` and `public_exchange_reference` sources.
- The report checks both `splitAdjustedClose` and `totalReturnAdjustedClose` with per-case tolerance.
- The route and `/data/runtime` capability are read-only and do not emit SQL.

## Disabled Surfaces

- Live partner rows
- Live Serving reads
- SQL execution
- Persistent writes
- Frontend rendering

## Verification

- `npm run check:corporate-action-benchmark-parity`
- `npm run check:traceability-matrix`
- `npx vitest run packages/corporate-actions/src/index.test.ts apps/worker/src/index.test.ts`
