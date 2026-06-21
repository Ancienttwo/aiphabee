# Task Contract: eval-v1-wvro-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-eval-v1-wvro-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint14-eval-v1-wvro
> **Last Updated**: 2026-06-21 04:52 +08
> **Notes File**: `tasks/notes/eval-v1-wvro-scaffold.notes.md`

## Goal

Create a no-write eval v1 and WVRO instrumentation scaffold for Sprint 1.4
without depending on frontend dashboards or persistent eval storage.

## Scope

- In scope:
  - eval v1 capability in `GET /observability/runtime`;
  - eval v1 no-write plan route at `POST /observability/eval-v1/plan`;
  - `run.eval.eval_v1` payloads;
  - quality metrics for fact accuracy, calculation accuracy, citation accuracy,
    and correct refusal rate;
  - unsourced numeric claim sample target `<0.1%`;
  - WVRO criteria from PRD §4.3;
  - high-intent action capture for save, watchlist, compare, allowed export,
    alert, follow-up, and MCP follow-up.
- Out of scope:
  - persistent D1 writes;
  - live OTLP export;
  - frontend analytics UI;
  - production partner-approved eval corpus;
  - automatic answer grading.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/observability/eval-v1.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/eval-v1-wvro-scaffold.md
  - package.json
  - packages/observability/**
  - plans/plan-eval-v1-wvro-scaffold.md
  - scripts/check-eval-v1-contract.mjs
  - tasks/contracts/eval-v1-wvro-scaffold.contract.md
  - tasks/notes/eval-v1-wvro-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /observability/runtime advertises eval_v1"
    - "POST /observability/eval-v1/plan returns planned_no_write"
    - "run.eval events carry eval_v1 payloads"
    - "Metrics include fact_accuracy, calculation_accuracy, citation_accuracy, and correct_refusal_rate"
    - "WVRO criteria include financial tool success, openable evidence, high-intent action, and no data error/severe hallucination/compliance block"
    - "Unsourced numeric claim target is 0.001"
    - "No persistent eval writes, live OTLP export, or frontend dashboard is claimed"
  commands_succeed:
    - npm run check:eval-v1
    - npm run check:observability
    - npm run test -- packages/observability/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck --workspace @aiphabee/observability
    - npm run typecheck --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/observability
    - npm run build --workspace @aiphabee/worker
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /observability/eval-v1/plan returns wvro.eligible=true for a fully satisfied synthetic run"
    - "GET /observability/runtime returns eval_v1.status=eval_v1_wvro_scaffold"
```

## Acceptance Notes

- This task completes the Sprint 1.4 backend scaffold item for eval v1 and WVRO
  instrumentation.
- It does not complete persistent eval storage, live dashboards, or production
  eval corpus sign-off.

## Rollback Point

- Revert the commit that adds eval v1 helpers, Worker route, checker, and
  tracker/governance updates.
