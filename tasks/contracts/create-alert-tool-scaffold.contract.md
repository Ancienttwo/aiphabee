# Create Alert Tool Scaffold Contract

## Objective

Complete the Phase 4 backend-only `create_alert` scaffold for alert creation
semantics that require explicit confirmation, an independent `alerts.write`
scope, and an idempotency key.

## Required Surfaces

- Package: `@aiphabee/watchlist-runtime`
- Runtime route: `GET /watchlist/runtime`
- Tool route: `POST /tools/create-alert`
- Planner route: `POST /watchlist/alerts/plan`
- Contract: `deploy/watchlist/create-alert.contract.json`
- Checker: `npm run check:create-alert`

## Required Guarantees

- Use standard response envelopes.
- Return `toolName: "create_alert"`.
- Link the output to `plan_watchlist_alerts`.
- Require explicit confirmation.
- Require independent `alerts.write` scope.
- Require an idempotency key.
- Preserve dedupe, frequency, quiet-period, source evidence, and notification
  fanout planning from the watchlist alert planner.
- Do not execute live tools.
- Do not write DB rows.
- Do not enqueue notifications.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker and Watchlist Runtime typecheck pass.
- Sprint tracker row is checked.
