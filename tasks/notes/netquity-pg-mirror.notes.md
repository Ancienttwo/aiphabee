# Netquity PostgreSQL mirror — public-safe engineering notes

## Scope and rights boundary

- The source MDB files and vendor dictionaries are licensed inputs under `_ref/`; they remain ignored and read-only.
- This tracked note intentionally excludes vendor wording, person/company names, exact source rows, and raw error payloads.
- Public Git contains pipeline code, structural contracts, source-document references, and paraphrased decisions only.
- Runtime data stays behind the existing `default_deny` database rights posture.

## Architecture and data flow

1. `generate-schema.mjs` reads 35 private MDB fixtures through mdbtools and emits one PostgreSQL schema per MDB plus `nq_ops.del_sec`.
2. `load.mjs` performs the bootstrap mirror one table per transaction with streaming `mdb-export | psql` copy and in-transaction row-count gates.
3. `update.mjs` resolves a daily drop, validates it against `strategies.json`, then applies `replace_all`, `upsert_only`, or `window_replace` semantics. Unresolved tables are never guessed.
4. `verify.mjs` independently checks bootstrap parity or the scope of one daily drop.

## Verified deviations

- Advisory Access `Required` metadata is not trusted for non-key nullability. Generated inline `NOT NULL` is removed; real PostgreSQL primary keys still enforce non-null members.
- Three source tables have a private delivered row with NULL in a vendor-documented composite-key member. `pk-demotions.json` limits the exception to those exact table/key shapes and changes only `PRIMARY KEY` to `UNIQUE NULLS DISTINCT` semantics.
- Vendor `COMMENT ON COLUMN` prose is omitted from the public migration. Structural DDL remains the execution contract.

## Daily update safety decisions

- A daily write requires `--allow-db-write`; remote targets additionally require `--allow-remote`.
- Write commands accept only `--database-url` or `NETQUITY_DATABASE_URL`; they do not inherit generic database variables.
- `psql` is always invoked with `-X -v ON_ERROR_STOP=1`, so a user `psqlrc` cannot weaken error-stop behavior.
- Duplicate raw/zip deliveries resolving to one schema must be byte-identical. A hash mismatch fails closed.
- Execution stops at the first failed table and does not process later tables or `del_sec`; completed table transactions are idempotent and the whole drop can be rerun after correction.
- Keyless `window_replace` is accepted only when every staged row is inside the declared window. An out-of-window or NULL-window row cannot be matched safely to a prior revision and is refused.
- `nq_sharecapitaldata.data` and `nq_sharehold.shareholddata` are unresolved because observed deliveries falsified a safe incremental identity/window assumption.
- A daily verify with no verifiable tables fails; `--skip-unresolved` cannot produce a vacuous pass.

## Current verification evidence

- Schema regeneration: 36 schemas / 173 tables and byte-identical canonical output before the public-prose redaction change.
- Bootstrap local parity: 172 vendor tables passed; `nq_ops.del_sec` was structural-only.
- Tokenizer self-test: all escaped-quote split offsets, one-byte chunks, and quoted/unquoted NULL sentinel cases passed.
- Dry-run loader and updater exercised the private fixture without database writes.
- Negative probes confirmed missing write URL and unapproved remote writes fail closed.
- `npm run check:database` and `npm run check:env` passed before final merge validation.

## Residual production gate

- The local fixture is a full-history proving set, not evidence that every real daily file is a complete snapshot. `replace_all` classifications for FinReport and TurnoverBreakdown must not be used on production daily drops until a real delivery confirms full-snapshot semantics.
- The generated structural schema may itself be subject to the vendor licence. No push/publication of this local commit is authorised by this task; licence ownership must approve that surface before any future push.
