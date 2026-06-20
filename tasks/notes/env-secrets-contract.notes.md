# Notes: env-secrets-contract

> **Last Updated**: 2026-06-20 14:58 +08
> **Plan**: `plans/plan-env-secrets-contract.md`
> **Runtime Evidence**: `docs/governance/env-secrets-contract.md`

## Decisions

- Committed names-only examples; no values.
- Marked service-role/API-token/database URL fields as secret in schema.
- Kept provider secret provisioning out of scope.
- Wired env validation into root `npm run check` and CI.

## Verification

- Passed: `npm run check:env`
- Passed: `npm run check`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Real provider stores and deployment environments are not provisioned.
- Rotation/revocation runbooks do not exist.
- Binding resource IDs remain unassigned until Cloudflare/Supabase resources
  exist.
