# Compare Securities Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 05:47 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-compare-securities-scaffold.md`
> **Task Contract**: `tasks/contracts/compare-securities-scaffold.contract.md`

This slice starts Sprint 2.1 with a backend-only `compare_securities` scaffold.
It compares 2-5 securities using existing synthetic data surfaces and returns
explicit incomparable reasons instead of hiding missing metrics, quality holds,
currency mismatches, or unit mismatches.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/analytics-tools` | Owns deterministic analytics scaffolds |
| Runtime route | `GET /analytics/runtime` | Reports available analytics tool capability |
| Compare route | `POST /analytics/compare-securities` | Returns compare rows and comparability metadata |
| Source tools | `security-tools`, `market-data`, `financial-facts` | Existing synthetic handlers remain source of truth |
| Contract | `deploy/analytics/compare-securities.contract.json` | Guards ANA-01/ANA-02 compare behavior |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /analytics/compare-securities` with 2-5 securities.
2. Each input runs through `resolve_security`.
3. Resolved securities call:
   - `get_security_profile`
   - `get_quote_snapshot`
   - `get_financial_facts`
4. The package builds per-security rows with quote and four required financial
   metrics: revenue, net income, assets, equity.
5. Rows missing metrics, with data-quality holds, with unresolved security, or
   with currency/unit mismatch are marked incomparable with explicit reasons.
6. The Worker returns the result in the shared standard envelope.

## P3 Design Decision

Selected a new analytics package instead of expanding the Phase 1 tool registry.

Reason:

- Sprint 2.1 begins deterministic analysis surfaces beyond the original 9
  Phase 1 atomic data tools.
- The full P0 tool directory/MCP registration is already tracked for Sprint 3.1.
- Compare can be locally verified without introducing frontend UI, MCP protocol
  changes, live FX rates, or live partner rows.

Tradeoff:

- The backend compare surface is testable and contract-guarded now.
- Tool registry/MCP exposure remains a later integration task.
- The first Sprint 2.1 row is complete here; screening is covered by
  `docs/governance/screen-securities-scaffold.md`; financial ratios are covered
  by `docs/governance/financial-ratios-scaffold.md`; return/risk,
  peer/index/history percentile, and UI rows remain open.

## Verification

Passed:

- `npm run check:compare-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /analytics/runtime`
- local Worker smoke for `POST /analytics/compare-securities`

Observed compare behavior:

```json
{
  "toolName": "compare_securities",
  "status": "partial",
  "row_count": 2,
  "unified_comparison": {
    "base_currency": "HKD",
    "base_unit": "million",
    "currency_conversion": "not_required"
  }
}
```

## Residual Gaps

- `screen_securities` is covered by `docs/governance/screen-securities-scaffold.md`.
- Financial ratios are covered by `docs/governance/financial-ratios-scaffold.md`;
  deterministic return/risk/Beta engines are not implemented.
- Peer/index/history percentile comparison is not implemented.
- Frontend comparison and screening UI remains delegated.
- Tool registry/MCP exposure remains pending.
