# Plan: Establish Better Auth identity authority on staging

> **Status**: Completed
> **Created**: 20260711-0400
> **Slug**: establish-better-auth-identity-authority-on-staging
> **Planning Source**: waza-think
> **Orchestration Kind**: sprint-task
> **Source Ref**: sprint:plans/sprints/20260711-0357-authenticated-netquity-web-resolver.sprint.md#Establish Better Auth identity authority on staging
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: local schema and role plus deployed GitHub OAuth session lifecycle
> **Rollback Surface**: staging Web deployment auth binding and secrets only
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md`
> **Task Review**: `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md`
> **Implementation Notes**: `tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260711-0357-authenticated-netquity-web-resolver.sprint.md#Establish Better Auth identity authority on staging
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md`
- Sprint contract: `tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md`
- Sprint review: `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md`
- Implementation notes: `tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md`.

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
- Contract file: `tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md`
- Review file: `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md`
- Implementation notes file: `tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: staging Web deployment auth binding and secrets only
- **Verification boundary**: local schema and role plus deployed GitHub OAuth session lifecycle
- **Review/acceptance boundary**: `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md`, `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md`, and `tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: staging Web deployment auth binding and secrets only

## Captured Planning Output

# Establish Better Auth Identity Authority On Staging

## Why

The released Netquity staging snapshot cannot be attached to a product user while
`apps/web` uses a hard-coded session and the Worker has no verified session
authority. This work-package establishes the identity boundary only. It does not
activate live market-data reads.

## Goal

Deploy an invite-only Better Auth GitHub OAuth session flow on
`aiphabee-web-staging`, backed by an isolated PlanetScale auth schema and role,
and map the stable Better Auth user id to the canonical
`platform.account.auth_subject` field without granting the auth runtime product,
Serving, governance, or raw-Netquity privileges.

## Scope

- Add Better Auth to the existing TanStack Start Web Worker using the official
  TanStack handler and PostgreSQL adapter.
- Store Better Auth core user/session/account/verification rows under the
  dedicated `aiphabee_auth` schema through `AIPHABEE_AUTH_HYPERDRIVE`.
- Add a convergent database migration that makes `platform.account.auth_subject`
  the sole future runtime identity key. Existing product rows and the legacy
  `auth_user_id` column remain untouched; runtime code must never read or fall
  back to `auth_user_id`.
- Add a least-privilege staging auth role with schema/table/sequence privileges
  limited to `aiphabee_auth`; it must have no privilege on `platform`,
  `aiphabee_core`, `aiphabee_governance`, `aiphabee_audit`, or `nq_*` schemas.
- Add `/login` and `/account` Web surfaces that expose GitHub sign-in, verified
  session readback, logout, and revoke-all-sessions without displaying raw
  provider tokens or session secrets.
- Add the staging Web Worker configuration, secret/env contracts, contract
  checker, unit/integration tests, and a redacted live-smoke script.
- Deploy only staging and record version/hash/status evidence. Production Worker
  and Web configuration must remain unchanged.

## Non-goals

- Netquity resolver activation, private Worker RPC, field-rights loading, or
  product-data reads.
- Automatic platform account/workspace provisioning, billing, password login,
  magic-link/email delivery, Google OAuth, Cloudflare Access, MCP/API/export, or
  production deployment.
- Accepting email, request headers, or request-body workspace ids as identity.

## Architecture And Concrete Trace

`Browser -> aiphabee-web-staging /api/auth/* -> Better Auth ->
AIPHABEE_AUTH_HYPERDRIVE -> aiphabee_auth.*`.

GitHub is the upstream identity proof. Better Auth owns provider exchange,
session issuance, rotation, and revocation. PlanetScale owns durable auth rows.
The later product-data slice will pass only `better-auth:<user.id>` over a private
RPC boundary, then resolve the platform account inside the API Worker. This slice
therefore does not let the Web auth role read the mapping table.

## Key Decisions

- Add one runtime dependency, `better-auth`; reuse the already-installed `pg`
  driver and Cloudflare `nodejs_compat` instead of adding an ORM.
- Use Better Auth's generated PostgreSQL schema as input, then commit an explicit
  reviewed migration rather than running interactive schema migration in staging.
- Use `better-auth:<user.id>` as the exact canonical auth subject. Email is
  display/contact metadata only and is never the lookup key.
- Keep signup invite-only. GitHub OAuth may create the Better Auth user, but no
  product access exists until a later admin packet maps that subject.
- Store `BETTER_AUTH_SECRET` and `GITHUB_CLIENT_SECRET` only as Cloudflare
  secrets; `GITHUB_CLIENT_ID` may be a non-secret staging variable. No raw value
  may enter git, logs, evidence packets, tests, or task notes.
- Fail closed when any binding, secret, trusted origin, callback, database, or
  verified session is absent. No mock session or password fallback is allowed.

## Files And Interfaces

- `apps/web/package.json`, root lockfile: Better Auth dependency only.
- `apps/web/src/lib/auth.server.ts`: Better Auth configuration and PostgreSQL
  pool factory from the auth Hyperdrive binding.
- `apps/web/src/lib/auth-client.ts`: browser client.
- `apps/web/src/routes/api/auth/$.ts`: official TanStack Start auth handler.
- `apps/web/src/routes/login.tsx`, `apps/web/src/routes/account/index.tsx`, and
  session context/tests: real session UI and actions.
- `apps/web/wrangler.jsonc` and generated bindings: staging auth Hyperdrive and
  non-secret origin/client-id configuration.
- `deploy/database/migrations/<timestamp>_authenticated_web_identity.sql`:
  `aiphabee_auth` tables plus canonical `auth_subject` convergence.
- `deploy/database/roles/authenticated-web-identity-staging.sql`: narrow role.
- `deploy/account/authenticated-web-identity-staging.contract.json`, checker,
  fixtures, package scripts, and governance note: executable contract.
- `scripts/smoke-authenticated-web-identity-staging.mjs`: redacted login/session,
  logout/revoke, role-privilege, production-version, and no-secret evidence.

This is expected to touch more than eight files because schema, runtime, UI,
tests, contract, and deployment evidence are separate authorities. It adds no
new service and no abstraction beyond the Better Auth boundary already required
by the approved design.

## Task Breakdown

- [x] Add the failing contract/tests for binding, secret, session, canonical
  subject, invite-only, and privilege behavior.
- [x] Install and configure Better Auth with the dedicated auth Hyperdrive.
- [x] Generate, review, and commit the auth/canonical-subject migration and
  least-privilege staging role packet.
- [x] Replace the Web mock session surface with login/account/session/logout and
  revoke behavior while keeping product data inaccessible.
- [x] Add contract checker, fixtures, env/secret registration, and redacted live
  smoke.
- [x] Apply the migration/role to the staging PostgreSQL database and prove
  the role's positive and negative privilege matrix.
- [x] Deploy `aiphabee-web-staging`, run GitHub login/session/logout/revoke live
  acceptance, and verify production versions are unchanged.
- [x] Run review and verify-sprint, then open the Row 1 pull request.

## Verification Boundary

- `npm run check:authenticated-web-identity`
- Targeted Web auth tests plus the full Web typecheck/build.
- `npm run check:database`, `npm run check:env`, and `npm run typecheck`.
- Local PostgreSQL apply/readback using the narrow auth role.
- Staging GitHub OAuth callback, session readback, logout, revoke-all, expired or
  invalid session, missing binding/secret, and unprovisioned-product denial.
- Cloudflare version readback before/after proving production unchanged.
- `git diff --check`, contract verification, `$check`, external acceptance, and
  `repo-harness run verify-sprint`.

## Rollback Surface

Remove the staging Web auth routes/binding and deploy the prior Web version;
revoke/delete the staging GitHub OAuth secret and dedicated auth login. Leave
auth tables and canonical `auth_subject` column in place because they are
non-destructive and unused when the route is absent. Never roll back to the mock
session as an authenticated product claim.

## Stop Conditions

- Stop before deployment if the GitHub OAuth callback URL, client id/secret, or
  Better Auth secret is unavailable.
- Stop before database apply if the target is not the shared staging database or
  the apply credential cannot prove its current database/user.
- Stop if generated Better Auth SQL requests privileges outside
  `aiphabee_auth`, mutates existing product data, or requires a compatibility
  runtime read from `auth_user_id`.
- Stop if the auth role can read or write any product, Serving, governance,
  audit, or raw-Netquity schema.
- Stop if production Worker/Web version changes at any point.

## Promotion Gate

- Merge unit: one identity-foundation work-package with migration, runtime, UI,
  tests, contract, and staging evidence.
- Rollback surface: staging Web deployment and auth binding/secrets only.
- Verification boundary: local schema/role plus deployed OAuth/session lifecycle.
- Review boundary: auth, secret handling, session revocation, schema privilege,
  and production isolation require an independent review.
- Promotion reason: this crosses identity, database-write, Cloudflare deployment,
  and security boundaries and cannot remain an inline checklist row.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Add failing contract/tests for binding, secret, session, canonical subject, invite-only, and privilege behavior.
- [x] Install and configure Better Auth with the dedicated auth Hyperdrive.
- [x] Generate, review, and commit the auth/canonical-subject migration and least-privilege staging role packet.
- [x] Replace the Web mock session surface with login/account/session/logout and revoke behavior while keeping product data inaccessible.
- [x] Add contract checker, fixtures, env/secret registration, and redacted live smoke.
- [x] Apply the migration/role to the staging PostgreSQL database and prove the role's positive and negative privilege matrix.
- [x] Deploy `aiphabee-web-staging`, run GitHub login/session/logout/revoke live acceptance, and verify production versions are unchanged.
- [x] Run review and verify-sprint, then open the Row 1 pull request.
