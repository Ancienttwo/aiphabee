# PlanetScale Remote Apply

> Status: direct apply blocked; Hyperdrive-origin schema apply completed
> Last Updated: 2026-06-26
> Contract: `deploy/database/planetscale-remote-apply.contract.json`

This slice applies the locked SQL packet to the dedicated PlanetScale database
only after the direct smoke, local dry-run, and apply-packet hash gates pass.
The default package script is a no-network preflight. The write path requires
the explicit `--execute --use-keychain` route behind `npm run
database:planetscale:apply`.

The direct route remains useful as a guard and diagnostic surface. The actual
2026-06-25 production bootstrap used a temporary `_ops/hyperdrive-apply-worker`
preview Worker because the Cloudflare-managed Hyperdrive origin credential had
`CREATE` privilege while the local direct credential did not.

## P1 Architecture Map

| Surface | Authority | Boundary |
|---|---|---|
| Migration inventory | `deploy/database/migrations.contract.json` | Lists the 66 SQL files in apply order |
| Apply packet | `deploy/database/apply-packet.contract.json` | Locks file count, byte size, and aggregate hash |
| Direct target | `deploy/database/planetscale-direct-preflight.contract.json` | Confirms direct apply user and Keychain route |
| Remote apply contract | `deploy/database/planetscale-remote-apply.contract.json` | Defines write guard, allowed pre-existing tables, and safe-output policy |
| Direct runner | `scripts/apply-planetscale-migrations.mjs` | Runs inventory or direct single-transaction apply through `psql` |
| Hyperdrive bootstrap runner | `_ops/hyperdrive-apply-worker` | Temporary local ops Worker; removed from remote preview after apply |

Out of scope:

- Loading source market data.
- Renaming `supabase/migrations`.
- Writing direct passwords or database URLs to repo files.

## P2 Concrete Trace

1. `npm run check:planetscale-remote-apply` validates the contract, package
   wiring, direct target, and packet hash locally without network access.
2. `node scripts/apply-planetscale-migrations.mjs --inventory --use-keychain`
   reads the direct password from macOS Keychain and lists non-system remote
   tables.
3. The runner allows only PlanetScale provider helper tables before apply:
   `pscale_extensions.hypopg_hidden_indexes` and
   `pscale_extensions.hypopg_list_indexes`.
4. The runner verifies `has_database_privilege(current_user,
   current_database(), 'CREATE')` before running schema DDL.
5. `npm run database:planetscale:apply` runs all 66 SQL files through `psql
   --single-transaction --set ON_ERROR_STOP=1`.
6. The output records only counts and hashes.
7. When the direct route lacks `CREATE`, `_ops/hyperdrive-apply-worker` can run
   the same packet through the Hyperdrive origin credential in a remote preview
   session with a one-time token.

## P3 Design Decision

The remote apply runner is deliberately explicit because it writes a production
database. The invariant is that remote apply uses the same packet hash that
passed the local dry-run. The existing PlanetScale helper tables are allowed so
a newly provisioned PlanetScale database is not mistaken for a dirty AiphaBee
database.

At 10x scale, this runner is still only a bootstrap path. Large future DDL,
backfills, and index operations should become separate forward-only migrations
with their own lock and rollback notes.

## Current Readback

Current no-network remote-apply guard:

```json
{
  "migration_count": 66,
  "packet_hash": "sha256:12962e56e3d436227adf4d857c77e62a22730e62407323b3adb417e352ee1523",
  "status": "ready_for_guarded_remote_apply"
}
```

Verified on 2026-06-25T16:50:55Z:

```json
{
  "allowed_existing_tables": 2,
  "database_create_privilege": false,
  "disallowed_existing_tables": [],
  "status": "remote_inventory_blocked",
  "tables": 2
}
```

The direct runner stopped before running any migration SQL with
`remote_apply_permission_missing`. The earlier direct single-transaction apply
attempt failed on the first `create schema` statement, so it did not leave
partial AiphaBee objects behind.

The Hyperdrive-origin bootstrap then succeeded with the then-locked packet. The
canonical migration file later folded the RLS/session-claim patch back into the
local SQL inventory, so the current guard hash above is newer than this
historical bootstrap hash.

```json
{
  "migrations_applied": 66,
  "packet_hash": "sha256:92047c671809c1772648030a10ae3d4e26048f09c2e9bc9b99f00a22b75373c8",
  "schemas": 6,
  "status": "ok",
  "tables": 227
}
```

Post-apply application smoke passed through Hyperdrive:

```json
{
  "deleted_rows": 2,
  "inserted_rows": 2,
  "selected_rows": 1,
  "status": "passed",
  "tables": ["core.evidence_record", "core.evidence_source_ref"]
}
```

Production deployed Worker readback also passed. The latest runtime-safe
readback version is `0ab3f7d0-517e-4fa3-91b7-1ccc92e90a88`:

```json
{
  "database_runtime_provider": "planetscale_postgres",
  "database_runtime_default_hash": "sha256:7e71121a405ef075762cc87db8236df2525874f2f62f4a7e6cd65d083b9c81e4",
  "hyperdrive_response_hash": "sha256:39701a96a519ffc42069ee0a4dca588180b0cacf164354f819609febd4bbb1c1",
  "hyperdrive_schema_inventory_hash": "sha256:d22fe1501e284fab169d8e051d98201687d950c5b2367aee119471c838c2e881",
  "platform_product_aiphabee_present": true,
  "runtime_hyperdrive_config": "2ddc2108d072420c9263ff6923b4f2c3",
  "runtime_role_ready": true,
  "status": "ok",
  "worker_url": "https://aiphabee-worker.metalabs.workers.dev"
}
```

The platform RLS follow-up also passed through the Hyperdrive-origin bootstrap
runner and deployed Worker:

```json
{
  "function_patch_packet_hash": "sha256:240861073f6958235159f5b2bf0fbc36766638ae177d24f01100e78ac6758fb9",
  "runtime_role_active_for_selects": true,
  "runtime_role_bypassrls": false,
  "runtime_role_helper_response_hash": "sha256:e60b560fadeae069e2ca670c71c0098766221075e7162259b339bb709cc3a48c",
  "runtime_role_helper_status": "passed_runtime_role_transaction_helper",
  "runtime_role_patch_packet_hash": "sha256:4405e504180008be589fbd15e2d0f84819daf10c9ab120b8d3ac33a402fef907",
  "runtime_role_superuser": false,
  "smoke_response_hash": "sha256:b634572a91f84023bf1e625a268db330ea4d9e96f30d6b0981d6e037182000bf",
  "status": "passed_runtime_role_enforced",
  "workspace_with_claim_rows": 1,
  "workspace_with_wrong_claim_rows": 0,
  "workspace_without_claim_rows": 0
}
```
