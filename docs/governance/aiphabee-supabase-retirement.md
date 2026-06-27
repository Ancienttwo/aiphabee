# AiphaBee Supabase Retirement Packet

> Status: project_removed_without_cold_backup
> Last Updated: 2026-06-27
> Contract: `deploy/database/supabase-retirement.contract.json`

This packet retires Supabase from the active AiphaBee runtime and provider-secret
contracts. It does not authorize deleting the Supabase project:
`delete_allowed=false`. Current readback shows the Supabase resource has already
been removed or is no longer accessible, while no cold backup artifact was
created.

## P1 Architecture Map

| Surface | Current State | Authority |
|---|---|---|
| Production database runtime | PlanetScale Postgres through Cloudflare Hyperdrive | `deploy/database/migrations.contract.json`, `apps/worker/wrangler.jsonc` |
| Production Hyperdrive binding | `AIPHABEE_HYPERDRIVE` -> `2ddc2108d072420c9263ff6923b4f2c3` | Cloudflare readback and `apps/worker/wrangler.jsonc` |
| Supabase project | Removed or no longer accessible | `npx supabase projects list --output json`, `npx supabase projects api-keys --project-ref kuudopqqtddiqtnwdhuf --output json` |
| Secret-store providers | Cloudflare Workers and GitHub Actions only | `deploy/secrets/stores.contract.json` |
| Local rollback metadata | Superseded env files under ignored `_ops/env/superseded/` | local ops state, not git |
| Cold backup | Not obtained before removal | `_ops/backups/supabase-retirement` contains only private readback metadata, not a restorable dump |

Out of scope:

- Authorizing deletion of the Supabase project.
- Treating `supabase/migrations/*` as a live Supabase dependency. It remains the
  historical Postgres-compatible SQL inventory until a later directory rename.
- Storing DB dumps, connection URLs, passwords, CLI dry-run output, or raw
  provider output in git.

## P2 Concrete Trace

1. `npm run check:database` returns `provider=planetscale_postgres` and
   `status=ok`.
2. `node scripts/check-planetscale-direct-preflight.mjs --smoke-select-1
   --use-keychain` returns `status=ok` and `row_count=1`.
3. `wrangler hyperdrive get 2ddc2108d072420c9263ff6923b4f2c3` shows the active
   production runtime config points to the PlanetScale host and
   `aiphabee_runtime_rls` origin user.
4. `npx supabase projects list --output json` no longer lists `aiphabee-prod`
   (`kuudopqqtddiqtnwdhuf`). It returned three other visible project refs.
5. Cold backup attempt `pg_dump_pooler_from_superseded_private_env` failed with
   safe reason `tenant_user_not_found`; stderr hash:
   `sha256:558a853f5b1ba951ce557b615e902ae2b0506892511b100e20213b0da0226496`.
6. Cold backup attempt `pg_dump_direct_from_superseded_private_env` failed with
   safe reason `direct_host_nxdomain`; stderr hash:
   `sha256:01f8d577de7f50b3e389f1b5e453294e3b6cde8ddb3b5b9ce27c6d4f6a4fc3b3`.
7. `supabase_cli_db_dump_dry_run` was discarded because the CLI prints raw
   connection environment to stdout; that output is not valid repo evidence.
8. `supabase_cli_db_dump_linked_with_password` timed out without producing an
   artifact; stderr hash:
   `sha256:174dba068f1b5c0996aabb6c6fd1a091c7034de4cdc519df5376264f14dd833b`.
9. `psql_private_url_select_1` failed across the superseded private URLs:
   pooler variants returned `tenant_user_not_found`, and the direct URL returned
   DNS or tenant resolution failure.
10. `npx supabase projects api-keys --project-ref kuudopqqtddiqtnwdhuf
   --output json` failed with safe reason `Resource has been removed`; stderr
   hash:
   `sha256:9e3ac566e6135dd29a4690a44ff6000777d50d242096f4cf0b97800ed754c103`.
11. Active runtime scan roots are `apps/` and `packages/`; the retirement checker
   rejects active `@supabase`, `SUPABASE_`, or `auth.uid()` references there.

## P3 Decision Rationale

The smallest coherent change is to record the project removal without upgrading
the deletion decision to success. The production path has already moved to
PlanetScale, but data destruction still has the stricter invariant: a restorable
cold backup or equivalent dashboard export should exist before the old project is
deleted. Current readback shows the old Supabase resource is already removed or
inaccessible, so that invariant was not satisfied.

The tradeoff is deliberate. The contract now treats this as an audit exception,
not a green delete gate. At 10x scale the first failure would not be TypeScript
routing; it would be losing a database backup or silently deleting the only copy
of old operational rows.

## Verification

- `npm run check:supabase-retirement-readiness`
- `npm run check:env`
- `npm run check:secrets`
- `npm run check:provider-secret-stores-live-readiness`
- `npm run check:live-smoke-external-env-preflight`
- `npm run check:live-smoke-evidence-ledger`
- `npm run check:live-smoke-capture-transition-review`

## Deletion Gate

Current gate state is failed for backup and passed for removal:

- `production_runtime_moved_to_planetscale`: passed
- `secret_store_contract_cleanup`: passed
- `active_runtime_connection_audit`: passed
- `cold_backup_manifest_present`: failed
- `supabase_project_removed`: passed
- `manual_supabase_project_delete`: externally_completed_or_removed

The next acceptable recovery action is to look for an out-of-band Supabase
dashboard backup, billing audit, or support export for `kuudopqqtddiqtnwdhuf`.
Only manifest hashes and safe row/table counts may be promoted to repo evidence.
