# Plan: Netquity staging security resolution

> **Status**: Archived
> **Created**: 20260711-0209
> **Slug**: netquity-security-resolution-staging
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260711-0154-netquity-security-resolution-staging.sprint.md#1
> **Artifact Level**: work-package
> **Promotion Reason**: Activate the verified Netquity raw mirror through a versioned, released, operator-guarded staging security resolver.
> **Verification Boundary**: Local contract/type/tests plus PostgreSQL role/promotion simulation and real staging promotion, least-privilege, deploy, symbol/name, and failure-path readback.
> **Rollback Surface**: Withdraw the serving data version, revoke five SELECT grants, remove the staging secret, and redeploy staging without touching raw mirror or production.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md`
> **Task Review**: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md`
> **Implementation Notes**: `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md`

## Agentic Routing
- Selected route: netquity-security-resolution-staging
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260711-0154-netquity-security-resolution-staging.sprint.md#1
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md`
- Sprint contract: `tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md`
- Sprint review: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md`
- Implementation notes: `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md`.

## Approach
### Strategy
Use the captured planning output below as the execution source of truth.

### Trade-offs
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Captured plan | Preserves the approved Codex Plan or Waza think decision | Requires the captured text to be concrete enough to execute | Use |

## Detailed Design
### File Changes
| File | Action | Description |
|------|--------|-------------|
| See captured planning output | Follow | Implement only the approved scope named below |

### Code Snippets
See captured planning output.

### Data Flow
See captured planning output.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Captured plan lacks enough detail | Medium | Execution may need clarification | Stop before implementation if the captured output contradicts repo rules or lacks concrete file targets |

## Task Contracts
- Contract file: `tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md`
- Review file: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md`
- Implementation notes file: `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Withdraw the serving data version, revoke five SELECT grants, remove the staging secret, and redeploy staging without touching raw mirror or production.
- **Verification boundary**: Local contract/type/tests plus PostgreSQL role/promotion simulation and real staging promotion, least-privilege, deploy, symbol/name, and failure-path readback.
- **Review/acceptance boundary**: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: Activate the verified Netquity raw mirror through a versioned, released, operator-guarded staging security resolver.

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md`, `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md`, and `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Withdraw the serving data version, revoke five SELECT grants, remove the staging secret, and redeploy staging without touching raw mirror or production.

## Captured Planning Output

## Agentic Routing

- Selected route: one contract-level, staging-only licensed-data activation slice.
- Routing reason: the raw mirror and remote parity are complete, while the current
  `resolve_security` route still returns four synthetic records. Repo inspection
  also proved that the public tool route has no real auth middleware and the
  staging runtime login has no access to either `nq_basicdata` or
  `aiphabee_core`; opening the public route now would violate default-deny.
- Due diligence:
  - P1 map: `_ref/Sample/BasicData.mdb` is the ignored licensed source;
    `nq_basicdata.stock` is its 18,036-row PlanetScale raw mirror;
    `aiphabee_core.{raw_source_batch,data_version_batch,serving_dataset,
    serving_field,serving_snapshot,serving_record}` are the version/release
    boundary; `packages/security-tools` owns result semantics;
    `apps/worker` owns Hyperdrive and HTTP; `aiphabee_runtime_rls` is the
    staging Worker login; `_ops/` owns temporary apply evidence.
  - P2 trace: verified BasicData content hash -> transactional staging promotion
    -> released serving snapshot -> narrow runtime-role SELECT -> guarded Worker
    Hyperdrive query -> exact alias match -> live candidate envelope -> hash-only
    acceptance evidence. Any missing token, binding, released snapshot, or DB
    result stops before a candidate is emitted.
  - P3 decision rationale: use an existing `serving_record` snapshot instead of
    querying raw `nq_*` tables from the app or forcing vendor instrument names
    into the stricter `company` schema. This preserves a release/data-version
    gate, keeps raw schemas unreachable from runtime, and avoids inventing legal
    company identities or instrument types.

## Goal and Success Contract

Promote the verified Netquity BasicData snapshot into one released
`security_master` serving snapshot and prove exact symbol/name resolution through
the actual AiphaBee staging Hyperdrive. The delivered capability is an
operator-token-guarded staging acceptance route, not a public product cutover.

Done means all of the following are true:

- Source identity is pinned to SHA-256
  `80cfa8bd1c737750199ceaf0f8f0bfe5c71d7f3cb074d6ae51da5cb394f8c861`,
  source batch `src_netquity_basicdata_80cfa8bd1c73`, data version
  `netquity-basicdata-80cfa8bd1c73.v1`, and source as-of
  `2026-07-11T00:00:00+08:00`.
- Promotion preflight and readback both prove 18,036 source rows, 18,036 serving
  records, unique five-digit HKEX codes, complete English/Traditional/Simplified
  names, complete market/currency/trading status, and status partition
  `listed=17,555`, `suspended=141`, `delisted=340` at the pinned as-of date.
- A valid guarded request resolves exact code, canonical symbol, English name,
  Traditional Chinese name, and Simplified Chinese name with
  `liveDataAccess=true`, a released data version, and Netquity source-record
  provenance.
- The runtime role can SELECT only the five required serving tables, has no
  `nq_*` schema access, no writes, no CREATE, no ownership, and no RLS bypass.
- No live failure path calls the synthetic resolver or returns synthetic
  provenance.
- Only `aiphabee-worker-staging` is deployed; production Worker, production
  Hyperdrive, and `aiphabee-prod` are unchanged.

## Scope

### Building

- An idempotent staging promotion SQL packet for the existing serving-store
  tables, with exact preconditions, transactionality, released snapshot
  metadata, normalized exact aliases, and one GIN payload index.
- If shared staging lacks the canonical Serving Store objects, apply only the
  existing foundational migrations
  `20260620082000_security_master_raw_snapshot_scaffold.sql` and
  `20260620091000_serving_store_scaffold.sql` before promotion; do not create an
  ad-hoc staging schema or apply later unrelated migrations.
- A staging role policy granting `aiphabee_runtime_rls` USAGE on
  `aiphabee_core` and SELECT on only
  `raw_source_batch`, `data_version_batch`, `serving_dataset`,
  `serving_snapshot`, and `serving_record`.
- Pure security-resolution mapping/validation for database rows, keeping the
  existing synthetic scaffold explicitly separate.
- Guarded `POST /tools/resolve-security/live-smoke`, requiring
  `x-aiphabee-smoke: netquity-security-resolution-v1` and bearer secret
  `AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN` before Hyperdrive access.
- Contract checks, unit/route tests, remote apply/readback, staging deploy,
  symbol/multilingual/failure-path live smokes, and hash-only evidence.

### Not building

- Public `/tools/resolve-security` replacement, `/stock` UI activation,
  production deployment, MCP/export exposure, generic Serving Store executor
  activation, profile/history, fuzzy search, `RelatedCode`, prices, financials,
  daily promotion, or runtime access to raw `nq_*` tables.

## Chosen Approach

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Query `nq_basicdata.stock` directly from Worker | Fewest lines | Exposes raw schema to runtime; no release/data-version gate | Rejected |
| Replace the public synthetic route immediately | User-visible quickly | Current route is unauthenticated and rights remain default-deny | Rejected |
| Add only a guarded raw SELECT smoke | Minimal connectivity proof | Does not prove normalized contract, release state, or provenance | Rejected as insufficient |
| Promote to released `serving_record` snapshot and expose a guarded exact resolver | Reuses existing data/version/release model; runtime never sees raw tables; rollback is withdrawal | More tracked contract surfaces and one promotion step | Chosen |

This plan assumes the user's Netquity authorization permits operator-only
staging validation of the security-master fields. If that premise is later
narrowed, the data version is switched from `released` to `held`, the runtime
SELECT grants are revoked, and the guarded route returns no released data; no
public exposure or destructive raw-data rollback is required.

## Detailed Design

### Promotion and data contract

- Promotion SQL aborts unless the source inventory and quality counts equal the
  pinned figures above. It never infers around a failed precondition.
- One serving record is written per `nq_basicdata.stock.code` with opaque IDs
  `hkex_security_<five-digit-code>` and source record IDs
  `netquity:basicdata.stock:<five-digit-code>`.
- Payload fields are `code`, `symbol`, `exchange`, `market`, `currency`,
  multilingual `name`, nullable `validFrom`, nullable `validTo`,
  `listingStatus`, and normalized exact alias entries with their match reason.
- `symbol` is `<five-digit-code>.HK`; IDs do not infer equity/ETF/warrant type.
- `listingStatus` is `delisted` when vendor `lastlistdate` is before the pinned
  as-of date, otherwise `suspended` for vendor `tradingstatus='S'`, otherwise
  `listed` for vendor `tradingstatus='N'`. Unknown values fail promotion.
- Missing listing dates remain absent. The live result contract changes
  `validFrom` from required to optional rather than fabricating a date.
- Aliases are exact normalized values only: unpadded/padded code forms,
  canonical `.HK`, `HK:` prefix, and the six authoritative instrument-name
  columns. No fuzzy, transliteration, substring, or semantic matching exists.
- The route queries only the newest released snapshot for dataset
  `security_master`, reads at most 26 rows, returns at most 25, and rejects 26
  instead of truncating ambiguity.

### Runtime and failure contract

- Authorization is checked with constant-time bearer comparison before reading
  the Hyperdrive binding.
- Response statuses are fixed: 403 invalid/missing authorization, 424 missing
  binding, 409 no released snapshot or candidate limit exceeded, 404 exact
  alias not found, 502 query/readback failure, and 200 for resolved/ambiguous
  live results.
- Logs and tracked evidence contain only counts, versions, table names, status,
  and SHA-256 values. Vendor names and row payloads never enter git.
- The existing `/tools/resolve-security` synthetic route is not called from the
  guarded route. Its public cutover is deferred, not used as a fallback.

### Data flow

```text
licensed BasicData.mdb
        |
        v
nq_basicdata.stock (raw mirror, runtime cannot access)
        |
        v  staging promotion/admin transaction
released aiphabee_core security_master serving snapshot
        |
        v  five-table SELECT grant only
AIPHABEE_HYPERDRIVE -> aiphabee_runtime_rls
        |
        v
guarded live-smoke route -> exact resolver -> hash-only acceptance evidence
```

There is no write/read cycle from Worker back into the raw mirror.

## File and Abstraction Inventory

This slice touches more than eight files because database policy, runtime,
contract checks, tests, and workflow evidence are separate authority surfaces.
It adds no service, package, runtime, language, or third-party dependency.

| File | Action | Purpose |
|---|---|---|
| `plans/sprints/20260711-0154-netquity-security-resolution-staging.sprint.md` | update | Approved one-row Sprint container |
| `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md` | add | Decision-complete work package |
| `deploy/ingest/netquity-security-resolution-staging.sql` | add | Idempotent promotion/index/readback packet |
| `deploy/ingest/netquity-security-resolution-staging.contract.json` | add | Source/version/field/role/route contract |
| `deploy/database/roles/netquity-security-serving-staging.sql` | add | Narrow runtime SELECT policy |
| `scripts/check-netquity-security-resolution-staging-contract.mjs` | add | Static SQL/contract/package verification |
| `package.json` | update | Add targeted contract check command |
| `packages/security-tools/src/index.ts` | update | Live-row contract, exact normalization, result mapping |
| `packages/security-tools/src/index.test.ts` | update | Symbol/name/nullable-date/ambiguity/over-limit tests |
| `apps/worker/src/index.ts` | update | Guarded Hyperdrive route and fail-closed adapter |
| `apps/worker/src/netquity-security-resolution-live.test.ts` | add | Auth/binding/DB/release/no-fallback route tests |
| `deploy/env/env.schema.json` | update | Names-only staging smoke secret contract |
| `deploy/env/{.env,dev.env,staging.env,prod.env}.example` | update | Keep the repository-wide env-name parity gate aligned; values remain blank |
| `deploy/secrets/stores.contract.json` | update | Secret-store ownership without a value |
| `tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md` | add after plan approval | Allowed paths and machine acceptance |
| `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md` | add after plan approval | Redacted implementation/live evidence |
| `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md` | add at review | Independent acceptance verdict |

New abstractions are limited to one live database-row mapper and one guarded
Worker adapter. The mapper keeps SQL rows out of domain code; the adapter keeps
Hyperdrive/auth/failure behavior out of pure matching logic. Existing `pg`,
Hono, security-tools, serving tables, Hyperdrive config, and role are reused.

## External Dependencies and Credentials

- Cloudflare Wrangler OAuth: already reachable; owns staging Worker deploy and
  temporary ignored apply Worker.
- PlanetScale shared staging through Hyperdrive
  `1e83eb563db44746a168175e065cc958`: already contains the verified raw mirror.
- Staging runtime Hyperdrive `755ab0a9b0404e10be1f8ab1c736358a`:
  live readback confirms origin user `aiphabee_runtime_rls.v20dtpdoz3ik` and SQL
  cache disabled.
- Existing macOS Keychain services remain the only direct credential stores.
- New Wrangler secret
  `AIPHABEE_NETQUITY_SECURITY_RESOLUTION_SMOKE_TOKEN`: authorizes only the
  guarded staging smoke route; its value is never committed or printed.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Public data leak through existing unauthenticated tool route | High if cut over now | High | Separate bearer-guarded route; public route unchanged |
| Runtime role gains raw or write access | Low | High | Explicit five-table SELECT grant; remote negative privilege readback |
| Source semantics are guessed | Medium | High | Exact vendor fields only; opaque IDs; nullable dates; unknown status aborts |
| External DB/Hyperdrive failure | Medium | Medium | Explicit 424/502; no synthetic fallback |
| Exact-name collision explodes candidates | Low now, higher at 10x | Medium | GIN alias index, LIMIT 26, reject over 25 |
| Promotion partially commits | Low | High | One transaction plus exact post-commit readback |
| Direction is wrong after staging | Low | Low | Withdraw version + revoke grants + redeploy; raw mirror untouched |

At 10x records, alias lookup is index-backed; promotion transaction duration and
GIN index maintenance fail first. That is acceptable for a one-shot staging
snapshot. Daily incremental promotion is a separate slice with bounded batches.

## Verification and Acceptance

Local/machine checks:

- `npm run check:netquity-security-resolution-staging`
- targeted `security-tools` tests
- targeted Worker route tests
- `npm run check:database`
- `npm run check:env`
- `npm run typecheck`
- `git diff --check`
- ephemeral PostgreSQL apply of promotion/role SQL against the canonical schema

Remote staging checks:

- Preflight raw counts and fixed quality/status partition.
- Canonical security-master/raw-snapshot and Serving Store foundation inventory;
  apply the two existing foundational migrations only when those objects are
  absent, then read them back before promotion.
- Transactional promotion and released-snapshot readback: 18,036/18,036.
- Runtime login readback: five allowed SELECT tables; zero writes; no raw schema
  USAGE; no CREATE/owner/bypass.
- Deploy `aiphabee-worker-staging` only.
- Valid symbol plus English/Traditional/Simplified exact-name live smokes.
- Invalid token, missing binding fixture, no-release fixture, over-limit fixture,
  and forced database error all return their fixed non-success status.
- Response evidence proves `liveDataAccess=true`, released data version, and no
  synthetic source; tracked notes store hashes/counts only.
- High-risk SQL/auth diff receives second-model review before merge.

## Rollback and Stop Conditions

- Normal rollback: mark data version `withdrawn`, revoke the five SELECT grants,
  remove the staging secret, and redeploy staging without the guarded route.
- Do not delete `nq_*` source data or deploy any change to production.
- Stop before remote apply if source counts/hash/version differ, the role already
  has unexpected privilege, or the promotion cannot represent all rows without
  invented values.
- Stop before deployment if the guarded route can reach synthetic records or an
  auth failure opens Hyperdrive.
- Stop before merge if remote privilege/read/release readback or independent
  review is not green.

## Workflow Inventory

- Active plan: `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md`
- Sprint: `plans/sprints/20260711-0154-netquity-security-resolution-staging.sprint.md`
- Contract: `tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md`
- Review: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md`
- Notes: `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md`
- Deferred ledger: `tasks/todos.md`
- Checks: `.ai/harness/checks/latest.json`
- Execution isolation: project through `repo-harness run plan-to-todo`, verify
  the strict contract, then start a contract worktree. Main stays unchanged
  until reviewed merge.

## Promotion Gate

- Merge/PR unit: one staging security-resolution contract slice.
- Verification boundary: local contract/type/test suite + PostgreSQL role/promotion
  simulation + real staging promotion/role/deploy/live failure-path readback.
- Review boundary: independent second-model verdict over main plus the entire
  worktree diff and live evidence hashes.
- High-risk surface: remote data-version release, database grants, guarded auth,
  and public-route separation.
- Why not an inline checklist row: it changes remote database state, role policy,
  Worker auth behavior, and data-release evidence across more than eight files.

## Deferred Unknowns

- Public `/tools/resolve-security` cutover is owned by a later auth/rights sprint;
  it requires a real user session and approved channel/field policy.
- Stable product-wide instrument IDs and profile/history joins are owned by the
  later security-master normalization sprint; this slice uses opaque HKEX IDs.
- `RelatedCode`, fuzzy search, and daily incremental promotion are explicitly
  deferred until authoritative semantics/delivery behavior are separately proven.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Generate and strict-verify the task contract/worktree scope.
- [x] Implement promotion SQL, role policy, JSON contract, and static checker.
- [x] Implement pure live-row mapping and exact alias tests in security-tools.
- [x] Implement guarded Worker Hyperdrive adapter and all failure-path tests.
- [x] Run targeted/full relevant local validation and ephemeral PostgreSQL apply.
- [x] Apply promotion + grants to shared staging and prove role/release readback.
- [x] Deploy staging only and run symbol/multilingual/negative live acceptance.
- [x] Run second-model review, bind redacted notes/review evidence, merge, and
  clean up the feature branch/worktree.
