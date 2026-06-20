# Supabase Migrations

This directory stores repo-local SQL migrations for the planned Supabase
Postgres database. Values, project IDs, database URLs, and credentials are not
stored here.

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
