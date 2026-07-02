> **Archived**: 2026-07-03 02:40
> **Related Plan**: plans/archive/plan-20260703-0134-chart-upload-routing.md
> **Outcome**: Completed
> **Lifecycle**: contract
> **Parent Run ID**: run-20260703-0240

# Task Contract: chart-upload-routing

> **Status**: Fulfilled
> **Plan**: plans/plan-20260703-0134-chart-upload-routing.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-03 02:36
> **Review File**: `tasks/reviews/20260703-0134-chart-upload-routing.review.md`
> **Notes File**: `tasks/notes/20260703-0134-chart-upload-routing.notes.md`

## Goal

Deliver sprint row 5 for `parse_chart_image`: upload chart screenshots to
`AIPHABEE_ARTIFACTS`, persist image metadata in `aiphabee_core.chart_images`,
enforce tenant-owned imageRef resolution before vision parsing, record the
calibration used for FR-01 routing, and prove the required non-auto-match,
cross-tenant, and removal fixtures.

## Scope

- In scope:
  - Raw binary PNG/JPEG/WEBP upload route with fixture-level token gate.
  - `chart_images` migration and migration contract registration.
  - Tenant-owned imageRef lookup before R2 reads.
  - Calibration-aware FR-01 routing in `@aiphabee/agent-runtime/parse-chart-image`.
  - Worker upload/removal route tests and agent-runtime routing/executor tests.
  - Sprint row 5 and handoff/notes/review closeout.
- Out of scope:
  - Production Better Auth/session integration.
  - Live PlanetScale apply or credentialed live DB smoke.
  - Server-side image resizing or `@cf-wasm/photon`.
  - Upload dedupe/shared cross-tenant object reuse.
  - Real calibration data generation.

## Workflow Inventory

- Source plan: `plans/plan-20260703-0134-chart-upload-routing.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260703-0134-chart-upload-routing.review.md`
- Notes file: `tasks/notes/20260703-0134-chart-upload-routing.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - plans/
  - tasks/todos.md
  - tasks/archive/
  - tasks/contracts/20260703-0134-chart-upload-routing.contract.md
  - tasks/reviews/20260703-0134-chart-upload-routing.review.md
  - tasks/notes/20260703-0134-chart-upload-routing.notes.md
  - tasks/notes/20260703-chart-upload-routing-implementation-handoff.notes.md
  - tasks/current.md
  - packages/agent-runtime/
  - apps/worker/
  - deploy/database/migrations/
  - deploy/database/migrations.contract.json
  - package.json
  - package-lock.json
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
    - deploy/database/migrations/20260703005000_chart_image_uploads.sql
    - packages/agent-runtime/src/parse-chart-image/routing.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260703-0134-chart-upload-routing.notes.md
  commands_succeed:
    - npm run check:database
    - npx vitest run packages/agent-runtime/src/parse-chart-image apps/worker/src/index.test.ts
    - npm run typecheck
    - npm run lint
    - npm run test
    - npm run test:golden
  qa_scores:
    - dimension: functionality
      min: 7
```

## Acceptance Notes (Human Review)

- Functional behavior: Upload returns an imageRef and metadata only; parse reads
  bytes only after tenant ownership passes; routing records the calibration id
  only when a ready matching calibration is used.
- Edge cases: Unsupported MIME, oversized body, cross-tenant imageRef, missing
  calibration, superseded calibration, version mismatch, and removed images.
- Regression risks: Worker route changes touch a large file; keep route helpers
  isolated and response bodies redacted.
- Production risk: upload/delete/stored-image parse routes are smoke-token
  fixture surfaces only; production auth must replace header tenant context.
- Deployment risk: stored-image live smoke now requires Hyperdrive metadata and
  active `chart_images` rows, not bare R2 fixture objects.

## Rollback Point

- Commit / checkpoint: branch `codex/chart-upload-routing`.
- Revert strategy: revert the final branch commit or remove the additive worker
  routes/routing wiring while leaving the unused additive migration unapplied.
