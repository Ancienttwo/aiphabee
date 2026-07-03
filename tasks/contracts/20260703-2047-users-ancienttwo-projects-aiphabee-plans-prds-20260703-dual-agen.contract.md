# Task Contract: users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen

> **Status**: Fulfilled
> **Plan**: plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-03 20:47
> **Review File**: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md`
> **Notes File**: `tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md`

## Goal

Add the first control-plane convergence contract inside the existing `@aiphabee/agent-runtime` package: stable agent layer/run-mode/request/event/runner types exported from the current runtime authority, with focused tests proving the contract is local, typed, and not a new package split.

## Scope

- In scope:
- `packages/agent-runtime/src/index.ts` contract constants, type exports, and dry-run capability metadata.
- `packages/agent-runtime/src/index.test.ts` focused tests for the new contract surface.
- Sprint plan/contract/review/notes artifacts for this captured work package.
- Out of scope:
- New package or app roots such as `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.
- FastClaw/E2B execution, production auth/session semantics, or live Worker route behavior.
- Generic-agent access to `parse_chart_image`.

## Workflow Inventory

- Source plan: `plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md`
- Notes file: `tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - docs/spec.md
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md
  - tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md
  - tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md
  - .ai/context/capabilities.json
  - .claude/templates/
  - packages/agent-runtime/
  - src/
  - tests/
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
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - packages/agent-runtime/src/index.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md
  tests_pass:
    - path: packages/agent-runtime/src/index.test.ts
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/index.test.ts
    - npx vitest run packages/agent-runtime/src/parse-chart-image
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior:
- Existing `@aiphabee/agent-runtime` is the sole authority for the new agent control-plane contract.
- The exported contract names include `AgentLayer`, `AgentRunMode`, `AgentExecutionRequest`, `AgentExecutionEvent`, and `AgentRunner`.
- Runtime capability metadata exposes the supported layers/run modes without enabling model calls, persistent writes, or live tool execution.
- Edge cases:
- Unknown layers/run modes remain type-invalid instead of being coerced.
- Generic layer remains separate from research-only chart parsing; this slice does not grant any tool access.
- Regression risks:
- The contract must not move runtime ownership into a new package.
- Existing parse-chart-image targeted tests must continue to pass.

## Rollback Point

- Commit / checkpoint:
- Revert strategy:
