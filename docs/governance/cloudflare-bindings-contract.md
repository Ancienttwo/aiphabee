# Cloudflare Bindings Contract

> **Status**: Verified contract; resource provisioning pending
> **Last Updated**: 2026-06-20 15:10 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-cloudflare-bindings-contract.md`
> **Task Contract**: `tasks/contracts/cloudflare-bindings-contract.contract.md`

This slice defines the planned Cloudflare binding surface without provisioning
real resources.

## Contract

| Surface | Artifact | State |
|---|---|---|
| Binding manifest | `deploy/cloudflare/bindings.contract.json` | Lists Worker, Workflows, Queues, Cron, Durable Objects, R2, KV, AI Gateway, and Hyperdrive |
| Validator | `scripts/check-cloudflare-bindings-contract.mjs` | Ensures every required binding type has name, purpose, sprint, smoke test, and no IDs/secrets |
| CI | `.github/workflows/ci.yml` | Runs `npm run check:bindings` |

## Current Provisioning State

- Provisioned locally: `aiphabee-worker` with `/health`.
- Planned only: Workflows, Queues, Cron, Durable Objects, R2, KV, AI Gateway,
  Hyperdrive.

No resource IDs, account tokens, database URLs, or provider secrets are stored
in this contract.

## Verification

Passed:

- `npm run check:bindings`
- `npm run check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Real Cloudflare resources are not created.
- Wrangler bindings for planned resources are not attached.
- Binding smoke tests are documented but not executable until resources exist.
