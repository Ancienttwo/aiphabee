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
- Added `AiphaBeeRunCoordinator` Durable Object plus a guarded state smoke route
  with temporary migration/binding config and storage put/get/delete proof.
- Added `AiphaBeeResearchWorkflow` plus a guarded Workflow smoke route with
  temporary Workflow binding config, `create()` execution, and KV evidence
  cleanup.
- Added a module Worker `scheduled` handler plus a guarded Cron handler smoke
  route with temporary `triggers.crons` config and KV evidence cleanup.
- Extended the Wrangler functional smoke to inject a dedicated temporary
  `AI_GATEWAY_LIVE_SMOKE_TOKEN` Worker secret through `--secrets-file`, call
  `POST /agent/model-provider/live-smoke`, and delete the dedicated secret
  after the smoke.
- Added guarded `POST /cloudflare/hyperdrive/smoke`, `pg`, `nodejs_compat`, and
  temporary Wrangler Hyperdrive binding support for future read-only
  `SELECT 1` through `AIPHABEE_HYPERDRIVE`.

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
- Durable Object `AiphaBeeRunCoordinator` passed migration and
  `POST /cloudflare/durable-objects/smoke` state put/get/delete with sanitized
  hashes/status/operation counts only.
- Workflow `AiphaBeeResearchWorkflow` passed `POST
  /cloudflare/workflows/smoke` create + KV evidence with sanitized
  hashes/status/operation counts only.
- Cron passed deployed `triggers.crons` config plus `POST
  /cloudflare/cron/smoke` scheduled handler KV evidence with sanitized
  hashes/status/operation counts only.
- AI Gateway passed deployed Worker `POST /agent/model-provider/live-smoke`
  through Cloudflare AI Gateway with sanitized hashes/status/operation counts
  only.
- Dedicated `AI_GATEWAY_LIVE_SMOKE_TOKEN` cleanup was verified by secret list
  boolean check.
- Hyperdrive route/harness is implemented, but no real Hyperdrive config/origin
  has passed live `SELECT 1`.
- Hyperdrive remains blocked by Postgres origin prerequisites. Natural Cron
  trigger evidence remains unclaimed.

## What Was Not Claimed

- No Hyperdrive resource was created or live-bound.
- No natural Cron trigger event was observed or claimed.
- No Hyperdrive `SELECT 1` pass was observed or claimed.
- No AI Gateway request/cost/cache/rate-limit/fallback log evidence was
  verified.
- No OTLP export, product eval-store write/read, or provider secret rotation
  smoke was executed.

## Verification

- `npm run check:cloudflare-resource-live-readiness`
- `node scripts/smoke-cloudflare-resources-live.mjs --dry-run`
- `node scripts/smoke-cloudflare-bindings-wrangler-live.mjs --dry-run`
- `CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... AI_GATEWAY_NAME=... AI_GATEWAY_SMOKE_MODEL=... npm run smoke:cloudflare-bindings-wrangler-live`
- missing-env smoke branch expects exit code `2`
- `npm run check:env`
- `npm run check:bindings`
