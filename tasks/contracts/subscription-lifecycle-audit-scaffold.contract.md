# Subscription Lifecycle Audit Scaffold Contract

## Objective

Complete the backend-only Sprint 2.4 ACC-03 scaffold for auditable subscription
upgrade, downgrade, renewal, cancellation, and grace-period lifecycle planning.

## Required Surfaces

- Package: `@aiphabee/account-runtime`
- Runtime route: `GET /account/runtime`
- Planner route: `POST /account/subscription/lifecycle/plan`
- Contract: `deploy/account/subscription-lifecycle.contract.json`
- Checker: `npm run check:subscription-lifecycle`
- Audit table scaffold: `audit.subscription_lifecycle_event`

## Required Guarantees

- Use standard response envelopes.
- Support `upgrade`, `downgrade`, `renew`, `cancel`, `enter_grace_period`, and
  `exit_grace_period`.
- Support Free, Plus, Pro, Developer, Team, and Enterprise plan codes.
- Return a versioned `account.subscription.lifecycle.plan` audit event for every
  planned lifecycle transition.
- Make grace-period transitions explicit and auditable.
- Do not call a billing provider.
- Do not emit SQL.
- Do not write `core.workspace_subscription`.
- Do not write `audit.subscription_lifecycle_event`.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes the audit table scaffold.
- Package and Worker targeted tests pass.
- Worker typecheck/build pass.
- Local Worker smoke proves both runtime and planner routes return `200 OK`
  and no-live flags.
- Sprint tracker row is checked and Sprint 2.4 count is updated.
