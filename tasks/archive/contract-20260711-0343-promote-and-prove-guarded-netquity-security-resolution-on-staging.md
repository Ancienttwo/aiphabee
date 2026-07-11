> **Archived**: 2026-07-11 03:43
> **Related Plan**: plans/archive/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md
> **Outcome**: Completed
> **Lifecycle**: contract
> **Parent Run ID**: run-20260711-0343

# Task Contract: promote-and-prove-guarded-netquity-security-resolution-on-staging

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md
> **Task Profile**: migration
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: netquity_security_resolution_staging
> **Last Updated**: 2026-07-11 02:09
> **Review File**: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md`
> **Notes File**: `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

The licensed Netquity BasicData mirror is present in shared staging, but the
AiphaBee runtime cannot yet consume it through a released, versioned Serving
Store contract. Querying raw `nq_*` schemas or silently falling back to the
synthetic resolver would bypass release authority, provenance, and least
privilege. A wrong promotion or grant could expose raw vendor data, fabricate
security semantics, or change production unintentionally.

## Goal

Promote the pinned BasicData source into one released 18,036-record
`security_master` snapshot, grant the staging runtime role read-only access to
exactly five Serving Store tables, and prove exact symbol/name resolution
through an operator-token-guarded staging Worker route. Production and the
existing public synthetic route remain unchanged.

## Scope

- In scope: staging-only promotion/index SQL, the two existing canonical
  security-master/Serving Store foundation migrations when remote inventory
  proves those objects absent, narrow role grants, a pinned JSON contract and
  checker, pure live-row validation/mapping, the guarded Worker Hyperdrive
  adapter, local/ephemeral/remote verification, staging deploy, and redacted
  acceptance evidence.
- Out of scope: production deploy, public `/tools/resolve-security` cutover,
  `/stock` UI, MCP/export, raw `nq_*` runtime access, fuzzy/transliteration or
  semantic matching, profile/history/prices/financials, `RelatedCode`, daily
  automation, and destructive raw-mirror rollback.
- Taste constraints: fail closed on missing/malformed authority; keep vendor
  instrument IDs opaque; do not invent listing dates or instrument types; no
  synthetic resolver fallback from the live path.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop before remote apply when the pinned source hash/count/quality/status
  partition differs, the runtime role has unexpected privilege, or any row
  requires invented semantic data.
- Stop rather than applying unrelated migrations if the two canonical
  foundational migrations are insufficient to create the required Serving
  Store objects.
- Stop before staging deploy when authorization can touch Hyperdrive before
  succeeding, the live route can invoke the synthetic resolver, or released
  snapshot readback is not exact.
- Stop before merge when staging role/read/release evidence or independent
  second-model review is not green.

## Falsifier

The direction is wrong if the existing Serving Store cannot represent all
18,036 BasicData rows without fabricated fields, or if exact aliases cannot be
queried under the five-table SELECT boundary. The cheapest proof is a local
promotion preflight plus ephemeral PostgreSQL apply/readback before any remote
write.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md`
- Notes file: `tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.md
  - plans/sprints/20260711-0154-netquity-security-resolution-staging.sprint.md
  - deploy/ingest/netquity-security-resolution-staging.sql
  - deploy/ingest/netquity-security-resolution-staging-index.sql
  - deploy/ingest/netquity-security-resolution-staging.contract.json
  - deploy/database/roles/netquity-security-serving-staging.sql
  - scripts/check-netquity-security-resolution-staging-contract.mjs
  - package.json
  - packages/security-tools/src/index.ts
  - packages/security-tools/src/index.test.ts
  - apps/worker/src/index.ts
  - apps/worker/src/netquity-security-resolution-live.test.ts
  - deploy/env/env.schema.json
  - deploy/env/.env.example
  - deploy/env/dev.env.example
  - deploy/env/staging.env.example
  - deploy/env/prod.env.example
  - deploy/secrets/stores.contract.json
  - tasks/contracts/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.contract.md
  - tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md
  - tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md
  - _ops/netquity-security-resolution-staging/
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
    - deploy/ingest/netquity-security-resolution-staging.sql
    - deploy/ingest/netquity-security-resolution-staging-index.sql
    - deploy/ingest/netquity-security-resolution-staging.contract.json
    - deploy/database/roles/netquity-security-serving-staging.sql
    - scripts/check-netquity-security-resolution-staging-contract.mjs
    - packages/security-tools/src/index.test.ts
    - apps/worker/src/netquity-security-resolution-live.test.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.notes.md
    - tasks/reviews/20260711-0209-promote-and-prove-guarded-netquity-security-resolution-on-staging.review.md
  tests_pass:
    - path: packages/security-tools/src/index.test.ts
  commands_succeed:
    - npm run check:netquity-security-resolution-staging
    - npx vitest run packages/security-tools/src/index.test.ts apps/worker/src/netquity-security-resolution-live.test.ts
    - npm run check:database
    - npm run check:env
    - npm run typecheck
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 9
```

## Acceptance Notes (Human Review)

- Functional behavior: exact aliases resolve against the newest released
  `security_master` snapshot with `liveDataAccess=true`, released data-version
  identity, and Netquity source provenance.
- Edge cases: non-staging is generic 404; missing/invalid/oversized auth is 403
  before binding access; oversized query is 400 before binding access; missing
  binding is 424; missing release and >25 candidates are 409; no exact alias is
  404; query/readback failure is 502; nullable listing dates remain absent.
- Regression risks: the current public synthetic route stays separate and
  unchanged; the live route must never call it as a fallback.
- External readback: released snapshot is exactly 18,036 records with pinned
  `17,555/141/340` status partition; the runtime has only the intended five
  Serving SELECTs and no raw-schema, write, CREATE, ownership, or BYPASSRLS
  authority.
- Deployment acceptance: guarded symbol/English/Traditional/Simplified live
  smokes and negative auth/input/not-found cases pass on staging; unit fixtures
  cover missing binding/release, overflow, and database/readback error; only
  `aiphabee-worker-staging` changed and independent review recommends pass.

## Rollback Point

- Commit / checkpoint: the reviewed feature-branch commit immediately before
  merge, plus the released data-version ID recorded in the task notes.
- Revert strategy: mark the staging data version `withdrawn`, revoke the five
  SELECT grants, delete the staging-only Wrangler smoke secret, and redeploy
  staging without the guarded route. Never delete the raw Netquity mirror and
  never modify production during rollback.
