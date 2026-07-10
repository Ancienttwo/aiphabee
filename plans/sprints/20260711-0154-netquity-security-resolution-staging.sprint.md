# Sprint: Netquity staging security resolution

> **Status**: Done
> **Approved**: user `go on`, 2026-07-11
> **Slug**: netquity-security-resolution-staging
> **Created**: 2026-07-11 01:54
> **Updated**: 2026-07-11 03:42
> **Source PRD**: none; bounded brownfield activation from `plans/plan-netquity-pg-mirror.md`
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: incremental

Program-level sprint container. The Source PRD summary and ordered backlog
decompose product intent into ordered rows. Contract rows become task-contract
slices after `$think` expansion; inline rows stay in the sprint backlog or
active plan Task Breakdown.
`tasks/todos.md` stays the deferred-goal ledger and never carries this backlog.

## PRD

Turn the already verified Netquity `BasicData.Stock` mirror into one released,
versioned staging security-resolution snapshot and prove an authenticated live
read through the real AiphaBee staging Hyperdrive. This sprint deliberately
stops before public web/API activation because the current tool route is
unauthenticated and the P0 field-rights surface remains default-deny.

### Problem

- PlanetScale staging contains 18,036 verified `nq_basicdata.stock` rows, but
  `resolve_security` still reads four synthetic records and reports
  `liveDataAccess=false`.
- The staging runtime role has no `aiphabee_core` or `nq_basicdata` access, so
  the live path cannot accidentally work through elevated or raw-mirror
  credentials.

### Users

- AiphaBee operators validating licensed-data activation in staging.
- The later authenticated product route, which will consume the same released
  snapshot after a separate rights/auth cutover.

### Success Criteria

- Promote exactly 18,036 rows from BasicData content hash
  `80cfa8bd1c737750199ceaf0f8f0bfe5c71d7f3cb074d6ae51da5cb394f8c861`
  into one released `security_master` serving snapshot.
- Resolve exact code, canonical symbol, English, Traditional Chinese, and
  Simplified Chinese names through the deployed staging Worker with
  `liveDataAccess=true` and Netquity-bound provenance.
- Keep the AiphaBee runtime role non-owner/non-bypass/no-CREATE, grant it SELECT
  only on the five serving metadata/record tables, and prove it still has no
  `nq_*` access or write privilege.
- Missing authorization, binding, released snapshot, or database availability
  fails closed; no request falls back to synthetic records.

### Acceptance Scenarios

- Given a valid operator token and `00700.HK`, the guarded staging route returns
  one live candidate whose source record is bound to the released Netquity
  snapshot.
- Given an exact multilingual instrument name, the same route returns the
  corresponding candidate without fuzzy or semantic inference.
- Given an absent/invalid token, the route returns 403 before opening
  Hyperdrive; given a missing binding it returns 424; given no released snapshot
  or a database failure it returns an explicit non-success response.
- Given more than 25 exact candidates, the route rejects the result instead of
  truncating ambiguity.

### Non-goals

- Replacing the public `/tools/resolve-security` synthetic scaffold.
- Production deployment, web UI activation, MCP/export access, profile/history,
  fuzzy matching, `RelatedCode`, prices, financials, or daily automation.
- Granting the runtime role access to raw `nq_*` schemas or any write privilege.

## Architecture Notes

### Capabilities Touched

- `packages/security-tools`: live candidate/result contract and exact input
  normalization without synthetic fallback.
- `apps/worker`: guarded staging-only Hyperdrive adapter and hash-only live
  acceptance surface.
- `aiphabee_core.serving_*`: versioned/released snapshot storage; the raw mirror
  remains upstream authority.
- Database roles/contracts: narrow read grant to `aiphabee_runtime_rls`.

### Dependency Order

1. Add the idempotent serving promotion + role policy and their contract checks.
2. Apply/publish the versioned staging snapshot and read grants.
3. Add the guarded Worker route and unit/integration tests.
4. Deploy only `aiphabee-worker-staging`, run live symbol/name/failure-path
   acceptance, and record hash-only evidence.

### Risks

- Public exposure: the existing tool route has no real auth middleware. The
  live route therefore remains operator-token guarded and separate.
- Semantic drift: do not manufacture missing dates or company identities;
  preserve nullable `validFrom` and use opaque `hkex_security_<code>` IDs.
- Scale: exact alias lookup uses a GIN-indexed normalized alias array and reads
  at most 26 candidates, rejecting rather than truncating over-limit results.
- Rollback: withdraw the data version, revoke the five SELECT grants, and
  redeploy staging without the guarded route; do not delete raw mirror rows.

## Backlog

Ordered execution queue; keep rows in dependency order. Mode `contract` runs
the full plan -> contract -> worktree flow; `inline` allows primary-tree
execution for small tasks. Every row needs a concrete acceptance line.

| # | Status | Task | Mode | Acceptance | Plan |
|---|--------|------|------|------------|------|
| 1 | [x] | Promote and prove guarded Netquity security resolution on staging | contract | 18,036/18,036 rows promoted; role/read/release checks pass; guarded symbol + multilingual live smokes pass with `liveDataAccess=true`; failure paths prove no synthetic fallback; production unchanged | `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md` |

## Execution Log

Keep this section last; `repo-harness run sprint-backlog complete-task` appends rows here.

| When | Task | Plan | Result |
|------|------|------|--------|
| 2026-07-11 03:42 | Promote and prove guarded Netquity security resolution on staging | `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md` | done |
