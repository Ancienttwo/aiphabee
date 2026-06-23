# Platform Umbrella Schema Foundation

> Status: verified repo-local migration scaffold
> Last Updated: 2026-06-23
> Source Tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> Design Plan: `docs/supabase-umbrella-schema-plan.md`

This slice turns the standalone umbrella schema plan into the first repo-local
Supabase migration. It does not apply SQL to a live database, move product data,
or expose product-owned schemas through Supabase Data API.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Design plan | `docs/supabase-umbrella-schema-plan.md` | Shared platform/product-owned schema decision |
| Migration | `supabase/migrations/20260623010000_platform_umbrella_schema_foundation.sql` | Creates empty umbrella platform tables, indexes, helper functions, RLS policies, and product registry seed rows |
| Manifest | `deploy/database/migrations.contract.json` | Registers schemas, tables, indexes, and RLS tables for `npm run check:database` |
| Checker | `scripts/check-database-migrations-contract.mjs` | Verifies migration coverage plus declared `indexes` and `rls_tables` |
| Product-owned schemas | Not created here | AiphaBee/AIMPACT/Salesko business tables stay outside this foundation slice |
| Live database | Not touched | No Supabase project link, DB URL, Hyperdrive ID, or remote dry-run is committed or executed |

Created schemas:

- `platform`
- `platform_audit`

Created tables:

- `platform.product`
- `platform.product_environment`
- `platform.account`
- `platform.workspace`
- `platform.workspace_membership`
- `platform.workspace_product_access`
- `platform.entitlement_policy`
- `platform.workspace_entitlement`
- `platform_audit.product_access_event`

## P2 Concrete Trace

The intended read path is:

1. Supabase Auth provides `auth.uid()` for an authenticated user.
2. `platform.current_account_id()` resolves the active platform account row.
3. `platform.is_workspace_member(workspace_id)` checks active workspace
   membership through the normal invoker/RLS path.
4. Workspace-scoped RLS policies use that helper for `workspace`,
   `workspace_product_access`, and `workspace_entitlement` reads.
5. Product access rows bind a workspace to `product_id`, `policy_version`, and
   validity windows before a product-owned runtime reads its own schema.

The migration intentionally keeps server-side service-role paths out of scope:
runtime code must still pass explicit product/workspace/tenant filters because
service-role access can bypass RLS.

## P3 Design Decision

The smallest coherent first migration is the shared `platform` foundation, not
an AiphaBee product-table rename.

Reason:

- Existing AiphaBee scaffolds already use `core/governance/audit`; renaming them
  now would mix a platform boundary decision with product data migration.
- AIMPACT and Salesko have their own storage/runtime boundaries; a shared
  Supabase project should start with product registry, workspace membership, and
  product access control.
- RLS and index verification must be contract-backed before any product-owned
  schema is exposed.

Tradeoff:

- The platform registry now has seed product codes for `aiphabee`, `aimpact`,
  and `salesko`.
- No workspace/product access rows are seeded, so the migration creates the
  boundary but does not grant any user data access.

## Verification

Passed:

```bash
npm run check:database
```

Observed result:

```json
{
  "migrations": 64,
  "provider": "supabase_postgres",
  "status": "ok"
}
```

The checker now validates declared migration indexes and RLS tables. This
foundation migration declares both, so the database contract proves:

- every listed platform table exists in SQL;
- every listed FK/RLS index exists as `create index if not exists`;
- every listed RLS table has both `enable row level security` and `force row
  level security`.

## Residual Gaps

- No remote `supabase db push --dry-run` was executed.
- No live Supabase/Hyperdrive `SELECT 1` evidence was produced.
- Product-owned schemas such as `aiphabee_core`, `aimpact_core`, and
  `salesko_core` are not created in this slice.
- Existing AiphaBee `core/governance/audit` scaffold migrations remain in place
  until a later compatibility or rename migration is explicitly planned.
