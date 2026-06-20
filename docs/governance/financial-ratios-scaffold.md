# Financial Ratios Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 06:18 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-financial-ratios-scaffold.md`
> **Task Contract**: `tasks/contracts/financial-ratios-scaffold.contract.md`

This slice continues Sprint 2.1 with a backend-only `get_financial_ratios`
scaffold. It derives deterministic ratios from existing synthetic financial
facts, attaches formula/version metadata, preserves source-record IDs, and
returns synthetic percentile metadata without enabling live peer constituents.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/analytics-tools` | Owns deterministic analytics scaffolds |
| Runtime route | `GET /analytics/runtime` | Reports compare, screen, and ratio capabilities |
| Ratios route | `POST /analytics/financial-ratios` | Returns derived ratios, definitions, blocked reasons, and percentiles |
| Source tools | `resolve_security`, `get_financial_facts` | Existing synthetic handlers remain source of truth |
| Contract | `deploy/analytics/financial-ratios.contract.json` | Guards formula/version/source/percentile behavior |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /analytics/financial-ratios` with `security_query` or
   `instrument_id`.
2. If only `security_query` is supplied, the package runs `resolve_security()`.
3. Ambiguous or unresolved securities return `blocked_resolution`; no guess is
   selected.
4. Resolved securities call `getFinancialFacts()` for revenue, net income,
   assets, and equity at the requested financial period.
5. The package computes:
   - `net_margin`
   - `return_on_assets`
   - `return_on_equity`
   - `asset_turnover`
   - `equity_multiplier`
6. Missing inputs, held facts, zero denominators, and negative denominators are
   returned as blocked ratio rows with explicit `blocked_reason`.
7. Computed rows include formula version, input values, source-record IDs, and a
   synthetic peer percentile.
8. The Worker returns the result in the shared standard envelope.

## P3 Design Decision

Selected deterministic accounting ratios before return/risk metrics.

Reason:

- The ratios depend only on the existing financial facts fixture surface.
- They are a lower-risk math dependency for comparison and screening.
- Return/risk/Beta needs a separate price-history window contract and tolerance
  gate, so mixing it into this slice would blur acceptance.

Tradeoff:

- Formula/version/source traceability is testable now.
- Peer percentiles are scaffold metadata from a synthetic distribution, not live
  constituent ranking.
- Valuation multiples remain blocked until market-cap/share-count authority is
  available.

## Verification

Passed:

- `npm run check:financial-ratios`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /analytics/runtime`
- local Worker smoke for `POST /analytics/financial-ratios`

Observed ratio behavior:

```json
{
  "toolName": "get_financial_ratios",
  "status": "computed",
  "instrument_id": "eq_hk_00700",
  "ratios": [
    ["net_margin", 0.189184],
    ["return_on_assets", 0.073386],
    ["return_on_equity", 0.13915],
    ["asset_turnover", 0.387908],
    ["equity_multiplier", 1.896135]
  ],
  "percentile_methodology": "synthetic_peer_distribution_rank"
}
```

## Residual Gaps

- Return/risk/Beta calculations are not implemented.
- Peer/index/history percentile comparison beyond ratio scaffold metadata is not
  implemented.
- Frontend comparison, screening, and ratio UI remains delegated.
- Tool registry/MCP exposure remains pending.
- Live peer constituents and live data remain disabled.
