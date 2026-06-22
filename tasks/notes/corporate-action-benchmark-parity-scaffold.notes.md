# Corporate Action Benchmark Parity Scaffold Notes

## Decision

DAT-04 is closed at the repo-local acceptance level by pairing the existing deterministic adjustment engine with a 20-case partner/public benchmark parity gate. This is sufficient for the current non-frontend slice because PRD DAT-04 requires golden samples to match partner/public baselines, while live partner data and live Serving reads are separate Sprint 1.1 blockers.

## Boundary

- Benchmark references are local fixtures, not licensed vendor rows.
- The gate verifies adjustment math only; it does not load, reconcile, or persist partner data.
- `GET /data/corporate-actions/benchmark-parity` is a no-input, read-only report route.
- Frontend rendering remains out of scope.

## Verification

- `npm run check:corporate-action-benchmark-parity`
