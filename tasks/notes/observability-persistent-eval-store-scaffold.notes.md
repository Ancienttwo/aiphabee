# Notes: observability-persistent-eval-store-scaffold

> **Last Updated**: 2026-06-20 16:00 +08
> **Plan**: `plans/plan-observability-persistent-eval-store-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/observability-persistent-eval-store-scaffold.md`

## Decisions

- Used D1 as the persistent eval-store binding because eval records are small,
  queryable, and tied to run-quality review.
- Added OTLP endpoint and header env names only; no endpoint, token, or header
  value is committed.
- Kept Worker runtime `writes_enabled=false` and `live_export_enabled=false`.
- Split tracker wording so live destination/write smoke remains unchecked.
- Recorded that the D1 resource exists by name while Worker binding writes stay
  disabled.

## Verification

- Passed: `npm run check:observability`
- Passed: `npm run check:bindings`
- Passed: `npm run check:env`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /observability/runtime`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- No real OTLP endpoint/header is configured.
- No Worker D1 binding write/read path is configured.
- No product eval-store write/read smoke or dashboard exists; D1 resource-level
  synthetic write/read has passed in the Cloudflare resource smoke slice.
- Real token/cost/latency metrics remain blocked until model calls exist.
