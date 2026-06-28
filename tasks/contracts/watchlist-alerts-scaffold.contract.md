# Watchlist Alerts Scaffold Contract

## Objective

Complete the backend-only Sprint 2.4 RES-05 / US-W09 scaffold for creating
price, announcement, and metric alerts from a watchlist with dedupe, frequency,
quiet period, explicit confirmation, and source evidence requirements.

## Required Surfaces

- Package: `@aiphabee/watchlist-runtime`
- Runtime route: `GET /watchlist/runtime`
- Planner route: `POST /watchlist/alerts/plan`
- Contract: `deploy/watchlist/alerts.contract.json`
- Checker: `npm run check:watchlist-alerts`
- Watchlist table scaffold: `aiphabee_core.watchlist`
- Watchlist item table scaffold: `aiphabee_core.watchlist_item`
- Alert rule table scaffold: `aiphabee_core.watchlist_alert_rule`
- Alert event table scaffold: `aiphabee_core.watchlist_alert_event`

## Required Guarantees

- Use standard response envelopes.
- Require explicit user confirmation before any planned alert write.
- Require independent `alerts.write` scope.
- Require an idempotency key for create-alert semantics.
- Support price, announcement, and metric alert kinds.
- Include dedupe policy, frequency, and quiet-period controls.
- Require `source_record_id` evidence for alert events.
- Plan notification fanout through `AIPHABEE_EVENTS_QUEUE` without writing queue
  messages.
- Do not execute tools.
- Do not write DB rows.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes watchlist and alert table scaffolds.
- Package and Worker targeted tests pass.
- Worker and Watchlist Runtime typecheck/build pass.
- Sprint tracker row is checked and Sprint 2.4 count is updated.
