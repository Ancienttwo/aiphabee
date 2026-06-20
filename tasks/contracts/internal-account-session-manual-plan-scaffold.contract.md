# Internal Account Session Manual Plan Scaffold Contract

## Objective

Complete the backend-only Sprint 1.4 ACC-01 scaffold for internal account,
manual plan, login/session, and device management.

## Required Surfaces

- Package: `@aiphabee/account-runtime`
- Runtime route: `GET /account/runtime`
- Planner route: `POST /account/session/plan`
- Contract: `deploy/account/session.contract.json`
- Checker: `npm run check:account-runtime`

## Required Guarantees

- Use standard response envelopes.
- Accept only hashed email identity material (`email_hash`) in the planner.
- Keep raw email, password, OAuth token, refresh token, and session secret as
  forbidden payload classes.
- Return no-write plans for session/device/manual-plan changes.
- Do not issue cookies.
- Do not call a live auth provider.
- Do not call a billing provider.
- Do not emit SQL or write to a database.
- Reuse existing account/workspace/subscription tables:
  - `core.account`
  - `core.workspace`
  - `core.workspace_membership`
  - `core.subscription_plan`
  - `core.workspace_subscription`
- Keep frontend out of scope.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves both routes return `200 OK` and no-write flags.
- Sprint tracker row is checked and Sprint 1.4 count is updated.
