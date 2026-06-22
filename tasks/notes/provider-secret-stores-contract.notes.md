# Notes: provider-secret-stores-contract

> **Last Updated**: 2026-06-20 15:20 +08
> **Plan**: `plans/plan-provider-secret-stores-contract.md`
> **Runtime Evidence**: `docs/governance/provider-secret-stores-contract.md`

## Decisions

- Matched contract `secret_names` directly to `deploy/env/env.schema.json`
  secret variables.
- Kept every provider status as `planned` because no live provider mutation was
  performed.
- Added Cloudflare, GitHub Actions, and Supabase command shapes from current
  provider documentation without adding real values.
- Added `.dev.vars*` to `.gitignore` for Cloudflare local Worker secret files.
- Added `/secrets/runtime` to expose no-secret capability state for smoke tests.
- Added a follow-on live smoke readiness harness in
  `deploy/secrets/live-smoke-readiness.contract.json` and
  `scripts/smoke-provider-secret-stores-live.mjs`; the live command remains
  explicit and unrun without provider auth/env.

## Verification

- Passed: `npm run check:secrets`
- Passed: `npm run check:provider-secret-stores-live-readiness`
- Passed: `node scripts/smoke-provider-secret-stores-live.mjs --dry-run`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /secrets/runtime`.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- Provider secret stores are not provisioned.
- No secret has been set, listed, rotated, deleted, or restored in a live
  provider during this slice.
- No OIDC replacement for long-lived deployment secrets has been configured.
- No production incident evidence store exists.
