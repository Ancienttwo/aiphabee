# Task Contract: observability-live-smoke-readiness

Tracker item: Sprint 0.4 `OTLP destination + persistent eval store live smoke`

## Scope

- Add a no-secret live smoke readiness contract for OTLP HTTP export and D1
  eval-store record write/read/delete.
- Add an explicit live smoke script that runs only when operator env/auth is
  present.
- Add a no-network checker and include it in `npm run check`.
- Keep the tracker item incomplete until real live OTLP export and D1 eval-store
  rerun evidence exists.

## Verification

- `npm run check:observability-live-readiness`
- `node --check scripts/smoke-observability-live.mjs`
- `npm run smoke:observability-live -- --dry-run`
- `npm run check:observability`
- `npm run check`

## Non-Claims

- No OTLP header value is committed or emitted.
- No product eval-store writes are enabled.
- No retention/dashboard/alert evidence is claimed.
- No live smoke pass is claimed in this slice.
