# Task Contract: establish-better-auth-identity-authority-on-staging

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: authenticated_web_identity
> **Last Updated**: 2026-07-11 05:26
> **Review File**: `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md`
> **Notes File**: `tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

The released Netquity snapshot cannot be exposed to a product user while the Web
application uses a mock session and the API Worker has no verified identity
authority. Shipping an over-privileged auth connection or treating email/header
values as identity would compromise every later workspace, entitlement, billing,
and data-rights decision.

## Goal

Deploy an invite-only Better Auth GitHub OAuth session flow on
`aiphabee-web-staging`, persist its core tables under an isolated
`aiphabee_auth` schema/role, and establish `platform.account.auth_subject` as the
sole future product mapping key. Prove login/session/logout/revoke behavior and
prove the auth role has no product, Serving, governance, audit, or raw-Netquity
privilege. Do not activate Netquity product reads in this slice.

## Scope

- In scope: Better Auth server/client integration in the TanStack Web Worker;
  GitHub OAuth; dedicated auth Hyperdrive; explicit auth schema and canonical
  subject migration; narrow staging auth role; login/account/session/logout and
  revoke UI/API; env/secret contracts; checker, fixtures, tests, redacted live
  smoke; staging-only deployment and production-version readback.
- Out of scope: Netquity resolver activation, private Web-to-API RPC,
  field-rights loading, automatic product account/workspace provisioning,
  billing, password or email login, Google OAuth, Cloudflare Access, MCP/API/
  export, and production deployment.
- Taste constraints: one identity authority; exact `better-auth:<user.id>`
  mapping; email is never an identity key; no mock/password/header fallback;
  secrets never enter git, logs, or evidence; fail closed on missing binding,
  secret, origin, callback, database, or session authority.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop before deployment if the GitHub OAuth callback URL, client id/secret, or
  `BETTER_AUTH_SECRET` is unavailable.
- Stop before remote apply if the target database/user cannot be read back as
  the shared staging authority.
- Stop if generated auth SQL requests privilege outside `aiphabee_auth`, mutates
  existing product rows, or introduces a runtime read/fallback from legacy
  `auth_user_id`.
- Stop if the auth role can read or write `platform`, `aiphabee_core`,
  `aiphabee_governance`, `aiphabee_audit`, or any `nq_*` schema.
- Stop if a production Worker/Web version changes.

## Falsifier

The direction is wrong if Better Auth cannot run in the existing TanStack Start
Cloudflare Worker against PostgreSQL through Hyperdrive without widening the auth
role beyond its own schema. The cheapest proof is a minimal Better Auth config
plus generated SQL applied to an isolated local PostgreSQL database, followed by
positive auth-table writes and negative cross-schema privilege probes.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md`
- Notes file: `tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-0400-establish-better-auth-identity-authority-on-staging.md
  - plans/sprints/20260711-0357-authenticated-netquity-web-resolver.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-0400-establish-better-auth-identity-authority-on-staging.contract.md
  - tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md
  - tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md
  - package.json
  - package-lock.json
  - apps/web/package.json
  - apps/web/tsconfig.json
  - apps/web/wrangler.jsonc
  - apps/web/worker-configuration.d.ts
  - apps/web/src/lib/auth.server.ts
  - apps/web/src/lib/auth.server.test.ts
  - apps/web/src/lib/auth-client.ts
  - apps/web/src/lib/context/SessionContext.tsx
  - apps/web/src/lib/context/SessionContext.test.tsx
  - apps/web/src/routes/api/auth/$.ts
  - apps/web/src/routes/login.tsx
  - apps/web/src/routes/account/index.tsx
  - apps/web/src/routeTree.gen.ts
  - deploy/database/migrations/20260711041000_authenticated_web_identity.sql
  - deploy/database/roles/authenticated-web-identity-staging.sql
  - deploy/database/migrations.contract.json
  - deploy/account/authenticated-web-identity-staging.contract.json
  - deploy/env/env.schema.json
  - deploy/env/.env.example
  - deploy/env/dev.env.example
  - deploy/env/staging.env.example
  - deploy/env/prod.env.example
  - deploy/secrets/stores.contract.json
  - scripts/check-authenticated-web-identity-staging-contract.mjs
  - scripts/check-authenticated-web-identity-staging-fixtures.mjs
  - scripts/check-database-migrations-contract.mjs
  - scripts/check-secret-stores-contract.mjs
  - scripts/smoke-authenticated-web-identity-staging.mjs
  - docs/governance/authenticated-web-identity-staging.md
  - _ops/authenticated-web-identity-staging/
```

## Delegation Contract

```yaml
delegation:
  budget:
    tokens: null
    tool_calls: null
    wall_time_minutes: null
  permission_scope:
    mode: inherit_allowed_paths
    writable_paths: []
    network: inherited
  roles:
    parent:
      mode: narrate_and_gatekeep
      purpose: approval_checkpoint_owner
    explorer:
      mode: read_only
      purpose: codebase_research
    worker:
      mode: edit_within_allowed_paths
      purpose: implementation
    verifier:
      mode: read_only
      purpose: exit_criteria_review
  runner:
    preferred:
      - main-thread
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - apps/web/src/lib/auth.server.ts
    - apps/web/src/lib/auth.server.test.ts
    - apps/web/src/lib/auth-client.ts
    - apps/web/src/routes/api/auth/$.ts
    - apps/web/src/routes/login.tsx
    - apps/web/src/routes/account/index.tsx
    - deploy/database/migrations/20260711041000_authenticated_web_identity.sql
    - deploy/database/roles/authenticated-web-identity-staging.sql
    - deploy/account/authenticated-web-identity-staging.contract.json
    - scripts/check-authenticated-web-identity-staging-contract.mjs
    - scripts/check-authenticated-web-identity-staging-fixtures.mjs
    - scripts/smoke-authenticated-web-identity-staging.mjs
    - docs/governance/authenticated-web-identity-staging.md
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-0400-establish-better-auth-identity-authority-on-staging.notes.md
    - tasks/reviews/20260711-0400-establish-better-auth-identity-authority-on-staging.review.md
  tests_pass:
    - path: apps/web/src/lib/auth.server.test.ts
    - path: apps/web/src/lib/context/SessionContext.test.tsx
  commands_succeed:
    - npm run check:authenticated-web-identity
    - npx vitest run apps/web/src/lib/auth.server.test.ts apps/web/src/lib/context/SessionContext.test.tsx
    - npm run typecheck --workspace @aiphabee/web
    - npm run build --workspace @aiphabee/web
    - npm run check:database
    - npm run check:env
    - npm run typecheck
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 9
```

## Acceptance Notes (Human Review)

- Functional behavior: GitHub OAuth establishes one Better Auth session whose
  server readback uses the stable Better Auth user id; logout and revoke remove
  authorization without exposing provider/session secrets.
- Edge cases: missing binding/secret/trusted origin, invalid callback/state,
  invalid/expired/revoked session, and unprovisioned product mapping all fail
  closed. No password, mock session, or email identity fallback exists.
- Regression risks: this replaces the Web mock-session claim, but does not enable
  any Netquity, product-data, public API, MCP, export, or production path.
- External readback: local and staging privilege matrices prove the auth runtime
  can access only `aiphabee_auth`; staging login/session/logout/revoke pass; only
  `aiphabee-web-staging` and the dedicated auth Hyperdrive/login change.

## Rollback Point

- Commit / checkpoint: reviewed feature-branch commit immediately before merge,
  plus staging Web and Hyperdrive version ids in task notes.
- Revert strategy: deploy the previous staging Web version, remove the staging
  auth binding/secrets, and revoke/delete the dedicated auth login. Leave the
  non-destructive auth schema and canonical `auth_subject` column unused; never
  restore the mock session as an authenticated product claim.
