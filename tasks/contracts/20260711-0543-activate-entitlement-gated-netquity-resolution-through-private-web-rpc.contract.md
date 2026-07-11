# Task Contract: activate-entitlement-gated-netquity-resolution-through-private-web-rpc

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: authenticated_netquity_web_resolver
> **Last Updated**: 2026-07-11 07:06
> **Review File**: `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md`
> **Notes File**: `tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

The released Netquity staging snapshot cannot become a product path while stock
search uses a public synthetic resolver and no runtime trace binds a verified
session to account, workspace, subscription, and field-rights authority. If the
boundary ships wrong, callers could forge identity/workspace, bypass revoked or
expired rights, or turn a private data release into a public API.

## Goal

Deploy a staging-only TanStack server function that derives the canonical
Better Auth subject from the server-validated session and calls a named private
Cloudflare Worker RPC. The API Worker must derive one active entitled workspace
under RLS, compile exact Web `security_master` field rights through the existing
Data Access Gateway, and only then query the released Netquity Serving snapshot.
Prove code and multilingual success plus every required denial, public-route
isolation, temporary-fixture cleanup, and unchanged production state.

## Scope

- In scope: Better Auth session read helper; query/market-only TanStack server
  function; staging Web service binding; named WorkerEntrypoint; exact subject
  resolver function; RLS account/workspace/subscription/product/rights loader;
  existing Gateway policy compiler/evaluator; shared released Serving query;
  explicit staging provisioning/role packets; deterministic and live tests;
  staging API/Web deploy and redacted readback.
- Out of scope: production, public live resolver, MCP/API/export, fuzzy or
  semantic matching, profile/history/price/financial data, multi-workspace
  selection, automatic provisioning, billing-provider integration, usage
  charging, and changes to raw Netquity schemas.
- Taste constraints: identity comes only from Better Auth; the browser cannot
  send auth subject/account/workspace; require exactly one entitled workspace;
  exact Web field rows only; no wildcard authorization, legacy `auth_user_id`,
  public-header/static-token identity, synthetic resolver fallback, or second
  entitlement parser.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop before remote apply unless the shared staging database/user and exactly
  one verified Better Auth user are read back.
- Stop if the SECURITY DEFINER function exposes email/legacy ids, grants PUBLIC,
  or enables account enumeration.
- Stop if authorization denial reaches a Serving query, public HTTP can invoke
  the named RPC, or Web input can select identity/workspace.
- Stop if runtime gains product writes/raw-schema access, API/MCP/export rights
  become approved, temporary fixtures cannot be deleted, or production changes.

## Falsifier

The design is wrong if a named service binding cannot invoke the existing Worker
without widening public HTTP, or if `aiphabee_runtime_rls` cannot resolve one
exact subject and read its entitled context without broad account access. The
cheapest proof is a named-entrypoint unit/dry-run plus the locked subject
function and role packet applied to staging before provisioning or UI cutover.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md`
- Notes file: `tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.md
  - plans/sprints/20260711-0357-authenticated-netquity-web-resolver.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.contract.md
  - tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md
  - tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md
  - package.json
  - apps/web/src/lib/auth.server.ts
  - apps/web/src/lib/auth.server.test.ts
  - apps/web/src/lib/api/endpoints.ts
  - apps/web/src/lib/api/types.ts
  - apps/web/src/lib/api/security.functions.ts
  - apps/web/src/lib/api/security.server.ts
  - apps/web/src/lib/api/security.server.test.ts
  - apps/web/src/routes/stock/index.tsx
  - apps/web/wrangler.jsonc
  - apps/web/worker-configuration.d.ts
  - apps/worker/src/index.ts
  - apps/worker/src/authenticated-netquity-web-resolver.ts
  - apps/worker/src/authenticated-netquity-web-resolver.test.ts
  - apps/worker/src/netquity-security-resolution-live.test.ts
  - apps/worker/src/index.test.ts
  - apps/worker/src/worker-configuration.d.ts
  - apps/worker/wrangler.jsonc
  - packages/data-access-gateway/src/index.ts
  - packages/data-access-gateway/src/index.test.ts
  - packages/security-tools/src/index.ts
  - packages/security-tools/src/index.test.ts
  - tests/shims/cloudflare-workers.ts
  - deploy/account/authenticated-netquity-web-resolver-staging.contract.json
  - deploy/account/authenticated-netquity-web-resolver-staging.sql
  - deploy/database/migrations/20260711054300_authenticated_netquity_web_resolver.sql
  - deploy/database/roles/authenticated-netquity-web-resolver-staging.sql
  - deploy/database/migrations.contract.json
  - deploy/cloudflare/bindings.contract.json
  - scripts/check-authenticated-netquity-web-resolver-contract.mjs
  - scripts/check-authenticated-netquity-web-resolver-fixtures.mjs
  - scripts/smoke-authenticated-netquity-web-resolver-staging.mjs
  - scripts/check-database-migrations-contract.mjs
  - scripts/check-cloudflare-bindings-contract.mjs
  - docs/governance/authenticated-netquity-web-resolver-staging.md
  - _ops/authenticated-netquity-web-resolver-staging/
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
      - subagent
      - codex-exec
      - main-thread
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - apps/web/src/lib/api/security.functions.ts
    - apps/web/src/lib/api/security.server.ts
    - apps/worker/src/authenticated-netquity-web-resolver.test.ts
    - apps/worker/src/authenticated-netquity-web-resolver.ts
    - deploy/account/authenticated-netquity-web-resolver-staging.contract.json
    - deploy/account/authenticated-netquity-web-resolver-staging.sql
    - deploy/database/migrations/20260711054300_authenticated_netquity_web_resolver.sql
    - deploy/database/roles/authenticated-netquity-web-resolver-staging.sql
    - scripts/check-authenticated-netquity-web-resolver-contract.mjs
    - scripts/check-authenticated-netquity-web-resolver-fixtures.mjs
    - scripts/smoke-authenticated-netquity-web-resolver-staging.mjs
    - docs/governance/authenticated-netquity-web-resolver-staging.md
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.notes.md
    - tasks/reviews/20260711-0543-activate-entitlement-gated-netquity-resolution-through-private-web-rpc.review.md
  tests_pass:
    - path: apps/web/src/lib/api/security.server.test.ts
    - path: packages/data-access-gateway/src/index.test.ts
    - path: packages/security-tools/src/index.test.ts
  commands_succeed:
    - npm run check:authenticated-netquity-web-resolver
    - npx vitest run apps/web/src/lib/auth.server.test.ts apps/web/src/lib/api/security.server.test.ts apps/worker/src/authenticated-netquity-web-resolver.test.ts apps/worker/src/netquity-security-resolution-live.test.ts packages/data-access-gateway/src/index.test.ts packages/security-tools/src/index.test.ts
    - npm run typecheck --workspace @aiphabee/web
    - npm run typecheck --workspace @aiphabee/worker
    - npm run check:database
    - npm run check:bindings
    - npm run typecheck
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 9
```

## Acceptance Notes (Human Review)

- Functional behavior: authenticated stock search derives the Better Auth
  subject server-side, crosses only the named RPC, authorizes exact active Web
  rights, and returns released Netquity code/name matches.
- Edge cases: unauthenticated/invalid session, unmapped account, no or expired
  membership/subscription, no/blocked field rights, multiple entitled
  workspaces, missing service/DB binding, DB failure, no released snapshot,
  oversized input, and candidate overflow all fail closed before inappropriate
  reads.
- Regression risks: the public synthetic resolver, guarded operator live-smoke,
  existing non-security Web API clients, production Worker, production Web
  absence, and raw Netquity privileges must remain unchanged.

## Rollback Point

- Commit / checkpoint: stacked Row 2 branch on Row 1 commit `55f3635`.
- Revert strategy: deploy the prior staging Web/API versions and delete only the
  explicit initial provisioning rows. Leave the additive locked function and
  indexes unused; delete temporary acceptance Workers/fixtures and confirm
  absence. Production requires no rollback.
