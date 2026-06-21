# Cloudflare Resource Smoke Readiness

Date: 2026-06-22

## Scope

This slice records partial Sprint 0.4 Cloudflare external provisioning and
partial resource-level functional smoke plus Worker runtime KV/R2/D1 binding
smoke, Queue publish/consume smoke, Durable Object state smoke, Workflow
instance execution smoke, Cron handler smoke, and deployed Worker AI Gateway
model request smoke without claiming complete
Cloudflare binding smoke.

## P1 Architecture Map

- Product truth: `docs/researches/AiphaBee_PRD_v1.0.md` requires Cloudflare
  Workers, Workflows, Queues, Cron, Durable Objects, R2, KV, AI Gateway, and
  Hyperdrive as the deployment substrate.
- Current contract: `deploy/cloudflare/bindings.contract.json` remains
  `planned`; `aiphabee-worker`, `AIPHABEE_RESEARCH_WORKFLOW`,
  `AIPHABEE_EVENTS_QUEUE`, `AIPHABEE_MAINTENANCE_CRON`,
  `AIPHABEE_RUN_COORDINATOR`, `AIPHABEE_ARTIFACTS`, `AIPHABEE_CONFIG`,
  `AIPHABEE_EVAL_STORE`, and `AIPHABEE_AI_GATEWAY` are marked provisioned by
  names only.
- Readiness contract:
  `deploy/cloudflare/resource-smoke-readiness.contract.json`.
- Live smoke command: `npm run smoke:cloudflare-resources-live`.
- Functional smoke command:
  `npm run smoke:cloudflare-bindings-wrangler-live`.
- Readiness gate: `npm run check:cloudflare-resource-live-readiness`.
- Out of scope: Hyperdrive resource completion, natural Cron trigger evidence,
  running Hyperdrive `SELECT 1`, AI Gateway cost/cache/rate-limit/fallback log
  verification, OTLP export, or rotating provider secrets.

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
15. The temporary Worker config binds `AIPHABEE_RESEARCH_WORKFLOW` to the
    exported `AiphaBeeResearchWorkflow` class. `POST
    /cloudflare/workflows/smoke` calls `env.AIPHABEE_RESEARCH_WORKFLOW.create()`,
    the Workflow writes KV evidence, the route verifies and deletes the marker,
    and the response returns only hashes/status/counts.
16. The same config declares `triggers.crons`. `POST /cloudflare/cron/smoke`
    exercises the shared `scheduled` handler logic with KV evidence cleanup.
    This proves handler/config smoke, not that a natural scheduled event has
    already fired.
17. The temporary config injects `AI_GATEWAY_NAME`, `AI_GATEWAY_SMOKE_MODEL`,
    and `CLOUDFLARE_ACCOUNT_ID` as non-secret vars and uploads
    `AI_GATEWAY_LIVE_SMOKE_TOKEN` through Wrangler `--secrets-file`. `POST
    /agent/model-provider/live-smoke` runs Cloudflare AI Gateway
    OpenAI-compatible `generateText` and `streamText`, requires exact synthetic
    output, and returns only hashes/status/counts. The smoke script deletes the
    dedicated temporary Worker secret after the route call.

## P3 Decision

The existing binding contract is intentionally names-only. The smallest
coherent update is to record the resources that now exist and prove
resource-level KV/R2/D1 write-read-delete through Wrangler, prove Worker
runtime KV/R2/D1, prove Queue publish/consume through a temporary Worker
consumer, prove Durable Object state put/get/delete, prove Workflow
`create()`/KV evidence, prove Cron handler/config execution, and prove the
deployed Worker AI Gateway model request path while keeping the overall
resource smoke item unchecked until Hyperdrive and natural Cron evidence are
complete.

At 10x scale this fails first on partial provisioning and token scope drift:
some resources may exist while D1/Durable Object list permissions are missing.
The output therefore separates `missing_resources` from `permission_errors`
instead of collapsing everything into one failed smoke. The partial evidence
block is also checked against raw account/resource id patterns so local
contracts do not become secret or environment ledgers.

Wrangler functional smoke also fails first on eventual consistency and cleanup
gaps. The KV check therefore retries reads briefly, and all mutating operations
use synthetic `aiphabee-smoke` keys/objects/rows with cleanup. Workflow
execution also uses KV evidence because `create()` may return before the
instance has reached a terminal state.

## Verification Surface

- `npm run check:cloudflare-resource-live-readiness`
- `node scripts/smoke-cloudflare-resources-live.mjs --dry-run`
- `node scripts/smoke-cloudflare-resources-live.mjs` with real env
- `node scripts/smoke-cloudflare-bindings-wrangler-live.mjs --dry-run`
- `CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=... AI_GATEWAY_NAME=... AI_GATEWAY_SMOKE_MODEL=... npm run smoke:cloudflare-bindings-wrangler-live`
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
- AI Gateway `AIPHABEE_AI_GATEWAY` passed deployed Worker
  `/agent/model-provider/live-smoke` with hash-only evidence; response hash
  `sha256:908a43d9a0b52e15f06ae890db0c7f131a0c661958a5ac25eb37d449c1cf3a9d`.
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
- Workflow `AiphaBeeResearchWorkflow` passed `create()` plus KV evidence smoke
  through `POST /cloudflare/workflows/smoke`; output contained only hashes,
  status fields, and operation counts.
- Cron passed deployed `triggers.crons` config plus scheduled handler KV
  evidence through `POST /cloudflare/cron/smoke`; output contained only hashes,
  status fields, and operation counts.

Hyperdrive remains unprovisioned because it requires a Postgres origin decision
before safe creation. Natural Cron trigger evidence and AI Gateway
cost/cache/rate-limit/fallback log verification are not claimed by this slice.

## Residual Gaps

- Sprint 0.4 Cloudflare resource provisioning remains unchecked because not all
  required resource classes are provisioned.
- Functional binding smoke remains unchecked: Hyperdrive `SELECT 1` and natural
  Cron trigger evidence are not claimed.
- AI Gateway model request smoke passed, but request/cost/cache/rate-limit and
  fallback log evidence is still owned by the model-provider/A5 slice.
- Provider secret rotation/revocation remains unchecked.
