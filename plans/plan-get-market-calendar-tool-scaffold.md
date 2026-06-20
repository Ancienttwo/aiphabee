# Plan: Get Market Calendar Tool Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 01:10 +08
> **Slug**: get-market-calendar-tool-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/get-market-calendar-tool-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/get-market-calendar-tool-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `get_market_calendar` tool scaffold for Sprint 1.2.
- Routing reason: quote and history tools need trading-day, half-day, and
  closed-market context before they can safely expose point-in-time snapshots or
  time series.
- Due diligence:
  - P1 map: `@aiphabee/market-calendar`, `@aiphabee/tool-registry`, Worker
    `/tools/get-market-calendar`, and market-calendar contract checker.
  - P2 trace: date range -> synthetic HK session fixture -> standard response
    envelope -> not-found/out-of-range/invalid error handling.
  - P3 decision rationale: use deterministic synthetic HK calendar fixtures to
    prove date-range semantics before live exchange calendar ingestion.

## Workflow Inventory

- Active plan: `plans/plan-get-market-calendar-tool-scaffold.md`
- Task contract:
  `tasks/contracts/get-market-calendar-tool-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/get-market-calendar-tool-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/get-market-calendar-tool-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/market-calendar` with `getMarketCalendar()`.
- Cover synthetic HK trading day, half-day, severe-weather closure, holiday,
  and weekend sessions.
- Return `found`, `not_found`, or `out_of_range` status.
- Add Worker `POST /tools/get-market-calendar` with standard envelopes.
- Mark `get_market_calendar` as scaffold-ready while live data remains
  disabled.
- Add `deploy/tools/get-market-calendar.contract.json` and
  `npm run check:market-calendar`.

## Task Breakdown

- [x] Add no-live `getMarketCalendar()` package and tests.
- [x] Promote `get_market_calendar` registry entry from planned to scaffold.
- [x] Add Worker `POST /tools/get-market-calendar` route.
- [x] Add tool contract and checker.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
