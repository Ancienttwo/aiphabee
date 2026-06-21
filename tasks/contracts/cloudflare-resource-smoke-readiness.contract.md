# Task Contract: cloudflare-resource-smoke-readiness

## Objective

Create a no-secret readiness harness for Sprint 0.4 Cloudflare resource live
smoke and record partial external provisioning evidence without claiming full
resource or binding-smoke completion.

## Inputs

- `deploy/cloudflare/bindings.contract.json`
- `deploy/env/env.schema.json`
- `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Cloudflare OpenAPI read-only endpoint confirmations

## Deliverables

- `deploy/cloudflare/resource-smoke-readiness.contract.json`
- `scripts/check-cloudflare-resource-live-readiness.mjs`
- `scripts/smoke-cloudflare-resources-live.mjs`
- `npm run check:cloudflare-resource-live-readiness`
- `npm run smoke:cloudflare-resources-live`
- Tracker update that keeps the live resource item unchecked
- Partial provisioning evidence for Worker, Queue, R2, KV, and D1, with no
  account ids or resource ids committed

## Acceptance

- Readiness checker passes locally with no network.
- Smoke script `--dry-run` lists read-only endpoints and required env.
- Smoke script with missing env exits `2` and prints env names only.
- Partial provisioning evidence exactly matches the provisioned flags in
  `deploy/cloudflare/bindings.contract.json`.
- Full repository check includes the readiness gate.
- No Cloudflare token, account id, raw API response, or resource id is written
  to committed files.
