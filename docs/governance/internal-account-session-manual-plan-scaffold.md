# Internal Account Session Manual Plan Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 05:10 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-internal-account-session-manual-plan-scaffold.md`
> **Task Contract**:
> `tasks/contracts/internal-account-session-manual-plan-scaffold.contract.md`

This slice completes the backend-only scaffold for Sprint 1.4 ACC-01. It gives
the repo a deterministic account/session/device/manual-plan runtime surface
without enabling live identity, cookies, billing, database writes, or frontend
screens.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/account-runtime` | Owns account/session/manual-plan capability and deterministic no-write planner |
| Runtime route | `GET /account/runtime` | Reports supported login methods, plan codes, table dependencies, and no-live posture |
| Planner route | `POST /account/session/plan` | Normalizes request fields and returns a standard no-write plan |
| Contract | `deploy/account/session.contract.json` | Guards no frontend, no provider calls, no DB writes, no SQL, and forbidden payload classes |
| Existing schema | `core.account`, `core.workspace`, `core.workspace_membership`, `core.subscription_plan`, `core.workspace_subscription` | Storage tables already exist from Sprint 1.1 schema scaffold |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /account/session/plan` with `account_id`,
   `workspace_id`, `email_hash`, optional `device_id`, `session_id`, `role`, and
   `plan_code`.
2. Worker normalizes snake/camel request fields and rejects no fields by side
   effect; unsupported raw credentials remain listed as forbidden payload
   classes.
3. `createAccountSessionPlan()` builds account, workspace membership, session,
   device, and manual plan records as deterministic plans.
4. The plan returns `auth_provider_calls=false`, `persistent_writes=false`,
   `sql_emitted=false`, and `cookie_issued=false`.
5. Worker wraps the result in the shared standard success envelope with
   zero credits and at most one planned row.

## P3 Design Decision

Selected a no-write runtime planner instead of integrating Auth0/Clerk/Supabase
Auth, issuing cookies, or writing `core.account` rows.

Reason:

- Sprint 1.4 asks for internal account/manual-plan/session/device management,
  but the repo currently has only schema foundations and no selected live
  identity provider.
- Frontend is explicitly delegated to Claude.
- Billing and subscription lifecycle are separate Sprint 2.4 work.

Tradeoff:

- The backend contract is now stable and testable.
- It still cannot authenticate a real user or persist a revoked session/device.

## Verification

Passed:

- `npm run check:account-runtime`
- `npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/account-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/account-runtime`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `GET /account/runtime`
- local Worker smoke for `POST /account/session/plan`

Observed runtime fields:

```json
{
  "account_runtime": {
    "auth_provider_calls": false,
    "frontend": false,
    "persistent_writes": false,
    "status": "internal_account_session_manual_plan_scaffold"
  },
  "session_plan": {
    "auth_provider_calls": false,
    "cookie_issued": false,
    "persistent_writes": false,
    "sql_emitted": false,
    "status": "planned_no_write"
  }
}
```

## Residual Gaps

- Live identity provider selection and callback handling are absent.
- Real session cookie issuance and revocation persistence are absent.
- Manual plan assignment does not write `core.workspace_subscription`.
- Frontend account/settings UI is absent by delegation.
