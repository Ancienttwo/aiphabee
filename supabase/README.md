# Supabase Migrations

This directory stores repo-local SQL migrations for the planned dedicated
AiphaBee Supabase Postgres database. Values, project IDs, database URLs, and
credentials are not stored here.

## Project Boundary

AiphaBee uses its own Supabase organization/project boundary. Do not point these
migrations, `HYPERDRIVE_DATABASE_URL`, or `AIPHABEE_HYPERDRIVE` at AIMPACT,
Salesko, or any shared sibling-product Supabase project.

Reason: AiphaBee will carry IPO, HK F10, security master, financial facts,
serving, lineage, and usage-ledger data. It must remain independently movable
when data volume, plan, PITR, read-replica, or database-engine pressure requires
a migration.

## Commands

Use these only after a local or approved remote database target exists:

```bash
supabase migration new <name>
supabase migration up --local
supabase db push --dry-run --db-url "$HYPERDRIVE_DATABASE_URL"
supabase db push --db-url "$HYPERDRIVE_DATABASE_URL"
```

`HYPERDRIVE_DATABASE_URL` and
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_AIPHABEE_HYPERDRIVE` are
names-only secret variables in `deploy/env/env.schema.json`.

## Verification

```bash
npm run check:database
```
