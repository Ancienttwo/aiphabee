# Review: Netquity Vendor MDB → PostgreSQL 1:1 Mirror — Phase 1 Gate

> **Review Rubric Version**: 2
> **Reviewed Diff Fingerprint**: sha256:4156c4bfe489ee0f82a3f53e1d2bc60a76498a8c1667ec554bbe4ee446fb2336
> **Reviewed Scope**: branch+staged+unstaged+untracked
> **External Acceptance**: pass
> **External Reviewer**: Codex
> **External Source**: codex-review (codex-cli 0.144.0, `codex exec --sandbox read-only`, exit 0)
> **External Started**: 2026-07-10T02:00:00+0800
> **External Completed**: 2026-07-10T03:58:54+0800
> **Gatekeeper Verdict**: PASS (Opus acceptance agent, re-ran verification in-session)

## Dual-track review summary

- **Gatekeeper (internal)**: VERDICT PASS. Reproduced all gates in-session: verify `{"failed":0,"passed":172,"skipped":1}` exit 0; check:database/check:env ok; migration structure validated (36 schemas / 173 tables / 164 `_pkey` + 3 `_key` UNIQUE / 4 secondary indexes / 0 DROP / 0 TRUNCATE); regeneration via `--out` is byte-identical to the committed migration; scope fidelity clean (16 in-scope paths, user WIP untouched). Findings: 2 (P2 tokenizer chunk-boundary escape pair; P3 quoted-`NULL` sentinel collision — both verify-only, safe failure direction).
- **Codex (external, cross-model)**: 9 findings — 5×P1 (write-target classification, identifier quoting, secret-in-argv, short-export commit, verifier inventory pinning), 3×P2 (nullability parity, pipeline peer-kill, manifest upsert staleness), 1×P3 (plan checkboxes).

## Disposition — all 11 findings accepted and fixed (fix round, re-verified 2026-07-10)

| # | Finding (source) | Fix |
|---|---|---|
| 1 | Write can target unapproved DB (Codex P1) | Write-mode URL resolution requires explicit `--database-url`/`NETQUITY_DATABASE_URL`; non-local hosts refused without `--allow-remote` (negative probes re-run: both refuse, exit 1) |
| 2 | Unquoted SQL identifiers (Codex P1) | `quoteIdentifier`/`quoteQualifiedIdentifier` helpers; NUL/CR/LF rejected |
| 3 | Secret URL in argv (Codex P1) | Password stripped from conninfo argv, passed via child-env `PGPASSWORD`, argv-leak assertion in code |
| 4 | Short zero-exit export commits (Codex P1) | In-transaction `DO $$ ... RAISE EXCEPTION` row-count gate vs mdb-count before commit |
| 5 | Verifier accepts incomplete delivery (Codex P1) | Bidirectional inventory pinning DDL↔source; `nq_ops.del_sec` structural verification |
| 6 | Nullability parity missing (Codex P2) | `is_nullable` compared, PK-member-aware (encodes the attnotnull gotcha permanently) |
| 7 | Pipeline peer-kill (Codex P2) | mdb-export/psql treated as one pipeline; either failure kills the peer, single settle |
| 8 | Manifest upsert staleness (Codex P2) | Manifest row upserted in place; table removal fails closed without `--allow-table-removal` |
| 9 | Plan checkboxes (Codex P3) | Phase 1a/1b marked `[x]` |
| 10 | Tokenizer chunk-boundary escape pair (Gatekeeper P2) | Full trailing quote-run carried across chunks |
| 11 | Quoted-text `NULL` counted as SQL NULL (Gatekeeper P3) | Per-field `wasQuoted` tracking; only unquoted sentinel counts as NULL |

Regression coverage: `verify.mjs --self-test` (28 escape-pair split offsets, all-1-char-chunk, null-sentinel fixtures) exit 0.

## Post-fix verification battery (2026-07-10, all green)

- `node --check` ×4 OK; self-test exit 0
- Reload smokes (CompProfile memo-heavy 3,219 rows; codetable 35 tables 1,841 rows) OK under count-gated commit
- `npm run netquity:verify` → `{"failed":0,"passed":172,"skipped":1,"status":"pass","total":173}` exit 0
- `npm run check:database` → ok (71 migrations); `npm run check:env` → ok
- Live DB total 635,501 rows = 100% of source

## Residual risks (non-blocking)

- No unit-test integration into the vitest chain (self-test is script-local by design; netquity scripts deliberately excluded from `npm run check`)
- Verifier untested against high-latency remote DB (Phase 2 concern)
- `nq_ops.del_sec` data path exercised only in Phase 3
- Vendor-side data quality issues recorded in `scripts/netquity-mirror/pk-demotions.json` (3 documented PK violations by the vendor's own data)

## Gate decision

Phase 1 accepted. Ship packaging deferred until after Phase 3 so the daily updater lands in the same reviewed unit; Phase 2 (PlanetScale apply) remains blocked on credentials + explicit user confirmation.
