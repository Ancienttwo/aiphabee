# Cloudflare Resource Smoke Readiness

Date: 2026-06-22

## Scope

This slice records partial Sprint 0.4 Cloudflare external provisioning and
partial resource-level functional smoke plus Worker runtime KV/R2/D1 binding
smoke, Queue publish/consume smoke, and Durable Object state smoke without
claiming complete Cloudflare binding smoke.

## P1 Architecture Map

- Product truth: `docs/researches/AiphaBee_PRD_v1.0.md` requires Cloudflare
  Workers, Workflows, Queues, Cron, Durable Objects, R2, KV, AI Gateway, and
  Hyperdrive as the deployment substrate.
- Current contract: `deploy/cloudflare/bindings.contract.json` remains
  `planned`; `aiphabee-worker`, `AIPHABEE_EVENTS_QUEUE`,
  `AIPHABEE_ARTIFACTS`, `AIPHABEE_CONFIG`, and `AIPHABEE_EVAL_STORE` are
  marked provisioned by names only.
- Readiness contract:
  `deploy/cloudflare/resource-smoke-readiness.contract.json`.
- Live smoke command: `npm run smoke:cloudflare-resources-live`.
- Functional smoke command:
  `npm run smoke:cloudflare-bindings-wrangler-live`.
- Readiness gate: `npm run check:cloudflare-resource-live-readiness`.
- Out of scope: creating Workflow/Cron/AI Gateway/Hyperdrive resources, running
  Hyperdrive `SELECT 1`, OTLP export, or rotating provider secrets.

## P2 Concrete Trace

1. Operator provisions resources through Wrangler or Cloudflare API without
   committing account ids, resource ids, or tokens.
2. `deploy/cloudflare/resource-smoke-readiness.contract.json` records the
   names-only partial provisioning evidence.
3. `scripts/check-cloudflare-resource-live-readiness.mjs` validates that
   `partial_provisioning.provisioned_bindings` exactly matches
   `deploy/cloudflare/bindings.contract.json`.
4. Operator can provide names-only env plus `CLOUDFLARE_API_TOKEN` for the live
   smoke path.
5. `scripts/smoke-cloudflare-resources-live.mjs` validates required env.
6. The script calls Cloudflare API v4 read-only endpoints for Workers,
   Workflows, Queues, Cron triggers, Durable Object namespaces, R2 buckets, KV
   namespaces, D1 databases, AI Gateway gateways, and Hyperdrive configs.
7. Each result is reduced to `binding_name`, `type`, `status`, `http_status`,
   count, and hash fields.
8. The script exits `0` only when every expected resource is found; missing
   resources or permission errors exit `1`; missing env exits `2`.
9. `scripts/smoke-cloudflare-bindings-wrangler-live.mjs` uses Wrangler's
   authenticated CLI session for live-only synthetic operations:
   - KV namespace title lookup, then key put/get/delete;
   - R2 object put/get/delete;
   - D1 synthetic table create/insert/select/delete/drop.
10. Functional smoke output contains hashes and status fields only; it does not
    emit account ids, namespace ids, object keys, raw values, or raw command
    output.
11. The same functional smoke script writes a temporary untracked Wrangler
    config under `apps/worker`, resolves KV/D1 ids at runtime, deploys
    `aiphabee-worker` with KV/R2/D1 bindings, and calls
    `POST /cloudflare/bindings/smoke`.
12. The Worker route requires `x-aiphabee-smoke`, performs synthetic KV
    put/get/delete, R2 put/get/delete, and D1 create/insert/select/delete/drop,
    then returns only status, operation counts, missing bindings, and hashes.
13. The temporary Worker config also attaches `AIPHABEE_EVENTS_QUEUE` as a
    producer and one-message Worker consumer. `POST /cloudflare/queues/smoke`
    sends a synthetic message, the queue handler writes a KV evidence marker,
    the route verifies and deletes that marker, and the script removes the
    temporary Worker consumer registration after the smoke.
14. The temporary Worker config attaches `AIPHABEE_RUN_COORDINATOR` to the
    exported `AiphaBeeRunCoordinator` Durable Object class with a migration.
    `POST /cloudflare/durable-objects/smoke` routes to a named object and proves
    storage put/get/delete without returning object ids or state keys.

## P3 Decision

The existing binding contract is intentionally names-only. The smallest
coherent update is to record the resources that now exist and prove
resource-level KV/R2/D1 write-read-delete through Wrangler, prove Worker
runtime KV/R2/D1, prove Queue publish/consume through a temporary Worker
consumer, and prove Durable Object state put/get/delete while keeping the
overall resource smoke item unchecked until the remaining Cloudflare classes
pass their own live smokes.

At 10x scale this fails first on partial provisioning and token scope drift:
some resources may exist while D1/Durable Object list permissions are missing.
The output therefore separates `missing_resources` from `permission_errors`
instead of collapsing everything into one failed smoke. The partial evidence
block is also checked against raw account/resource id patterns so local
contracts do not become secret or environment ledgers.

Wrangler functional smoke also fails first on eventual consistency and cleanup
gaps. The KV check therefore retries reads briefly, and all mutating operations
use synthetic `aiphabee-smoke` keys/objects/rows with cleanup.

## Verification Surface

- `npm run check:cloudflare-resource-live-readiness`
- `node scripts/smoke-cloudflare-resources-live.mjs --dry-run`
- `node scripts/smoke-cloudflare-resources-live.mjs` with real env
- `node scripts/smoke-cloudflare-bindings-wrangler-live.mjs --dry-run`
- `CLOUDFLARE_ACCOUNT_ID=... npm run smoke:cloudflare-bindings-wrangler-live`
- `npm run check:bindings`
- `npm run check:env`

## External Provisioning Observation

Wrangler-authenticated Cloudflare operations against the selected account
completed the following names-only provisioning and verification:

- Worker `aiphabee-worker` deployed and `GET /health` returned `status=ok`.
- Queue `aiphabee-events-queue` created and found by queue list.
- R2 bucket `aiphabee-artifacts` created and found by bucket list.
- KV namespace title `AIPHABEE_CONFIG` created and found by namespace list.
- D1 database `AIPHABEE_EVAL_STORE` created and found by database list.
- KV `AIPHABEE_CONFIG` passed synthetic put/get/delete through Wrangler.
- R2 `aiphabee-artifacts` passed synthetic object put/get/delete through
  Wrangler.
- D1 `AIPHABEE_EVAL_STORE` passed synthetic create/insert/select/delete/drop
  through Wrangler.
- Worker `POST /cloudflare/bindings/smoke` passed runtime KV/R2/D1 binding
  smoke through a temporary no-id Wrangler config; output contained only hashes,
  status fields, and operation counts.
- Worker `POST /cloudflare/queues/smoke` passed Queue publish/consume smoke
  through a temporary no-id Wrangler config with `AIPHABEE_EVENTS_QUEUE` as
  producer/consumer and KV evidence cleanup; output contained only hashes,
  status fields, and operation counts.
- Durable Object `AiphaBeeRunCoordinator` passed migration plus
  `POST /cloudflare/durable-objects/smoke` state put/get/delete through a
  temporary no-id Wrangler config; output contained only hashes, status fields,
  and operation counts.

The AI Gateway create attempt returned a Cloudflare API authentication error in
the available API context. Workflow, Cron trigger, and Hyperdrive remain
unprovisioned because they require a workflow class, schedule config, or a
Postgres origin decision before safe creation.

## Residual Gaps

- Sprint 0.4 Cloudflare resource provisioning remains unchecked because not all
  required resource classes are provisioned.
- Functional binding smoke remains unchecked: Hyperdrive `SELECT 1`,
  Workflow execution, and Cron trigger execution are not claimed.
- Provider secret rotation/revocation remains unchecked.
