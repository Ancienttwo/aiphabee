# Subscription Lifecycle Audit Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 15:47 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-subscription-lifecycle-audit-scaffold.md`
> **Task Contract**:
> `tasks/contracts/subscription-lifecycle-audit-scaffold.contract.md`

This slice completes the backend-only scaffold for Sprint 2.4 ACC-03. It makes
subscription upgrade, downgrade, renewal, cancellation, and grace-period
transitions auditable without enabling live billing provider calls, persistent
writes, SQL emission, or frontend screens.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/account-runtime` | Owns deterministic subscription lifecycle capability and no-write planner |
| Runtime route | `GET /account/runtime` | Reports existing account capability plus nested `subscription_lifecycle` readiness |
| Planner route | `POST /account/subscription/lifecycle/plan` | Normalizes lifecycle requests and returns a standard no-write audit plan |
| Contract | `deploy/account/subscription-lifecycle.contract.json` | Guards standard envelope, supported actions, plan codes, billing states, no frontend, no billing provider, no writes, and no SQL |
| Schema scaffold | `aiphabee_audit.subscription_lifecycle_event` | Empty audit-event table for future live lifecycle writes |
| Existing schema | `platform.account`, `platform.workspace`, `platform.subscription_plan`, `platform.workspace_subscription` | Existing account/workspace/subscription tables remain the authority for future persistence |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /account/subscription/lifecycle/plan` with
   `account_id`, `workspace_id`, `subscription_id`, `action`,
   `current_plan_code`, `target_plan_code`, and `effective_at`.
2. Worker accepts snake/camel request fields and normalizes action, billing
   state, and plan code values.
3. `createSubscriptionLifecyclePlan()` derives the target billing state:
   cancellation moves to `canceled`, grace-period entry moves to
   `grace_period`, renewal and grace-period exit move to `active`, and
   upgrade/downgrade preserve the current billing state unless recovering from
   cancellation.
4. The plan emits subscription transition fields, an
   `account.subscription.lifecycle.plan` audit event, and a no-call billing
   provider block.
5. Worker wraps the plan in the shared standard success envelope with zero
   credits and one planned row when account/workspace context is present.

## P3 Design Decision

Selected a no-write lifecycle audit planner plus an empty audit table scaffold
instead of integrating Stripe, writing `platform.workspace_subscription`, or
building frontend billing screens.

Reason:

- ACC-03 requires paid plan support with auditable upgrade, downgrade, renewal,
  cancellation, and grace-period paths.
- The repo already separates account, workspace, subscription plan, and
  workspace subscription tables, but has no selected live billing provider.
- Frontend work is explicitly delegated to Claude.

Tradeoff:

- Subscription lifecycle semantics and audit payloads are now stable and
  testable.
- Real invoice/proration/refund previews, payment state, and DB writes remain
  blocked until billing provider integration is selected.

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

Observed runtime fields:

```json
{
  "subscription_lifecycle": {
    "billing_provider_calls": false,
    "persistent_writes": false,
    "route": "POST /account/subscription/lifecycle/plan",
    "sql_emitted": false,
    "status": "subscription_lifecycle_audit_scaffold"
  },
  "subscription_lifecycle_plan": {
    "audit_event": "account.subscription.lifecycle.plan",
    "billing_provider_calls": false,
    "persistent_writes": false,
    "sql_emitted": false,
    "status": "planned_no_write"
  }
}
```

## Residual Gaps

- Live billing provider integration is absent.
- Proration, invoice, refund, and payment retry previews are absent.
- `platform.workspace_subscription` and `aiphabee_audit.subscription_lifecycle_event` are not
  written by runtime code.
- Frontend billing/settings UI is absent by delegation.
