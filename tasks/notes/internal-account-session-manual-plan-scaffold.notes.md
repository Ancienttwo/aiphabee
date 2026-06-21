# Internal Account Session Manual Plan Scaffold Notes

## Summary

Implemented the Sprint 1.4 ACC-01 backend scaffold for internal accounts,
manual plan assignment, login/session planning, and device revocation planning.

## Current State

- `@aiphabee/account-runtime` exposes deterministic capabilities and a
  no-write session/manual-plan planner.
- `GET /account/runtime` reports supported login methods, table dependencies,
  manual plan codes, no frontend, no persistent writes, and no auth provider
  calls.
- `POST /account/session/plan` returns a standard envelope containing account,
  workspace, session, device, and manual plan write plans.
- Raw email, password, OAuth access/refresh tokens, and session secrets remain
  forbidden payload classes.

## Non-Goals

- No frontend account page.
- No live auth provider integration.
- No session cookie issuance.
- No DB writes.
- No billing provider integration.

## Verification

Passed:

- `npm run check:account-runtime`
- `npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/account-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run dev:worker`
- `GET /account/runtime` smoke:
  - `ok=true`
  - `status=internal_account_session_manual_plan_scaffold`
  - `auth_provider_calls=false`
  - `persistent_writes=false`
  - `frontend=false`
  - login methods: `email_passwordless`, `social_google`, `social_github`
- `POST /account/session/plan` smoke:
  - `ok=true`
  - `status=planned_no_write`
  - `cookie_issued=false`
  - `manual_plan.assignment_status=planned_no_write`
  - `auth_provider_calls=false`
  - `persistent_writes=false`
  - `sql_emitted=false`
