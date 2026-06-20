# Environment And Secrets Contract

> **Status**: Verified repo-local contract
> **Last Updated**: 2026-06-20 15:10 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-env-secrets-contract.md`
> **Task Contract**: `tasks/contracts/env-secrets-contract.contract.md`

This slice establishes names-only environment templates and validation for dev,
staging, and prod. It does not provision provider secrets.

## Contract

| Surface | Artifact | Rule |
|---|---|---|
| Schema | `deploy/env/env.schema.json` | Lists every allowed variable, whether it is secret, and its environments |
| Global template | `deploy/env/.env.example` | Names only, blank values |
| Dev template | `deploy/env/dev.env.example` | Names only, blank values |
| Staging template | `deploy/env/staging.env.example` | Names only, blank values |
| Prod template | `deploy/env/prod.env.example` | Names only, blank values |
| Validator | `scripts/check-env-contract.mjs` | Fails if templates diverge from schema or contain values |
| CI | `.github/workflows/ci.yml` | Runs `npm run check:env` |

## Secret Variables

The schema marks these variables as secret:

- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HYPERDRIVE_DATABASE_URL`
- `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_AIPHABEE_HYPERDRIVE`

They must not be committed with values. Provider-specific storage remains a
future deployment task.

## Verification

Passed:

- `npm run check:env`
- `npm run check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Cloudflare/GitHub/Supabase secret stores are not provisioned.
- Rotation policy and emergency revocation runbooks are not implemented.
- Binding IDs are still placeholders until resources exist.
