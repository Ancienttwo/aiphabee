# Stock Workbench Aggregate Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 05:36 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-stock-workbench-aggregate-scaffold.md`
> **Task Contract**:
> `tasks/contracts/stock-workbench-aggregate-scaffold.contract.md`

This slice completes the backend-only stock workbench aggregate scaffold for
Sprint 1.4 STK-01, STK-02, STK-03, STK-04, STK-05, and STK-06. It composes
existing synthetic tool handlers into one snapshot surface, adds deterministic
derived-metric definitions/results, and exposes a basic announcement search
entry with source locators without frontend rendering, live market data access,
SQL, or live document fetches.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/workbench` | Owns stock workbench aggregate planner |
| Runtime route | `GET /workbench/runtime` | Reports sections, source tools, unsupported sections, and no-live posture |
| Snapshot route | `POST /workbench/stock/snapshot` | Aggregates existing tool package outputs into a standard envelope |
| Derived metrics | `derived_metrics` section | Computes profitability ratios and blocks valuation multiples when market cap is unavailable |
| Announcement route | `POST /workbench/stock/announcements` | Returns synthetic announcement rows with original-position locators |
| Source tools | `security-tools`, `market-data`, `financial-facts`, `corporate-actions` | Existing synthetic handlers remain authoritative for facts |
| Contract | `deploy/workbench/stock-workbench.contract.json` | Guards route, covered STK rows, no frontend, no live data, no SQL |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /workbench/stock/snapshot` with either `instrument_id`
   or `security_query`.
2. If only `security_query` is provided, `resolve_security` runs first.
3. Ambiguous resolution returns `blocked_resolution`; no candidate is chosen.
4. Resolved snapshots call existing handlers:
   - `get_security_profile`
   - `get_quote_snapshot`
   - `get_price_history`
   - `get_financial_facts`
   - `get_corporate_actions`
5. Workbench derives STK-04 metrics from returned facts:
   - computed: `net_margin`, `return_on_assets`, `return_on_equity`,
     `asset_turnover`, `equity_multiplier`
   - blocked with explicit reason: `price_to_earnings`, `price_to_sales`,
     `price_to_book` when `market_cap` is unavailable
6. Workbench searches synthetic announcement fixtures by security/date/category/
   keyword and returns source-record IDs plus `synthetic_original_locator`
   fields (`document_id`, `page`, `anchor`, `original_url`).
7. The aggregate returns section statuses, provenance/source-record summary,
   and the original handler results inside a shared success envelope.

## P3 Design Decision

Selected a backend aggregate over a new workbench data model.

Reason:

- Existing tool packages already encode security/profile/quote/history/facts
  and corporate-action contracts.
- Frontend rendering is explicitly delegated.
- Valuation multiples require market cap/share-count authority; this scaffold
  exposes the formula and blocks those metrics instead of fabricating inputs.
- STK-06 only needs a basic workbench entry in this sprint; the dedicated
  `search_announcements` / `get_announcement` tool pair is covered by Sprint
  2.2 document-tool surfaces.

Tradeoff:

- The workbench now has a stable backend snapshot surface for six STK rows.
- The user still cannot see a frontend workbench until Claude integrates UI.
- Valuation formulas are inspectable, but valuation values remain blocked until
  market cap/share-count source data exists.
- Announcement search is synthetic and locator-ready, but live original
  document fetch is disabled.

## Verification

Passed:

- `npm run check:stock-workbench`
- `npm run test -- packages/workbench/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/workbench`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/workbench`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /workbench/runtime`
- local Worker smoke for ready `POST /workbench/stock/snapshot`
- local Worker smoke for ambiguous security `POST /workbench/stock/snapshot`

Observed runtime fields:

```json
{
  "runtime": {
    "frontend_rendering": false,
    "live_data_access": false,
    "sections": [
      "security_profile",
      "quote_snapshot",
      "price_history",
      "financial_facts",
      "derived_metrics",
      "announcement_search",
      "corporate_actions"
    ],
    "status": "stock_workbench_aggregate_scaffold"
  },
  "snapshot": {
    "instrument_id": "eq_hk_00700",
    "section_statuses": {
      "corporate_actions": "found",
      "derived_metrics": "found",
      "announcement_search": "found",
      "financial_facts": "found",
      "price_history": "found",
      "quote_snapshot": "found",
      "security_profile": "found"
    },
    "status": "ready"
  }
}
```

Derived metric behavior:

```json
{
  "computed": [
    "net_margin",
    "return_on_assets",
    "return_on_equity",
    "asset_turnover",
    "equity_multiplier"
  ],
  "blocked": {
    "price_to_earnings": "market_cap_unavailable",
    "price_to_sales": "market_cap_unavailable",
    "price_to_book": "market_cap_unavailable"
  },
  "formula_version": "stock-workbench-derived-metrics-v0"
}
```

Announcement search behavior:

```json
{
  "route": "POST /workbench/stock/announcements",
  "categories": ["results", "dividend", "buyback"],
  "locator_fields": ["document_id", "source_record_id", "page", "anchor", "original_url"],
  "external_href_authority": false,
  "original_document_fetch": false
}
```

## Residual Gaps

- Full Phase 2 semantic search, document diffing, and research replay tools are
  not implemented; `search_announcements` and `get_announcement` are covered
  separately by `docs/governance/search-announcements-scaffold.md` and
  `docs/governance/get-announcement-scaffold.md`.
- Valuation multiples remain blocked until a market cap/share-count source is
  added.
- Frontend workbench rendering remains delegated.
- Live partner data and live Serving reads remain absent.
