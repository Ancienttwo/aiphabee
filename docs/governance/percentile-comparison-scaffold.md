# Percentile Comparison Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 11:30 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-percentile-comparison-scaffold.md`
> **Task Contract**: `tasks/contracts/percentile-comparison-scaffold.contract.md`

This slice continues Sprint 2.1 with a backend-only `compare_percentiles`
scaffold. It compares a subject metric against peer, index, and own-history
synthetic benchmarks while making benchmark and constituent as-of metadata
explicit.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/analytics-tools` | Owns deterministic analytics scaffolds |
| Runtime route | `GET /analytics/runtime` | Reports compare, screen, ratios, returns/risk, and percentile capabilities |
| Percentile route | `POST /analytics/percentile-comparison` | Returns peer/index/history percentile comparisons |
| Source tools | `resolve_security`, `get_financial_ratios`, `calculate_returns_risk` | Existing synthetic handlers remain source of truth |
| Contract | `deploy/analytics/percentile-comparison.contract.json` | Guards benchmark/as-of/point-in-time behavior |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /analytics/percentile-comparison` with
   `security_query` or `instrument_id`.
2. If only `security_query` is supplied, the package runs `resolve_security()`.
3. Ambiguous or unresolved securities return `blocked_resolution`; no guess is
   selected.
4. The package derives the subject metric from:
   - `get_financial_ratios` for `net_margin`
   - `calculate_returns_risk` for `total_return`
5. The package compares the subject value against synthetic peer, index, and
   own-history distributions.
6. Each benchmark result returns benchmark ID, benchmark as-of, constituent
   as-of, constituents or historical observations, sample count, percentile
   rank, and point-in-time metadata.
7. The Worker returns the result in the shared standard envelope.

## P3 Design Decision

Selected explicit synthetic benchmark fixtures over implicit live constituents.

Reason:

- ANA-02 requires benchmark and constituent timing to be visible.
- The repo does not yet have live index constituent or historical industry
  classification services.
- A deterministic scaffold can prove the response contract and prevent future
  data leakage before live data is introduced.

Tradeoff:

- The point-in-time contract is testable now.
- Live peer/index constituents remain disabled.
- Broader historical screening classification is left to the next Sprint 2.1
  safeguard slice.

## Verification

Passed:

- `npm run check:percentile-comparison`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /analytics/runtime`
- local Worker smoke for `POST /analytics/percentile-comparison`

Observed percentile behavior:

```json
{
  "toolName": "compare_percentiles",
  "status": "compared",
  "metric_id": "net_margin",
  "subject": ["get_financial_ratios", 0.189184],
  "comparisons": [
    ["peer", 0.8],
    ["index", 0.8],
    ["history", 0.8]
  ],
  "no_future_constituents": true
}
```

## Residual Gaps

- Live peer/index constituents are not implemented.
- Point-in-time screening safeguards beyond this percentile contract are not
  implemented.
- Frontend comparison, screening, ratios, returns/risk, and percentile UI
  remains delegated.
- Tool registry/MCP exposure remains pending.
