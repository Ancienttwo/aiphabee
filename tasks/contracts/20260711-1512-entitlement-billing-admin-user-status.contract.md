# Task Contract: entitlement-billing-admin-user-status

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-1512-entitlement-billing-admin-user-status.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: fastclaw_personal_runner
> **Last Updated**: 2026-07-11 15:36
> **Review File**: `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md`
> **Notes File**: `tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Rows 6-8 establish identity, execution and durable output, but product/operator
control is absent. Shipping paid FastClaw availability without separating
entitlement from routing, observed usage from estimates, and admin identity from
a shared token would create hidden auto-routing, untraceable costs and
unauthorised lifecycle/kill actions.

## Goal

Deliver one private Worker product-control service: temporal entitlement and
profile state produce a five-state user status without selecting a runner;
observed model/tool/sandbox/storage usage is idempotently attributable by run
and linked to existing preview billing rows; current owner/admin actors can
idempotently retry/disable/delete/kill and read tenant-scoped audit without
remote-ID, token, lease or raw-error leakage.

## Scope

- In scope: Better Auth subject/account/workspace/role/entitlement/profile
  authority; five-state status projection; observed run usage detail plus
  existing usage_event/preview ledger trace; owner/admin action idempotency and
  audit; existing lifecycle and injected killer ports; RLS migration; focused
  fixtures and machine/capability/Sprint truth.
- Out of scope: public route/header-trust auth, automatic paid-plan routing,
  billing-provider post, invoice charge, live price methodology, live run
  registry/kill composition, deploy, secret, resource or staging PG mutation.
- Taste constraints: Agent Runtime remains selection authority; observed-only
  usage; exact replay or fail closed; current temporal owner/admin membership
  before side effects; reuse lifecycle/kill authorities; preview credits only;
  no protected references or raw errors in product/admin records.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop if product control must select a runner or infer FastClaw from plan tier.
- Stop if sandbox/storage usage must be estimated or encoded into an unrelated
  generic usage dimension.
- Stop if admin action can bypass current owner/admin membership or locally
  reimplements lifecycle/kill semantics.
- Stop if replay cannot distinguish exact from changed payload or a crash window
  can cause an unrecorded repeated side effect.
- Stop if implementation needs a public route, provider billing call, live
  resource/secret/staging mutation, dependency, package or service.

## Falsifier

The direction is false if an entitled/paid status returns a selected FastClaw
runner, an estimated or mismatched usage replay persists, a non-admin reaches a
side effect, or repeated admin request performs a second logical action. The
cheapest proof is the focused in-memory status/usage/admin matrix before the
PostgreSQL adapter and migration.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-1512-entitlement-billing-admin-user-status.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md`
- Notes file: `tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-1512-entitlement-billing-admin-user-status.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-1512-entitlement-billing-admin-user-status.contract.md
  - tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md
  - tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - apps/worker/src/research-agent-product-control.ts
  - apps/worker/src/research-agent-product-control.test.ts
  - deploy/database/migrations/20260711151100_research_agent_product_control.sql
  - deploy/database/migrations.contract.json
  - deploy/fastclaw/research-agent-product-control.contract.json
  - scripts/check-research-agent-product-control-contract.mjs
  - package.json
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
    - apps/worker/src/research-agent-product-control.ts
    - apps/worker/src/research-agent-product-control.test.ts
    - deploy/database/migrations/20260711151100_research_agent_product_control.sql
    - deploy/fastclaw/research-agent-product-control.contract.json
    - scripts/check-research-agent-product-control-contract.mjs
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-1512-entitlement-billing-admin-user-status.notes.md
    - tasks/reviews/20260711-1512-entitlement-billing-admin-user-status.review.md
  tests_pass:
    - path: apps/worker/src/research-agent-product-control.test.ts
  commands_succeed:
    - npm run check:research-agent-product-control
    - npx vitest run apps/worker/src/research-agent-product-control.test.ts apps/worker/src/research-agent-lifecycle.test.ts apps/worker/src/research-agent-lifecycle.postgres.test.ts packages/agent-runtime/src/fastclaw-agent-runner.test.ts packages/agent-runtime/src/durable-memory-artifact-handoff.test.ts
    - npm run typecheck
    - npm run lint
    - npm run check:database
    - npm run check:env
    - npm test
    - node -e "JSON.parse(require('node:fs').readFileSync('.ai/context/capabilities.json','utf8')); JSON.parse(require('node:fs').readFileSync('.ai/context/capability-source-map.json','utf8')); JSON.parse(require('node:fs').readFileSync('deploy/fastclaw/research-agent-product-control.contract.json','utf8'))"
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: five-state status separates entitlement/availability
  from selection; observed run usage links detail/event/preview ledger; exact
  current owner/admin authority gates idempotent lifecycle/kill/audit.
- Edge cases: absent/inactive authority; every lifecycle state; paid but not
  ready; exact/mismatched/concurrent usage replay; negative/estimated metrics;
  non-admin/inactive actor; admin request mismatch; crash-window resume;
  lifecycle/kill denial/failure and audit filtering/non-leakage.
- Regression risks: second routing authority, hidden auto-routing, estimated
  billing, corrupted generic usage semantics, double action, shared-token admin,
  cross-tenant audit and protected-reference leakage.

## Rollback Point

- Commit / checkpoint: one Row-9 commit stacked on integration base `3d70cb6`.
- Revert strategy: revert Row 9; no external cleanup is required.
