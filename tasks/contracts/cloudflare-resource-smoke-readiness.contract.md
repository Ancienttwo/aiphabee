# Task Contract: cloudflare-resource-smoke-readiness

## Objective

Create a no-secret readiness harness for Sprint 0.4 Cloudflare resource live
smoke and record partial external provisioning plus KV/R2/D1 functional smoke
evidence plus Worker runtime KV/R2/D1 binding smoke and Queue publish/consume
smoke plus Durable Object state smoke without claiming full Cloudflare resource
or binding-smoke completion.

## Inputs

- `deploy/cloudflare/bindings.contract.json`
- `deploy/env/env.schema.json`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Cloudflare OpenAPI read-only endpoint confirmations

## Deliverables

- `deploy/cloudflare/resource-smoke-readiness.contract.json`
- `scripts/check-cloudflare-resource-live-readiness.mjs`
- `scripts/smoke-cloudflare-resources-live.mjs`
- `scripts/smoke-cloudflare-bindings-wrangler-live.mjs`
- `npm run check:cloudflare-resource-live-readiness`
- `npm run smoke:cloudflare-resources-live`
- `npm run smoke:cloudflare-bindings-wrangler-live`
- Tracker update that keeps the live resource item unchecked
- Partial provisioning evidence for Worker, Queue, R2, KV, and D1, with no
  account ids or resource ids committed
- Partial functional evidence for KV put/get/delete, R2 put/get/delete, and D1
  create/insert/select/delete/drop
- Worker runtime functional evidence for KV runtime put/get/delete, R2 runtime
  put/get/delete, and D1 runtime create/insert/select/delete/drop through a
  temporary no-id Wrangler binding config
- Queue functional evidence for synthetic publish/consume through a temporary
  Worker consumer and KV evidence marker cleanup
- Durable Object functional evidence for `AiphaBeeRunCoordinator` migration and
  synthetic storage put/get/delete through `AIPHABEE_RUN_COORDINATOR`

## Acceptance

- Readiness checker passes locally with no network.
- Smoke script `--dry-run` lists read-only endpoints and required env.
- Functional smoke script `--dry-run` lists live-only Wrangler operations and
  required env.
- Smoke script with missing env exits `2` and prints env names only.
- Partial provisioning evidence exactly matches the provisioned flags in
  `deploy/cloudflare/bindings.contract.json`.
- Functional smoke output contains hashes/status only and does not print account
  ids, resource ids, object keys, or raw values.
- Worker runtime binding smoke route requires `x-aiphabee-smoke`, returns only
  hashes/status/operation counts, and is deployed through a temporary untracked
  Wrangler config that resolves KV/D1 ids at runtime.
- Queue smoke route requires `x-aiphabee-smoke`, sends a synthetic message to
  `AIPHABEE_EVENTS_QUEUE`, verifies consumer-written KV evidence, removes the
  temporary Worker consumer registration, and returns only hashes/status/counts.
- Durable Object smoke route requires `x-aiphabee-smoke`, routes through the
  `AIPHABEE_RUN_COORDINATOR` namespace, proves storage put/get/delete, and
  returns only hashes/status/counts.
- Full repository check includes the readiness gate.
- No Cloudflare token, account id, raw API response, or resource id is written
  to committed files.
