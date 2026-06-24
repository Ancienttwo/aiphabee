# AiphaBee Independent Supabase Boundary

> Status: accepted architecture boundary
> Last Updated: 2026-06-24
> Supersedes: `docs/supabase-umbrella-schema-plan.md` for live Supabase topology

This decision makes AiphaBee a dedicated Supabase deployment target. AiphaBee
must not share the same Supabase project, database URL, service-role path, or
Hyperdrive origin with AIMPACT, Salesko, or any other sibling product.

## P1 Architecture Map

| Surface | Decision | Boundary |
|---|---|---|
| Supabase organization | Dedicated AiphaBee organization preferred | Billing, IAM, audit, upgrade plan, and migration blast radius stay product-owned |
| Supabase project | Dedicated AiphaBee project required | `supabase/migrations` apply only to AiphaBee runtime data |
| Cloudflare binding | `AIPHABEE_HYPERDRIVE` | Points only to the AiphaBee database origin |
| Worker runtime | `GET /database/runtime` | Continues to report `supabase_postgres` via `cloudflare_hyperdrive` |
| Data domains | AiphaBee-owned | IPO, HK F10, security master, financial facts, serving store, lineage, usage ledger |
| Raw large objects | External object store | Raw documents, MDB dumps, PDFs, large HTML/JSON blobs stay outside Postgres where practical |
| AIMPACT/Salesko | External systems | Integration happens through APIs or explicit federation, never shared tables |

Authoritative repo surfaces:

- `deploy/database/migrations.contract.json`
- `supabase/README.md`
- `supabase/migrations/*`
- `docs/governance/postgres-hyperdrive-migration-scaffold.md`
- `docs/governance/serving-store-schema-scaffold.md`

Out of scope:

- Creating live Supabase or Cloudflare resources.
- Moving data from AIMPACT, Salesko, or any existing external database.
- Finalizing auth federation between products.

## P2 Concrete Trace

Future AiphaBee live data path:

1. AiphaBee operator provisions a dedicated Supabase organization/project.
2. The AiphaBee database URL is used to create the Cloudflare Hyperdrive config.
3. Worker binds that config as `AIPHABEE_HYPERDRIVE`.
4. `supabase db push --dry-run --db-url "$HYPERDRIVE_DATABASE_URL"` runs only
   against the AiphaBee project.
5. The guarded Hyperdrive smoke runs `SELECT 1` through
   `AIPHABEE_HYPERDRIVE`.
6. IPO/F10 ingestion writes to AiphaBee-owned schemas only after dry-run,
   rights, quality, and evidence gates pass.

Denied path:

1. A migration, env file, runbook, or smoke packet points AiphaBee at an AIMPACT
   or Salesko Supabase project.
2. The run is invalid even if schema names do not collide.
3. The failure reason is migration pressure: AiphaBee must be independently
   movable when data volume, compliance, plan, PITR, read replicas, or database
   engine choice changes.

## P3 Decision Rationale

Why this shape exists:

- AiphaBee is a financial data platform, not only an app state database.
- IPO and HK F10 data will create large, product-specific storage and indexing
  pressure.
- Future migration is likely: Supabase plan changes, read replicas, PITR,
  PolarDB/Postgres migration, or raw/serving split are all easier when AiphaBee
  owns the project boundary.
- Sharing a Supabase project with AIMPACT would make migrations hostage to
  unrelated tables, RLS policies, auth assumptions, and release schedules.

Invariant to preserve:

- AiphaBee can be dumped, restored, replicated, upgraded, or migrated without
  copying AIMPACT/Salesko data and without coordinating their app migrations.

Tradeoff:

- We give up shared Auth/billing convenience across sibling products.
- We gain a clean migration boundary, smaller incident radius, simpler database
  cost attribution, and clearer data-governance evidence.

10x scale first failure:

- The first pressure point will be Postgres database size, index bloat, WAL,
  backup/PITR window, and analytical query IO, not TypeScript routing. Dedicated
  ownership keeps the first capacity-driven migration bounded.

## Migration Rules

- Do not point AiphaBee `HYPERDRIVE_DATABASE_URL` at AIMPACT or Salesko.
- Do not reuse AIMPACT/Salesko Supabase service-role paths for AiphaBee jobs.
- Do not seed AIMPACT/Salesko product registry rows into a new AiphaBee live
  project.
- Do not store large raw F10/announcement blobs in Postgres when an object-store
  pointer plus hash/locator is enough.
- Do not expose product schemas through Supabase Data API without reviewed RLS
  and denied probes.

## Verification Surface

Before first live apply:

1. Confirm Supabase target ownership is AiphaBee-only.
2. Run `npm run check:database`.
3. Run remote dry-run against the dedicated AiphaBee project.
4. Create/bind Hyperdrive as `AIPHABEE_HYPERDRIVE`.
5. Run guarded Hyperdrive `SELECT 1`.
6. Capture hash-only evidence in the live-smoke packet flow before enabling
   live Serving or ingest writes.
