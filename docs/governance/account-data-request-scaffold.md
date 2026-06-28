# Account Data Request Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 21:15 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**: `tasks/contracts/account-data-request-scaffold.contract.md`

This slice completes the backend-only Sprint 3.2 ACC-05 scaffold for account
data download and deletion requests. It plans user-visible data requests with
retention-policy controls and audit records without enabling live data export,
live erasure, DB writes, SQL execution, or frontend UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/account-runtime` | Owns account/session, authorized memory, package pricing, subscription lifecycle, and this account data request planner |
| Runtime route | `GET /account/runtime` | Reports nested `data_requests` readiness |
| Planner route | `POST /account/data-requests/plan` | Normalizes download/delete request inputs and returns a no-write retention/audit plan |
| Contract | `deploy/account/data-request.contract.json` | Guards request actions, scopes, retention holds, audit requirement, no frontend, no live export, no writes, and no SQL |
| Schema scaffold | `aiphabee_core.account_data_request`, `aiphabee_core.account_data_request_item`, `aiphabee_audit.account_data_request_event`, `aiphabee_governance.account_data_request_contract` | Empty future request, item, audit, and governance tables |
| Adjacent contracts | `authorized_session_memory`, `subscription_lifecycle`, `usage_ledger` | Referenced as data scopes or retention-hold surfaces only |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. User/support submits `POST /account/data-requests/plan` with account,
   workspace, action, request scopes, requested time, and retention policy
   version.
2. Worker accepts snake/camel fields and normalizes the action and scopes.
3. `createAccountDataRequestPlan()` validates required context and blocks
   unsupported scopes before any planned write.
4. Download requests produce secure-delivery export steps.
5. Delete requests produce `schedule_erasure` steps for erasable scopes and
   `retain` steps for billing, usage-ledger, and audit-log retention holds.
6. The response includes audit metadata, policy version, privacy exclusions,
   execution plan, and standard envelope usage rows.

## P3 Design Decision

Selected a no-write request planner rather than live export or live erasure.

Reason:

- ACC-05 requires download/delete request support, retention-policy compliance,
  and audit records.
- Current repo scaffolds shared account behavior through deterministic planners
  and local contract checkers before live persistence.
- Deletion must not remove retained audit, billing, or security evidence.

Tradeoff:

- The user-facing account data request contract is now explicit and testable.
- Real identity verification, export materialization, erasure job execution,
  delivery expiry, and frontend status UI remain future slices.

## Verification

Passed checks on 2026-06-21:

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
