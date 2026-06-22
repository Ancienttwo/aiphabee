# Notes: observability-live-smoke-readiness

## What Changed

- Added `deploy/observability/live-smoke-readiness.contract.json`.
- Added `scripts/check-observability-live-readiness.mjs`.
- Added `scripts/smoke-observability-live.mjs`.
- Added `npm run check:observability-live-readiness` to full `npm run check`.
- Added `npm run smoke:observability-live` as an explicit live command.
- Documented the OTLP + D1 eval-store live-smoke path in
  `docs/governance/observability-live-smoke-readiness.md`.

## Evidence

- Dry-run reports required env and forbidden output fields without network.
- Missing-env branch exits before any OTLP request or D1 command.
- Live script sends a synthetic OTLP JSON log and writes only a prompt-free
  synthetic eval-store record.
- Output is limited to hashes, HTTP status, operation counts, and surface
  status.

## What Was Not Claimed

- No live OTLP endpoint/header env is present in the current shell.
- No remote D1 eval-store mutation was executed in this slice.
- No retention, dashboard, alerting, or product eval write evidence exists.
- Sprint 0.4 OTLP/eval-store live checkbox remains incomplete.

## Verification

- `npm run check:observability-live-readiness`
- `node --check scripts/smoke-observability-live.mjs`
- `npm run smoke:observability-live -- --dry-run`
- `npm run check:observability`
