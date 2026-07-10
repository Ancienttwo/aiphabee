# Implementation Notes: promote-and-prove-guarded-netquity-security-resolution-on-staging

> **Status**: Active
> **Plan**: plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md
> **Contract**: tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md
> **Review**: tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md
> **Last Updated**: 2026-07-11 03:26
> **Lifecycle**: notes

## Design Decisions

- P1 map: licensed rows stay in `nq_basicdata.stock`; staging admin authority
  promotes them into the canonical `aiphabee_core` source/version/Serving
  tables; `aiphabee_runtime_rls` reads only five tables through
  `AIPHABEE_HYPERDRIVE`; the guarded Worker route is the only new consumer.
  Public `/tools/resolve-security`, production Worker/Hyperdrive, UI, MCP, and
  exports are outside this slice.
- P2 trace: exact input is bounded to 512 bytes, normalized only for casing and
  whitespace, and queried against the newest released `security_master`
  snapshot with `LIMIT 26`. The pure mapper validates version, opaque ID,
  source-record provenance, market, status, names, and the matched exact alias.
  Invalid environment/auth stops before binding access; missing authority,
  overflow, not-found, and readback failures retain distinct fail-closed HTTP
  statuses. Success returns `liveDataAccess=true` and no synthetic fallback.
- P3 decision: use the existing versioned Serving Store instead of exposing raw
  schemas or forcing vendor rows into company/listing identity tables. Opaque
  `hkex_security_<five-digit-code>` IDs and optional dates preserve source
  semantics. At 10x scale the one-shot promotion/index build fails first;
  runtime lookups remain GIN-backed and bounded to 26 rows.
- The operator route is code-gated by `APP_ENV=staging`, double-header/token
  authorization, constant-time digest comparison, and 512-byte token/query
  limits. Non-staging receives a generic 404 before auth or Hyperdrive access.

## Deviations From Plan Or Spec

- Shared staging inventory contained the raw mirror but zero canonical Serving
  foundation tables. Rather than add an ad-hoc schema, the apply packet ran only
  the two existing foundational migrations
  `20260620082000_security_master_raw_snapshot_scaffold.sql` and
  `20260620091000_serving_store_scaffold.sql`, then read the objects back before
  promotion. The plan/contract were widened before that write.
- The GIN index is in a separate staging SQL file because PostgreSQL forbids
  `CREATE INDEX CONCURRENTLY` inside the promotion transaction.
- The repository env parity checker requires every declared name in all four
  blank templates and the `dev,staging,prod` schema tuple. Runtime scope remains
  staging-only through `APP_ENV`, Wrangler secret placement, and deployment.
- Claude CLI review was unavailable due its session quota. Gemini CLI provided
  the cross-vendor read-only fallback: its first pass found the missing input
  bound, the fix added token/query limits, and its final pass returned
  `NO_FINDINGS`.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Runtime reads raw `nq_*` | Rejected | Removes release/version authority and expands vendor blast radius. |
| Immediate public-route cutover | Rejected | Existing public route has no product auth/rights gate. |
| Ad-hoc minimal staging tables | Rejected | Would drift from canonical migrations and future deploy tooling. |
| Versioned Serving snapshot + guarded route | Chosen | Smallest coherent live proof with withdrawal/revoke rollback. |

## Open Questions

- None.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Local PostgreSQL apply (run twice): released snapshot/records
  `18,036/18,036`, status partition `17,555/141/340`, GIN index `1`, core
  USAGE/SELECT true, raw USAGE/write false.
- Remote preflight: source/distinct codes `18,036/18,036`, missing listing dates
  `62`, invalid required rows `0`, status partition `17,555/141/340`; two runtime
  roles, no superuser/BYPASSRLS/raw-schema USAGE; foundation tables initially
  `0`.
- Remote packet hashes: security-master foundation
  `fe88a1c5ddfeffa0f7c6e1f4cf65b1a138e51afec88667415b50c0ffb74bc817`,
  Serving foundation
  `cb5a8daaccef317f761bab12cce904424323658a2b542a55cc9c49a555c2fecd`,
  promotion
  `7dcc8b2db82595c5e18294a3dca99dee7b3b9d3cd252e39435029a8552bca6c9`,
  index `7522f8b7f3acdb8b6f5bc1bbc51fedb5f400ba659390e53cf4e9796add31311f`,
  role `ead02e224a61d5ec7693bfc60b818acd5d31739f293b978dca298a3159901549`.
- Remote admin/runtime readback: released/PASS `18,036`, partition
  `17,555/141/340`, source hash/rights true, index `1`, both runtime roles have
  all five SELECTs and no insert/update/delete/CREATE/ownership/superuser/
  BYPASSRLS/raw-schema USAGE; runtime `raw_table_visible=false`.
- Staging Worker version `2ccb743c-6bd8-4e40-a597-9f7d3945cd5e`: code plus
  English/Traditional/Simplified exact aliases each returned one live candidate
  on data version `netquity-basicdata-80cfa8bd1c73.v1`; response hashes
  `6137ab2e0385bffd3c3bedf3389c63545c484df274e17c079ddf9f1fee48aae1`,
  `33c6791822b385d1196d5443517096925df0c3e17546168f54e07495553a483b`,
  `dbcff01638426680b6fe719062751583334568d9f1487950779f31e87b5aca8e`,
  and `11c7ecad3566797c9d2d69edae0c372f15776d63a675747516e7797b678cacb5`.
  Invalid/oversized bearer returned 403, oversized query 400, unknown alias 404.
- Production Worker version stayed
  `0ab3f7d0-517e-4fa3-91b7-1ccc92e90a88` before and after all staging deploys.
- Local verification: targeted + full Worker/security-tools surface `290/290`,
  contract check `ok`, env/database checks `ok`, all-workspace typecheck `ok`,
  and `git diff --check` clean.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates
