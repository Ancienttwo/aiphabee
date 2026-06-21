# Secret Rotation And Emergency Revocation Runbook

> **Status**: Planned procedure, no provider mutation performed
> **Contract**: `deploy/secrets/stores.contract.json`

This runbook defines the operator path for rotating or revoking AiphaBee secrets
without committing secret values into the repository.

## Normal Rotation

1. Open a change window and identify the affected secret names from
   `deploy/secrets/stores.contract.json`.
2. Create replacement values in the provider source system.
3. Update provider stores:
   - Cloudflare: `wrangler secret bulk < deploy/secrets/runtime.secrets.json`
   - GitHub Actions: `gh secret set --env <ENV_NAME> <SECRET_NAME>`
   - Supabase: `supabase secrets set <NAME=VALUE> --project-ref <PROJECT_REF>`
4. Run post-rotation smoke:
   - `GET /health`
   - `GET /database/runtime`
   - `POST /agent/runs/dry-run`
5. Remove old values after the dual-write window closes.
6. Record evidence with provider, secret name, timestamp, operator, and smoke
   result. Do not record secret values.

## Emergency Revocation

Target SLA: complete delete/replace action within 30 minutes of confirmed
compromise.

1. Freeze deploys.
2. Identify affected provider stores and environments.
3. Delete or replace the compromised secret:
   - Cloudflare: `wrangler secret delete <SECRET_NAME> --name aiphabee-worker`
   - GitHub Actions: `gh secret delete --env <ENV_NAME> <SECRET_NAME>`
   - Supabase: `supabase secrets unset <SECRET_NAME> --project-ref <PROJECT_REF>`
4. Rotate downstream credentials at the source provider.
5. Recreate the secret in required stores.
6. Run post-revocation smoke.
7. Record incident evidence without storing secret values.

## Non-Goals

- This runbook does not provision provider stores.
- This runbook does not authorize production mutation without an approved
  operator and target environment.
