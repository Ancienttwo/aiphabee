# Watchlist Briefings Scaffold Contract

## Objective

Complete the backend-only Sprint 2.4 RES-06 scaffold for daily and weekly
watchlist briefings that summarize only material changes with source evidence.

## Required Surfaces

- Package: `@aiphabee/watchlist-runtime`
- Runtime route: `GET /watchlist/runtime`
- Planner route: `POST /watchlist/briefings/plan`
- Contract: `deploy/watchlist/briefings.contract.json`
- Checker: `npm run check:watchlist-briefings`
- Briefing table scaffold: `core.watchlist_briefing`
- Briefing item table scaffold: `core.watchlist_briefing_item`

## Required Guarantees

- Use standard response envelopes.
- Support daily and weekly briefing cadence.
- Require a watchlist context before planning a briefing.
- Summarize material changes only.
- Suppress empty briefings when no material changes qualify.
- Require source evidence and source record IDs for included items.
- Plan price, announcement, and metric source collection without executing tools.
- Plan notification fanout through `AIPHABEE_EVENTS_QUEUE` without writing queue
  messages.
- Do not execute tools.
- Do not write DB rows.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes briefing table scaffolds.
- Package and Worker targeted tests pass.
- Worker and Watchlist Runtime typecheck/build pass.
- Sprint tracker row is checked and Sprint 2.4 count is updated.
