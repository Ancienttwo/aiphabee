# Notes: observability-eval-scaffold

> **Last Updated**: 2026-06-20 14:57 +08
> **Plan**: `plans/plan-observability-eval-scaffold.md`
> **Runtime Evidence**: `docs/governance/observability-eval-scaffold.md`

## Decisions

- Enabled Worker observability and traces in `apps/worker/wrangler.jsonc`.
- Added a local structured JSON event contract instead of enabling OTLP export
  or persistent eval writes.
- Kept prompt content, API keys, tokens, secrets, and passwords out of telemetry
  events.
- Used deterministic event IDs based on `request_id` and event type for local
  smoke/debuggability.
- Did not add custom spans because the current Hono route surface does not expose
  Worker `ExecutionContext` tracing.

## Verification

- Passed: `npm run check`
- Passed: Wrangler smoke for `POST /agent/runs/dry-run`.
- Observed response headers:
  - `x-aiphabee-telemetry-event-count: 2`
  - `x-aiphabee-telemetry-run-id: dry_req-smoke-otel`
- Observed console events:
  - `run.audit`
  - `run.eval`

## Residual Blockers

- No OTLP destination is provisioned.
- D1 eval-store resource now exists by name, but no Worker binding write/read
  path is implemented.
- Real token/cost/latency telemetry remains blocked until real model execution is
  wired.
- Dashboards, alerts, and retention policy are absent.
