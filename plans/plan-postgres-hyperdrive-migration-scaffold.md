# Plan: Postgres Hyperdrive Migration Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 15:10 +08
> **Slug**: postgres-hyperdrive-migration-scaffold
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/postgres-hyperdrive-migration-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/postgres-hyperdrive-migration-scaffold.notes.md`

## Agentic Routing

- Selected route: repo-local Supabase migration scaffold plus Hyperdrive
  capability contract.
- Routing reason: Sprint 0.4 needs Postgres/Supabase via Hyperdrive, but real
  database credentials, Hyperdrive binding IDs, and provider smoke tests are not
  available in the repo.
- Due diligence:
  - P1 map: Supabase migration directory, database manifest, env names, Worker
    runtime capability route, and CI checker.
  - P2 trace: SQL migration file -> manifest -> checker -> Worker
    `/database/runtime` no-live-query response.
  - P3 decision rationale: create verifiable migration tooling and default-deny
    governance schema without committing resource IDs or touching a live DB.

## Task Breakdown

- [x] Add Supabase-compatible migration directory and README.
- [x] Add Phase 0 foundation SQL migration with non-market-data governance
      schemas and default-deny channel status.
- [x] Add database migration manifest for Supabase Postgres through Cloudflare
      Hyperdrive.
- [x] Add `npm run check:database` and CI coverage.
- [x] Add Worker `/database/runtime` capability route.
- [x] Add tests for database runtime capability route.
- [x] Update tracker/todos/governance docs.
- [x] Verify local checks, Wrangler smoke, and workflow strict check.
