# Subscription Lifecycle Audit Scaffold Notes

## Summary

Implemented the Sprint 2.4 ACC-03 backend scaffold for auditable subscription
lifecycle planning.

## Current State

- `@aiphabee/account-runtime` exposes subscription lifecycle capabilities.
- `GET /account/runtime` includes nested `subscription_lifecycle` readiness.
- `POST /account/subscription/lifecycle/plan` returns deterministic no-write
  plans for upgrade, downgrade, renewal, cancellation, grace-period entry, and
  grace-period exit.
- `aiphabee_audit.subscription_lifecycle_event` exists as an empty schema scaffold for
  future persistence.
- The local contract checker verifies supported actions, plan codes, billing
  states, audit event naming, no provider calls, no SQL, no writes, and database
  contract linkage.

## Non-Goals

- No live billing provider integration.
- No invoice, proration, refund, or payment retry preview.
- No DB writes to subscription or audit tables.
- No frontend billing UI.

## Verification

Passed:

- `npm run check:subscription-lifecycle`
- `npm run check:database`
- `npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/account-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint && npm run typecheck && npm run test && npm run test:golden`
- `npm run check:account-runtime`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`
- `git diff --name-only -- apps/web`
