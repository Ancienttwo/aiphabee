# Task Contract: fastclaw-dedicated-agent-lifecycle

> **Status**: Fulfilled
> **Plan**: plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-10 11:29
> **Review File**: `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md`
> **Notes File**: `tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

The prior smoke proves a disposable FastClaw Agent can execute through the
Cloudflare sandbox seam, but it does not give a paid AiphaBee user a durable,
auditable identity. Shipping lifecycle code without remote idempotency can
create duplicate Agents after a crash; treating a disabled FastClaw app-user
as a kill switch while identity-switch errors fall back to the API-key owner
can execute under the wrong authority. This task closes both boundaries before
any production `runner_remote` cutover.

## Goal

Deliver an additive, fail-closed `(workspace_id, account_id)` to FastClaw
app-user/Agent lifecycle. Activation is allowed only by live database
entitlement, concurrent/retried activation converges to one remote Agent,
disable blocks locally before the remote call, and delete reaches a verified
remote-absent plus local tombstone state. All transitions are auditable and no
path falls back to a shared Agent or API-key-owner identity.

## Scope

- In scope: linked FastClaw prerequisite on a separate stacked worktree;
  additive AiphaBee profile/audit migration; lifecycle contract and FastClaw
  client in `@aiphabee/agent-runtime`; focused Worker repository/orchestrator
  and protected internal route; env contract; deterministic tests; staging
  acceptance or explicit missing-credential evidence.
- Out of scope: billing-provider webhook/writes, public auth/onboarding/UI,
  production `runner_remote`, chat/SSE adapter, Generic Agent changes, memory
  UI, queue/scheduler, or Cloudflare Sandbox creation.
- Taste constraints: no new package, service, dependency, shared-Agent
  fallback, email identity, heuristic Agent-name lookup, or DB transaction held
  across FastClaw HTTP.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.

## Falsifier

The direction is wrong if FastClaw cannot provide an owner-scoped idempotency
key for Agent clone or cannot reject disabled app-user switching without
breaking valid API-key calls. Cheapest proof: targeted FastClaw store/setup/auth
tests before wiring AiphaBee. If either invariant cannot be made deterministic,
stop before the AiphaBee lifecycle route is enabled.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md`
- Notes file: `tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md
  - tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md
  - tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md
  - .ai/harness/checks/latest.json
  - .ai/harness/runs/
  - deploy/database/migrations/
  - deploy/database/migrations.contract.json
  - deploy/env/
  - packages/agent-runtime/package.json
  - packages/agent-runtime/src/
  - apps/worker/src/
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
    - deploy/database/migrations/20260710120000_research_agent_lifecycle.sql
    - packages/agent-runtime/src/fastclaw-lifecycle.ts
    - packages/agent-runtime/src/fastclaw-lifecycle.test.ts
    - apps/worker/src/research-agent-lifecycle.ts
    - apps/worker/src/research-agent-lifecycle.test.ts
    - apps/worker/src/research-agent-lifecycle.postgres.test.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260710-1129-fastclaw-dedicated-agent-lifecycle.notes.md
    - tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md
  tests_pass:
    - path: packages/agent-runtime/src/fastclaw-lifecycle.test.ts
    - path: apps/worker/src/research-agent-lifecycle.test.ts
    - path: apps/worker/src/research-agent-lifecycle.postgres.test.ts
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/fastclaw-lifecycle.test.ts apps/worker/src/research-agent-lifecycle.test.ts apps/worker/src/index.test.ts
    - npx vitest run apps/worker/src/research-agent-lifecycle.postgres.test.ts
    - npm run lint
    - npm test
    - npm run check:database
    - npm run check:env
    - npm run typecheck
    - git diff --check
    - git -C ../fastclaw-wt-aiphabee-dedicated-agent-lifecycle diff --check
    - git -C ../fastclaw-wt-aiphabee-dedicated-agent-lifecycle status --short
    - git -C ../fastclaw-wt-aiphabee-dedicated-agent-lifecycle rev-parse --verify HEAD
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: activate twice produces one app-user/Agent; disable is
  locally blocking before remote completion; delete requires a closed account
  and records terminal state only after remote absence.
- Edge cases: concurrent lease claim, remote success followed by local failure,
  disabled-user header/body identity switch, FastClaw 401/404/429/5xx, missing
  Worker bindings, expired entitlement, and idempotent delete retry.
- Regression risks: FastClaw auth switching is shared by all API-key callers;
  its targeted tests and existing package tests are mandatory. AiphaBee Worker
  route wiring must not enable production runners or change public `/agent/*`.

## Rollback Point

- Commit / checkpoint: AiphaBee base `3ac36e6`; FastClaw base `c522523`.
- Revert strategy: disable the lifecycle flag, revert the two stacked
  application commits, and retain additive schema/audit tombstones. No
  destructive down migration and no production runner cutover.
