# Live Smoke External Env Preflight Notes

Date: 2026-06-22

## Completed

- Added `scripts/check-live-smoke-external-env-preflight.mjs`.
- Added `npm run check:live-smoke-external-env-preflight` and wired it into
  full `npm run check`.
- Updated `docs/governance/live-smoke-evidence-ledger.md`,
  `docs/AiphaBee_Sprint_Tracker_v1.0.md`, and `tasks/todos.md`.

## Current Preflight Result

Current local shell has no non-inferable live smoke env. The preflight returns
`status=missing_external_env`, `ready_commands=0`, `blocked_commands=6`.

Missing env names:

- `AI_GATEWAY_SMOKE_MODEL`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `GITHUB_ENVIRONMENT`
- `GITHUB_REPOSITORY`
- `OTLP_EXPORTER_OTLP_ENDPOINT`
- `OTLP_EXPORTER_OTLP_HEADERS`
- `SUPABASE_PROJECT_REF`

Defaulted non-secret names:

- `AI_GATEWAY_NAME`
- `CLOUDFLARE_D1_DATABASE_NAME`
- `CLOUDFLARE_DURABLE_OBJECT_NAMESPACE_NAME`
- `CLOUDFLARE_HYPERDRIVE_CONFIG_NAME`
- `CLOUDFLARE_WORKER_NAME`
- `CLOUDFLARE_WORKFLOW_NAME`
- `KV_NAMESPACE_ID`
- `QUEUE_NAME`
- `R2_BUCKET_NAME`

## Boundary

The preflight is non-networked and prints no env values. It does not validate
Cloudflare token permissions, OTLP endpoint acceptance, GitHub auth, Supabase
auth, Hyperdrive origin reachability, or provider secret mutation behavior.
No Sprint 0.4 live smoke checkbox was marked complete.
