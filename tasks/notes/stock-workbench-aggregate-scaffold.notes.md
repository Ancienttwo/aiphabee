# Stock Workbench Aggregate Scaffold Notes

## Summary

Implemented the Sprint 1.4 backend stock workbench aggregate scaffold for
STK-01, STK-02, STK-03, and STK-05.

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
  quote, price history, financial facts, corporate actions, data-quality section
  statuses, and evidence summary.
- Ambiguous security resolution returns `blocked_resolution` rather than
  silently choosing a candidate.

## Non-Goals

- No frontend workbench UI.
- No live market data access.
- No SQL execution.
- No valuation-derived metric surface.
- No announcement/document search.

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
  - sections: profile, quote, price history, financial facts, corporate actions
  - `live_data_access=false`
  - `frontend_rendering=false`
- `POST /workbench/stock/snapshot` smoke for `00700.HK`:
  - `ok=true`
  - `status=ready`
  - `instrument_id=eq_hk_00700`
  - all five covered sections `found`
  - `price_history.history.adjustment=total_return_adjusted`
  - `financial_facts.facts.rowCount=4`
  - `corporate_actions.timeline.rowCount=3`
  - `live_data_access=false`
  - `frontend_rendering=false`
  - `sql_emitted=false`
- `POST /workbench/stock/snapshot` smoke for ambiguous `ABC`:
  - `ok=true`
  - `status=blocked_resolution`
  - `resolve_security.status=ambiguous`
  - no `instrument_id`
