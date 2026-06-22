# Provider Secret Stores Live Smoke Readiness

Date: 2026-06-22

## Scope

This slice adds the no-secret live smoke harness for Provider secret stores
across Cloudflare Workers, GitHub Actions environment secrets, and Supabase
project secrets. It does not claim that a live smoke has passed.

## P1 Architecture Map

- Source contract: `deploy/secrets/stores.contract.json`.
- Live readiness contract: `deploy/secrets/live-smoke-readiness.contract.json`.
- No-network checker: `npm run check:provider-secret-stores-live-readiness`.
- Explicit live command: `npm run smoke:provider-secret-stores-live`.
- Existing runtime status: `GET /secrets/runtime`.
- Out of scope: production secret values, rotating production secrets, OIDC
  migration, incident execution evidence, or storing provider resource ids.

## P2 Concrete Trace

1. Operator authenticates each provider CLI out of band.
2. Operator exports names-only target env:
   - `CLOUDFLARE_WORKER_NAME`;
   - `GITHUB_REPOSITORY`;
   - `GITHUB_ENVIRONMENT`;
   - `SUPABASE_PROJECT_REF`.
3. `npm run smoke:provider-secret-stores-live -- --dry-run` reports required
   env, auth sources, operations, providers, and forbidden output fields without
   network access.
4. A real smoke run generates one synthetic `AIPHABEE_SECRET_STORE_SMOKE...`
   name and two random in-memory values.
5. For Cloudflare Workers the script runs `wrangler secret put`, `wrangler
   secret list --format json`, a second `put` as rotation smoke, `wrangler
   secret delete`, and a final list to confirm absence.
6. For GitHub Actions the script runs `gh secret set`, `gh secret list --json
   name,updatedAt`, a second `set` as rotation smoke, `gh secret delete`, and a
   final list to confirm absence.
7. For Supabase the script writes a temporary local env file, runs `supabase
   secrets set --env-file`, `supabase secrets list --output json`, a second
   set as rotation smoke, `supabase secrets unset --yes`, then confirms absence.
8. Output contains provider, status, operation counts, smoke secret name/hash,
   and command-output hashes only. Secret values, raw CLI output, env file
   contents, tokens, and authorization headers are never emitted.

## P3 Decision

The smallest coherent move is a synthetic provider-store smoke, not production
secret rotation. It directly proves set/list/update/delete mechanics for the
three planned stores while keeping production credentials and provider ids out
of git and out of smoke output.

At 10x scale this fails first on provider auth scope drift: a token may list
secrets but not set/delete them, or the target GitHub environment/Supabase
project may be wrong. The smoke therefore treats each provider independently
and exits non-zero unless every provider completes set, list, rotate, delete,
and confirm-absent.

## Verification

- `npm run check:provider-secret-stores-live-readiness`
- `node --check scripts/smoke-provider-secret-stores-live.mjs`
- `node scripts/smoke-provider-secret-stores-live.mjs --dry-run`
- `npm run check:secrets`
- `npm run check`

## Residual Gaps

- No live provider auth/env is present in the current shell.
- No real Cloudflare/GitHub/Supabase synthetic secret mutation was executed.
- Sprint 0.4 Provider secret stores live item remains unchecked.
