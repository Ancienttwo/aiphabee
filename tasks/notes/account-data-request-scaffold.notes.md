# Account Data Request Scaffold Notes

## Summary

Implemented the Sprint 3.2 ACC-05 backend scaffold for account data download
and deletion requests with retention policy controls and audit planning.

## Current State

- `@aiphabee/account-runtime` exposes `data_requests` capabilities.
- `GET /account/runtime` includes nested data request readiness.
- `POST /account/data-requests/plan` returns deterministic no-write plans for
  `download` and `delete` requests.
- Download requests plan secure JSON delivery without live export.
- Delete requests schedule erasure only for eligible scopes and retain billing,
  usage-ledger, and audit-log scopes under retention policy.
- `aiphabee_core.account_data_request`, `aiphabee_core.account_data_request_item`,
  `aiphabee_audit.account_data_request_event`, and
  `aiphabee_governance.account_data_request_contract` exist as empty schema scaffolds.
- The local contract checker verifies retention-policy versioning, audit
  requirements, no live export, no writes, no SQL, privacy exclusions, and
  database contract linkage.

## Non-Goals

- No identity verification provider.
- No live data export.
- No live erasure.
- No persistent writes.
- No secure delivery materialization.
- No frontend account privacy UI.

## Verification

Passed on 2026-06-21:

- `npm run check:account-data-request`
- `npm run check:database`
- `npx vitest run packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/account-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`
- `git diff --name-only -- apps/web`

Root check caveat:

- `npm run check` passes through `check:account-data-request`,
  `check:secrets`, and all backend package builds, then fails only at
  `@aiphabee/web` Vite config loading because the current Node runtime does not
  expose `node:module.registerHooks` required by `@cloudflare/vite-plugin`.
  Frontend work remains delegated and this slice did not modify `apps/web`.
