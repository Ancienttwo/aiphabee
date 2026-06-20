# Task Contract: observability-eval-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-observability-eval-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-observability-eval
> **Last Updated**: 2026-06-20 14:57 +08
> **Notes File**: `tasks/notes/observability-eval-scaffold.notes.md`

## Goal

Create a verified local observability/eval scaffold for the Agent Runtime dry-run
route without configuring real OTLP destinations, secrets, or persistent stores.

## Scope

- In scope:
  - Wrangler Workers Logs and traces config;
  - structured audit/eval event contract;
  - local console sink and testable in-memory sink;
  - dry-run success, policy-denial, and unexpected-error telemetry;
  - contract check and CI coverage;
  - tracker/governance updates.
- Out of scope:
  - external OTLP destination provisioning;
  - Cloudflare Logpush, Analytics Engine, D1, R2, or Postgres eval store;
  - model-provider cost/token telemetry from real model calls;
  - custom span nesting through Worker `ExecutionContext`;
  - dashboards and alerting.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - apps/worker/**
  - deploy/observability/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/observability-eval-scaffold.md
  - docs/governance/phase0-traceability-closeout.md
  - package-lock.json
  - package.json
  - packages/observability/**
  - plans/plan-observability-eval-scaffold.md
  - scripts/check-observability-contract.mjs
  - tasks/contracts/observability-eval-scaffold.contract.md
  - tasks/notes/observability-eval-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - packages/observability/src/index.ts
    - deploy/observability/events.contract.json
    - scripts/check-observability-contract.mjs
    - docs/governance/observability-eval-scaffold.md
  content_checks:
    - "Event contract defines run.audit and run.eval"
    - "Event contract forbids prompt and secret fields"
    - "Worker dry-run route emits telemetry headers"
    - "Wrangler observability and traces are enabled"
    - "No API keys, OTLP endpoints, or secret values are committed"
  commands_succeed:
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/dry-run returns x-aiphabee-telemetry-event-count: 2"
    - "Worker console emits run.audit and run.eval JSON events"
```

## Acceptance Notes

- This task completes the local OTel/log/eval event-contract scaffold only.
- Persistent eval storage and external telemetry export remain later
  backend/runtime tasks.

## Rollback Point

- Revert the commit that adds this scaffold and status update.
