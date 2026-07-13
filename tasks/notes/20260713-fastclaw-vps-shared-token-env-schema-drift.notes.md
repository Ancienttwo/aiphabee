# Baseline Fix: FASTCLAW_VPS_SHARED_TOKEN env schema drift

> **Status**: Recorded
> **Date**: 2026-07-13
> **Scope**: Unblock `check:secrets` on PR #27 CI; no product behavior change.

## Root Cause

`deploy/secrets/stores.contract.json` references `FASTCLAW_VPS_SHARED_TOKEN` in two
providers (`cloudflare_workers`, `github_actions`) and lists it in `secret_names`,
but `deploy/env/env.schema.json` never declared it. `check:secrets` requires
`secret_names` to exactly match the `secret === true` variables in the env schema,
so it failed:

```
secret_names must match secret variables in deploy/env/env.schema.json
providers[0]/providers[2] stores unknown secret FASTCLAW_VPS_SHARED_TOKEN
```

The token is a real, used secret — referenced by `apps/worker/src/index.ts`,
`apps/worker/src/research-agent-lifecycle.ts`, `apps/worker/src/fastclaw-row10-acceptance.ts`,
and `scripts/deploy-fastclaw-vps-staging.mjs`. It entered `stores.contract.json` in
commit `98dca0b feat(fastclaw): close staging live evidence sprint` without a matching
env-schema declaration. This drift pre-existed on `origin/main`.

## Fix (fail-closed, declare the real secret)

- Declare `FASTCLAW_VPS_SHARED_TOKEN` as `secret: true` in `deploy/env/env.schema.json`,
  grouped with its sibling `FASTCLAW_ADMIN_API_KEY`, environments `["dev","staging","prod"]`
  (matching the sibling secret and the `github_actions` provider scope).
- Add the value-less `FASTCLAW_VPS_SHARED_TOKEN=` key to the four env templates
  (`.env.example`, `dev/staging/prod.env.example`) so `check:env` (schema ↔ template
  set-equality) also passes.
- No secret value is committed; templates stay value-less and write-only.

## Verification

```
npm run check:secrets → ok (providers 3, secrets 14)
npm run check:env     → ok (files 4, variables 34, secret_variables 14)
git diff --check      → clean
```

Removing the token from the stores contract was rejected: it is an authoritative,
runtime-referenced secret, so the schema must declare it rather than drop it.
