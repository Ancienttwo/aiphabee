# Netquity vendor mirror (Access mdb -> PostgreSQL)

`plans/plan-netquity-pg-mirror.md`: a 1:1 structural mirror of the licensed Netquity vendor
Access deliverables (35 `.mdb` files, 172 tables; `_ref/Sample/*.mdb` is the local bootstrap/proving
fixture) into PostgreSQL schemas, plus a bulk loader (Phase 1), a daily incremental updater
(Phase 3), and a parity verifier covering both. `_ref/` is read-only source material and is never
committed to or modified by these scripts.

Four scripts, four npm entrypoints:

| Script | npm script | Purpose |
| --- | --- | --- |
| `generate-schema.mjs` | `npm run netquity:schema` | Emits the combined migration SQL + `deploy/database/migrations.contract.json` manifest row |
| `load.mjs` | `npm run netquity:load` | Bootstrap: streams `mdb-export` into `psql \copy`, one transaction per table, always truncate+reload |
| `update.mjs` | `npm run netquity:update` | Daily incremental: dispatches each table to its `strategies.json` mode (`replace_all` \| `upsert_only` \| `window_replace`), one transaction per table |
| `verify.mjs` | `npm run netquity:verify` | Bootstrap mode (default): row/column/key/data parity + Chinese round-trip against `--source-dir`, writes `parity-report.{json,md}`. `--mode daily --drop-dir <dir>`: scope-limited parity for an already-applied drop, writes `parity-report-daily.json` |

`lib.mjs` holds the shared helpers: arg parsing, schema-name mapping, mdbtools wrappers, the
forbidden-SQL-pattern scanner, the DDL parser shared by the generator's self-assert and the
verifier's column/key checks, the `mdb-export | psql` copy-in pipeline and the `replace_all`
recipe built on it (shared by `load.mjs` and `update.mjs`), `strategies.json` loading/validation,
and drop-dir resolution (shared by `update.mjs` and `verify.mjs --mode daily`).

`strategies.json` (checked in) records the daily-update mode for every one of the 172 vendor
tables, with the vendor-dictionary evidence that justifies it -- see "Daily incremental update
(Phase 3)" below.

## Schema-name mapping

`basename(file, ".mdb")` -> lowercase -> every non-`[a-z0-9_]` character replaced with `_` ->
prefixed with `nq_`. Example: `CompProfile2.mdb` -> `nq_compprofile2`. One schema per source
file is required because table names collide across files with different structures (`Stock`,
`Daily`, `Data`, 17x `DataPeriod`, ...). `mdb-schema` lowercases table names verbatim with no
other transformation (empirically verified against all 172 tables), so the Postgres table name
is always `mdbTableName.toLowerCase()`.

A 36th schema, `nq_ops`, is hand-authored (not derived from any `.mdb`) and holds
`nq_ops.del_sec`, a structural mirror of the vendor's `del_sec_*.dat` delisted-securities feed.
Codes are stored as `VARCHAR(10)` (not integer) to preserve leading zeros (e.g. `08558`). This
table has no vendor `.mdb` source -- `update.mjs` (Phase 3) is the only writer, upserting
`del_sec_*.dat` drop-dir files into it; `load.mjs`/`generate-schema.mjs` never touch it beyond
creating the empty structure.

## Database URL resolution

`verify.mjs` (read-only) resolves the connection string in this order: `--database-url` flag >
`NETQUITY_DATABASE_URL` > `LOCAL_DATABASE_URL` > `DATABASE_URL`. `load.mjs` (write) resolves more
narrowly -- see "Write-mode safety" below. Neither script has a hardcoded default; if no source
resolves, the script fails closed with a clear message. `env.schema.json` declares
`NETQUITY_DATABASE_URL` as a secret, dev/staging/prod env var.

## Usage

```bash
# 1. Generate the migration SQL + manifest row (pure file generation, no DB connection).
npm run netquity:schema

# 2. Apply it to a local database (set PGCLIENTENCODING for the COMMENT ON COLUMN text).
createdb netquity
PGCLIENTENCODING=UTF8 psql postgresql:///netquity -f deploy/database/migrations/20260709180000_netquity_mirror_schema.sql

# 3. Dry run the loader (prints the table plan + mdb-count source rows, touches no DB).
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:load -- --only codetable

# 4. Load one file (smoke test), then everything.
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:load -- --only codetable --allow-db-write
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:load -- --allow-db-write --concurrency 4

# 5. Verify parity (bootstrap mode).
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:verify

# 6. Tokenizer self-test -- no database, mdbtools, or source files required.
node scripts/netquity-mirror/verify.mjs --self-test

# 7. Daily incremental update + its own scope-limited verify -- see "Daily incremental update
#    (Phase 3)" below for the full picture (strategies.json modes, drop-dir contents, the
#    out-of-window warning, the vendor delivery clock).
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:update -- --drop-dir <dir> --allow-db-write --skip-unresolved
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:verify -- --mode daily --drop-dir <dir> --skip-unresolved
```

`load.mjs` flags: `--only <mdbname>` (basename without `.mdb`, case-insensitive), `--allow-db-write`
(default is dry-run), `--concurrency N` (default 1; each unit of concurrency is one
`mdb-export | psql` pipeline), `--allow-remote` (required for a non-local database host -- see
"Write-mode safety" below). `generate-schema.mjs` flags additionally include
`--allow-table-removal` (see "Deviation register"). `generate-schema.mjs` / `verify.mjs` flags:
`--source-dir`, `--out`, `--migration-file`, `--database-url` as applicable -- see each script's
header comment. `update.mjs` and `verify.mjs --mode daily` flags are covered in "Daily incremental
update (Phase 3)" below. `verify.mjs --self-test` exercises the streaming CSV tokenizer (`createRowTokenizer`
in `verify.mjs`) against two fixture classes and exits 0/1:

- An escaped-quote (`""`) pair straddling a forced chunk split, at every possible split offset of
  a sample row (28 offsets for the current fixture), plus the same row forced through 1-byte
  chunks. Proves the "carry the entire trailing run of `"` characters across chunks" fix -- a
  single held-back quote is not enough when 2+ quotes land exactly at a chunk boundary (the old
  logic silently mis-parsed exactly the 2 offsets where that happens).
- Quoted vendor text that happens to equal the `NULL` sentinel string is not treated as NULL,
  while an unquoted sentinel occurrence is -- proves the per-field `wasQuoted` tracking that
  `isNullField()` relies on.

## Write-mode safety

`load.mjs` (and any future `update.mjs`) resolves its database URL more narrowly than
`verify.mjs`: `--database-url` or `NETQUITY_DATABASE_URL` only, with no fallback to
`LOCAL_DATABASE_URL`/`DATABASE_URL` (`lib.mjs` `resolveWriteDatabaseUrl`) -- a write command must
not silently inherit a URL some other tool set for a different purpose. It also classifies the
target host (`lib.mjs` `classifyDatabaseHost`) and refuses anything other than a unix socket,
`localhost`, `127.0.0.1`, or `::1` unless `--allow-remote` is also passed; remote (PlanetScale)
apply is Phase 2 of `plans/plan-netquity-pg-mirror.md`, explicitly blocked there on credentials
and explicit user confirmation.

If the resolved URL carries a password, `splitDatabaseUrlSecret` strips it before the URL ever
reaches `psql`'s argv (visible to `ps`/shell history) and passes it via the child process's
`PGPASSWORD` environment variable instead; `load.mjs` asserts in code that the password string
never appears in the argv it is about to spawn.

Every `TRUNCATE`/`\copy` target is built through `lib.mjs` `quoteQualifiedIdentifier` (proper
double-quoting, doubled embedded quotes) rather than raw string interpolation, and rejects any
schema/table name containing NUL/CR/LF outright.

After `\copy` completes and before `commit`, `load.mjs` runs an in-transaction row-count gate --
a `DO $$ ... IF (SELECT count(*) FROM <table>) <> <expected> THEN RAISE EXCEPTION ... END IF ...
$$;` block, where `<expected>` is `mdb-count`'s row count for that table (read before the copy
starts). A mismatch raises, which -- under `psql -v ON_ERROR_STOP=1` -- aborts the script before
`commit;` ever runs, so the whole transaction (truncate + copy) rolls back on connection close.

`load.mjs` treats each table's `mdb-export | psql` pair as one pipeline: whichever child
fails/errors first kills the other and both `close` events are awaited before the table's result
promise settles, so nothing is left running under `--concurrency` when one side of a pipeline
fails early. `update.mjs` resolves its database URL and constructs psql argv/env the same way
(`lib.mjs` `buildPsqlConnection`, wrapping `resolveWriteDatabaseUrl`).

## Daily incremental update (Phase 3)

```bash
# Dry run: prints the per-table action plan (mode, resolved window, source row counts) and
# touches no database. Unresolved tables are always listed here, informationally -- they only
# block a real (--allow-db-write) run.
node scripts/netquity-mirror/update.mjs --drop-dir /path/to/todays/drop

# Apply it. --skip-unresolved is required whenever the drop contains a table this repo has no
# vendor-documented update semantics for (see "Unresolved tables" below) -- omit it and the run
# refuses outright rather than guessing.
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:update -- \
  --drop-dir /path/to/todays/drop --allow-db-write --skip-unresolved

# Scope-limited parity for the drop just applied (see "verify.mjs --mode daily" below).
NETQUITY_DATABASE_URL=postgresql:///netquity npm run netquity:verify -- \
  --mode daily --drop-dir /path/to/todays/drop --skip-unresolved
```

`update.mjs --drop-dir <dir>` flags: `--allow-db-write` (default is dry-run), `--skip-unresolved`,
plus the inherited `--database-url`/`--allow-remote` write-mode flags described above. Every
table is processed sequentially, one transaction each (no `--concurrency` -- a daily drop is
orders of magnitude smaller than the Phase 1 bootstrap, and processing sequentially keeps the
window-resolution/dedup logic simple).

### Drop-dir contents

- **`.mdb` files** -- resolved by `basename(file, ".mdb")` through the same `schemaNameFor()`
  mapping as `load.mjs`/`generate-schema.mjs`.
- **`.zip` files** -- extracted to a tmpdir and resolved by their **inner** `.mdb` filename, not
  the zip's own basename. The vendor sometimes ships a stale-named archive whose inner file is
  current (e.g. `ETFData.zip` containing `ETFData2.mdb`, `TurnoverBreakdown.zip` containing
  `TurnoverBreakdown2.mdb`) -- both resolve correctly to `nq_etfdata2`/`nq_turnoverbreakdown2`.
- **Duplicate deliveries for the same schema** (e.g. both a raw `.mdb` and a `.zip` for the same
  file, as `_ref/Sample` intentionally has for nearly every schema, since it is the Phase 1
  bootstrap set reused as a drop-dir proving fixture rather than a trimmed daily drop) --
  deduplicated deterministically (raw `.mdb` preferred over zip-derived; ties broken by filename),
  every non-chosen duplicate logged, never silently dropped or double-processed.
- **`del_sec_*.dat` files** -- tab-delimited `YYYY/MM/DD<TAB><code>`, CRLF line endings, parsed
  fully in memory (these are small flat files, not vendor `.mdb` exports) and upserted into
  `nq_ops.del_sec` (`del_date`, `code`) with `ON CONFLICT DO NOTHING`. **Record-only**: the vendor
  dictionaries document no other action for a delisted-security notice (no cascading delete, no
  status flag elsewhere) -- `update.mjs` does not invent one. Re-running the same file is a no-op
  the second time (0 newly inserted rows).
- **Unknown `.mdb`/`.zip`** (resolves to a schema not in the migration DDL) -- refused outright:
  "new vendor file -- regenerate schema first" (`npm run netquity:schema`), naming the file.

### strategies.json modes

| Mode | Mechanism | Example tables |
| --- | --- | --- |
| `replace_all` | `TRUNCATE` + `\copy` + row-count gate + `commit` -- identical to `load.mjs`'s own per-table recipe (`lib.mjs` `runReplaceAllCopy`), reused verbatim. The delivered file is the complete current state. | Lookup/code tables, snapshot masters (`BasicData`, `MarketData`, `CompInfo`, `CompProfile(2)`, `IndustryComp`, `ETFData2`, `Biography`, `FinReport` families, `LatestResult`, `TurnoverBreakdown2`, `ListCompHeld`, `IssueShare.issueshare`), all `NewIPO2` tables, every schema's `DataPeriod` control table itself |
| `upsert_only` | Stage into a `TEMP` table (`LIKE target INCLUDING DEFAULTS`) + row-count gate on the temp table (proves the `\copy` got everything) + `INSERT ... ON CONFLICT (<key columns>) DO UPDATE SET <non-key columns> = EXCLUDED.<col>` (`DO NOTHING` if the table is fully keyed). No deletes. | `nq_unadjprice2.daily` (latest trading day, `AdjNominal` corrected the next morning), `nq_unadjprice2h.daily` (adjustment history since 2001) -- processed in that order when both are present in a drop |
| `window_replace` | Stage into `TEMP`, gate its row count, replace the declared `[start,end]` window, then gate post-insert parity. Keyed tables may also replace a re-supplied keyed row outside the window. Keyless tables fail if any staged row is outside/NULL-window because a prior revision cannot be identified safely. | `CorpAct` event tables, `DividendInfo.dividendinfo`, `CapitalRaised.capitalraised`, `SDIData.sdi`, `ShareBuyback`/`ShortSelling.daily_data`, `SubTransaction.daily`, `ShareCapital.sharecapitalchange`, `FreeFloatShare2(_Partial).freefloatshare` |
| `unresolved` | Not processed. Collected and reported; the whole run refuses unless `--skip-unresolved` is passed, in which case these tables are skipped with a loud warning and excluded from the plan. | `DebtData`, `SCShareHold`, `FinReportIPO`; `nq_sharehold.shareholddata`; `nq_sharecapitaldata.data` |

`strategies.json` contains 172 public-safe source references and paraphrased classifications,
cross-checked 1:1 against the migration DDL at startup. Licensed vendor wording and exact rows
remain under ignored private/operator surfaces, not Git.

### Out-of-window staged rows (warning, not a failure)

A keyed `window_replace` table may legitimately carry rows outside `[start,end]` or with a NULL
window value. The updater replaces those rows by their declared key and reports the count; the
verifier checks full-row coverage. A keyless table cannot distinguish a correction from a new
row outside the window, so both update and verify fail closed instead of accumulating stale
revisions.

### `verify.mjs --mode daily` row-level parity

Row-level, not aggregate: each planned table is staged into a temp table and compared against
the target with a bidirectional `EXCEPT ALL`, mode-aware:

- `replace_all` -- whole table, both directions (`extra_in_file`/`extra_in_db` must both be 0).
- `upsert_only` -- scoped to the staged key set only, since this mode never deletes; target rows
  outside that key set are out of scope by design.
- `window_replace` -- in-window rows compared the same way, plus a full-row (not key-only)
  coverage check for out-of-window/NULL-window staged rows: every one must match an identical row
  somewhere in the whole target table, mirroring the updater's own delete-union semantics.

`nq_ops.del_sec` coverage is checked separately: every `(del_date, code)` row parsed from the
drop's `del_sec_*.dat` file(s) must exist in `nq_ops.del_sec` (a single existence query -- there
is no staged file to diff against for this feed). A drop containing only `del_sec_*.dat` files
still yields a real, non-vacuous report entry rather than a trivial pass.

Zip archives in a `--drop-dir` are contained in two layers, shared by `update.mjs` and
`verify.mjs --mode daily` alike (both resolve a drop dir through the same code path): before
extraction, `unzip -Z1` lists every entry and refuses the whole archive if any entry is an
absolute path or contains a `..` path segment; after extraction, every extracted file's realpath
must resolve strictly under the extraction tmpdir's own realpath, and any symlink or
non-file/non-directory entry is refused outright. Every tmpdir created while resolving a drop is
removed in a `finally` block, independent of success or failure.

### Unresolved tables

Two reasons a table is `unresolved`:

1. **No vendor dictionary at all** for the `.mdb` file (`DebtData`, `SCShareHold`, `FinReportIPO`)
   -- `_ref/tables/*.doc` simply never mentions it.
2. **A prior classification was falsified by private fixture data.**
   `nq_sharehold.shareholddata` has no authoritative safe window, and
   `nq_sharecapitaldata.data` has no key that can identify out-of-window revisions. Both remain
   unresolved rather than guessing a field or treating a potentially incremental file as a full
   snapshot.

Both are fail-closed, not invented: `update.mjs`/`verify.mjs --mode daily` refuse to process an
unresolved table's data at all without `--skip-unresolved`, and never guess a mode.

### Vendor delivery clock

Schedule runs from the private licensed operations runbook. Delivery timing is intentionally not
copied into this public repository.

### Idempotency

Every executed table mode is idempotent against a re-delivery of the identical file. The updater
stops at the first table failure and skips later tables/`del_sec`; after correcting the cause,
rerun the same drop to converge the already-committed earlier table transactions and the
remaining work.

## Rebuild / rollback

Local rebuild from scratch:

```sql
drop schema if exists nq_basicdata, nq_biography, ..., nq_unadjprice2h, nq_ops cascade;
-- or, more simply, drop and recreate the whole database:
```
```bash
dropdb netquity && createdb netquity
```

Then re-run steps 1-5 above. To roll back the migration-contract change: revert
`deploy/database/migrations/20260709180000_netquity_mirror_schema.sql` and the corresponding
row in `deploy/database/migrations.contract.json` (last entry in the `migrations` array).

## Known caveats

- **REAL vs DOUBLE PRECISION is faithful to `mdb-schema`'s own inference**, not something this
  pipeline chooses. `REAL` mirrors Access "Single" (32-bit, ~7 significant digits); `DOUBLE
  PRECISION` mirrors Access "Double" (64-bit). `verify.mjs` uses a looser relative-epsilon
  (`1e-6`) for `REAL` column sum comparisons than for `DOUBLE PRECISION` (`1e-9`) because
  summing thousands of already-lossy float4 values in a different order (JS sequential vs.
  Postgres's aggregate) legitimately diverges beyond `1e-9` from float4's native precision limit
  alone -- empirically observed up to ~1.4e-8 on real vendor data with no underlying corruption.
- **`DebtData.mdb`, `SCShareHold.mdb`, and `FinReportIPO.mdb` have no vendor dictionary** under
  `_ref/tables/*.doc`. They are mirrored directly from the `.mdb` structure with no additional
  semantic annotation.
- **6 tables have no primary key** in the source schema (`nq_scsharehold.dataperiod`,
  `nq_sharebuyback.dataperiod`, `nq_sharecapitaldata.data`, `nq_shortselling.dataperiod`,
  `nq_subtransaction.daily`, `nq_subtransaction.dataperiod`). This is faithful to
  `mdb-schema`'s own output (it emits no `ADD CONSTRAINT ... PRIMARY KEY` for them) and is left
  as-is.
- **`WarrantData` / `WarrIssue`** are documented in `_ref/tables/` but not present in
  `_ref/Sample/`. The generator auto-includes any `.mdb` file present in the source directory,
  so no code change is needed once those files are delivered.

## Deviation register (raw `mdb-schema` output is not applied verbatim)

Two deviations from `mdb-schema`'s raw output are applied automatically by `generate-schema.mjs`
on every regeneration. Both are documented in the generated migration file's own header comment.

1. **Inline `NOT NULL` on column definitions is stripped.** Access's per-field "Required"
   metadata is not reliably enforced at the storage layer in vendor deliveries -- 3 tables
   across 3 different `.mdb` files each contained a real row that violated their own declared
   `NOT NULL`, which rolled back the whole table on the first full load. Primary-key columns are
   unaffected in practice: PostgreSQL enforces `NOT NULL` on every `PRIMARY KEY` column
   unconditionally, regardless of the column's own declaration (verified empirically -- adding a
   `PRIMARY KEY` via `ALTER TABLE` sets `attnotnull` on its columns even when they were never
   declared `NOT NULL`), so this is a pure widening of nullability for non-key columns, not a
   relaxation of any real uniqueness/identity invariant.
2. **`scripts/netquity-mirror/pk-demotions.json` is an explicit, evidence-backed exception
   register -- not a blanket rule.** For exactly 3 tables, the column carrying a genuine vendor
   `NULL` turned out to be a member of that table's own documented composite `PRIMARY KEY`
   (`nq_biography.biography.engtitle`, `nq_corpact.directorchange.engdirectorname`,
   `nq_etfdata2.invest.engsectorname`). A `PRIMARY KEY` column can never hold `NULL` in any SQL
   database -- deviation 1 alone cannot make those rows loadable. The vendor's own Word
   dictionary independently documents the same composite key for all 3 tables (confirmed by
   converting the relevant `_ref/tables/*.doc` files and reading the "Primary Key:" line), so
   this is not a schema-inference mistake -- the delivered rows simply violate the vendor's own
   documented key. For exactly the schema/table/columns listed in `pk-demotions.json`, and only
   those, `generate-schema.mjs` emits `ADD CONSTRAINT "<table>_key" UNIQUE (<same columns>)`
   instead of `ADD CONSTRAINT "<table>_pkey" PRIMARY KEY (...)`. PostgreSQL's default `NULLS
   DISTINCT` behavior on `UNIQUE` constraints approximates Jet/Access's lax NULL-in-key
   handling (multiple `NULL`s coexist), while uniqueness is still fully enforced across every
   fully-non-NULL key combination. `generate-schema.mjs` fails hard if a manifest entry's
   `columns` differ from the table's actual generated `PRIMARY KEY` columns (protects against
   silent drift if a future vendor delivery changes one of these tables' structure), and fails
   hard if any manifest entry is never applied. `verify.mjs`'s key-parity check is
   type-aware (`primary_key` | `unique` | `none`): it reads the expected type from the generated
   DDL and confirms `pg_catalog` shows the same type with the same columns, not just the same
   column list.

   **Operational note for manual constraint changes on an already-existing live database**:
   `ALTER TABLE ... DROP CONSTRAINT <x>_pkey` does not revert `attnotnull` on that constraint's
   columns -- PostgreSQL has no memory of *why* a column is `NOT NULL`, so a column that became
   `NOT NULL` as a side effect of a since-dropped `PRIMARY KEY` stays `NOT NULL` until an
   explicit `ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL`. This only matters when altering an
   already-existing table in place; a from-scratch rebuild (`dropdb && createdb` + re-apply the
   regenerated migration) never hits it, since a `UNIQUE` constraint never sets `attnotnull` in
   the first place. See `tasks/notes/netquity-pg-mirror.notes.md` ("Follow-up 2") for the full
   incident.

   Exact licensed row-level evidence is intentionally excluded from Git. `pk-demotions.json`
   keeps only the private source reference, affected key member, and public-safe rationale.

3. **`verify.mjs`'s column check now includes nullability parity as a permanent regression
   guard for the `attnotnull` gotcha above**: every column is expected `NULLABLE` except a true
   `PRIMARY KEY` member (`ddl.key.type === "primary_key"`), independent of what the table's
   `NOT NULL`/`UNIQUE` history has been. A stale `NOT NULL` left over from a since-dropped or
   demoted `PRIMARY KEY` now fails `npm run netquity:verify` directly instead of only surfacing
   later as a load failure.

4. **`generate-schema.mjs`'s manifest write is upsert-in-place, not append-only.** If
   `deploy/database/migrations.contract.json` already has a row for the canonical migration file
   and the newly-generated `schemas`/`tables` differ from what is recorded, the row is updated in
   place (not duplicated). If that update would remove a previously-listed table (a source `.mdb`
   file or table disappeared), the script fails closed unless `--allow-table-removal` is passed --
   this is a real vendor-delivery signal worth a deliberate look, not something to silently drop
   from the manifest.

5. **`verify.mjs` requires exact bidirectional equality between the DDL's table inventory and
   `--source-dir`'s `.mdb` table inventory** (besides `nq_ops.del_sec`, which has no vendor `.mdb`
   source by design). A schema the DDL expects with no matching source file, a source file with no
   matching DDL schema, or an individual table present on only one side of that comparison all
   fail with the offending schema/table key(s) listed in the report -- this catches a stale DDL
   entry or a vendor file that silently disappeared between deliveries, rather than the per-table
   loop just never visiting it.
