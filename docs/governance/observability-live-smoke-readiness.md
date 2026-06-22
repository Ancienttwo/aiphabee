# Observability Live Smoke Readiness

Date: 2026-06-22

## Scope

This slice adds the no-secret live smoke harness for the Sprint 0.4
observability live gap: OTLP HTTP export and persistent eval-store D1
write/read/delete rerun. It does not claim retention, dashboard, alerting, or a
passed live smoke.

## P1 Architecture Map

- Source event contract: `deploy/observability/events.contract.json`.
- Live readiness contract: `deploy/observability/live-smoke-readiness.contract.json`.
- No-network checker: `npm run check:observability-live-readiness`.
- Explicit live command: `npm run smoke:observability-live`.
- Runtime status surface: `GET /observability/runtime`.
- Out of scope: product eval writes, dashboard creation, alerting, retention
  proof, raw OTLP response capture, or committing OTLP header values.

## P2 Concrete Trace

1. Operator provides `OTLP_EXPORTER_OTLP_ENDPOINT`,
   `OTLP_EXPORTER_OTLP_HEADERS`, and `CLOUDFLARE_D1_DATABASE_NAME`.
2. `npm run smoke:observability-live -- --dry-run` reports required env,
   planned operations, forbidden output fields, and the synthetic D1 table
   without network access.
3. A real smoke run sends one synthetic OTLP JSON log payload to the configured
   endpoint, using parsed OTLP headers but never emitting header values.
4. The same run writes a prompt-free synthetic eval-store record into
   `aiphabee_eval_store_live_smoke` via `wrangler d1 execute --remote`.
5. The script selects the row back and requires matching `schema_version`,
   `result`, and `record_json`, then deletes the row and drops the smoke table.
6. Output contains endpoint/database/table/record hashes, HTTP status,
   operation counts, and status only.

## P3 Decision

The smallest coherent next step is a synthetic live-smoke harness, not enabling
product telemetry writes. This proves the two external mechanics needed by the
Sprint item while preserving the invariant that production eval writes,
retention, and dashboards stay off until their own lifecycle is designed.

At 10x scale this fails first on provider auth and endpoint compatibility:
OTLP collectors may reject JSON, and Wrangler D1 auth may list but not execute.
The smoke keeps OTLP and D1 as separate surfaces so partial failures are
actionable without exposing headers or raw provider output.

## Verification

- `npm run check:observability-live-readiness`
- `node --check scripts/smoke-observability-live.mjs`
- `npm run smoke:observability-live -- --dry-run`
- `npm run check:observability`
- `npm run check`

## Residual Gaps

- Current shell does not provide live OTLP/D1 env.
- No live OTLP request or remote D1 mutation was executed.
- Product eval-store writes, dashboard, retention, and alerting evidence remain
  incomplete.
