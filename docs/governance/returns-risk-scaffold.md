# Returns/Risk Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 06:24 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-returns-risk-scaffold.md`
> **Task Contract**: `tasks/contracts/returns-risk-scaffold.contract.md`

This slice continues Sprint 2.1 with a backend-only `calculate_returns_risk`
scaffold. It derives deterministic return/risk metrics from existing synthetic
price history, attaches formula-version and tolerance metadata, and computes
Beta only when a benchmark is explicitly provided.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/analytics-tools` | Owns deterministic analytics scaffolds |
| Runtime route | `GET /analytics/runtime` | Reports compare, screen, ratios, and returns/risk capabilities |
| Returns/risk route | `POST /analytics/returns-risk` | Returns metrics, definitions, blocked reasons, and window metadata |
| Source tools | `resolve_security`, `get_price_history` | Existing synthetic handlers remain source of truth |
| Contract | `deploy/analytics/returns-risk.contract.json` | Guards formula/version/tolerance/window behavior |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /analytics/returns-risk` with `security_query` or
   `instrument_id`, plus an optional benchmark.
2. If only `security_query` is supplied, the package runs `resolve_security()`.
3. Ambiguous or unresolved securities return `blocked_resolution`; no guess is
   selected.
4. The package calls `getPriceHistory()` for close, return, and drawdown over
   the deterministic 3-row window.
5. The package computes:
   - `total_return`
   - `average_daily_return`
   - `volatility_daily`
   - `volatility_annualized`
   - `max_drawdown`
6. If a benchmark is supplied, benchmark price history is aligned by date and
   Beta is computed as sample covariance over sample variance.
7. If no benchmark is supplied, only Beta is blocked with `benchmark_required`.
8. The Worker returns the result in the shared standard envelope.

## P3 Design Decision

Selected explicit benchmark gating for Beta.

Reason:

- Sprint 2.1 requires deterministic Beta, but the repo does not yet have a
  live index/constituent surface.
- Silently defaulting to an index would create a false source-of-truth.
- The next percentile/index slice can introduce real benchmark policy without
  changing this tool's formula contract.

Tradeoff:

- Return, volatility, and drawdown metrics are available without a benchmark.
- Beta is computed only when benchmark data exists and overlaps by date.
- Peer/index/history percentile comparison remains a separate Sprint 2.1 item.

## Verification

Passed:

- `npm run check:returns-risk`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /analytics/runtime`
- local Worker smoke for `POST /analytics/returns-risk`

Observed returns/risk behavior:

```json
{
  "toolName": "calculate_returns_risk",
  "status": "computed",
  "instrument_id": "eq_hk_00700",
  "benchmark_instrument_id": "eq_hk_00700",
  "metrics": [
    ["total_return", 0.012195],
    ["average_daily_return", 0.007267],
    ["volatility_daily", 0.002301],
    ["volatility_annualized", 0.036523],
    ["max_drawdown", 0],
    ["beta", 1]
  ]
}
```

## Residual Gaps

- Peer/index/history percentile comparison is not implemented.
- Point-in-time screening safeguards beyond latest-as-of metadata are not
  implemented.
- Frontend comparison, screening, ratios, and returns/risk UI remains delegated.
- Tool registry/MCP exposure remains pending.
- Live benchmark constituents and live data remain disabled.
