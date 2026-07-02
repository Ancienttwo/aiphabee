# Database Migrations

This directory stores repo-local SQL migrations for the dedicated AiphaBee
PlanetScale Postgres database reached through Cloudflare Hyperdrive. Values,
project IDs, database URLs, and credentials are not stored here.

## Project Boundary

AiphaBee uses its own PlanetScale database boundary. Do not point these
migrations, `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_AIPHABEE_HYPERDRIVE`,
or `AIPHABEE_HYPERDRIVE` at AIMPACT, Salesko, or any shared sibling-product
database.

Reason: AiphaBee will carry IPO, HK F10, security master, financial facts,
serving, lineage, and usage-ledger data. It must remain independently movable
when data volume, plan, PITR, read-replica, or database-engine pressure requires
another move.

## Commands

Use these only after a local or approved remote database target exists:

```bash
npm run check:database
npm run check:database-local-dry-run
npm run check:database-apply-packet
npm run check:planetscale-remote-apply
```

`HYPERDRIVE_DATABASE_URL` and
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_AIPHABEE_HYPERDRIVE` are
names-only secret variables in `deploy/env/env.schema.json`.

## Verification

```bash
npm run check:database
```
