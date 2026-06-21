# Task Contract: failure-recovery-policy-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-failure-recovery-policy-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-failure-recovery-policy
> **Last Updated**: 2026-06-21 04:27 +08
> **Notes File**: `tasks/notes/failure-recovery-policy-scaffold.notes.md`

## Goal

Create a no-live failure recovery policy proving a single tool failure will not
drop the whole planned run and that system retries are not double-charged.

## Scope

- In scope:
  - `failure_recovery_policy` in `GET /agent/runtime`;
  - `failure_recovery_policy` in `POST /agent/runs/plan`;
  - retryable error classes: `RATE_LIMITED`, `TOOL_TIMEOUT`, `UPSTREAM_5XX`,
    `NETWORK_RESET`;
  - non-retryable error classes: `DATA_NOT_LICENSED`, `DATA_QUALITY_HOLD`,
    `INVALID_INPUT`, `OUT_OF_RANGE`, `SCOPE_DENIED`, `TOO_MANY_ROWS`;
  - failed-tool-call-only retry scope;
  - max two attempts per tool;
  - reuse of completed evidence and completed steps;
  - partial answer fallback with failed values labeled `unknown`;
  - no-double-charge usage contract with planned usage-ledger idempotency.
- Out of scope:
  - live tool retry execution;
  - durable persisted run state;
  - live usage ledger writes;
  - frontend retry controls;
  - Workflow task recovery.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/failure-recovery-policy.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/failure-recovery-policy-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-failure-recovery-policy-scaffold.md
  - scripts/check-failure-recovery-policy-contract.mjs
  - tasks/contracts/failure-recovery-policy-scaffold.contract.md
  - tasks/notes/failure-recovery-policy-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime advertises failure_recovery_policy"
    - "POST /agent/runs/plan returns failure_recovery_policy"
    - "Retry scope is failed_tool_call_only"
    - "Retryable classes include RATE_LIMITED, TOOL_TIMEOUT, UPSTREAM_5XX, and NETWORK_RESET"
    - "Non-retryable classes include DATA_NOT_LICENSED, DATA_QUALITY_HOLD, INVALID_INPUT, OUT_OF_RANGE, SCOPE_DENIED, and TOO_MANY_ROWS"
    - "Failed attempts and retry attempts are not billable"
    - "Charge grain is tool_call_success"
    - "Usage ledger idempotency key is required"
    - "Single tool failure allows partial answer behavior"
    - "Completed steps and evidence can be reused"
    - "No live tool execution, durable persistence, live ledger write, or frontend retry UI is claimed"
  commands_succeed:
    - npm run test
    - npm run test:golden
    - npm run check:failure-recovery-policy
    - npm run check:agent-run-context
    - npm run check:tool-loop-agent
    - npm run check:pre-tool-call-resolution
    - npm run check:budget-stop-policy
    - npm run check:tool-enforcement
    - npm run check:numeric-source-guard
    - npm run check:answer-evidence-contract
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/plan returns failure_recovery_policy.status=failure_recovery_policy_scaffold"
    - "POST /agent/runs/plan returns no_double_charge=true"
```

## Acceptance Notes

- This task completes a deterministic backend policy scaffold for AGT-08.
- It does not complete live retry execution or persisted run recovery.

## Rollback Point

- Revert the commit that adds failure recovery policy behavior, checker, and
  tracker/governance updates.
