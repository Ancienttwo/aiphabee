# Notes: postgres-hyperdrive-migration-scaffold

> **Last Updated**: 2026-06-22 08:05 +08
> **Plan**: `plans/plan-postgres-hyperdrive-migration-scaffold.md`
> **Runtime Evidence**: `docs/governance/postgres-hyperdrive-migration-scaffold.md`

## Decisions

- Used Supabase migration naming under `deploy/database/migrations/`.
- Added a repo-local migration manifest instead of provisioning a Supabase or
  Hyperdrive resource.
- Added only non-market-data schemas and default-deny governance tables.
- Did not add a Wrangler `hyperdrive` binding entry because Cloudflare requires
  a real Hyperdrive `id`, and no resource ID should be committed.
- Added the documented Hyperdrive local connection env var as a names-only
  secret variable.
- A later Cloudflare resource smoke slice added guarded
  `POST /cloudflare/hyperdrive/smoke` plus `pg`/`nodejs_compat` readiness, but
  product `/database/runtime` still keeps `live_queries=false`.

## Verification

- Passed: `npm run check:database`
- Passed: `npm run check:env`
- Passed: `npm run test`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /database/runtime`.
- Passed: `scripts/check-task-workflow.sh --strict`.

## Residual Blockers

- No Supabase project or Hyperdrive resource is provisioned.
- No remote migration dry-run or apply has been executed.
- No read-only `SELECT 1` through Hyperdrive has passed live execution.
- Security master, raw snapshot, financial fact/restatement,
  corporate-action/adjustment, account/workspace entitlement, and usage-ledger
  schemas now exist, but ingestion, live data gateway reads, field entitlement
  execution, and live usage writes remain absent.
