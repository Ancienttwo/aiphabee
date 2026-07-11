# Task Contract: dedicated-agent-provisioning

> **Status**: Fulfilled
> **Plan**: plans/plan-20260711-1045-dedicated-agent-provisioning.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: fastclaw_personal_runner
> **Last Updated**: 2026-07-11 11:08
> **Review File**: `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md`
> **Notes File**: `tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

The existing dedicated lifecycle owns the AiphaBee/FastClaw identity boundary,
but Row 6 cannot be accepted while true PostgreSQL concurrency,
partial-success retry, temporal expiry and competing-request audit are not
machine-proven. Row 7 must not dispatch on an unproved provisioning authority.

## Goal

Deliver one reviewed PostgreSQL profile and one owner-scoped FastClaw
user/Agent identity across concurrent activation, retry, disable, re-enable,
delete, entitlement expiry and lease expiry. A request ID identifies one
idempotent attempt; a retryable result explicitly requires a new request ID.
An in-flight duplicate of the lease owner's same ID remains transient until the
owner writes the attempt audit. Every completed/competing attempt is audited,
authority failures fail closed, and dispatch stays off.

## Scope

- In scope: authoritative busy-profile readback and conflict audit; explicit
  in-flight duplicate, same-attempt replay and new-attempt retry contract;
  disposable PostgreSQL
  concurrency/recovery fixtures; FastClaw
  `dev@35cd5ad006d991713c91a1fc641bcf01dbaf3a8b` pin; capability/Sprint truth.
- Out of scope: new expiry state/intent, migration, scheduler/outbox, FastClaw
  product edit, runner dispatch, sandbox, billing/admin UI, deploy, shared
  staging DB writes and credentialed live acceptance.
- Taste constraints: preserve the existing state machine and deterministic
  identity; no shared/name lookup, fallback or expiry inference from reason.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop if the pinned FastClaw commit lacks the five lifecycle route shapes or
  owner-scoped user/Agent idempotency.
- Stop rather than target a database whose name does not begin with
  `aiphabee_lifecycle_test`.
- Stop with an explicit version error below PostgreSQL 16; the disposable RLS
  fixture uses role membership `SET` options introduced in PostgreSQL 16.
- Stop if concurrent activation can call remote provision twice or if a
  retryable result does not state that a new request ID is required.

## Falsifier

The direction is false if unique profile plus lease CAS permits two remote
provision paths, a partial user cannot be reused, or the FastClaw pin lacks
owner-scoped external-ID semantics. The cheapest proof is the two-client
PostgreSQL barrier fixture plus exact upstream commit/route readback.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260711-1045-dedicated-agent-provisioning.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md`
- Notes file: `tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/plan-20260711-1045-dedicated-agent-provisioning.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/todos.md
  - tasks/contracts/20260711-1045-dedicated-agent-provisioning.contract.md
  - tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md
  - tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - apps/worker/src/research-agent-lifecycle.ts
  - apps/worker/src/research-agent-lifecycle.test.ts
  - apps/worker/src/research-agent-lifecycle.postgres.test.ts
  - packages/agent-runtime/src/fastclaw-lifecycle.test.ts
  - deploy/fastclaw/dedicated-agent-provisioning.contract.json
  - scripts/check-fastclaw-dedicated-agent-provisioning-contract.mjs
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
    - apps/worker/src/research-agent-lifecycle.ts
    - apps/worker/src/research-agent-lifecycle.test.ts
    - apps/worker/src/research-agent-lifecycle.postgres.test.ts
    - packages/agent-runtime/src/fastclaw-lifecycle.test.ts
    - deploy/fastclaw/dedicated-agent-provisioning.contract.json
    - scripts/check-fastclaw-dedicated-agent-provisioning-contract.mjs
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260711-1045-dedicated-agent-provisioning.notes.md
    - tasks/reviews/20260711-1045-dedicated-agent-provisioning.review.md
  tests_pass:
    - path: apps/worker/src/research-agent-lifecycle.test.ts
    - path: apps/worker/src/research-agent-lifecycle.postgres.test.ts
    - path: packages/agent-runtime/src/fastclaw-lifecycle.test.ts
  commands_succeed:
    - npm run check:fastclaw-dedicated-agent-provisioning
    - npx vitest run packages/agent-runtime/src/fastclaw-lifecycle.test.ts apps/worker/src/research-agent-lifecycle.test.ts apps/worker/src/index.test.ts
    - RESEARCH_AGENT_LIFECYCLE_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/aiphabee_lifecycle_test_row6 npx vitest run apps/worker/src/research-agent-lifecycle.postgres.test.ts
    - npm run typecheck
    - npm run lint
    - npm run check:database
    - npm run check:env
    - npm test
    - node -e "JSON.parse(require('node:fs').readFileSync('.ai/context/capabilities.json','utf8')); JSON.parse(require('node:fs').readFileSync('.ai/context/capability-source-map.json','utf8')); JSON.parse(require('node:fs').readFileSync('deploy/fastclaw/dedicated-agent-provisioning.contract.json','utf8'))"
    - git diff --check
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: one concurrent winner, one audited retryable loser, one
  remote identity path; an in-flight duplicate cannot preempt the owner's audit,
  completed same request ID replays the same attempt and a new ID retries;
  partial success reconciles; lifecycle operations are idempotent.
- Edge cases: deleted profile, unexpired/expired leases, temporal entitlement
  expiry, retryable/non-retryable upstream failure, request-ID mismatch,
  terminal replay and remote success before local failure.
- Regression risks: remote double provision, lease theft, poisoned retry,
  misleading deleted-profile conflict, missing audit, raw ID leakage, pin drift
  and accidental runtime activation.

## Rollback Point

- Commit / checkpoint: one Row-6 commit stacked on integration base `824de72`.
- Revert strategy: revert that commit; no external cleanup is required.
