# Task Contract: restricted-exports-scaffold

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint31-restricted-exports-scaffold
> **Last Updated**: 2026-06-21 19:29 +08
> **Notes File**:
> `tasks/notes/restricted-exports-scaffold.notes.md`

## Goal

Close the Sprint 3.1 ANA-08 backend acceptance gap by proving CSV, image, and
PDF export plans require `exports.read`, respect field authorization and row
limits, and include mandatory watermark metadata.

## Scope

- In scope:
  - `@aiphabee/data-access-gateway` restricted export planner;
  - `GET /gateway/runtime` `restricted_exports` capability;
  - `POST /gateway/exports/plan`;
  - supported formats `csv`, `image`, and `pdf`;
  - required `exports.read` scope before export planning;
  - Gateway `channel=export` and `exportRequested=true` rights evaluation;
  - field redaction, row limit, time-range limit, and quality-state blocking;
  - required watermark fields for request, workspace, dataset, rights policy,
    and as-of metadata;
  - empty export request/audit/governance schema scaffold;
  - `check:restricted-exports` and database contract update;
  - tracker, governance, and deferred-ledger updates.
- Out of scope:
  - live artifact generation;
  - R2 writes;
  - frontend export UI;
  - persistent audit writes;
  - partner rights matrix live reads.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "POST /gateway/exports/plan requires exports.read"
    - "CSV, image, and PDF are the supported formats"
    - "Allowed export plans use channel=export and exportRequested=true"
    - "Field authorization redacts unapproved fields before artifact planning"
    - "Row limits and time-range limits can block export planning"
    - "Watermark metadata is required and includes request/workspace/dataset/rights/as-of fields"
    - "Schema scaffold includes restricted export request, audit event, and governance contract tables"
    - "No live data access, artifact writes, R2 writes, frontend changes, or persistent writes are introduced"
  commands_succeed:
    - npm run typecheck --workspace @aiphabee/data-access-gateway
    - npm run typecheck --workspace @aiphabee/worker
    - npm run test -- packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:restricted-exports
    - npm run check:database
    - npm run typecheck
    - npm run test
    - git diff --check
    - git diff --name-only -- apps/web
    - scripts/check-task-workflow.sh --strict
  known_environment_blockers:
    - "npm run check reaches npm run build after passing lint/typecheck/tests/golden/contracts, then fails only at delegated @aiphabee/web Vite build because Node v22.12.0 lacks node:module.registerHooks"
```

## Acceptance Notes

- This task completes no-live backend contract coverage for ANA-08 only.
- It does not claim real downloadable artifacts or UI export controls.

## Rollback Point

- Revert the commit that adds restricted export planner behavior, route,
  migration scaffold, contract/checker, and tracker/governance docs.
