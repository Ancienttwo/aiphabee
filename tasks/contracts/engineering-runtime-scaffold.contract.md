# Task Contract: engineering-runtime-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-engineering-runtime-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-engineering-runtime
> **Last Updated**: 2026-06-20 14:20 +08
> **Notes File**: `tasks/notes/engineering-runtime-scaffold.notes.md`

## Goal

Deliver a verified non-frontend engineering scaffold: package manager,
Worker runtime, shared contracts package, CI, and env example, while keeping
Gate 0 rights constraints intact.

## Scope

- In scope:
  - root npm workspace and lockfile;
  - shared TypeScript and Vitest config;
  - Hono Worker health/root routes;
  - Wrangler local config;
  - shared response envelope and default-deny error codes;
  - GitHub Actions CI matching local commands;
  - names-only env example;
  - tracker/todo/notes updates.
- Out of scope:
  - `apps/web`, TanStack Start, Vite, or design-system frontend integration;
  - AI SDK v7 agent loop;
  - live market data, MCP redistribution, or provider connectors;
  - production Cloudflare deployment;
  - Postgres/Hyperdrive/Hyperdrive migrations;
  - OTel/log/eval store wiring;
  - real secrets.

## Workflow Inventory

- Source plan: `plans/plan-engineering-runtime-scaffold.md`
- Source tracker: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
- Runtime evidence: `docs/governance/engineering-runtime-scaffold.md`
- Deferred-goal ledger: `tasks/todos.md`
- Notes file: `tasks/notes/engineering-runtime-scaffold.notes.md`
- Scope gate: edit only paths listed under `allowed_paths`.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - .gitignore
  - apps/worker/**
  - deploy/env/.env.example
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/phase0-traceability-closeout.md
  - package-lock.json
  - package.json
  - packages/data-contracts/**
  - plans/plan-engineering-runtime-scaffold.md
  - tasks/contracts/engineering-runtime-scaffold.contract.md
  - tasks/notes/engineering-runtime-scaffold.notes.md
  - tasks/todos.md
  - tsconfig.base.json
  - vitest.config.ts
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
      purpose: boundary_owner
    explorer:
      mode: read_only
      purpose: runtime_docs_and_repo_mapping
    worker:
      mode: edit_within_allowed_paths
      purpose: scaffold_delivery
    verifier:
      mode: read_only
      purpose: local_check_and_health_smoke
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - package.json
    - package-lock.json
    - apps/worker/src/index.ts
    - apps/worker/wrangler.jsonc
    - packages/data-contracts/src/index.ts
    - .github/workflows/ci.yml
    - deploy/env/.env.example
    - docs/governance/engineering-runtime-scaffold.md
  content_checks:
    - "No apps/web or frontend implementation is included"
    - "Worker /health exposes no market data or MCP redistribution surface"
    - "Shared contracts include response envelope and default-deny errors"
    - "CI uses npm ci, lint, typecheck, test, and build"
    - "Env example contains names only and no secret values"
  commands_succeed:
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "Wrangler local /health returns 200 OK with no-store cache header"
```

## Acceptance Notes

- This task completes only the non-frontend subset of Sprint 0.4.
- Frontend/TanStack Start/Vite remains unimplemented by request and should be
  picked up by Claude or a dedicated frontend task.
- Phase 0 Gate remains open because external approvals, golden regression,
  full bindings, persistence, observability, and traceability are incomplete.

## Rollback Point

- Revert the commit that adds this scaffold and status update.
