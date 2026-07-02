# Postgres Hyperdrive Migration Scaffold

> **Status**: Verified repo-local migration scaffold
> **Last Updated**: 2026-06-22 08:05 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-postgres-hyperdrive-migration-scaffold.md`
> **Task Contract**: `tasks/contracts/postgres-hyperdrive-migration-scaffold.contract.md`

This slice creates the repo-local migration tooling for the future Supabase
Postgres database reached through Cloudflare Hyperdrive. It has since been
extended by `docs/governance/security-master-raw-snapshot-scaffold.md`,
`docs/governance/financial-facts-restatement-scaffold.md`,
`docs/governance/corporate-action-adjustment-scaffold.md`,
`docs/governance/account-workspace-entitlement-scaffold.md`,
`docs/governance/usage-ledger-scaffold.md`, and
`docs/governance/serving-store-schema-scaffold.md` with empty Sprint 1.1
security-master/raw-snapshot, financial-fact, corporate-action,
account/workspace entitlement, usage-ledger, and Serving Store schemas. It does
not provision a database, add a real Hyperdrive binding ID, or run remote DDL.

References checked:

- [Cloudflare Wrangler Hyperdrive config](https://developers.cloudflare.com/workers/wrangler/configuration/#hyperdrive):
  Hyperdrive bindings require a binding name and real configuration `id`.
- [Cloudflare Hyperdrive local development update](https://developers.cloudflare.com/changelog/post/2025-12-04-hyperdrive-remote-database-local-dev/):
  local dev can use `localConnectionString` or
  `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING_NAME>`.
- The repo-local migration inventory is plain Postgres SQL under
  `deploy/database/migrations`; remote apply is guarded by the PlanetScale
  packet and direct-preflight contracts.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Migration directory | `deploy/database/migrations` | Postgres-compatible SQL file naming; no live Supabase project link |
| First migration | `20260620071000_phase0_foundation.sql` | Creates `audit`, `core`, `governance` schemas and default-deny governance tables only |
| Security master scaffold | `20260620082000_security_master_raw_snapshot_scaffold.sql` | Creates empty security master, raw snapshot, and data-version tables without loading market data |
| Financial facts scaffold | `20260620083000_financial_facts_restatement_scaffold.sql` | Creates empty financial statement, fact, and restatement tables without loading market data |
| Corporate action scaffold | `20260620084000_corporate_action_adjustment_scaffold.sql` | Creates empty corporate action, adjustment methodology, and factor tables without loading market data |
| Account workspace scaffold | `20260620085000_account_workspace_entitlement_scaffold.sql` | Creates empty account, workspace, subscription, and entitlement tables without loading market data |
| Usage ledger scaffold | `20260620090000_usage_ledger_scaffold.sql` | Creates empty usage event, weighted credit, ledger, and reconciliation tables without loading market data |
| Serving Store scaffold | `20260620091000_serving_store_scaffold.sql` | Creates empty versioned Serving projection tables without enabling live reads |
| Database manifest | `deploy/database/migrations.contract.json` | Declares provider, Hyperdrive path, commands, migration inventory, and no-secret resource status |
| Validator | `scripts/check-database-migrations-contract.mjs` | Checks manifest shape, migration file coverage, no destructive SQL, and no committed URLs/secrets |
| Env names | `deploy/env/env.schema.json` | Adds Hyperdrive local connection env name with blank values in every template |
| Worker route | `GET /database/runtime` | Reports `supabase_postgres`, `cloudflare_hyperdrive`, planned binding, and `live_queries=false` |
| Hyperdrive smoke route | `POST /cloudflare/hyperdrive/smoke` | Guarded by smoke header; uses `pg` + Hyperdrive binding for future read-only `SELECT 1` only |
| Live database | Absent | No Supabase project, Hyperdrive ID, DB URL, remote migration, or live `SELECT 1` pass is committed or executed |

## P2 Concrete Trace

Migration validation trace:

1. `npm run check:database` runs
   `scripts/check-database-migrations-contract.mjs`.
2. The script reads `deploy/database/migrations.contract.json`.
3. It confirms:
   - provider is `supabase_postgres`;
   - connection path is `cloudflare_hyperdrive`;
   - Hyperdrive binding is `AIPHABEE_HYPERDRIVE`;
   - migration files listed in the manifest match `deploy/database/migrations/*.sql`;
   - SQL contains required schemas/tables and `default_deny`;
   - SQL and manifest do not include database URLs, passwords, tokens, secret
     values, or destructive statements.
4. It returns `status=ok`.

Runtime capability trace:

1. `GET /database/runtime` enters the Hono Worker.
2. Worker returns a standard success envelope with:
   - `provider=supabase_postgres`;
   - `connection_path=cloudflare_hyperdrive`;
   - `hyperdrive.binding_name=AIPHABEE_HYPERDRIVE`;
   - `hyperdrive.status=planned`;
   - `live_queries=false`;
   - `market_data_surfaces=false`;
   - `migration_directory=deploy/database/migrations`.
3. No database query is executed by this product runtime route; the `pg` driver
   is only wired behind guarded `POST /cloudflare/hyperdrive/smoke`.

## P3 Design Decision

Selected a repo-local migration scaffold instead of a live database connection.

Reason:

- Cloudflare Hyperdrive Wrangler config requires a real resource `id`; committing
  a placeholder ID would make local runtime behavior misleading.
- Supabase remote migration commands require a database URL or linked project;
  neither is present in repo-local, no-secret state.
- Gate 0 still blocks market-data exposure, so the only schema added here is
  non-market-data governance scaffolding with default-deny channel status.

Tradeoff:

- This completes the Sprint 0.4 migration-toolchain scaffold leaf and now
  supports the Sprint 1.1 schema scaffold inventory.
- It does not complete live Hyperdrive provisioning, remote migration dry-run,
  live `SELECT 1` pass, partner data loading, ingestion, or Serving Gateway
  behavior.

## Verification

Passed:

- `npm run check:database`
- `npm run check:env`
- `npm run test`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /database/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/database/runtime` response fields:

```json
{
  "connection_path": "cloudflare_hyperdrive",
  "hyperdrive": {
    "binding_configured": false,
    "binding_name": "AIPHABEE_HYPERDRIVE",
    "status": "planned"
  },
  "live_queries": false,
  "market_data_surfaces": false,
  "migration_directory": "deploy/database/migrations",
  "provider": "supabase_postgres"
}
```

## Residual Gaps

- Supabase project provisioning is retired; the active runtime uses PlanetScale
  Postgres through Cloudflare Hyperdrive.
- Remote apply is guarded by `npm run check:planetscale-remote-apply` and
  `npm run database:planetscale:apply`.
- Hyperdrive guarded route/harness exists, and the live pass is tracked through
  PlanetScale/Hyperdrive evidence.
- Partner data loading, Serving Gateway live reads, field entitlement live DB
  policy source, and live usage writes remain future Sprint 1.1 work; data,
  account/workspace entitlement, usage-ledger, and Serving Store schemas are
  scaffolded but not live.
