# Notes: cloudflare-resource-smoke-readiness

## What Changed

- Added a Cloudflare resource live-smoke readiness contract.
- Added a read-only live smoke script for Worker, Workflow, Queue, Cron, Durable
  Object, R2, KV, D1, AI Gateway, and Hyperdrive discovery.
- Added a no-network checker that ties the contract to env schema, bindings,
  package scripts, smoke script, and tracker status.
- Added names-only env variables for Workflow, Durable Object namespace, D1
  database, and Hyperdrive config names.

## What Was Not Claimed

- No Cloudflare resources were created.
- No binding write/read smoke was executed.
- No Hyperdrive `SELECT 1` was executed.
- No OTLP export, eval-store write/read, or provider secret rotation smoke was
  executed.

## Verification

- `npm run check:cloudflare-resource-live-readiness`
- `node scripts/smoke-cloudflare-resources-live.mjs --dry-run`
- missing-env smoke branch expects exit code `2`
- `npm run check:env`
- `npm run check:bindings`
