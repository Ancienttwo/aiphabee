# Stock Workbench Aggregate Scaffold Notes

## Summary

Implemented the Sprint 1.4 backend stock workbench aggregate scaffold for
STK-01, STK-02, STK-03, STK-04, STK-05, and STK-06.

## Current State

- `@aiphabee/workbench` aggregates existing synthetic handlers:
  - `resolve_security`
  - `get_security_profile`
  - `get_quote_snapshot`
  - `get_price_history`
  - `get_financial_facts`
  - `get_corporate_actions`
- `GET /workbench/runtime` reports aggregate capability, supported sections,
  unsupported sections, and no-live/no-frontend posture.
- `POST /workbench/stock/snapshot` returns a standard envelope with profile,
  quote, price history, financial facts, derived metrics, corporate actions,
  announcement search, data-quality section statuses, and evidence summary.
- `POST /workbench/stock/announcements` exposes the STK-06 basic announcement
  entry with security/date/category/keyword filters and source locators.
- `derived_metrics` exposes formula definitions and anomaly handling:
  - computed profitability: `net_margin`, `return_on_assets`,
    `return_on_equity`, `asset_turnover`, `equity_multiplier`
  - blocked valuation: `price_to_earnings`, `price_to_sales`, `price_to_book`
    with `market_cap_unavailable`
- `announcement_search` exposes synthetic results with `document_id`, `page`,
  `anchor`, `source_record_id`, and `original_url` locator fields.
- Ambiguous security resolution returns `blocked_resolution` rather than
  silently choosing a candidate.

## Non-Goals

- No frontend workbench UI.
- No live market data access.
- No SQL execution.
- No fabricated valuation values when market cap/share-count authority is
  absent.
- No live original announcement/document fetch.
- No full Phase 2 `search_announcements` / `get_announcement` tool behavior.

## Verification

Passed:

- `npm run check:stock-workbench`
- `npm run test -- packages/workbench/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/workbench`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/workbench`
- `npm run build --workspace @aiphabee/worker`
- `npm run dev:worker`
- `GET /workbench/runtime` smoke:
  - `ok=true`
  - `status=stock_workbench_aggregate_scaffold`
  - sections: profile, quote, price history, financial facts, derived metrics,
    announcement search, corporate actions
  - `live_data_access=false`
  - `frontend_rendering=false`
- `POST /workbench/stock/snapshot` smoke for `00700.HK`:
  - `ok=true`
  - `status=ready`
  - `instrument_id=eq_hk_00700`
  - all five covered sections `found`
  - `price_history.history.adjustment=total_return_adjusted`
  - `financial_facts.facts.rowCount=4`
  - `derived_metrics.metrics` computes 5 profitability metrics
  - valuation metrics are blocked with `market_cap_unavailable`
  - `announcement_search.row_count=3`
  - `corporate_actions.timeline.rowCount=3`
  - `live_data_access=false`
  - `frontend_rendering=false`
  - `sql_emitted=false`
- `POST /workbench/stock/snapshot` smoke for ambiguous `ABC`:
  - `ok=true`
  - `status=blocked_resolution`
  - `resolve_security.status=ambiguous`
  - no `instrument_id`
- `POST /workbench/stock/announcements` smoke for `00700.HK` dividend keyword:
  - `ok=true`
  - `status=found`
  - `row_count=1`
  - locator includes `page=2`, `anchor=dividend-timetable`
