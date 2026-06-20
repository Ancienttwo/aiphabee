# Plan: Get Price History Tool Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 01:42 +08
> **Slug**: get-price-history-tool-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/get-price-history-tool-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/get-price-history-tool-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `get_price_history` tool scaffold for Sprint 1.2.
- Routing reason: quote snapshot semantics are verified, so the next atomic data
  tool can prove OHLCV/return series shape, adjustment methodology, and cursor
  behavior without live partner data.
- Due diligence:
  - P1 map: `@aiphabee/market-data`, `@aiphabee/tool-registry`, Worker
    `/tools/get-price-history`, and market-data contract checker.
  - P2 trace: instrument + date range + adjustment + fields + limit/cursor ->
    synthetic price rows -> standard response envelope -> licensing, quality,
    range, row-limit, and input errors.
  - P3 decision rationale: deterministic synthetic OHLCV rows prove the tool
    contract before data rights, live serving reads, corporate-action factors,
    and MCP tool calls are enabled.

## Workflow Inventory

- Active plan: `plans/plan-get-price-history-tool-scaffold.md`
- Task contract:
  `tasks/contracts/get-price-history-tool-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/get-price-history-tool-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/get-price-history-tool-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extend `@aiphabee/market-data` with `getPriceHistory()`.
- Cover synthetic OHLCV, return, drawdown, and turnover fields.
- Support `raw`, `split_adjusted`, and `total_return_adjusted` adjustment
  methodology metadata.
- Support deterministic limit/cursor pagination.
- Return standard error states for unlicensed fields, quality hold, out of
  range, too many rows, not found, and invalid input.
- Add Worker `POST /tools/get-price-history` with standard envelopes.
- Promote `get_price_history` from planned to scaffold in the shared registry.
- Add `deploy/tools/get-price-history.contract.json` and keep
  `npm run check:market-data` as the market-data contract gate.

## Task Breakdown

- [x] Add no-live `getPriceHistory()` package behavior and tests.
- [x] Promote `get_price_history` registry entry from planned to scaffold.
- [x] Add Worker `POST /tools/get-price-history` route.
- [x] Add tool contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
