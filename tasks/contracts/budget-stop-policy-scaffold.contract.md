# Task Contract: budget-stop-policy-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-budget-stop-policy-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-budget-stop-policy
> **Last Updated**: 2026-06-21 03:50 +08
> **Notes File**: `tasks/notes/budget-stop-policy-scaffold.notes.md`

## Goal

Create a deterministic no-live scaffold for single-run budget limits and stop
policy so AGT-03 has a verifiable runtime contract.

## Scope

- In scope:
  - `budget_stop_policy` on `createToolLoopAgentPlan()` output;
  - budget dimensions for steps, credits, rows, tokens, and wall-clock ms;
  - deterministic usage estimates for registered read-only tool plans;
  - valid budget exhaustion returning `stopped_budget` with partial steps;
  - graceful stop response step and continuation cost message;
  - two consecutive same-class error automatic retry stop policy;
  - Worker `/agent/runs/plan` returning `200 OK` for valid exhausted budgets;
  - contract checker and tracker/governance updates.
- Out of scope:
  - live tool execution;
  - live retry orchestration;
  - real billing, usage ledger writes, or credit reconciliation;
  - model calls or AI Gateway cost accounting;
  - frontend confirmation UI.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/budget-stop-policy.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/budget-stop-policy-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-budget-stop-policy-scaffold.md
  - scripts/check-budget-stop-policy-contract.mjs
  - tasks/contracts/budget-stop-policy-scaffold.contract.md
  - tasks/notes/budget-stop-policy-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Default /agent/runs/plan remains planned_no_model"
    - "Budget-exhausted /agent/runs/plan returns stopped_budget instead of OUT_OF_RANGE when supplied budgets are valid"
    - "budget_stop_policy includes estimated_usage, planned_usage, limit_status, decision, graceful_stop, retry_policy, and error_stop_policy"
    - "Stop response returns completed_step_ids, unfinished_step_ids, existing_evidence_record_ids, partial_response_ready, and next_step"
    - "Two consecutive same-class errors stop automatic retry and remain non-billable"
    - "No model calls, actual tool calls, live billing, or frontend changes are claimed"
  commands_succeed:
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:budget-stop-policy
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/plan default path returns planned_no_model and budget_stop_policy.decision.status=continue"
    - "POST /agent/runs/plan with max_steps=3 returns stopped_budget and a graceful budget stop response"
```

## Acceptance Notes

- This task completes a deterministic AGT-03 scaffold for Sprint 1.3.
- It does not replace future live usage metering, model-cost accounting, or
  frontend budget confirmation.

## Rollback Point

- Revert the commit that adds budget stop policy behavior, budget stop contract
  checker, and tracker/governance updates.
