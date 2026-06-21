# Task Contract: numeric-source-guard-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-numeric-source-guard-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-numeric-source-guard
> **Last Updated**: 2026-06-21 04:09 +08
> **Notes File**: `tasks/notes/numeric-source-guard-scaffold.notes.md`

## Goal

Create a no-live answer-contract guard proving concrete financial numbers must
come from tool results or deterministic calculations, not model memory.

## Scope

- In scope:
  - `numeric_source_guard` in `GET /agent/runtime`;
  - `numeric_source_guard` in `POST /agent/runs/plan`;
  - no-source concrete financial numbers blocked in the no-live answer contract;
  - allowed source list: `tool_result`, `deterministic_calculation`;
  - blocked source list: `model_memory`, `training_data`, `unverified_prompt`,
    `unstated_source`;
  - planned tool result numeric sources;
  - deterministic calculation gates for price history, financial facts, and
    corporate-action adjustment;
  - contract checker and tracker/governance updates.
- Out of scope:
  - actual model output parsing;
  - live tool results;
  - live evidence binding;
  - frontend evidence cards or labels.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/numeric-source-guard.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/numeric-source-guard-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-numeric-source-guard-scaffold.md
  - scripts/check-numeric-source-guard-contract.mjs
  - tasks/contracts/numeric-source-guard-scaffold.contract.md
  - tasks/notes/numeric-source-guard-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime advertises numeric_source_guard"
    - "POST /agent/runs/plan returns numeric_source_guard"
    - "answer_contract.concrete_financial_numbers_allowed is false while actual tool results are absent"
    - "Allowed sources are tool_result and deterministic_calculation"
    - "Blocked sources include model_memory, training_data, unverified_prompt, and unstated_source"
    - "Planned tool result sources include quote snapshot, price history, and financial facts when those tools are requested"
    - "Deterministic calculation gates include return/risk and financial growth"
    - "No model calls, actual tool calls, live evidence binding, or frontend changes are claimed"
  commands_succeed:
    - npm run test
    - npm run test:golden
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:agent-run-context
    - npm run check:tool-loop-agent
    - npm run check:pre-tool-call-resolution
    - npm run check:budget-stop-policy
    - npm run check:tool-enforcement
    - npm run check:numeric-source-guard
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/plan returns numeric_source_guard.status=guarded_no_actual_results"
    - "POST /agent/runs/plan returns failure_code=UNSOURCED_NUMERIC_CLAIM"
```

## Acceptance Notes

- This task completes a deterministic AGT-05 planner scaffold for Sprint 1.3.
- It does not replace future post-generation validation or live evidence binding.

## Rollback Point

- Revert the commit that adds numeric source guard behavior, contract checker,
  and tracker/governance updates.
