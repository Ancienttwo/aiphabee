# Cloudflare Resource Smoke Readiness

Date: 2026-06-22

## Scope

This slice records partial Sprint 0.4 Cloudflare external provisioning and
partial resource-level functional smoke without claiming complete Worker
binding smoke.

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
- Out of scope: Queue publish/consume through a Worker consumer, Worker runtime
  bindings, creating Workflow/Cron/Durable Object/AI Gateway/Hyperdrive
  resources, running Hyperdrive `SELECT 1`, OTLP export, or rotating provider
  secrets.

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

## P3 Decision

The existing binding contract is intentionally names-only. The smallest
coherent update is to record the resources that now exist and prove
resource-level KV/R2/D1 write-read-delete through Wrangler while keeping the
overall resource smoke item unchecked until Queue, Worker binding, and remaining
Cloudflare classes pass their own live smokes.

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

The AI Gateway create attempt returned a Cloudflare API authentication error in
the available API context. Workflow, Cron trigger, Durable Object namespace, and
Hyperdrive remain unprovisioned because they require Worker class/migration,
schedule config, or a Postgres origin decision before safe creation.

## Residual Gaps

- Sprint 0.4 Cloudflare resource provisioning remains unchecked because not all
  required resource classes are provisioned and Worker runtime binding smoke has
  not passed.
- Functional binding smoke remains unchecked: Queue publish/consume, Worker
  runtime binding access, Hyperdrive `SELECT 1`, and Workflow/Cron/Durable
  Object execution are not claimed.
- Provider secret rotation/revocation remains unchecked.
