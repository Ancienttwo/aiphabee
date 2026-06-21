# Notes: cloudflare-resource-smoke-readiness

## What Changed

- Added a Cloudflare resource live-smoke readiness contract.
- Added a read-only live smoke script for Worker, Workflow, Queue, Cron, Durable
  Object, R2, KV, D1, AI Gateway, and Hyperdrive discovery.
- Added a no-network checker that ties the contract to env schema, bindings,
  package scripts, smoke script, and tracker status.
- Added names-only env variables for Workflow, Durable Object namespace, D1
  database, and Hyperdrive config names.
- Recorded partial external provisioning evidence without committing Cloudflare
  account ids or resource ids.
- Marked names-only provisioned bindings for Worker, Queue, R2, KV, and D1.
- Added a live-only Wrangler functional smoke for KV, R2, and D1.
- Added a guarded Worker runtime binding smoke route and extended the Wrangler
  smoke to deploy `aiphabee-worker` with temporary KV/R2/D1 bindings.
- Added a guarded Queue publish/consume smoke route and module Worker queue
  handler, with temporary producer/consumer config and KV evidence cleanup.

## External Evidence

- Worker `aiphabee-worker` deployed and `/health` returned `status=ok`.
- Queue `aiphabee-events-queue` was created and listed.
- R2 bucket `aiphabee-artifacts` was created and listed.
- KV namespace title `AIPHABEE_CONFIG` was created and listed.
- D1 database `AIPHABEE_EVAL_STORE` was created and listed.
- KV `AIPHABEE_CONFIG` passed synthetic put/get/delete.
- R2 bucket `aiphabee-artifacts` passed synthetic object put/get/delete.
- D1 database `AIPHABEE_EVAL_STORE` passed synthetic
  create/insert/select/delete/drop.
- Worker `POST /cloudflare/bindings/smoke` passed runtime KV/R2/D1 binding
  smoke with sanitized hashes/status/operation counts only.
- Worker `POST /cloudflare/queues/smoke` passed Queue publish/consume through
  a temporary Worker consumer and sanitized hashes/status/operation counts only.
- AI Gateway creation hit a Cloudflare API authentication error in the available
  context.
- Workflow, Cron, Durable Object, and Hyperdrive remain blocked by Worker
  workflow class, schedule config, Durable Object class/migration, and Postgres
  origin prerequisites.

## What Was Not Claimed

- No Workflow, Cron, Durable Object, AI Gateway, or Hyperdrive resource was
  created.
- No Hyperdrive `SELECT 1` was executed.
- No OTLP export, product eval-store write/read, or provider secret rotation
  smoke was executed.

## Verification

- `npm run check:cloudflare-resource-live-readiness`
- `node scripts/smoke-cloudflare-resources-live.mjs --dry-run`
- `node scripts/smoke-cloudflare-bindings-wrangler-live.mjs --dry-run`
- `CLOUDFLARE_ACCOUNT_ID=... npm run smoke:cloudflare-bindings-wrangler-live`
- missing-env smoke branch expects exit code `2`
- `npm run check:env`
- `npm run check:bindings`
