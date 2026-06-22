# Task Contract: provider-secret-stores-live-smoke-readiness

Tracker item: Sprint 0.4 `Provider secret stores provisioned + rotation/revocation smoke（Cloudflare/GitHub/Supabase）`

## Scope

- Add a no-secret live smoke readiness contract for Cloudflare Workers, GitHub
  Actions environment secrets, and Supabase project secrets.
- Add a live smoke script that performs synthetic set/list/rotate/delete and
  confirm-absent operations when explicit provider env/auth is present.
- Add a no-network checker and include it in `npm run check`.
- Do not mark the tracker item complete until a real live smoke passes.

## Verification

- `npm run check:provider-secret-stores-live-readiness`
- `node scripts/smoke-provider-secret-stores-live.mjs --dry-run`
- `node --check scripts/smoke-provider-secret-stores-live.mjs`
- `npm run check:secrets`
- `npm run check`

## Non-Claims

- No production secret values are committed or emitted.
- No production secret rotation is claimed.
- No live smoke pass is claimed in this slice.
