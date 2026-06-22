# Serving Quality Live Readiness

## Scope

This gate closes DAT-06 repo-local acceptance for the quality isolation path into Serving. It does not enable live partner rows, Hyperdrive reads, SQL execution, persistent writes, or frontend behavior.

## Contract

- `PASS` and `WARN` snapshots map to `released`; `WARN` keeps the warning surface.
- `HOLD` snapshots map to `held` and return `DATA_QUALITY_HOLD`.
- `REJECT_RAW` snapshots map to `withdrawn` and return `DATA_QUALITY_HOLD`.
- Blocked quality states stop before Serving query, SQL text emission, SQL execution, rows, and credits.
- Live activation remains blocked by partner Serving rows, Hyperdrive execution enablement, and quality-owner cutover signoff.

## Verification

- `npm run check:serving-quality-live-readiness`
- `npx vitest run packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
