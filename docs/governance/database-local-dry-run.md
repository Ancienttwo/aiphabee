# Database Local Dry Run

> Status: verified local Postgres migration dry-run
> Last Updated: 2026-06-26
> Contract: `deploy/database/local-dry-run.contract.json`

This slice adds a local migration dry-run that does not require PlanetScale
credentials. It starts a temporary local Postgres cluster, applies the current
SQL inventory in order, reports counts, then removes the cluster.

## P1 Architecture Map

| Surface | Authority | Boundary |
|---|---|---|
| Migration contract | `deploy/database/migrations.contract.json` | Lists the 66 SQL files and active PlanetScale provider boundary |
| SQL inventory | `supabase/migrations/*` | Historical directory name retained; files are Postgres SQL inventory |
| Local dry-run contract | `deploy/database/local-dry-run.contract.json` | Declares temp-cluster behavior and pass conditions |
| Checker | `scripts/check-database-local-dry-run.mjs` | Owns temp Postgres lifecycle, migration apply order, cleanup, and count output |
| Package script | `npm run check:database-local-dry-run` | Explicit local check; not part of root `npm run check` because it requires local Postgres server binaries |

Out of scope:

- Direct PlanetScale `SELECT 1`.
- Remote schema apply or data migration.
- Proving PlanetScale-specific behavior beyond ordinary Postgres syntax/apply
  compatibility.
- Renaming `supabase/migrations`.

## P2 Concrete Trace

1. The checker reads `deploy/database/migrations.contract.json`.
2. It confirms the listed files match `supabase/migrations/*.sql`.
3. It creates a temp directory under `/tmp`.
4. It runs `initdb` with trust auth and starts `postgres` through `pg_ctl` with
   Unix-socket-only local access.
5. It creates a disposable `aiphabee_dry_run` database.
6. It applies every migration in ascending filename order using `psql
   ON_ERROR_STOP=1`.
7. It reports migration/schema/table counts.
8. It stops Postgres and removes the temp cluster.

Current observed result:

```json
{
  "migrations_applied": 66,
  "schemas": 6,
  "status": "ok",
  "tables": 225
}
```

## P3 Design Decision

This does not replace direct PlanetScale smoke. It removes one class of delay:
while the real direct password is still blocked, the repo can still prove that
the SQL inventory is internally ordered and executable on ordinary Postgres.

At 10x scale, this check would fail first on long-running DDL, data volume, or
PlanetScale-specific engine behavior. Those remain direct-apply concerns after
credentials are fixed.
