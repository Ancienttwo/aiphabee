# Field Authorization Config Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 21:45 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Task Contract**:
> `tasks/contracts/field-authorization-config-scaffold.contract.md`

This slice completes the backend-only Sprint 3.2 US-O01 scaffold for
operations-configurable field authorization. It plans changes with approval,
policy version, and effective time without enabling live DB reads, live policy
writes, SQL execution, or frontend operations UI.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/data-access-gateway` | Owns field entitlement evaluation, row-snapshot policy compilation, restricted exports, and this config-change planner |
| Runtime route | `GET /gateway/runtime` | Reports nested `field_entitlement_enforcement.operations_config` readiness |
| Planner route | `POST /gateway/field-authorizations/changes/plan` | Normalizes operator change requests and returns a no-write approval/effective-time plan |
| Contract | `deploy/gateway/field-authorization-config.contract.json` | Guards approval, version, effective time, default-deny, no frontend, no reads, no writes, and no SQL |
| Schema scaffold | `core.field_authorization_change`, `audit.field_authorization_approval`, `governance.field_authorization_config_contract` | Empty future persistence/audit tables |
| Policy effect | `core.data_entitlement`, `core.workspace_entitlement` | Planned row shapes only; current runtime compiler remains row-snapshot based |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Operator submits `POST /gateway/field-authorizations/changes/plan` with
   dataset, field pattern, channel, plan, target status, policy version, and
   effective time.
2. Worker accepts snake/camel fields and rejects unknown channel/status values
   by leaving required context incomplete.
3. `createFieldAuthorizationConfigChangePlan()` builds a deterministic change
   record plus required approval audit record.
4. The plan marks status as `awaiting_approval`, `scheduled`,
   `active_preview`, `rejected`, or `blocked_missing_context`.
5. The policy-effect preview emits the future `core.data_entitlement` row and,
   when workspace-scoped, future `core.workspace_entitlement` row.

## P3 Design Decision

Selected a no-write change planner instead of mutating `DataAccessPolicy`
directly or adding live policy writes.

Reason:

- US-O01 requires operational configurability, approval, version, and effective
  time.
- Existing Gateway invariants require default deny unless explicit approved
  rows compile into policy.
- Existing cache keys include `rights_policy_version`, so policy changes must be
  versioned before activation.

Tradeoff:

- The governance workflow is now explicit and testable.
- Real approval persistence, live policy activation, and operations UI remain
  future slices.

## Verification

Passed checks on 2026-06-21:

- `npm run check:field-authorization-config`
- `npm run check:database`
- `npx vitest run packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/data-access-gateway`
- `npm run build --workspace @aiphabee/worker`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:golden`
- `scripts/check-task-workflow.sh --strict`
- `git diff --check`
- `git diff --name-only -- apps/web`

Root check caveat:

- `npm run check` passes through `check:field-authorization-config`,
  `check:secrets`, and all backend package builds, then fails only at
  `@aiphabee/web` Vite config loading because the current Node runtime does not
  expose `node:module.registerHooks` required by `@cloudflare/vite-plugin`.
  Frontend work remains delegated and this slice did not modify `apps/web`.
