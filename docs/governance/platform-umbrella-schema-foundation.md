# Platform Umbrella Schema Foundation

> Status: verified repo-local migration scaffold; staging and production runtime Hyperdrive bindings read back through non-bypass runtime roles; idempotent RLS policy guards are local-contract only
> Last Updated: 2026-06-28
> Source Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Design Plan: `docs/supabase-umbrella-schema-plan.md`
> Active Boundary: `docs/governance/aiphabee-planetscale-boundary.md`

This slice originally turned the standalone umbrella schema plan into the first
repo-local Postgres migration. The shared Supabase topology and later dedicated
Supabase project boundary are now superseded: AiphaBee production uses
PlanetScale Postgres behind Cloudflare Hyperdrive. The migration is retained as
an AiphaBee-local platform scaffold and does not apply SQL to a live database,
move product data, or expose product-owned schemas through a browser-accessible
Data API.

Staging now deliberately uses the shared platform umbrella database surface via
the `env.staging.hyperdrive` binding in `apps/worker/wrangler.jsonc`. That is a
non-production integration boundary for sibling projects; it does not change the
production database ownership decision.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Design plan | `docs/supabase-umbrella-schema-plan.md` | Historical shared platform/product-owned schema decision; superseded for live topology |
| Active boundary | `docs/governance/aiphabee-planetscale-boundary.md` | Dedicated AiphaBee production database plus shared staging umbrella database behind Cloudflare Hyperdrive |
| Staging Worker binding | `apps/worker/wrangler.jsonc` `env.staging.hyperdrive` | Uses AiphaBee runtime Hyperdrive config `755ab0a9b0404e10be1f8ab1c736358a`; keeps shared config `1e83eb563db44746a168175e065cc958` as `HYPERDRIVE` alias |
| Migration | `supabase/migrations/20260623010000_platform_umbrella_schema_foundation.sql` | Creates empty platform tables, indexes, helper functions, idempotently guarded RLS policies, and a non-overwriting AiphaBee registry seed row |
| Manifest | `deploy/database/migrations.contract.json` | Registers schemas, tables, indexes, and RLS tables for `npm run check:database` |
| Checker | `scripts/check-database-migrations-contract.mjs` | Verifies migration coverage, declared `indexes`, `rls_tables`, and the `aiphabee.account_id` RLS session claim |
| Product-owned schemas | Not created here | AiphaBee business tables stay outside this foundation slice; selected existing AiphaBee identity/entitlement tables are RLS-hardened after their own scaffold migrations |
| Staging live database | Applied | The shared staging DB now has `platform` / `platform_audit` through Hyperdrive config `1e83eb563db44746a168175e065cc958` |
| Production live database | Bootstrapped and runtime-bound | Production remains dedicated to AiphaBee; Worker runtime now uses Hyperdrive config `2ddc2108d072420c9263ff6923b4f2c3` with `aiphabee_runtime_rls.bpvsmvgwkutr` |

Created schemas:

- `platform`
- `platform_audit`

Created tables:

- `platform.product`
- `platform.product_environment`
- `platform.account`
- `platform.workspace`
- `platform.workspace_membership`
- `platform.subscription_plan`
- `platform.workspace_subscription`
- `platform.workspace_product_access`
- `platform.entitlement_policy`
- `platform.workspace_entitlement`
- `platform_audit.product_access_event`

## P2 Concrete Trace

The intended read path is:

1. Worker/Better Auth resolves the request identity to an AiphaBee
   `platform.account.account_id`.
2. Runtime code must set `SET LOCAL aiphabee.account_id = '<account_id>'`
   inside the database transaction before workspace-scoped reads.
3. `platform.current_account_id()` reads that transaction-local setting with
   `current_setting('aiphabee.account_id', true)` and confirms the account is
   active.
4. `platform.is_workspace_member(workspace_id)` checks active workspace
   membership through the normal invoker/RLS path.
5. Workspace-scoped RLS policies use that helper for `workspace`,
   `workspace_product_access`, and `workspace_entitlement` reads.
6. Product access rows bind a workspace to `product_id`, `policy_version`, and
   validity windows before a product-owned runtime reads its own schema.

If the transaction-local account claim is absent, `platform.current_account_id()`
returns no account and workspace-scoped RLS reads remain denied. The migration
intentionally keeps service-admin write paths out of scope; runtime code must
still pass explicit product/workspace/tenant filters.

## P3 Design Decision

The smallest coherent first migration is the local AiphaBee `platform`
foundation, not an AiphaBee product-table rename or a production cross-product
shared DB.

Reason:

- Existing AiphaBee scaffolds already use `core/governance/audit`; renaming them
  now would mix a platform boundary decision with product data migration.
- AIMPACT and Salesko have their own production storage/runtime boundaries and
  must not share AiphaBee's production PlanetScale database.
- Staging can use the shared umbrella database because the purpose is
  integration compatibility, not durable product ownership.
- RLS, the app-owned session claim, and index verification must be
  contract-backed before any product-owned schema is exposed.

Tradeoff:

- The platform registry migration still seeds only `aiphabee`; sibling-product
  staging rows are owned by their own repos or operator apply packets. The seed
  uses `on conflict (product_code) do nothing` so replay does not reset live
  AiphaBee product metadata.
- No workspace/product access rows are seeded, so the migration creates the
  boundary but does not grant any user data access.

## Verification

Passed:

```bash
npm run check:database
npm run check:database-apply-packet
npm run check:database-local-dry-run
npm run typecheck --workspace @aiphabee/worker
npx vitest run apps/worker/src/index.test.ts -t "Hyperdrive schema inventory"
npx wrangler types --check --config=apps/worker/wrangler.jsonc apps/worker/src/worker-configuration.d.ts
npx wrangler deploy --dry-run --env staging --config apps/worker/wrangler.jsonc
npx wrangler deploy --env staging --config apps/worker/wrangler.jsonc
curl -sS -X POST https://aiphabee-worker-staging.metalabs.workers.dev/cloudflare/hyperdrive/schema-inventory -H 'x-aiphabee-smoke: cloudflare-bindings-runtime-v1'
curl -sS -X POST https://aiphabee-worker-staging.metalabs.workers.dev/cloudflare/hyperdrive/platform-rls-fixture-smoke -H 'x-aiphabee-smoke: cloudflare-bindings-runtime-v1'
curl -sS -X POST https://aiphabee-worker-staging.metalabs.workers.dev/cloudflare/hyperdrive/platform-runtime-role-smoke -H 'x-aiphabee-smoke: cloudflare-bindings-runtime-v1'
npx wrangler deploy --dry-run --env="" --config apps/worker/wrangler.jsonc
npx wrangler deploy --env="" --config apps/worker/wrangler.jsonc
curl -sS -X POST https://aiphabee-worker.metalabs.workers.dev/cloudflare/hyperdrive/platform-runtime-role-smoke -H 'x-aiphabee-smoke: cloudflare-bindings-runtime-v1'
curl -sS -X POST https://aiphabee-worker.metalabs.workers.dev/cloudflare/hyperdrive/schema-inventory -H 'x-aiphabee-smoke: cloudflare-bindings-runtime-v1'
curl -sS -X POST https://aiphabee-worker.metalabs.workers.dev/cloudflare/hyperdrive/smoke -H 'x-aiphabee-smoke: cloudflare-bindings-runtime-v1'
```

Observed result:

```json
{
  "database_create_privilege": true,
  "expected_index_count": 12,
  "expected_rls_table_count": 9,
  "expected_schema_count": 2,
  "expected_table_count": 9,
  "missing_indexes": [],
  "missing_rls_tables": [],
  "missing_schemas": [],
  "missing_tables": [],
  "observed_index_count": 12,
  "observed_rls_table_count": 9,
  "observed_schema_count": 2,
  "observed_table_count": 9,
  "platform_product_aiphabee_present": true,
  "response_hash": "sha256:427fd932a849a883788a584e87ae88a61492d6003b6b1ab5ca03fe0dc7416b31",
  "status": "passed",
  "surface": "platform_umbrella_schema_inventory"
}
```

RLS fixture readback:

```json
{
  "cleanup_rolled_back": true,
  "current_role_bypassrls": true,
  "current_role_superuser": false,
  "fixture_policy_count": 6,
  "fixture_role_created": true,
  "inserted_rows": 6,
  "response_hash": "sha256:5d33c14a209c582ba813aa7282ccfd33039cb2f45dd05b58fca8aba4218b5a1f",
  "status": "passed",
  "surface": "platform_umbrella_rls_fixture_smoke",
  "workspace_entitlement_with_claim_rows": 1,
  "workspace_membership_with_claim_rows": 1,
  "workspace_product_access_with_claim_rows": 1,
  "workspace_with_claim_rows": 1,
  "workspace_without_claim_rows": 0,
  "workspace_with_wrong_claim_rows": 0
}
```

Runtime role gate readback:

```json
{
  "database_create_privilege": false,
  "platform_account_select_privilege": true,
  "platform_schema_create_privilege": false,
  "platform_schema_usage_privilege": true,
  "platform_workspace_rls_forced": true,
  "platform_workspace_select_privilege": true,
  "response_hash": "sha256:41bc8f133a9724827d7541560e5b2c127ebf0410ac0ed4359e19e7ad721461d3",
  "runtime_role_ready": true,
  "status": "passed",
  "surface": "platform_runtime_role_smoke",
  "workspace_table_owner_is_current_user": false
}
```

Production runtime role gate readback:

```json
{
  "current_role_bypassrls": false,
  "current_role_superuser": false,
  "database_create_privilege": false,
  "platform_account_select_privilege": true,
  "platform_schema_create_privilege": false,
  "platform_schema_usage_privilege": true,
  "platform_workspace_rls_forced": true,
  "platform_workspace_select_privilege": true,
  "response_hash": "sha256:6193531f7ab4a6f0f5dfbbe34fca5590750d884b0179cadaccf149792cc21a03",
  "runtime_role_ready": true,
  "status": "passed",
  "surface": "platform_runtime_role_smoke",
  "workspace_table_owner_is_current_user": false
}
```

Production schema inventory after runtime rebind:

```json
{
  "database_create_privilege": false,
  "expected_index_count": 12,
  "expected_rls_table_count": 9,
  "expected_schema_count": 2,
  "expected_table_count": 9,
  "missing_indexes": [],
  "missing_rls_tables": [],
  "missing_schemas": [],
  "missing_tables": [],
  "observed_index_count": 12,
  "observed_rls_table_count": 9,
  "observed_schema_count": 2,
  "observed_table_count": 9,
  "platform_product_aiphabee_present": true,
  "response_hash": "sha256:d22fe1501e284fab169d8e051d98201687d950c5b2367aee119471c838c2e881",
  "status": "passed",
  "surface": "platform_umbrella_schema_inventory"
}
```

The checker now validates declared migration indexes and RLS tables. This
foundation migration declares both, so the database contract proves:

- every listed platform table exists in SQL;
- every listed FK/RLS index exists as `create index if not exists`;
- every listed RLS table has both `enable row level security` and `force row
  level security`;
- the platform RLS helper reads `current_setting('aiphabee.account_id', true)`;
- migration SQL does not depend on `auth.uid()`, `TO authenticated`, or
  `supabase_*` identifiers.
- the two long umbrella index identifiers are normalized to PostgreSQL's actual
  63-byte names before contract and live `pg_indexes` verification.
- the staging RLS fixture smoke validates policy behavior under a transaction
  local low-privilege role because the Hyperdrive origin role itself has
  `rolbypassrls=true`.
- the staging runtime role gate now passes through a dedicated AiphaBee
  Hyperdrive config (`755ab0a9b0404e10be1f8ab1c736358a`) whose actual login is
  non-bypass, non-owner, has no database/schema `CREATE`, and retains platform
  read privileges.
- the production runtime role gate now passes through dedicated Hyperdrive
  config `2ddc2108d072420c9263ff6923b4f2c3`, whose actual login is
  non-bypass, non-owner, has no database/schema `CREATE`, and retains platform
  read privileges.

## Replay/Apply Safety

This branch keeps the migration additive under the current PlanetScale/Hyperdrive
boundary:

- **Policies are presence-guarded.** PostgreSQL has no `create policy if not
  exists`, so each read policy is wrapped in a `pg_policies` presence check
  before creation. The guard is non-destructive and avoids `drop policy` /
  recreate churn during local dry-runs or operator apply validation.
- **Product seed does not overwrite.** The migration still seeds only
  `aiphabee`, and the seed uses `on conflict (product_code) do nothing`.
  AIMPACT/Salesko rows are not inserted by this repo.
- **No Supabase browser-role dependency.** The SQL stays on the
  `aiphabee.account_id` transaction-local claim. It does not use `auth.uid()`,
  `TO authenticated`, `supabase_*` identifiers, browser-role grants, or
  service-role bypass policies.

## Residual Gaps

- The idempotent RLS guard changes in this branch have not been live-applied or
  live-read back; the live readbacks above are the last deployed baseline, not
  proof that this branch has reached staging or production.
- Product-owned table RLS hardening assumes earlier `aiphabee_core` /
  `aiphabee_governance` scaffold migrations have already run in timestamp order.
- Product-owned schemas such as `aiphabee_core` are not created in this slice.
- Existing AiphaBee `core/governance/audit` scaffold migrations remain in place
  until a later compatibility or rename migration is explicitly planned.
- AIMPACT/Salesko production integration, if needed, must use APIs or explicit
  federation rather than shared database tables.
- Elevated Hyperdrive origins remain only as guarded apply/admin surfaces; they
  are not the Worker runtime binding for staging or production.
