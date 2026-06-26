# Live Smoke Defaults Notes

Date: 2026-06-22

## Scope

Reduce Sprint 0.4 live-smoke friction without storing or inferring secrets.

## Completed

- Added `scripts/lib/live-smoke-defaults.mjs` to resolve non-secret Cloudflare resource names from `deploy/cloudflare/resource-smoke-readiness.contract.json` `partial_provisioning.resource_names`.
- The helper now safely parses local ops env files before falling back to
  contract defaults. Default files are `_ops/env/aiphabee-planetscale-prod.env`
  `_ops/env/aiphabee-planetscale-prod.private.env`, and
  `_ops/env/aiphabee-live-smoke-private.env`; override with comma-separated
  `AIPHABEE_LIVE_SMOKE_ENV_FILES`. These files are parsed as `KEY=VALUE` text
  only and are never sourced or executed.
- Added `_ops/env/aiphabee-live-smoke-private.env` as the local ignored,
  mode-600 entrypoint for Cloudflare API token, AI smoke model, OTLP,
  GitHub, and Supabase live-smoke inputs.
- Added `scripts/check-live-smoke-defaults.mjs` and `npm run check:live-smoke-defaults`.
- Updated live smoke scripts to infer:
  - `CLOUDFLARE_WORKER_NAME`
  - `CLOUDFLARE_WORKFLOW_NAME`
  - `QUEUE_NAME`
  - `CLOUDFLARE_DURABLE_OBJECT_NAMESPACE_NAME`
  - `R2_BUCKET_NAME`
  - `KV_NAMESPACE_ID` from the recorded KV namespace title
  - `CLOUDFLARE_D1_DATABASE_NAME`
  - `AI_GATEWAY_NAME`
  - `CLOUDFLARE_HYPERDRIVE_CONFIG_NAME`

## Preserved Boundary

These values remain explicit operator-controlled env/auth requirements and are
not inferred from committed repo contract defaults. They may be supplied by the
process environment or ignored local ops env files:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `AI_GATEWAY_SMOKE_MODEL`
- `OTLP_EXPORTER_OTLP_ENDPOINT`
- `OTLP_EXPORTER_OTLP_HEADERS`
- `GITHUB_REPOSITORY`
- `GITHUB_ENVIRONMENT`
- `SUPABASE_PROJECT_REF`

## Current Local Evidence

- `npm run check:live-smoke-defaults` passes.
- With `_ops/env/aiphabee-planetscale-prod.env` safely parsed,
  `CLOUDFLARE_ACCOUNT_ID` resolves from `local_ops_env_file` without sourcing
  the file.
- `npm run smoke:cloudflare-resources-live` now reports only
  `CLOUDFLARE_API_TOKEN` missing after the local ops env file is present.
- `npm run smoke:cloudflare-bindings-wrangler-live` now reports only
  `CLOUDFLARE_API_TOKEN` and `AI_GATEWAY_SMOKE_MODEL` missing after the local
  ops env file is present.
- `npm run smoke:observability-live` now reports only `OTLP_EXPORTER_OTLP_ENDPOINT` and `OTLP_EXPORTER_OTLP_HEADERS` missing.
- `npm run smoke:provider-secret-stores-live` now reports only GitHub/Supabase project identifiers missing; Cloudflare Worker name is inferred.
