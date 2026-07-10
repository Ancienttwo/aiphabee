# Plan: Netquity Vendor MDB → PostgreSQL 1:1 Mirror

> **Status**: Approved
> **Created**: 2026-07-09 17:40 +08
> **Slug**: netquity-pg-mirror
> **Artifact Level**: work-package
> **Promotion Reason**: Establish the licensed vendor (Netquity) raw mirror layer as PG schemas so downstream capabilities can consume authoritative HK market data.
> **Verification Boundary**: parity report exit 0 (172 tables) + `npm run check:database` green
> **Rollback Surface**: drop `nq_*` schemas locally; revert migration file + manifest row before PlanetScale apply
> **Spec**: `docs/spec.md`
> **Task Contract**: `tasks/contracts/netquity-pg-mirror.contract.md` (not created; plan-level execution)
> **Implementation Notes**: `tasks/notes/netquity-pg-mirror.notes.md`

## Agentic Routing

- Selected route: vendor raw-mirror foundation (schema generator + bulk loader + parity verifier + daily updater)
- Routing reason: user requested 1:1 PG equivalent of the Netquity Access deliverables in `_ref/Sample` (35 .mdb, 172 tables) with dictionaries in `_ref/tables`; approved scope includes daily incremental updater; target = local first, then PlanetScale.
- Due diligence:
  - P1 map: `_ref/Sample/*.mdb` (source, ignored external), `_ref/tables/*.doc` (authoritative dictionaries), `scripts/ingest-ipo-mdb.mjs` (precedent), `deploy/database/migrations/` + `migrations.contract.json` + `scripts/check-database-migrations-contract.mjs` (migration convention), PlanetScale via `scripts/apply-planetscale-migrations.mjs`, local PG at /tmp:5432.
  - P2 trace: `mdb-schema -N nq_<file> <file>.mdb postgres` → combined migration DDL → `psql -f` → `mdb-export -H -D %F -T "%F %T" | psql \copy FROM STDIN (format csv)` per table → verifier compares mdb-count/columns/PK/NULL/Chinese/SUM vs live DB → parity-report.
  - P3 decision rationale: schema-per-mdb (`nq_` prefix) is forced by cross-file table-name collisions with different structures (Stock, Daily, Data, DataPeriod×17); DOUBLE PRECISION kept as faithful equivalent of Access Double (vendor vocabulary has no Currency/Boolean); root declares `pg` explicitly because the root CLI imports it and must not depend on workspace hoisting; update semantics are encoded once in checked-in public-safe `strategies.json`; `del_sec_*.dat` is ingested to `nq_ops.del_sec` only — no invented delete semantics (fail-closed).

## Approach

Detailed design captured during planning (empirically validated against mdbtools 1.0.x):

- Generator: per mdb emit `CREATE SCHEMA IF NOT EXISTS nq_<name>` + `mdb-schema -N nq_<name> <file> postgres` (stderr dropped), dedupe `SET client_encoding`, `CREATE INDEX` → `IF NOT EXISTS` (4 lines, FinReport/FinReportIPO), forbidden-substring self-scan, single combined migration `deploy/database/migrations/<ts>_netquity_mirror_schema.sql` + manifest row (quoted `"nq_x"."y"` table entries ×172, 36 schemas incl. `nq_ops`, `default_rights_status: "default_deny"`, `-- default_deny` marker).
- Loader (bootstrap): per table `mdb-export -H -D "%Y-%m-%d" -T "%Y-%m-%d %H:%M:%S"` piped to `psql -X -v ON_ERROR_STOP=1` running `begin; truncate; \copy ... with (format csv); commit;` — streaming, one txn per table, `--allow-db-write` gated, `--only <mdb>` filter, `PGCLIENTENCODING=UTF8`. `-X` prevents a user `psqlrc` from weakening `ON_ERROR_STOP`. NULL mapping: unquoted-empty→NULL, `""`→empty string (mdb-export default aligns with COPY csv `NULL ''`).
- Verifier: per table row count (mdb-count vs count(*)), column name/type/order parity (DDL vs information_schema), PK parity (DDL vs pg_catalog), Chinese byte round-trip sample, DOUBLE/REAL SUM epsilon check, NULL-integrity via `mdb-export -0 SENTINEL`, memo-newline triangulation. Report `_ops/netquity-mirror/out/parity-report.{json,md}`; exit 0 iff all pass.
- Updater (daily): `strategies.json` maps every table to `replace_all | upsert_only | window_replace | unresolved`; unknown tables and conflicting duplicate deliveries fail. Keyless out-of-window revisions are unresolved/refused. Execution stops after the first failed table and skips later tables/`del_sec`; a corrected drop can be rerun idempotently. Accepts drop dirs with `.mdb`/`.zip`; `UnAdjPrice2` precedes `UnAdjPrice2H`; `del_sec_*.dat` is record-only upsert.

## Task Breakdown

- [x] Phase 1a: `scripts/netquity-mirror/{lib,generate-schema}.mjs` + npm scripts + env schema entry; generate migration (assert 172 tables / 35+1 schemas); manifest row; `npm run check:database` green.
- [x] Phase 1b: local db `netquity` created, migration applied (172 tables), `load.mjs` full load, `verify.mjs` parity exit 0.
- [x] Gate: gatekeeper review of Phase 1 diff + verification evidence (PASS; dual-track with Codex, 11 findings fixed and re-verified — see `tasks/reviews/plan-netquity-pg-mirror.review.md`).
- [x] Phase 3: `strategies.json` + `update.mjs` + `verify.mjs --mode daily` + README (vendor delivery clock, rebuild/rollback).
- [x] Gate: deep Phase 3 review completed 2026-07-10; fixed non-destructive generation, `psql -X`, duplicate-delivery hashing, vacuous daily verify, keyless out-of-window revisions, fail-fast sequencing, explicit root `pg`, and public-repo licensed-evidence redaction; re-ran bootstrap/daily parity and negative probes.
- [x] Licence gate: user confirmed on 2026-07-10 that the Netquity data is authorised cooperation material and has no copyright restriction for AiphaBee; the repository is also returning to private visibility. Existing evidence minimisation remains in place.
- [ ] Phase 2: PlanetScale apply (blocked on explicit database-write authorization; no remote data apply in this work package).

## Evidence Contract

- **State/progress path**: `tasks/notes/netquity-pg-mirror.notes.md`
- **Verification evidence**: `_ops/netquity-mirror/out/parity-report.{json,md}` + `npm run check:database` output
- **Evaluator rubric**: parity exit 0 on all 172 tables (rows/columns/PK/NULL/Chinese/SUM); check:database green; updater strategies cover 172/172 tables
- **Stop condition**: parity failures that trace to source-data defects (not pipeline bugs) are reported, not patched around
- **Rollback surface**: `DROP SCHEMA nq_* CASCADE` locally; revert migration + manifest row; no PlanetScale apply without explicit user go

## Annotations

- `_ref/` is read-only source material; never commit its contents. Artifacts go to `_ops/netquity-mirror/out/` (git-ignored).
- Vendor docs absent for DebtData/SCShareHold/FinReportIPO → mirror structure from MDB, but daily strategies remain `unresolved`; no inferred update semantics.
- WarrantData/WarrIssue documented but not delivered → not built until files appear (generator auto-includes new mdb files).
