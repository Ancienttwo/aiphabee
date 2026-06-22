# Provider Secret Stores Contract

> **Status**: Verified no-secret contract
> **Last Updated**: 2026-06-20 16:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-provider-secret-stores-contract.md`
> **Task Contract**: `tasks/contracts/provider-secret-stores-contract.contract.md`

This slice creates the repo-local contract for provider secret stores,
rotation, and emergency revocation. The later observability persistent-store
scaffold adds `OTLP_EXPORTER_OTLP_HEADERS` to the same no-secret contract. It
does not set, list, delete, or rotate any live provider secret.

References checked:

- [Cloudflare Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/):
  sensitive Worker values should use secrets, not `vars`, and local `.dev.vars`
  / `.env` files must not be committed.
- [Cloudflare Workers bulk secrets API](https://developers.cloudflare.com/changelog/post/2026-06-03-bulk-secrets-api/):
  Workers secrets can be created, updated, or deleted in bulk.
- [GitHub Actions secrets](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions):
  repository, environment, and organization secrets can be managed through UI or
  `gh secret set/list`.
- [Supabase CLI secrets](https://github.com/supabase/cli/blob/develop/apps/cli/docs/go-cli-reference.md):
  `supabase secrets set/list/unset` manages project secrets.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Env secret names | `deploy/env/env.schema.json` | Five secret variables; templates remain blank |
| Store contract | `deploy/secrets/stores.contract.json` | Cloudflare Workers, GitHub Actions, Supabase planned stores |
| Runbook | `deploy/runbooks/secret-rotation-emergency-revocation.md` | Operator path for normal rotation and emergency revocation |
| Validator | `scripts/check-secret-stores-contract.mjs` | Ensures provider coverage, env-secret parity, cadence/SLA, and no secret-like values |
| Live smoke readiness | `deploy/secrets/live-smoke-readiness.contract.json` / `scripts/smoke-provider-secret-stores-live.mjs` | Synthetic set/list/rotate/delete readiness for Cloudflare/GitHub/Supabase |
| Worker route | `GET /secrets/runtime` | Reports store contract, provider names, cadence, SLA, and `secret_values_available=false` |
| Live providers | Absent | No provider mutation, no secret value, no provider ID, no secret listing output |

## P2 Concrete Trace

Contract validation trace:

1. `npm run check:secrets` runs
   `scripts/check-secret-stores-contract.mjs`.
2. The checker reads `deploy/secrets/stores.contract.json` and
   `deploy/env/env.schema.json`.
3. It confirms:
   - contract secret names match env schema secret variables;
   - Cloudflare Workers, GitHub Actions, and Supabase providers exist;
   - provider statuses remain `planned`;
   - rotation cadence is within policy;
   - emergency revocation SLA is no more than 30 minutes;
   - no database URLs, token-like strings, provider IDs, or secret values are
     committed.
4. It returns `status=ok`.

Runtime capability trace:

1. `GET /secrets/runtime` enters the Hono Worker.
2. Worker returns a standard success envelope with:
   - `provider_stores=[cloudflare_workers, github_actions, supabase]`;
   - `rotation_cadence_days=90`;
   - `emergency_revocation_sla_minutes=30`;
   - `secret_values_available=false`;
   - `store_contract=deploy/secrets/stores.contract.json`.
3. No provider API is called and no secret value is exposed.

Live smoke readiness trace:

1. `npm run check:provider-secret-stores-live-readiness` validates
   `deploy/secrets/live-smoke-readiness.contract.json`, the explicit live smoke
   script, package scripts, source-store parity, and no-secret output rules.
2. `npm run smoke:provider-secret-stores-live -- --dry-run` reports required
   names-only env and planned operations without network access.
3. A future real run uses only a synthetic `AIPHABEE_SECRET_STORE_SMOKE...`
   secret name, generated in-memory values, provider list commands, and cleanup.

## P3 Design Decision

Selected a no-secret contract and runbook instead of live provider mutation.

Reason:

- The repo intentionally has names-only env templates and no provider secret
  values.
- Live secret provisioning would require approved accounts, target environments,
  and operator identity.
- A committed contract is still valuable because it fixes secret ownership,
  command shape, rotation cadence, revocation SLA, and CI validation before live
  cutover.

Tradeoff:

- This completes the Sprint 0.4 secret-store contract leaf.
- It does not prove that Cloudflare, GitHub Actions, or Supabase stores are live
  or that rotation has been smoke-tested.
- The new live smoke harness narrows the remaining live task to an explicit
  synthetic provider mutation run, but this document still does not claim a live
  pass.

## Verification

Passed:

- `npm run check:secrets`
- `npm run check:provider-secret-stores-live-readiness`
- `node scripts/smoke-provider-secret-stores-live.mjs --dry-run`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /secrets/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/secrets/runtime` response fields:

```json
{
  "emergency_revocation_sla_minutes": 30,
  "provider_stores": [
    { "name": "cloudflare_workers", "status": "planned" },
    { "name": "github_actions", "status": "planned" },
    { "name": "supabase", "status": "planned" }
  ],
  "rotation_cadence_days": 90,
  "secret_values_available": false,
  "store_contract": "deploy/secrets/stores.contract.json"
}
```

## Residual Gaps

- Real provider secret stores are not provisioned.
- No `wrangler secret`, `gh secret`, or `supabase secrets` live mutation smoke
  has passed against a real account.
- OIDC replacement for long-lived deployment credentials remains unimplemented.
- Production incident evidence storage is not implemented.
