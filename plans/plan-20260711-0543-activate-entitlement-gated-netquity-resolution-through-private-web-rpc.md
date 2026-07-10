# Plan: Activate Entitlement-Gated Netquity Resolution Through Private Web RPC

> **Status**: Completed
> **Created**: 20260711-0543
> **Slug**: activate-entitlement-gated-netquity-resolution-through-private-web-rpc
> **Planning Source**: waza-think
> **Orchestration Kind**: sprint-task
> **Source Ref**: sprint:plans/sprints/20260711-0357-authenticated-netquity-web-resolver.sprint.md#Activate entitlement-gated Netquity resolution through private Web RPC
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: staging Better Auth session through private RPC, RLS entitlement loader, and released Netquity Serving read
> **Rollback Surface**: staging Web/API deployments and explicit initial provisioning rows only
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md`
> **Task Review**: `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md`
> **Implementation Notes**: `tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260711-0357-authenticated-netquity-web-resolver.sprint.md#Activate entitlement-gated Netquity resolution through private Web RPC
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md`
- Sprint contract: `tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md`
- Sprint review: `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md`
- Implementation notes: `tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md`.

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
- Contract file: `tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md`
- Review file: `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md`
- Implementation notes file: `tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: staging Web/API deployments and explicit initial provisioning rows only
- **Verification boundary**: staging Better Auth session through private RPC, RLS entitlement loader, and released Netquity Serving read
- **Review/acceptance boundary**: `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md`, `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md`, and `tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: staging Web/API deployments and explicit initial provisioning rows only

## Captured Planning Output

# Activate Entitlement-Gated Netquity Resolution Through Private Web RPC

## Why

Row 1 established a verified, revocable Better Auth session, but the product
search still calls the public synthetic `POST /tools/resolve-security` route.
The released Netquity staging snapshot may be exposed only after the API Worker
derives account, workspace, subscription, and exact Web field rights from
database authority. Caller-provided identity, email, workspace, or a public
header must never enter that decision.

## Goal

Make the staging stock-search path call a TanStack server function that derives
`better-auth:<user.id>` from the server-validated session and invokes a named
Cloudflare `WorkerEntrypoint` over a service binding. Inside the API Worker,
resolve the mapped account and one active entitled workspace under RLS, compile
live Web field rights, and only then execute the released Netquity exact-alias
query. Every missing, blocked, expired, ambiguous, or unavailable authority
fails closed with no synthetic fallback.

## Scope

- Add a POST TanStack server function for authenticated security resolution.
  It reads the incoming Cookie server-side, obtains the Better Auth session,
  derives the canonical subject, and calls `AIPHABEE_API`; its input contains
  only `query` and optional `market`.
- Add a named `AuthenticatedNetquityResolver` Worker RPC entrypoint. No public
  HTTP route dispatches to this class.
- Add a convergent database function that maps one exact canonical auth subject
  to one active account without exposing broad account-table reads. Grant the
  runtime only EXECUTE on that function plus SELECT on the exact RLS-protected
  account/workspace/subscription/entitlement tables and the already-approved
  released Serving tables.
- Load active membership, active subscription, product access, policy version,
  and exact `channel=web`, `dataset=security_master` field entitlements from
  PlanetScale. Require exactly one entitled workspace; zero denies and more
  than one fails as ambiguous rather than choosing for the caller.
- Reuse `createPolicyFromEntitlementRows` and `evaluateDataAccessRequest` from
  `@aiphabee/data-access-gateway`. The resolver requests the complete
  `ResolveSecurityCandidate` field set and denies the whole operation if any
  field is not approved; it never fabricates a partial candidate.
- Refactor the existing guarded Netquity live query into one internal function
  shared by the operator smoke route and the private RPC so the released
  snapshot, exact alias, candidate limit, provenance, and no-fallback behavior
  stay identical.
- Add a staging provisioning packet for the one existing verified Better Auth
  identity, one active workspace/subscription/product access row, and explicit
  Web field-entitlement rows. The packet must fail unless exactly one verified
  Better Auth user exists and must never print the raw auth subject.
- Configure only `aiphabee-web-staging` to bind to the named entrypoint on
  `aiphabee-worker-staging`; deploy staging only.
- Add executable contracts, fixtures, unit/integration tests, live smoke, role
  readback, redacted evidence, and a governance runbook.

This work-package intentionally touches more than eight files because Web
session handling, private RPC, RLS/database authority, field-rights evaluation,
staging provisioning, deploy bindings, tests, and evidence are separate
authoritative surfaces. It adds no new persistent service; the temporary live
acceptance caller/apply Workers are ignored operator state and are deleted after
readback.

## Non-Goals

- Production deployment or production Web creation.
- Changing the public synthetic `POST /tools/resolve-security` contract or
  exposing the named RPC through public HTTP.
- MCP, API, export, bulk, fuzzy, semantic, profile/history, quote, financial,
  or derived-data activation.
- Automatic account/workspace provisioning, caller-selected workspace,
  multi-workspace preference, billing-provider integration, or usage charging.
- Email, headers, request body, static bearer tokens, or Cloudflare Access as
  product identity authority.
- Compatibility fallbacks to the mock resolver, legacy `auth_user_id`, raw
  Netquity tables, or a second field-rights parser.

## Architecture And Concrete Trace

```text
Browser stock search
  -> TanStack createServerFn (same-origin + no-store)
    -> Better Auth getSession(Cookie)
      -> canonical better-auth:<uuid>
        -> AIPHABEE_API service binding
          -> AuthenticatedNetquityResolver.resolveSecurity
            -> platform.resolve_active_account_by_auth_subject(subject)
            -> SET LOCAL aiphabee.account_id + RLS reads
            -> membership/subscription/product/field-rights authority
            -> Data Access Gateway default-deny evaluation
            -> released aiphabee_core Serving snapshot exact-alias query
              -> typed envelope -> server function -> browser
```

The source of truth for identity is the Better Auth database session, for
workspace authority it is the RLS-protected platform rows, for distribution
rights it is the governance entitlement rows, and for security candidates it is
the released Serving snapshot. The sync/async boundaries are browser-to-server
function, Web-to-Worker RPC, and Worker-to-PostgreSQL. Authorization finishes
before the first Serving query. Database/RPC/binding errors return an explicit
unavailable envelope; no alternate route is attempted.

## Key Decisions

- Use a named `WorkerEntrypoint`, not HTTP forwarding. Cloudflare service
  bindings are account-internal and named entrypoints make the permission role
  explicit; direct public requests have no path to the RPC method.
- Use a security-definer lookup function with locked `search_path`, exact input
  validation, revoked PUBLIC access, and EXECUTE granted only to
  `aiphabee_runtime_rls`. The runtime cannot scan `platform.account` before its
  RLS claim is established.
- Require one entitled workspace instead of picking `MIN(workspace_id)` or
  accepting a caller workspace. Multi-workspace selection is a later product
  decision and therefore fails closed here.
- Require `billing_state=active`, active temporal bounds, active product access,
  active policy, approved workspace entitlements, and exact Web field rows.
  Trial/grace/paused semantics are not inferred in this slice.
- Keep exact fields explicit. A wildcard `security_master.*` would silently
  authorize future fields and violates default deny.
- Reuse the existing Data Access Gateway compiler/evaluator. A second local
  entitlement interpretation would create two semantic authorities.

## Fragile Assumption And Attacks

This plan assumes the shared staging database contains exactly one verified
Better Auth user when the initial provisioning packet runs. If it does not,
provisioning stops before writing and the operator must select a future explicit
admin workflow; the packet never guesses by email or row order.

- Dependency failure: missing auth DB, service binding, Hyperdrive, or database
  authority returns fail-closed `AUTH_REQUIRED`, `DATA_NOT_LICENSED`, or
  `INTERNAL_ERROR`; the public synthetic route is never used as degradation.
- Scale explosion: at 10x, the account-context + RLS entitlement query and
  session DB read are the first pressure points. Composite indexes and one
  request-scoped PostgreSQL connection bound fan-out; no per-field DB query is
  allowed.
- Rollback: deploy prior staging Web/Worker versions and delete the provisioning
  rows. The additive function/migration may remain unused. Production and raw
  schemas are untouched.

## Files And Interfaces

- `apps/web/src/lib/auth.server.ts` and tests: server session read helper with
  request-scoped pool close.
- `apps/web/src/lib/api/security.functions.ts`: validated POST server function,
  same-origin/no-store response, query/market only.
- `apps/web/src/lib/api/security.server.ts` and tests: session-to-RPC adapter with
  dependency injection for deterministic denial tests.
- `apps/web/src/lib/api/endpoints.ts`, `types.ts`, `routes/stock/index.tsx`:
  switch only stock resolution to the authenticated server function and expose
  login/denial UX without changing other API clients.
- `apps/web/wrangler.jsonc` plus generated bindings: staging-only `AIPHABEE_API`
  service binding to service `aiphabee-worker-staging`, entrypoint
  `AuthenticatedNetquityResolver`.
- `apps/worker/src/index.ts`: named RPC class, identity/entitlement loader, shared
  live Serving query, exact failure envelopes.
- `apps/worker/src/authenticated-netquity-web-resolver.test.ts` and existing
  Netquity/public-route tests: success/denial/order/no-fallback coverage.
- `deploy/database/migrations/<timestamp>_authenticated_netquity_web_resolver.sql`:
  exact subject lookup function and required indexes.
- `deploy/database/roles/authenticated-netquity-web-resolver-staging.sql`:
  narrow EXECUTE/SELECT privilege packet and positive/negative readback.
- `deploy/account/authenticated-netquity-web-resolver-staging.sql`: convergent
  initial invited account/workspace/subscription/product/field-rights packet.
- `deploy/account/authenticated-netquity-web-resolver-staging.contract.json`,
  checker, fixtures, smoke, package scripts, and governance note: executable
  contract and redacted acceptance.
- Generated Worker/Web binding types, migration ledger, and env/binding
  contracts are updated only where required by these interfaces.

## Task Breakdown

- [x] Add failing contract/fixture tests for the named RPC, session-only Web input,
  RLS account lookup, exact field rights, public-route isolation, and staging
  binding/deploy invariants.
- [x] Add the convergent subject-lookup migration, narrow runtime role packet,
  and initial invited staging provisioning packet with rollback/readback SQL.
- [x] Implement the Worker private RPC identity/workspace/subscription/rights
  loader and share the existing released Netquity query without a synthetic
  fallback.
- [x] Implement the TanStack authenticated server function and switch the stock
  search client to it without exposing auth subject or workspace input.
- [x] Add unit/integration tests for unauthenticated, unmapped, inactive or
  expired membership/subscription, no-rights, blocked-field, ambiguous
  workspace, missing binding, code/English/Traditional/Simplified success, and
  public HTTP isolation.
- [x] Apply migration/role/provisioning to staging, deploy the API Worker then Web
  staging binding, and prove exact deployment/binding/privilege readback.
- [x] Run live Web/RPC acceptance for success and negative fixtures, delete all
  temporary acceptance Workers/rows, and prove public HTTP and production
  deployments unchanged.
- [x] Run independent architecture/security review, strict contract and sprint
  verification, then open a stacked Row 2 pull request targeting Row 1.

## Verification Boundary

- `npm run check:authenticated-netquity-web-resolver`
- Targeted Web auth/server-function, Worker RPC/live resolver, Data Access
  Gateway, and security-tools tests.
- Web/Worker/root typecheck and staging builds with generated artifact checks.
- Database migration, role, provisioning, env/binding, and secret contract
  checks.
- Staging live code, English, Traditional Chinese, and Simplified Chinese exact
  resolution through the authenticated Web path.
- Live unauthenticated, unmapped, no-membership, inactive/expired subscription,
  no-rights, blocked-field, ambiguous-workspace, missing-binding, and invalid
  session denial before Serving reads.
- Direct public HTTP remains synthetic/non-live; named entrypoint is not
  publicly routable; `aiphabee-web` remains absent and production
  `aiphabee-worker` remains on its pinned version.
- `git diff --check`, secret scan, independent `/check`, strict contract, and
  `repo-harness run verify-sprint`.

## External Dependencies And Credentials

- Existing GitHub OAuth and Better Auth staging secrets: only for the already
  configured invited login; no new secret is introduced.
- Existing `AIPHABEE_AUTH_HYPERDRIVE`: Web session authority.
- Existing `AIPHABEE_HYPERDRIVE`: API Worker RLS and released Serving reads.
- Cloudflare service binding: staging Web to named staging API entrypoint.
- Existing operator Cloudflare/PlanetScale authority: migration/provisioning and
  hash/status/count-only readback. Raw values never enter git or evidence.

## Stop Conditions

- Stop if Row 1 PR/head no longer contains the verified Better Auth authority or
  if this branch cannot remain a clean stack on Row 1.
- Stop before DB apply unless the target branch/database/user and exactly one
  verified Better Auth user are read back.
- Stop if the subject lookup function exposes email, accepts legacy ids, grants
  PUBLIC, or lets the runtime enumerate accounts.
- Stop if any public HTTP request can invoke the private RPC identity path or if
  the Web request can supply auth subject/workspace/account.
- Stop if any authorization denial reaches the Serving snapshot query.
- Stop if any API/MCP/export entitlement becomes approved, the runtime gains
  write/raw-schema access, or production changes.

## Promotion Gate

- Merge unit: one stacked Row 2 work-package containing private RPC, authority
  migration/role/provisioning, Web server function, tests, and staging evidence.
- Verification boundary: deterministic Web/Worker/Gateway tests plus live
  identity-to-entitlement-to-Serving trace and negative fixtures.
- Review boundary: session derivation, RPC isolation, security-definer function,
  RLS/privileges, entitlement evaluation, live fixture cleanup, and production
  isolation require independent security and architecture closure.
- Rollback surface: staging API/Web deployments and the explicit initial
  provisioning rows; no production or raw Netquity mutation.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Add failing contract/fixture tests for the named RPC, session-only Web input,
- [x] Add the convergent subject-lookup migration, narrow runtime role packet,
- [x] Implement the Worker private RPC identity/workspace/subscription/rights
- [x] Implement the TanStack authenticated server function and switch the stock
- [x] Add unit/integration tests for unauthenticated, unmapped, inactive or
- [x] Apply migration/role/provisioning to staging, deploy the API Worker then Web
- [x] Run live Web/RPC acceptance for success and negative fixtures, delete all
- [x] Run independent architecture/security review, strict contract and sprint
