# Cloudflare Resource Smoke Readiness

Date: 2026-06-22

## Scope

This slice records partial Sprint 0.4 Cloudflare external provisioning without
claiming complete binding write/read smoke.

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
- Readiness gate: `npm run check:cloudflare-resource-live-readiness`.
- Out of scope: writing R2/KV/D1/Queue records, creating Workflow/Cron/Durable
  Object/AI Gateway/Hyperdrive resources, running Hyperdrive `SELECT 1`, OTLP
  export, or rotating provider secrets.

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

## P3 Decision

The existing binding contract is intentionally names-only. The smallest
coherent update is to record the resources that now exist while keeping the
overall resource smoke item unchecked until functional binding write/read smoke
passes.

At 10x scale this fails first on partial provisioning and token scope drift:
some resources may exist while D1/Durable Object list permissions are missing.
The output therefore separates `missing_resources` from `permission_errors`
instead of collapsing everything into one failed smoke. The partial evidence
block is also checked against raw account/resource id patterns so local
contracts do not become secret or environment ledgers.

## Verification Surface

- `npm run check:cloudflare-resource-live-readiness`
- `node scripts/smoke-cloudflare-resources-live.mjs --dry-run`
- `node scripts/smoke-cloudflare-resources-live.mjs` with real env
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

The AI Gateway create attempt returned a Cloudflare API authentication error in
the available API context. Workflow, Cron trigger, Durable Object namespace, and
Hyperdrive remain unprovisioned because they require Worker class/migration,
schedule config, or a Postgres origin decision before safe creation.

## Residual Gaps

- Sprint 0.4 Cloudflare resource provisioning remains unchecked because not all
  required resource classes are provisioned and no binding write/read smoke has
  passed.
- Functional binding smoke remains unchecked: Queue publish/consume, R2
  put/get/delete, KV put/get, D1 eval write/read, Hyperdrive `SELECT 1`, and
  Workflow instance execution are not claimed.
- Provider secret rotation/revocation remains unchecked.
