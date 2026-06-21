# Cloudflare Resource Smoke Readiness

Date: 2026-06-22

## Scope

This slice prepares the Sprint 0.4 Cloudflare resource smoke path without
claiming that resources are provisioned.

## P1 Architecture Map

- Product truth: `docs/researches/AiphaBee_PRD_v1.0.md` requires Cloudflare
  Workers, Workflows, Queues, Cron, Durable Objects, R2, KV, AI Gateway, and
  Hyperdrive as the deployment substrate.
- Current contract: `deploy/cloudflare/bindings.contract.json` remains
  `planned`; only `aiphabee-worker` is marked provisioned locally.
- Readiness contract:
  `deploy/cloudflare/resource-smoke-readiness.contract.json`.
- Live smoke command: `npm run smoke:cloudflare-resources-live`.
- Readiness gate: `npm run check:cloudflare-resource-live-readiness`.
- Out of scope: creating Cloudflare resources, writing R2/KV/D1/Queue records,
  running Hyperdrive `SELECT 1`, OTLP export, or rotating provider secrets.

## P2 Concrete Trace

1. Operator provides names-only env plus `CLOUDFLARE_API_TOKEN`.
2. `scripts/smoke-cloudflare-resources-live.mjs` validates required env.
3. The script calls Cloudflare API v4 read-only endpoints for Workers,
   Workflows, Queues, Cron triggers, Durable Object namespaces, R2 buckets, KV
   namespaces, D1 databases, AI Gateway gateways, and Hyperdrive configs.
4. Each result is reduced to `binding_name`, `type`, `status`, `http_status`,
   count, and hash fields.
5. The script exits `0` only when every expected resource is found; missing
   resources or permission errors exit `1`; missing env exits `2`.

## P3 Decision

The existing binding contract is intentionally names-only and mostly planned.
The smallest coherent next step is a read-only live discovery harness that can
prove whether expected resources exist without leaking Cloudflare account ids,
resource ids, token values, raw API responses, or secret payloads.

At 10x scale this fails first on partial provisioning and token scope drift:
some resources may exist while D1/Durable Object list permissions are missing.
The output therefore separates `missing_resources` from `permission_errors`
instead of collapsing everything into one failed smoke.

## Verification Surface

- `npm run check:cloudflare-resource-live-readiness`
- `node scripts/smoke-cloudflare-resources-live.mjs --dry-run`
- `node scripts/smoke-cloudflare-resources-live.mjs` with real env
- `npm run check:bindings`
- `npm run check:env`

## External Read-Only Observation

Cloudflare connector read-only checks against the configured accounts did not
find AiphaBee-named resources. Workers, Workflows, Queues, KV, R2, Hyperdrive,
and AI Gateway list calls were reachable for at least one account, while D1 and
Durable Object namespace list calls returned provider authentication errors in
the connector context. No resource creation or mutation was attempted.

## Residual Gaps

- Sprint 0.4 Cloudflare resource provisioning remains unchecked.
- Functional binding smoke remains unchecked: Queue publish/consume, R2
  put/get/delete, KV put/get, D1 eval write/read, Hyperdrive `SELECT 1`, and
  Workflow instance execution are not claimed.
- Provider secret rotation/revocation remains unchecked.
