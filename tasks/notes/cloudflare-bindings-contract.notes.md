# Notes: cloudflare-bindings-contract

> **Last Updated**: 2026-06-20 15:10 +08
> **Plan**: `plans/plan-cloudflare-bindings-contract.md`
> **Runtime Evidence**: `docs/governance/cloudflare-bindings-contract.md`

## Decisions

- Kept binding resource IDs and secrets out of the repo.
- Marked only the Worker as locally provisioned because `/health` is runnable.
- Added planned binding names and smoke surfaces for the rest of the Cloudflare
  stack.
- Wired binding contract validation into root `npm run check` and CI.

## Verification

- Passed: `npm run check:bindings`
- Passed: `npm run check`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Cloudflare resources are not provisioned.
- Wrangler config does not include planned binding IDs.
- Smoke tests are not executable until resources exist.
