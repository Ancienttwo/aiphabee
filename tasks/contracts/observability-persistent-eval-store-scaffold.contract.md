# Task Contract: observability-persistent-eval-store-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-observability-persistent-eval-store-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-observability-eval-store
> **Last Updated**: 2026-06-20 16:00 +08
> **Notes File**: `tasks/notes/observability-persistent-eval-store-scaffold.notes.md`

## Goal

Create a no-secret scaffold for persistent eval records and OTLP destination
configuration without enabling live export or writes.

## Scope

- In scope:
  - eval-store record schema;
  - eval-store sink interface and tests;
  - Cloudflare D1 eval-store binding name and guarded provisioned state;
  - names-only OTLP env schema/templates;
  - observability contract checker coverage;
  - Worker `/observability/runtime` capability route;
  - tracker/governance updates.
- Out of scope:
  - real OTLP endpoint calls;
  - Worker D1 binding configuration;
  - persistent write/read smoke;
  - dashboarding or alerting;
  - real model token/cost/latency metrics;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/cloudflare/bindings.contract.json
  - deploy/env/**
  - deploy/observability/events.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/cloudflare-bindings-contract.md
  - docs/governance/env-secrets-contract.md
  - docs/governance/observability-eval-scaffold.md
  - docs/governance/observability-persistent-eval-store-scaffold.md
  - docs/governance/phase0-traceability-closeout.md
  - packages/observability/**
  - plans/plan-observability-persistent-eval-store-scaffold.md
  - scripts/check-cloudflare-bindings-contract.mjs
  - scripts/check-observability-contract.mjs
  - tasks/contracts/observability-persistent-eval-store-scaffold.contract.md
  - tasks/notes/observability-persistent-eval-store-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Eval store schema exists and does not include prompt or secret fields"
    - "OTLP endpoint/header env names are names-only"
    - "Cloudflare binding contract includes AIPHABEE_EVAL_STORE"
    - "Worker /observability/runtime reports writes/export disabled"
    - "Tracker keeps live OTLP/export/write smoke unchecked"
  commands_succeed:
    - npm run check:observability
    - npm run check:bindings
    - npm run check:env
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /observability/runtime returns eval_store.status=planned"
    - "GET /observability/runtime returns otlp_destination.live_export_enabled=false"
```

## Acceptance Notes

- This task completes the repo-local scaffold only.
- Live OTLP export and persistent eval-store write/read smoke remain separate
  deployment tasks.

## Rollback Point

- Revert the commit that adds the eval-store scaffold and tracker split.
