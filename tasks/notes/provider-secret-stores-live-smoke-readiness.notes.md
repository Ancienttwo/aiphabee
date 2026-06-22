# Notes: provider-secret-stores-live-smoke-readiness

## What Changed

- Added `deploy/secrets/live-smoke-readiness.contract.json`.
- Added `scripts/check-provider-secret-stores-live-readiness.mjs`.
- Added `scripts/smoke-provider-secret-stores-live.mjs`.
- Added `npm run check:provider-secret-stores-live-readiness` to full
  `npm run check`.
- Added `npm run smoke:provider-secret-stores-live` for explicit live smoke.
- Documented the synthetic set/list/rotate/delete/confirm-absent path in
  `docs/governance/provider-secret-stores-live-smoke-readiness.md`.

## Evidence

- The live smoke script uses a generated `AIPHABEE_SECRET_STORE_SMOKE...` name.
- Secret values are generated in memory and are not logged.
- Supabase smoke writes the generated value only to a temporary local env file
  and deletes that file after each set operation.
- Smoke output is limited to provider names, status, operation counts, smoke
  secret name/hash, and hash-only command evidence.

## What Was Not Claimed

- No live provider auth/env exists in the current shell.
- No Cloudflare/GitHub/Supabase synthetic secret was set, rotated, deleted, or
  confirmed absent in a live provider.
- The Sprint 0.4 Provider secret stores live checkbox remains incomplete.

## Verification

- `npm run check:provider-secret-stores-live-readiness`
- `node --check scripts/smoke-provider-secret-stores-live.mjs`
- `node scripts/smoke-provider-secret-stores-live.mjs --dry-run`
- `npm run check:secrets`
